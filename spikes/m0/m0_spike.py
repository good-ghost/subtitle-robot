# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx>=0.27", "pydantic>=2.7"]
# ///
"""M0 모델 스파이크 (PROJECT-PLAN §16 M0).

Pass 2와 같은 형태(unit 번역 → 원래 idx로 재분리, JSON 출력)의 요청을 공급자 × 모델 × 출력 방식 × 언어
조합마다 보내고 기술 지표만 측정한다. 번역 품질 지표는 두지 않는다(§20).

본 구현(M1~)과 코드를 공유하지 않는 독립 스크립트다. SRT 파서와 unitizer는 측정용 단순 버전이다.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import statistics
import sys
import time
from collections import Counter
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
import tomllib
from pydantic import BaseModel, ValidationError

HERE = Path(__file__).resolve().parent
PROMPT_FILE = HERE / "prompt_pass2.md"
PROMPT_VERSION = "m0-pass2@1"

STRUCTURED_MODES = ("json_schema", "guided_json", "json_object")
ALL_MODES = (*STRUCTURED_MODES, "prompt")
RETRY_STATUS = {429, 500, 502, 503, 504}
UNSUPPORTED_STATUS = {400, 422}
MAX_ATTEMPTS = 4
BACKOFF_BASE_S = 2.0
LOCAL_LOADING_POLL_S = 5.0
LOCAL_LOADING_MAX_WAIT_S = 600.0
SAMPLE_LIMIT = 5  # 리포트에 남길 원문 잔존 예시 수

LANG_RULES = {
    "en": "English source. Idioms and slang should become natural Korean, not literal.",
    "ja": (
        "Japanese source. Write Japanese names and places by Japanese pronunciation in Hangul "
        "(田中 -> 타나카), never by Korean hanja reading. Keep honorific suffixes as given "
        "(さん -> 상, くん -> 쿤, ちゃん -> 짱)."
    ),
}
RESIDUAL_PATTERNS = {
    "en": re.compile(r"[A-Za-z]{4,}"),
    "ja": re.compile(r"[぀-ゟ゠-ヿ]{2,}"),
}
TAG_RE = re.compile(r"<[^>]+>")
TIMING_RE = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)")
SDH_ONLY_RE = re.compile(r"\s*(\[[^\]]*\]\s*)+")
EN_TERMINAL_RE = re.compile(r"[.!?♪\"”\]]$")
JA_CONTINUE_RE = re.compile(r"(、|て|で|が|けど|し|から|ので|と|を|に|は|も)$")


# ---------------------------------------------------------------- SRT · unit · 배치


@dataclass
class Block:
    idx: int  # 파일 순서대로 부여한 내부 인덱스 (§7)
    number: str
    start: float
    end: float
    text: str


@dataclass
class Unit:
    unit_id: str
    blocks: list[Block]


def _to_seconds(h: str, m: str, s: str, ms: str) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms.ljust(3, "0")[:3]) / 1000


def parse_srt(text: str) -> list[Block]:
    text = text.lstrip("﻿").replace("\r\n", "\n").replace("\r", "\n")
    blocks: list[Block] = []
    for chunk in re.split(r"\n\s*\n", text):
        lines = chunk.strip("\n").split("\n")
        timing_at = next((i for i, line in enumerate(lines) if TIMING_RE.search(line)), None)
        if timing_at is None:
            continue
        g = TIMING_RE.search(lines[timing_at]).groups()  # type: ignore[union-attr]
        number = lines[timing_at - 1].strip() if timing_at > 0 else ""
        blocks.append(
            Block(
                idx=len(blocks) + 1,
                number=number,
                start=_to_seconds(*g[:4]),
                end=_to_seconds(*g[4:]),
                text="\n".join(lines[timing_at + 1 :]).strip(),
            )
        )
    return blocks


def select_blocks(blocks: list[Block], start: int, count: int) -> list[Block]:
    return [b for b in blocks[start:] if TAG_RE.sub("", b.text).strip()][:count]


def _plain(text: str) -> str:
    return TAG_RE.sub("", text).replace("\n", " ").strip()


def _standalone(text: str) -> bool:
    """화자 전환·SDH·가사 블록은 병합하지 않는다 (§10.1)."""
    plain = _plain(text)
    return plain.startswith("-") or SDH_ONLY_RE.fullmatch(plain) is not None or "♪" in plain


def _is_italic(text: str) -> bool:
    return text.lstrip().lower().startswith("<i>")


def _continues(cur: Block, nxt: Block, lang: str, max_gap: float) -> bool:
    if nxt.start - cur.end > max_gap or nxt.start < cur.end:
        return False
    if _standalone(cur.text) or _standalone(nxt.text):
        return False
    # 이탤릭 여부가 바뀌면 화면 밖 음성(TV·전화)과 현장 대사가 갈린 것으로 본다
    if _is_italic(cur.text) != _is_italic(nxt.text):
        return False
    c, n = _plain(cur.text), _plain(nxt.text)
    if lang == "ja":
        return JA_CONTINUE_RE.search(c) is not None
    if c.endswith("--"):  # 말이 끊긴 것(interruption)이지 문장이 다음 블록으로 이어지는 것이 아니다
        return False
    if c.endswith(("...", "…", ",", "-", "—")):
        return True
    if not EN_TERMINAL_RE.search(c):
        return True
    return n[:1].islower() or n.startswith(("...", "…"))


def unitize(blocks: list[Block], lang: str, unit_cfg: dict[str, Any]) -> list[Unit]:
    units: list[Unit] = []
    current: list[Block] = []
    for block in blocks:
        if current and (
            len(current) < unit_cfg["max_blocks"]
            and block.end - current[0].start <= unit_cfg["max_duration"]
            and _continues(current[-1], block, lang, unit_cfg["max_gap"])
        ):
            current.append(block)
            continue
        if current:
            units.append(Unit(f"U{len(units) + 1}", current))
        current = [block]
    if current:
        units.append(Unit(f"U{len(units) + 1}", current))
    return units


def make_batches(units: list[Unit], batch_blocks: int) -> list[list[Unit]]:
    batches: list[list[Unit]] = []
    current: list[Unit] = []
    size = 0
    for unit in units:
        if current and size + len(unit.blocks) > batch_blocks:
            batches.append(current)
            current, size = [], 0
        current.append(unit)
        size += len(unit.blocks)
    if current:
        batches.append(current)
    return batches


# ---------------------------------------------------------------- 출력 스키마 (§10.2)


class OutBlock(BaseModel):
    idx: int
    ko: str


class OutUnit(BaseModel):
    unit: str
    blocks: list[OutBlock]


class NewTerm(BaseModel):
    src: str
    type: str = "term"
    ko_suggestion: str = ""


class Pass2Out(BaseModel):
    units: list[OutUnit]
    new_terms: list[NewTerm] = []


def _inline_refs(node: Any, defs: dict[str, Any]) -> Any:
    # 일부 서버의 문법 변환기는 $ref 를 처리하지 못하므로 펼쳐서 보낸다
    if isinstance(node, dict):
        if "$ref" in node:
            return _inline_refs(defs[node["$ref"].split("/")[-1]], defs)
        return {k: _inline_refs(v, defs) for k, v in node.items() if k != "$defs"}
    if isinstance(node, list):
        return [_inline_refs(v, defs) for v in node]
    return node


def output_schema() -> dict[str, Any]:
    schema = Pass2Out.model_json_schema()
    inlined: dict[str, Any] = _inline_refs(schema, schema.get("$defs", {}))
    return inlined


# ---------------------------------------------------------------- 요청 조립


def build_messages(
    system_template: str, lang: str, batch: list[Unit], previous: list[tuple[Block, str]]
) -> list[dict[str, str]]:
    system = system_template.format(src_lang=lang, lang_rules=LANG_RULES.get(lang, ""))
    payload = {
        "units": [
            {"unit": u.unit_id, "blocks": [{"idx": b.idx, "src": b.text} for b in u.blocks]}
            for u in batch
        ]
    }
    prev = "\n".join(f"{b.idx}: {b.text!r} => {ko!r}" for b, ko in previous)
    user = (
        f"<previous_translations>\n{prev}\n</previous_translations>\n"
        f"<translate>\n{json.dumps(payload, ensure_ascii=False)}\n</translate>"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def build_body(
    model: str,
    messages: list[dict[str, str]],
    mode: str,
    provider_cfg: dict[str, Any],
    schema: dict[str, Any],
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": provider_cfg["temperature"],
        "max_tokens": provider_cfg["max_tokens"],
        "stream": False,
    }
    if mode == "json_schema":
        body["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": "pass2_output", "schema": schema},
        }
    elif mode == "guided_json":
        body["nvext"] = {"guided_json": schema}
    elif mode == "json_object":
        body["response_format"] = {"type": "json_object"}
    body.update(provider_cfg.get("extra_body") or {})
    body.update((provider_cfg.get("model_extra_body") or {}).get(model) or {})
    return body


# ---------------------------------------------------------------- 응답 해석 · 검증 (§11)


@dataclass
class Extracted:
    text: str
    had_think_tag: bool
    had_fence: bool


def extract_json_text(content: str) -> Extracted:
    had_think = "<think>" in content or "</think>" in content
    text = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL)
    if "</think>" in text:  # 여는 태그가 템플릿에 들어가 응답에는 닫는 태그만 오는 경우
        text = text.rsplit("</think>", 1)[1]
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL)
    if fence:
        text = fence.group(1)
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last > first:
        text = text[first : last + 1]
    return Extracted(text.strip(), had_think, fence is not None)


@dataclass
class BatchCheck:
    batch_no: int
    expected: int
    status: int | None = None
    error: str = ""
    json_ok: bool = False
    json_strict_ok: bool = False  # 후처리 없이 content 그대로 json.loads 성공
    schema_ok: bool = False
    preserved: int = 0
    missing: list[int] = field(default_factory=list)
    duplicate: list[int] = field(default_factory=list)
    extra: list[int] = field(default_factory=list)
    order_ok: bool = False
    empty: list[int] = field(default_factory=list)
    residual: dict[int, list[str]] = field(default_factory=dict)
    error_blocks: int = 0
    warnings: dict[str, int] = field(default_factory=dict)
    finish_reason: str | None = None
    think_leak: bool = False
    content_in_reasoning: bool = False  # content 가 비고 답이 reasoning 필드에만 옴
    had_fence: bool = False
    latency_s: float | None = None
    attempts: int = 0
    retries: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    prompt_chars: int = 0
    src_chars: int = 0
    new_terms: int = 0


def validate_output(
    check: BatchCheck,
    batch: list[Unit],
    content: str,
    lang: str,
    limits: dict[str, int],
) -> dict[int, str]:
    """content 를 검사해 check 를 채우고 idx → 번역문을 돌려준다."""
    expected = [b.idx for u in batch for b in u.blocks]
    check.error_blocks = len(expected)
    try:
        json.loads(content)
        check.json_strict_ok = True
    except json.JSONDecodeError:
        pass
    extracted = extract_json_text(content)
    check.had_fence = extracted.had_fence
    check.think_leak = check.think_leak or extracted.had_think_tag
    try:
        obj = json.loads(extracted.text)
        check.json_ok = True
    except json.JSONDecodeError as exc:
        check.error = f"json: {exc}"
        return {}
    try:
        parsed = Pass2Out.model_validate(obj)
        check.schema_ok = True
    except ValidationError as exc:
        check.error = f"schema: {exc.error_count()} errors"
        return {}

    check.new_terms = len(parsed.new_terms)
    returned = [ob for ou in parsed.units for ob in ou.blocks]
    counts = Counter(ob.idx for ob in returned)
    expected_set = set(expected)
    check.missing = [i for i in expected if counts[i] == 0]
    check.duplicate = sorted(i for i, c in counts.items() if c > 1)
    check.extra = sorted(i for i in counts if i not in expected_set)
    seen_order = list(dict.fromkeys(ob.idx for ob in returned if ob.idx in expected_set))
    check.order_ok = seen_order == [i for i in expected if counts[i] > 0]
    check.preserved = sum(1 for i in expected if counts[i] == 1)

    ko_by_idx: dict[int, str] = {}
    for ob in returned:
        ko_by_idx.setdefault(ob.idx, ob.ko)
    residual_re = RESIDUAL_PATTERNS.get(lang)
    error_idx: set[int] = set(check.missing) | set(check.duplicate)
    warnings: Counter[str] = Counter()
    for idx in expected:
        ko = ko_by_idx.get(idx)
        if ko is None:
            continue
        plain = TAG_RE.sub("", ko)
        if not plain.strip():
            check.empty.append(idx)
            error_idx.add(idx)
            continue
        if residual_re:
            hits = residual_re.findall(plain)
            if hits:
                check.residual[idx] = hits
                error_idx.add(idx)
        lines = plain.split("\n")
        if len(lines) > limits["max_lines"]:
            warnings["too_many_lines"] += 1
        if any(len(line) > limits["max_line_chars"] for line in lines):
            warnings["line_too_long"] += 1
    if not check.order_ok:
        error_idx |= {i for i in expected if counts[i] > 0}
    check.error_blocks = len(error_idx)
    check.warnings = dict(warnings)
    return ko_by_idx


# ---------------------------------------------------------------- HTTP (§6.3)


@dataclass
class Runtime:
    clock: Callable[[], float] = time.monotonic
    sleep: Callable[[float], None] = time.sleep
    jitter: Callable[[], float] = random.random


class RateLimiter:
    def __init__(self, rpm: int, runtime: Runtime) -> None:
        self.interval = 60.0 / rpm if rpm > 0 else 0.0
        self.next_at = 0.0
        self.runtime = runtime

    def wait(self) -> None:
        if not self.interval:
            return
        now = self.runtime.clock()
        if now < self.next_at:
            self.runtime.sleep(self.next_at - now)
            now = self.next_at
        self.next_at = now + self.interval


@dataclass
class CallResult:
    status: int | None
    data: dict[str, Any] | None
    text: str
    latency_s: float | None
    attempts: int
    retries: int
    error: str = ""


def _retry_after(response: httpx.Response) -> float | None:
    value = response.headers.get("retry-after")
    try:
        return float(value) if value else None
    except ValueError:
        return None


def post_chat(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    body: dict[str, Any],
    timeout: float,
    limiter: RateLimiter,
    runtime: Runtime,
    is_local: bool,
) -> CallResult:
    attempts = retries = 0
    loading_waited = 0.0
    last_error = ""
    last_status: int | None = None
    while attempts < MAX_ATTEMPTS:
        limiter.wait()
        started = runtime.clock()
        try:
            response = client.post(url, json=body, headers=headers, timeout=timeout)
        except httpx.TransportError as exc:  # 타임아웃·연결 거부 포함
            attempts += 1
            retries += 1
            last_error = f"{type(exc).__name__}: {exc}"
            runtime.sleep(BACKOFF_BASE_S * 2 ** (attempts - 1) + runtime.jitter())
            continue
        latency = runtime.clock() - started
        last_status = response.status_code
        # llama-server 모델 로딩 중 503은 실패로 세지 않고 기다린다 (§6.3)
        if is_local and response.status_code == 503 and loading_waited < LOCAL_LOADING_MAX_WAIT_S:
            runtime.sleep(LOCAL_LOADING_POLL_S)
            loading_waited += LOCAL_LOADING_POLL_S
            continue
        attempts += 1
        if response.status_code in RETRY_STATUS and attempts < MAX_ATTEMPTS:
            retries += 1
            delay = _retry_after(response) or BACKOFF_BASE_S * 2 ** (attempts - 1)
            runtime.sleep(delay + runtime.jitter())
            last_error = f"HTTP {response.status_code}"
            continue
        try:
            data = response.json()
        except ValueError:
            data = None
        error = "" if response.is_success else f"HTTP {response.status_code}"
        return CallResult(
            response.status_code, data, response.text, latency, attempts, retries, error
        )
    return CallResult(last_status, None, "", None, attempts, retries, last_error)


def auth_headers(provider_cfg: dict[str, Any]) -> dict[str, str]:
    key = os.environ.get(provider_cfg.get("api_key_env") or "", "")
    return {"Authorization": f"Bearer {key}"} if key else {}


def probe_local(client: httpx.Client, base_url: str, headers: dict[str, str]) -> dict[str, Any]:
    """llama-server 상태·컨텍스트·슬롯·로드 모델을 확인한다 (§6.1)."""
    root = base_url.rstrip("/").removesuffix("/v1")
    info: dict[str, Any] = {"base_url": base_url}
    try:
        info["health"] = client.get(f"{root}/health", headers=headers, timeout=10).status_code
        props = client.get(f"{root}/props", headers=headers, timeout=10)
        if props.is_success:
            p = props.json()
            info["n_ctx"] = (p.get("default_generation_settings") or {}).get("n_ctx")
            info["total_slots"] = p.get("total_slots")
            info["model_path"] = p.get("model_path")
            info["chat_template_present"] = bool(p.get("chat_template"))
        models = client.get(f"{base_url.rstrip('/')}/models", headers=headers, timeout=10)
        if models.is_success:
            info["model_ids"] = [m.get("id") for m in models.json().get("data", [])]
    except httpx.TransportError as exc:
        info["error"] = f"{type(exc).__name__}: {exc}"
    return info


# ---------------------------------------------------------------- 실행


@dataclass
class Sample:
    lang: str
    path: Path
    blocks: list[Block]
    units: list[Unit]
    batches: list[list[Unit]]


@dataclass
class RunResult:
    provider: str
    model: str
    mode: str
    lang: str
    supported: bool | None = None
    note: str = ""
    batches: list[BatchCheck] = field(default_factory=list)
    output_file: str = ""


def load_samples(cfg: dict[str, Any], only_lang: set[str] | None) -> tuple[list[Sample], list[str]]:
    samples: list[Sample] = []
    skipped: list[str] = []
    for spec in cfg["samples"]:
        lang = spec["lang"]
        if only_lang and lang not in only_lang:
            continue
        if not spec.get("path"):
            skipped.append(f"{lang}: 샘플 경로 미지정")
            continue
        path = Path(spec["path"])
        if not path.is_file():
            skipped.append(f"{lang}: 파일 없음 {path}")
            continue
        blocks = select_blocks(
            parse_srt(path.read_text(encoding="utf-8-sig")), spec.get("start", 0), cfg["blocks"]
        )
        units = unitize(blocks, lang, cfg["unit"])
        samples.append(Sample(lang, path, blocks, units, make_batches(units, cfg["batch_blocks"])))
    return samples, skipped


def _slug(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9.]+", "-", text).strip("-")


def write_srt(path: Path, blocks: list[Block], ko_by_idx: dict[int, str]) -> None:
    def fmt(t: float) -> str:
        ms = round(t * 1000)
        return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"

    parts = [
        f"{b.number or b.idx}\n{fmt(b.start)} --> {fmt(b.end)}\n{ko_by_idx.get(b.idx, '<<MISSING>>')}\n"
        for b in blocks
    ]
    path.write_text("\n".join(parts), encoding="utf-8")


def run_combo(
    client: httpx.Client,
    provider: str,
    provider_cfg: dict[str, Any],
    model: str,
    mode: str,
    sample: Sample,
    cfg: dict[str, Any],
    run_dir: Path,
    runtime: Runtime,
    limiter: RateLimiter,
    max_batches: int | None,
) -> RunResult:
    result = RunResult(provider, model, mode, sample.lang)
    system_template = PROMPT_FILE.read_text(encoding="utf-8")
    schema = output_schema()
    url = f"{provider_cfg['base_url'].rstrip('/')}/chat/completions"
    headers = auth_headers(provider_cfg)
    limits = {"max_lines": cfg["max_lines"], "max_line_chars": cfg["max_line_chars"]}
    stem = f"{sample.lang}.{provider}.{_slug(model)}.{mode}"
    raw_log = (run_dir / "raw" / f"{stem}.jsonl").open("w", encoding="utf-8")
    all_ko: dict[int, str] = {}
    previous: list[tuple[Block, str]] = []
    batches = sample.batches[:max_batches] if max_batches else sample.batches
    try:
        for batch_no, batch in enumerate(batches, start=1):
            messages = build_messages(system_template, sample.lang, batch, previous)
            body = build_body(model, messages, mode, provider_cfg, schema)
            check = BatchCheck(batch_no, sum(len(u.blocks) for u in batch))
            check.prompt_chars = sum(len(m["content"]) for m in messages)
            check.src_chars = sum(len(b.text) for u in batch for b in u.blocks)
            call = post_chat(
                client,
                url,
                headers,
                body,
                provider_cfg["timeout"],
                limiter,
                runtime,
                is_local=provider == "local",
            )
            check.status, check.attempts, check.retries = call.status, call.attempts, call.retries
            check.latency_s = call.latency_s
            raw_log.write(
                json.dumps(
                    {
                        "batch": batch_no,
                        "request": body,
                        "status": call.status,
                        "error": call.error,
                        "response": call.data or call.text[:4000],
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            if call.error:
                check.error = call.error
                check.error_blocks = check.expected
                result.batches.append(check)
                if mode != "prompt" and call.status in UNSUPPORTED_STATUS and batch_no == 1:
                    result.supported = False
                    result.note = f"HTTP {call.status}: {call.text[:300]}"
                else:
                    result.note = (
                        f"배치 {batch_no} 호출 실패로 중단: {call.error} {call.text[:300]}"
                    )
                break
            result.supported = True
            choice = (call.data or {}).get("choices", [{}])[0]
            message = choice.get("message") or {}
            check.finish_reason = choice.get("finish_reason")
            content = message.get("content") or ""
            reasoning = message.get("reasoning_content") or message.get("reasoning") or ""
            # NIM 일부 모델은 구조화 출력 요청 시 content 를 비우고 JSON 을 reasoning 필드에 넣는다.
            # 출력 방식 결정에 필요하므로 따로 기록하고, 그 JSON 으로 나머지 지표를 잰다.
            if not content.strip() and reasoning.strip():
                check.content_in_reasoning = True
                content = reasoning
            else:
                check.think_leak = bool(reasoning)
            usage = (call.data or {}).get("usage") or {}
            check.prompt_tokens = usage.get("prompt_tokens") or 0
            check.completion_tokens = usage.get("completion_tokens") or 0
            ko_by_idx = validate_output(check, batch, content, sample.lang, limits)
            all_ko.update(ko_by_idx)
            batch_blocks = [b for u in batch for b in u.blocks]
            previous = [
                (b, ko_by_idx[b.idx])
                for b in batch_blocks[-cfg["prev_context_blocks"] :]
                if b.idx in ko_by_idx
            ]
            result.batches.append(check)
    finally:
        raw_log.close()
    if all_ko:
        out = run_dir / "outputs" / f"{stem}.ko.srt"
        write_srt(out, sample.blocks[: sum(c.expected for c in result.batches)], all_ko)
        result.output_file = str(out.relative_to(run_dir))
    return result


# ---------------------------------------------------------------- 집계 · 리포트


def _pct(n: float, d: float) -> float | None:
    return round(100 * n / d, 1) if d else None


def summarize(result: RunResult) -> dict[str, Any]:
    checks = result.batches
    total_blocks = sum(c.expected for c in checks)
    latencies = sorted(c.latency_s for c in checks if c.latency_s is not None)
    completion = sum(c.completion_tokens for c in checks)
    prompt_tokens = sum(c.prompt_tokens for c in checks)
    responded = [c for c in checks if c.status and 200 <= c.status < 300]
    warnings: Counter[str] = Counter()
    residual_examples: list[str] = []
    for c in checks:
        warnings.update(c.warnings)
        for hits in c.residual.values():
            residual_examples.extend(hits)
    return {
        "provider": result.provider,
        "model": result.model,
        "mode": result.mode,
        "lang": result.lang,
        "supported": result.supported,
        "note": result.note,
        "batches": len(checks),
        "blocks": total_blocks,
        "http_fail": len(checks) - len(responded),
        "retries": sum(c.retries for c in checks),
        "json_ok_pct": _pct(sum(c.json_ok for c in checks), len(checks)),
        "json_strict_pct": _pct(sum(c.json_strict_ok for c in checks), len(checks)),
        "schema_ok_pct": _pct(sum(c.schema_ok for c in checks), len(checks)),
        "idx_preserved_pct": _pct(sum(c.preserved for c in checks), total_blocks),
        "block_error_pct": _pct(sum(c.error_blocks for c in checks), total_blocks),
        "order_fail_batches": sum(1 for c in checks if c.schema_ok and not c.order_ok),
        "empty_blocks": sum(len(c.empty) for c in checks),
        "residual_blocks": sum(len(c.residual) for c in checks),
        "residual_examples": residual_examples[:SAMPLE_LIMIT],
        "warnings": dict(warnings),
        "truncated_batches": sum(1 for c in checks if c.finish_reason == "length"),
        "think_leak_batches": sum(1 for c in checks if c.think_leak),
        "content_in_reasoning_batches": sum(1 for c in checks if c.content_in_reasoning),
        "fenced_batches": sum(1 for c in checks if c.had_fence),
        "latency_p50_s": round(statistics.median(latencies), 2) if latencies else None,
        "latency_p95_s": round(latencies[min(len(latencies) - 1, int(0.95 * len(latencies)))], 2)
        if latencies
        else None,
        "completion_tok_per_s": round(completion / sum(latencies), 1)
        if latencies and completion
        else None,
        "completion_tok_per_src_char": round(completion / sum(c.src_chars for c in responded), 3)
        if completion and responded
        else None,
        "prompt_chars_per_tok": round(sum(c.prompt_chars for c in responded) / prompt_tokens, 2)
        if prompt_tokens
        else None,
        "output_file": result.output_file,
    }


def _cell(v: Any) -> str:
    if v is None:
        return "-"
    if isinstance(v, bool):
        return "yes" if v else "no"
    return str(v)


def render_report(meta: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    cols = [
        ("provider", "공급자"),
        ("model", "모델"),
        ("mode", "출력 방식"),
        ("lang", "언어"),
        ("supported", "지원"),
        ("batches", "배치"),
        ("http_fail", "HTTP 실패"),
        ("retries", "재시도"),
        ("json_ok_pct", "JSON %"),
        ("json_strict_pct", "JSON(원문) %"),
        ("schema_ok_pct", "스키마 %"),
        ("idx_preserved_pct", "idx 보존 %"),
        ("block_error_pct", "error 블록 %"),
        ("truncated_batches", "잘림"),
        ("think_leak_batches", "추론 노출"),
        ("content_in_reasoning_batches", "답이 reasoning에"),
        ("latency_p50_s", "p50 s"),
        ("latency_p95_s", "p95 s"),
        ("completion_tok_per_s", "출력 tok/s"),
    ]
    lines = [
        "# M0 모델 스파이크 결과",
        "",
        f"- 실행 시각: {meta['started_at']}",
        f"- 프롬프트: {meta['prompt_version']}",
        f"- 설정: `{meta['config']}`",
        "",
        "## 샘플",
        "",
    ]
    for s in meta["samples"]:
        lines.append(
            f"- `{s['lang']}`: {s['path']} — 블록 {s['blocks']}, unit {s['units']} "
            f"(병합 unit {s['merged_units']}), 배치 {s['batches']}"
        )
    for reason in meta["skipped"]:
        lines.append(f"- 건너뜀: {reason}")
    if meta.get("local_probe"):
        lines += [
            "",
            "## llama-server 상태",
            "",
            "```json",
            json.dumps(meta["local_probe"], ensure_ascii=False, indent=2),
            "```",
        ]
    lines += [
        "",
        "## 지표",
        "",
        "| " + " | ".join(h for _, h in cols) + " |",
        "|" + "---|" * len(cols),
    ]
    for r in rows:
        lines.append("| " + " | ".join(_cell(r[k]) for k, _ in cols) + " |")
    lines += ["", "## 조합별 상세", ""]
    for r in rows:
        lines.append(f"### {r['provider']} / {r['model']} / {r['mode']} / {r['lang']}")
        lines.append("")
        for key in (
            "note",
            "order_fail_batches",
            "empty_blocks",
            "residual_blocks",
            "residual_examples",
            "warnings",
            "fenced_batches",
            "completion_tok_per_src_char",
            "prompt_chars_per_tok",
            "output_file",
        ):
            if r.get(key) not in (None, "", [], {}):
                lines.append(f"- {key}: {r[key]}")
        lines.append("")
    lines += [
        "## 지표 정의",
        "",
        "- JSON %: 코드펜스·`<think>` 제거 후 JSON 파싱에 성공한 배치 비율. JSON(원문) %는 후처리 없이 성공한 비율",
        "- idx 보존 %: 입력 idx 가운데 정확히 한 번 반환된 블록 비율 (호출·파싱 실패 배치는 0으로 계산)",
        "- error 블록 %: §11 error(파싱/스키마 실패, idx 누락·중복·순서, 빈 번역, 원문 잔존)가 있는 블록 비율",
        "- 원문 잔존: en은 라틴 문자 4자 이상 연속, ja는 가나 2자 이상 연속. 용어집이 없으므로 이름도 잔존으로 센다",
        "- 지원 = no: 첫 배치가 HTTP 400/422로 거부됨. 서버가 제약을 조용히 무시하는 경우는 구분하지 못한다",
        "- 추론 노출: content 와 별도로 reasoning 필드나 `<think>` 가 온 배치 (버릴 텍스트에 토큰·시간을 씀)",
        "- 답이 reasoning에: content 가 비고 JSON 이 reasoning 필드에만 온 배치. 이 경우 그 JSON 으로 지표를 잰다",
        "- completion_tok_per_src_char: 원문 1자당 출력 토큰 (§6.4 출력 예산 추정용)",
        "- prompt_chars_per_tok: 프롬프트 문자/토큰 비율 (§6.4 NIM 토큰 근사용)",
    ]
    return "\n".join(lines) + "\n"


def main(
    argv: list[str] | None = None,
    client: httpx.Client | None = None,
    runtime: Runtime | None = None,
) -> int:
    parser = argparse.ArgumentParser(description="M0 모델 스파이크")
    parser.add_argument("--config", default=str(HERE / "m0.toml"))
    parser.add_argument("--only", help="공급자 제한 (쉼표 구분: nim,local)")
    parser.add_argument("--models", help="모델 제한 (쉼표 구분, 부분 문자열 일치)")
    parser.add_argument("--lang", help="언어 제한 (쉼표 구분: en,ja)")
    parser.add_argument("--max-batches", type=int, help="조합당 배치 수 상한 (빠른 확인용)")
    parser.add_argument("--dry-run", action="store_true", help="샘플·unit·배치 구성만 출력")
    parser.add_argument("--out-dir", help="결과 디렉터리 (설정값 대신)")
    args = parser.parse_args(argv)

    runtime = runtime or Runtime()
    config_path = Path(args.config)
    cfg = tomllib.loads(config_path.read_text(encoding="utf-8"))
    only_providers = set(args.only.split(",")) if args.only else None
    model_filters = args.models.split(",") if args.models else None
    only_lang = set(args.lang.split(",")) if args.lang else None
    samples, skipped = load_samples(cfg, only_lang)
    sample_meta = [
        {
            "lang": s.lang,
            "path": str(s.path),
            "blocks": len(s.blocks),
            "units": len(s.units),
            "merged_units": sum(1 for u in s.units if len(u.blocks) > 1),
            "batches": len(s.batches),
        }
        for s in samples
    ]
    for s in sample_meta:
        print(f"[sample] {s}")
    if args.dry_run:
        for reason in skipped:
            print(f"[skip] {reason}")
        return 0 if samples else 2
    if not samples:
        print(f"실행할 샘플이 없다: {skipped}", file=sys.stderr)
        return 2

    own_client = client is None
    client = client or httpx.Client()
    started_at = datetime.now().astimezone()
    run_dir = Path(args.out_dir or cfg["out_dir"]) / started_at.strftime("%Y%m%d-%H%M%S")
    (run_dir / "raw").mkdir(parents=True, exist_ok=True)
    (run_dir / "outputs").mkdir(parents=True, exist_ok=True)
    meta: dict[str, Any] = {
        "started_at": started_at.isoformat(timespec="seconds"),
        "prompt_version": PROMPT_VERSION,
        "config": str(config_path),
        "samples": sample_meta,
        "skipped": list(skipped),
    }
    results: list[RunResult] = []
    try:
        for provider, pcfg in cfg["providers"].items():
            if only_providers and provider not in only_providers:
                continue
            if not pcfg.get("enabled", True):
                meta["skipped"].append(f"{provider}: enabled = false")
                continue
            if not pcfg.get("base_url"):
                meta["skipped"].append(f"{provider}: base_url 미지정")
                continue
            if provider == "nim" and not os.environ.get(pcfg["api_key_env"]):
                meta["skipped"].append(f"{provider}: {pcfg['api_key_env']} 미설정")
                continue
            models = list(pcfg["models"])
            if provider == "local":
                probe = probe_local(client, pcfg["base_url"], auth_headers(pcfg))
                meta["local_probe"] = probe
                if probe.get("error") or probe.get("health") not in (200, 503):
                    meta["skipped"].append(
                        f"local: llama-server 응답 없음 ({probe.get('error') or probe.get('health')})"
                    )
                    continue
                served = probe.get("model_ids") or []
                if served and models[0] not in served:
                    # --alias 없이 띄우면 model 필드에 서버가 알려준 id(GGUF 경로)를 써야 한다
                    probe["warning"] = f"설정 모델 {models[0]} 이 서버 목록에 없어 {served[0]} 사용"
                    models = [served[0]]
            limiter = RateLimiter(pcfg.get("rpm", 0), runtime)
            if model_filters:
                models = [m for m in models if any(f in m for f in model_filters)]
            for model in models:
                for mode in pcfg["modes"]:
                    if mode not in ALL_MODES:
                        raise ValueError(f"알 수 없는 출력 방식: {mode}")
                    for sample in samples:
                        print(f"[run] {provider} {model} {mode} {sample.lang}", flush=True)
                        result = run_combo(
                            client,
                            provider,
                            pcfg,
                            model,
                            mode,
                            sample,
                            cfg,
                            run_dir,
                            runtime,
                            limiter,
                            args.max_batches,
                        )
                        results.append(result)
                        print(
                            f"      → {json.dumps(summarize(result), ensure_ascii=False)}",
                            flush=True,
                        )
    finally:
        if own_client:
            client.close()

    rows = [summarize(r) for r in results]
    (run_dir / "metrics.json").write_text(
        json.dumps(
            {
                "meta": meta,
                "runs": rows,
                "batches": [
                    {
                        "provider": r.provider,
                        "model": r.model,
                        "mode": r.mode,
                        "lang": r.lang,
                        "checks": [asdict(c) for c in r.batches],
                    }
                    for r in results
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (run_dir / "report.md").write_text(render_report(meta, rows), encoding="utf-8")
    for reason in meta["skipped"]:
        print(f"[skip] {reason}")
    print(f"[done] {run_dir / 'report.md'}")
    return 0 if results else 2


if __name__ == "__main__":
    sys.exit(main())
