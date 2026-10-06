"""일본어 프로파일 (PROJECT-PLAN §8.4, §8.6)."""

from __future__ import annotations

import re

from subtitle_robot.lang.base import LanguageProfile

# 화자: 줄 앞 "（太郎）text" / "(太郎)text". 괄호만 있는 줄은 효과음(（笑）)으로 본다
_PAREN_LABEL = re.compile(r"^\s*(?:-\s*)?[（(](?P<name>[^）)]+)[）)]\s*(?P<rest>\S.*)$")
_SDH_LINE = re.compile(r"\s*(?:[（(\[［][^）)\]］]*[）)\]］]\s*)+")

# 접속·조사성 어미: 문장이 다음 블록으로 이어지는 신호 (§8.4)
_CONTINUATION_RE = re.compile(r"(、|て|で|けど|けれど|が|し|から|ので|のは|とか|って|と|を|に|は)$")
# 위 어미로 끝나도 문장이 끝나는 경우 (M0: 화자 경계를 넘은 오병합 — のに, なんて, いつも)
_SENTENCE_FINAL_RE = re.compile(r"(のに|なんて|も)$")


def japanese_continues(previous: str, following: str) -> bool:
    """일본어 문장이 다음 블록으로 이어지는지 (§8.4). 종결 부호 생략이 흔해 어미로 판단한다."""
    prev = previous.strip()
    if not prev or _SENTENCE_FINAL_RE.search(prev):
        return False
    return _CONTINUATION_RE.search(prev) is not None


JAPANESE = LanguageProfile(
    code="ja",
    encoding_candidates=("utf-8", "cp932", "euc_jp"),
    # §8.6 표의 접미사와 표기 변형
    honorific_suffixes=("さん", "様", "さま", "くん", "君", "ちゃん", "先輩", "先生"),
    titles=(),
    speaker_patterns=(_PAREN_LABEL,),
    sdh_line_pattern=_SDH_LINE,
    continues=japanese_continues,
)
