"""자막 파일 인코딩 감지와 디코딩 (PROJECT-PLAN §7).

순서: 수동 지정 → BOM → strict UTF-8 → 후보 인코딩 안에서 charset-normalizer 감지.
"""

from __future__ import annotations

import codecs
from dataclasses import dataclass

from charset_normalizer import CharsetMatch, from_bytes

# 영어·일본어 자막과 기존 한국어 자막에서 흔한 레거시 인코딩.
# 후보를 좁히면 오판이 줄어든다. 순서는 동점일 때의 우선순위다: 번역 대상이 영어·일본어라
# 일본어 인코딩을 먼저 둔다 (EUC-JP 와 EUC-KR 은 바이트 범위가 겹쳐 짧은 텍스트에서 동점이 된다).
CANDIDATE_ENCODINGS: tuple[str, ...] = ("cp932", "euc_jp", "cp949", "cp1252")

# charset-normalizer 의 chaos(0~1, 깨진 문자 비율 추정)가 이 값 이상이면 신뢰도 낮음으로 본다
LOW_CONFIDENCE_CHAOS = 0.1

# chaos 차이가 이 값 이하인 후보는 동점으로 본다
_TIE_CHAOS = 0.01
# 동점 후보끼리 디코딩 결과가 다를 때의 신뢰도 상한 (low_confidence 가 되게 한다)
AMBIGUOUS_CONFIDENCE = 0.5

# 긴 BOM 을 먼저 검사해야 UTF-32 LE 를 UTF-16 LE 로 오판하지 않는다
_BOMS: tuple[tuple[bytes, str], ...] = (
    (codecs.BOM_UTF32_LE, "utf-32"),
    (codecs.BOM_UTF32_BE, "utf-32"),
    (codecs.BOM_UTF8, "utf-8-sig"),
    (codecs.BOM_UTF16_LE, "utf-16"),
    (codecs.BOM_UTF16_BE, "utf-16"),
)


class EncodingDetectionError(ValueError):
    """인코딩을 감지하지 못했거나 지정한 인코딩으로 디코딩할 수 없을 때."""


@dataclass(frozen=True, slots=True)
class DecodedText:
    """디코딩 결과.

    Attributes:
        text: 디코딩한 문자열. BOM 문자는 포함하지 않는다.
        encoding: 사용한 인코딩의 Python 코덱 이름.
        confidence: 0~1. 수동 지정·BOM·strict UTF-8 은 1.0.
        had_bom: 원본에 BOM 이 있었는지.
        alternatives: 감지에서 동점이었지만 다른 글자로 디코딩되는 인코딩 (사용자 안내용).
    """

    text: str
    encoding: str
    confidence: float
    had_bom: bool
    alternatives: tuple[str, ...] = ()

    @property
    def low_confidence(self) -> bool:
        """감지 결과를 믿기 어려워 사용자에게 `--encoding` 지정을 권해야 하는지."""
        return self.confidence < 1.0 - LOW_CONFIDENCE_CHAOS


def decode_subtitle(data: bytes, encoding: str | None = None) -> DecodedText:
    """자막 파일 바이트를 문자열로 디코딩한다.

    Args:
        data: 파일 원본 바이트.
        encoding: 사용자가 지정한 인코딩 (`--encoding`). 주면 감지를 하지 않는다.

    Returns:
        디코딩 결과.

    Raises:
        EncodingDetectionError: 지정 인코딩으로 디코딩할 수 없거나 감지에 실패한 경우.
    """
    had_bom = _detect_bom(data) is not None
    if encoding is not None:
        return _decode_manual(data, encoding, had_bom=had_bom)

    bom_encoding = _detect_bom(data)
    if bom_encoding is not None:
        return DecodedText(
            _strip_bom(data.decode(bom_encoding)), _canonical(bom_encoding), 1.0, had_bom=True
        )

    utf8_text = _try_decode_utf8(data)
    if utf8_text is not None:
        return DecodedText(utf8_text, "utf-8", 1.0, had_bom=False)

    return _detect_legacy(data)


def _detect_legacy(data: bytes) -> DecodedText:
    """후보 인코딩 안에서 감지한다. 후보가 모두 실패하면 전체 인코딩에서 감지한다."""
    matches = list(from_bytes(data, cp_isolation=list(CANDIDATE_ENCODINGS))) or list(
        from_bytes(data)
    )
    if not matches:
        raise EncodingDetectionError(
            "자막 인코딩을 감지하지 못했다. --encoding 으로 지정해야 한다 "
            f"(후보: {', '.join(CANDIDATE_ENCODINGS)})"
        )
    lowest_chaos = min(match.chaos for match in matches)
    tied = sorted(
        (match for match in matches if match.chaos - lowest_chaos <= _TIE_CHAOS),
        key=lambda match: (-match.coherence, _preference(match)),
    )
    chosen = tied[0]
    chosen_text = str(chosen)
    alternatives = tuple(
        _canonical(match.encoding) for match in tied[1:] if str(match) != chosen_text
    )
    confidence = max(0.0, 1.0 - chosen.chaos)
    if alternatives:
        confidence = min(confidence, AMBIGUOUS_CONFIDENCE)
    return DecodedText(
        chosen_text,
        _canonical(chosen.encoding),
        confidence,
        had_bom=False,
        alternatives=alternatives,
    )


def _preference(match: CharsetMatch) -> int:
    canonical = {_canonical(name): rank for rank, name in enumerate(CANDIDATE_ENCODINGS)}
    return canonical.get(_canonical(match.encoding), len(CANDIDATE_ENCODINGS))


def _decode_manual(data: bytes, encoding: str, *, had_bom: bool) -> DecodedText:
    try:
        codec = codecs.lookup(encoding)
    except LookupError as exc:
        raise EncodingDetectionError(f"알 수 없는 인코딩: {encoding}") from exc
    try:
        text = data.decode(codec.name)
    except UnicodeDecodeError as exc:
        raise EncodingDetectionError(
            f"지정한 인코딩 {encoding} 으로 디코딩할 수 없다 (바이트 위치 {exc.start})"
        ) from exc
    return DecodedText(_strip_bom(text), codec.name, 1.0, had_bom=had_bom)


def _try_decode_utf8(data: bytes) -> str | None:
    """strict UTF-8 로 디코딩되면 문자열, 아니면 None (레거시 인코딩 감지로 넘긴다)."""
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def _detect_bom(data: bytes) -> str | None:
    for bom, name in _BOMS:
        if data.startswith(bom):
            return name
    return None


def _strip_bom(text: str) -> str:
    return text.removeprefix("﻿")


def _canonical(encoding: str) -> str:
    return codecs.lookup(encoding).name
