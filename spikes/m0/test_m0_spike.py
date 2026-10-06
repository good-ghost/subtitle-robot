"""M0 스파이크 하네스 테스트. 실제 공급자 대신 httpx.MockTransport 로 응답을 흉내 낸다."""

from __future__ import annotations

import json
import re
from pathlib import Path

import httpx
import m0_spike as m0
import pytest

SRT = """﻿1
00:00:01,000 --> 00:00:02,000
I don't know where it came from,

2
00:00:02,100 --> 00:00:03,000
but Starbuck was all
freaked out and barking.

3
00:00:04,000 --> 00:00:05,000
[dog barking]

4
00:00:06,000 --> 00:00:07,000
- What weird light?
- <i>The Chicago White Sox...</i>

5
00:00:08,000 --> 00:00:09,000


6
00:00:10,000 --> 00:00:11,000
Good boy.
"""

UNIT_CFG = {"max_blocks": 4, "max_duration": 10.0, "max_gap": 1.0}


class FakeRuntime(m0.Runtime):
    def __init__(self) -> None:
        self.now = 0.0
        self.slept: list[float] = []
        super().__init__(clock=self._clock, sleep=self._sleep, jitter=lambda: 0.0)

    def _clock(self) -> float:
        self.now += 0.5  # 호출마다 0.5초 흐른 것으로 본다
        return self.now

    def _sleep(self, seconds: float) -> None:
        self.slept.append(seconds)
        self.now += seconds


def _blocks() -> list[m0.Block]:
    return m0.select_blocks(m0.parse_srt(SRT), 0, 10)


def test_parse_and_select_skip_empty_blocks():
    blocks = _blocks()
    assert [b.idx for b in blocks] == [1, 2, 3, 4, 6]
    assert blocks[1].text == "but Starbuck was all\nfreaked out and barking."
    assert blocks[0].start == pytest.approx(1.0)


def test_unitize_merges_cut_sentence_but_not_sdh_or_speaker_dash():
    units = m0.unitize(_blocks(), "en", UNIT_CFG)
    assert [[b.idx for b in u.blocks] for u in units] == [[1, 2], [3], [4], [6]]


@pytest.mark.parametrize(
    ("first", "second"),
    [
        ("<i>Due to this activ--</i>", "<i>and then</i>"),  # 말 끊김
        ("<i>coming off an unprecedented wave</i>...", "That is so sweet of you."),  # 이탤릭 전환
    ],
)
def test_unitize_does_not_merge_interruption_or_italic_switch(first, second):
    blocks = [m0.Block(1, "1", 0.0, 1.0, first), m0.Block(2, "2", 1.1, 2.0, second)]
    assert len(m0.unitize(blocks, "en", UNIT_CFG)) == 2


def test_unitize_respects_max_blocks():
    blocks = [m0.Block(i, str(i), i * 1.0, i * 1.0 + 0.9, "and then,") for i in range(1, 7)]
    units = m0.unitize(blocks, "en", {**UNIT_CFG, "max_blocks": 4})
    assert [len(u.blocks) for u in units] == [4, 2]


def test_make_batches_never_splits_unit():
    units = m0.unitize(_blocks(), "en", UNIT_CFG)
    batches = m0.make_batches(units, 1)
    assert [[u.unit_id for u in b] for b in batches] == [["U1"], ["U2"], ["U3"], ["U4"]]


def test_extract_json_strips_think_and_fence():
    content = '<think>hmm</think>\nHere:\n```json\n{"units": []}\n```'
    got = m0.extract_json_text(content)
    assert got.text == '{"units": []}'
    assert got.had_think_tag and got.had_fence


def test_validate_detects_missing_duplicate_empty_and_residual():
    units = m0.unitize(_blocks(), "en", UNIT_CFG)
    content = json.dumps(
        {
            "units": [
                {
                    "unit": "U1",
                    "blocks": [
                        {"idx": 1, "ko": "어디서 왔는지 모르겠지만"},
                        {"idx": 1, "ko": "중복"},
                    ],
                },
                {"unit": "U2", "blocks": [{"idx": 3, "ko": " "}]},
                {
                    "unit": "U3",
                    "blocks": [{"idx": 4, "ko": "- 무슨 빛?\n- <i>Chicago 화이트삭스</i>"}],
                },
                {"unit": "U4", "blocks": [{"idx": 6, "ko": "착하지."}]},
            ]
        }
    )
    check = m0.BatchCheck(1, 5)
    m0.validate_output(check, units, content, "en", {"max_lines": 2, "max_line_chars": 22})
    assert check.json_strict_ok and check.schema_ok
    assert check.missing == [2]
    assert check.duplicate == [1]
    assert check.empty == [3]
    assert check.residual == {4: ["Chicago"]}
    assert check.preserved == 3  # 3, 4, 6
    assert check.error_blocks == 4  # 1(중복), 2(누락), 3(빈), 4(잔존)


def test_validate_schema_failure_counts_all_blocks_as_error():
    units = m0.unitize(_blocks(), "en", UNIT_CFG)
    check = m0.BatchCheck(1, 5)
    m0.validate_output(
        check, units, '{"translations": []}', "en", {"max_lines": 2, "max_line_chars": 22}
    )
    assert check.json_ok and not check.schema_ok
    assert check.error_blocks == 5


def test_output_schema_has_no_refs():
    assert "$ref" not in json.dumps(m0.output_schema())


# ---------------------------------------------------------------- 전체 실행 (mock 공급자)


def _request_idx(body: dict) -> list[tuple[str, list[int]]]:
    user = body["messages"][1]["content"]
    payload = json.loads(re.search(r"<translate>\n(.*)\n</translate>", user, re.DOTALL).group(1))
    return [(u["unit"], [b["idx"] for b in u["blocks"]]) for u in payload["units"]]


def _answer(units: list[tuple[str, list[int]]], drop: int | None = None, ko: str = "번역") -> str:
    return json.dumps(
        {
            "units": [
                {"unit": uid, "blocks": [{"idx": i, "ko": f"{ko} {i}"} for i in idxs if i != drop]}
                for uid, idxs in units
            ],
            "new_terms": [],
        },
        ensure_ascii=False,
    )


def _chat(content: str | None, reasoning: str | None = None) -> httpx.Response:
    message = {"role": "assistant", "content": content}
    if reasoning:
        message["reasoning_content"] = reasoning
    return httpx.Response(
        200,
        json={
            "choices": [{"message": message, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 100, "completion_tokens": 50},
        },
    )


def _make_handler():
    calls = {"prompt": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if request.url.host == "llm.local":
            if path == "/health":
                return httpx.Response(200, json={"status": "ok"})
            if path == "/props":
                return httpx.Response(
                    200,
                    json={
                        "default_generation_settings": {"n_ctx": 32768},
                        "total_slots": 2,
                        "model_path": "/m/q.gguf",
                        "chat_template": "x",
                    },
                )
            if path == "/v1/models":
                return httpx.Response(200, json={"data": [{"id": "qwen-alias"}]})
            body = json.loads(request.content)
            assert body["model"] == "qwen-alias"
            assert body["chat_template_kwargs"] == {"enable_thinking": False}
            return _chat(_answer(_request_idx(body)), reasoning="생각")
        assert request.headers["authorization"] == "Bearer test-key"
        body = json.loads(request.content)
        units = _request_idx(body)
        if "nvext" in body:
            return _chat(_answer(units))
        fmt = (body.get("response_format") or {}).get("type")
        if fmt == "json_schema":
            return httpx.Response(400, json={"error": "response_format json_schema not supported"})
        if fmt == "json_object":
            first = units[0][1][0]
            return _chat("<think>x</think>```json\n" + _answer(units, drop=first) + "\n```")
        calls["prompt"] += 1
        if calls["prompt"] == 1:
            return httpx.Response(429, headers={"retry-after": "3"}, json={"error": "rate"})
        return _chat(_answer(units, ko="Hello"))

    return handler


def _write_config(tmp_path: Path, local_url: str = "http://llm.local/v1") -> Path:
    srt = tmp_path / "sample.en.srt"
    srt.write_text(SRT, encoding="utf-8")
    config = tmp_path / "m0.toml"
    config.write_text(
        f"""
out_dir = "{tmp_path / "results"}"
blocks = 200
batch_blocks = 2
prev_context_blocks = 2
max_line_chars = 22
max_lines = 2
[unit]
max_blocks = 4
max_duration = 10.0
max_gap = 1.0
[[samples]]
lang = "en"
path = "{srt}"
start = 0
[[samples]]
lang = "ja"
path = ""
[providers.nim]
base_url = "https://nim.test/v1"
api_key_env = "NVIDIA_API_KEY"
models = ["deepseek-ai/deepseek-v4.1-flash"]
modes = ["json_schema", "guided_json", "json_object", "prompt"]
rpm = 30
timeout = 120
temperature = 0.2
max_tokens = 1024
extra_body = {{}}
[providers.local]
base_url = "{local_url}"
api_key_env = "LLAMA_API_KEY"
models = ["Qwen3.8-27B-UD-Q4_K_XL"]
modes = ["json_schema"]
rpm = 0
timeout = 600
temperature = 0.2
max_tokens = 1024
extra_body = {{ chat_template_kwargs = {{ enable_thinking = false }} }}
""",
        encoding="utf-8",
    )
    return config


def test_main_end_to_end_with_mock_providers(tmp_path, monkeypatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    config = _write_config(tmp_path)
    runtime = FakeRuntime()
    client = httpx.Client(transport=httpx.MockTransport(_make_handler()))

    assert m0.main(["--config", str(config)], client=client, runtime=runtime) == 0

    run_dir = next((tmp_path / "results").iterdir())
    metrics = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))
    runs = {(r["provider"], r["mode"]): r for r in metrics["runs"]}

    assert runs[("nim", "json_schema")]["supported"] is False
    assert "not supported" in runs[("nim", "json_schema")]["note"]

    guided = runs[("nim", "guided_json")]
    assert guided["supported"] is True
    assert guided["idx_preserved_pct"] == 100.0
    assert guided["block_error_pct"] == 0.0
    assert guided["batches"] == 3  # unit [1,2] / [3,4] / [6]

    obj = runs[("nim", "json_object")]
    assert obj["json_ok_pct"] == 100.0 and obj["json_strict_pct"] == 0.0
    assert obj["fenced_batches"] == 3 and obj["think_leak_batches"] == 3
    assert obj["idx_preserved_pct"] == pytest.approx(100 * 2 / 5, abs=0.1)

    prompt = runs[("nim", "prompt")]
    assert prompt["retries"] == 1
    assert prompt["residual_blocks"] == 5  # "Hello" 가 원문 잔존으로 잡힘
    assert 3.0 in runtime.slept  # Retry-After 준수

    local = runs[("local", "json_schema")]
    assert local["model"] == "qwen-alias"
    assert local["think_leak_batches"] == 3
    assert metrics["meta"]["local_probe"]["n_ctx"] == 32768
    assert "warning" in metrics["meta"]["local_probe"]
    assert "ja: 샘플 경로 미지정" in metrics["meta"]["skipped"]

    report = (run_dir / "report.md").read_text(encoding="utf-8")
    assert "| nim | deepseek-ai/deepseek-v4.1-flash | guided_json | en | yes |" in report
    out = (run_dir / guided["output_file"]).read_text(encoding="utf-8")
    assert "번역 6" in out and "00:00:10,000 --> 00:00:11,000" in out
    raw = (run_dir / "raw" / "en.nim.deepseek-ai-deepseek-v4.1-flash.guided_json.jsonl").read_text()
    assert "test-key" not in raw  # 인증 헤더는 로그에 남기지 않는다


def test_main_skips_providers_without_prerequisites(tmp_path, monkeypatch):
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    config = _write_config(tmp_path, local_url="")
    client = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(500)))

    assert m0.main(["--config", str(config)], client=client, runtime=FakeRuntime()) == 2

    run_dir = next((tmp_path / "results").iterdir())
    skipped = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))["meta"]["skipped"]
    assert "nim: NVIDIA_API_KEY 미설정" in skipped
    assert "local: base_url 미지정" in skipped


def test_local_loading_503_waits_without_counting_attempt():
    responses = iter(
        [httpx.Response(503, json={"error": {"message": "Loading model"}})] * 3 + [_chat("{}")]
    )
    client = httpx.Client(transport=httpx.MockTransport(lambda r: next(responses)))
    runtime = FakeRuntime()
    call = m0.post_chat(
        client,
        "http://llm.local/v1/chat/completions",
        {},
        {},
        10,
        m0.RateLimiter(0, runtime),
        runtime,
        is_local=True,
    )
    assert call.status == 200 and call.attempts == 1 and call.retries == 0
    assert runtime.slept == [m0.LOCAL_LOADING_POLL_S] * 3


def test_main_uses_reasoning_field_when_content_is_null(tmp_path, monkeypatch):
    # NIM deepseek-v4.1-flash 실측: 구조화 출력 요청 시 content=null, JSON 은 reasoning_content 에 온다
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    config = _write_config(tmp_path, local_url="")
    config.write_text(
        config.read_text(encoding="utf-8").replace(
            'modes = ["json_schema", "guided_json", "json_object", "prompt"]',
            'modes = ["json_object"]',
        ),
        encoding="utf-8",
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return _chat(None, reasoning=_answer(_request_idx(json.loads(request.content))))

    client = httpx.Client(transport=httpx.MockTransport(handler))
    assert m0.main(["--config", str(config)], client=client, runtime=FakeRuntime()) == 0

    run_dir = next((tmp_path / "results").iterdir())
    (run,) = json.loads((run_dir / "metrics.json").read_text(encoding="utf-8"))["runs"]
    assert run["content_in_reasoning_batches"] == 3
    assert run["think_leak_batches"] == 0
    assert run["idx_preserved_pct"] == 100.0
