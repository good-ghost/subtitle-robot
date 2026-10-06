from pathlib import Path

import pytest

from subtitle_robot.glossary.importer import (
    GlossaryImportError,
    OfficialRow,
    import_official,
    read_official_csv,
)
from subtitle_robot.glossary.model import (
    Glossary,
    Variant,
    avoid_with_old,
    respell_variants,
    update_entry,
)
from subtitle_robot.glossary.store import load_glossary

ROOT = Path(__file__).parent.parent.parent
EXAMPLE_GLOSSARY = ROOT / "examples" / "glossary.example.yaml"
EXAMPLE_CSV = ROOT / "examples" / "official.example.csv"


@pytest.fixture
def glossary() -> Glossary:
    return load_glossary(EXAMPLE_GLOSSARY)


def _row(source: str, ko: str, **extra: str) -> OfficialRow:
    return OfficialRow(line_no=2, source=source, target=ko, **extra)  # type: ignore[arg-type]


def test_example_csv_reads() -> None:
    rows = read_official_csv(EXAMPLE_CSV)

    assert [(r.source, r.target, r.src_lang) for r in rows] == [
        ("田中ヒロシ", "다나카 히로시", "ja"),
        ("ヒロ", "히로", "ja"),
        ("Kowalski", "코왈스키", "en"),
    ]
    assert rows[0].reading == "たなか ひろし"
    assert rows[1].note is None


def test_overwrites_generated_entry_and_locks(glossary: Glossary) -> None:
    # E0007 은 generated·auto 의 타나카 히로시
    updated, report = import_official(
        glossary, [_row("田中ヒロシ", "다나카 히로시")], default_src_lang="ja"
    )
    entry = updated.get("E0007")

    assert report.updated == ["E0007"]
    assert (entry.target, entry.target_source, entry.status) == (
        "다나카 히로시",
        "official",
        "locked",
    )
    # 공식 표기에 쓰인 '다나카'는 avoid 에서 빠지고, 바뀐 이전 단어 '타나카'가 들어간다
    assert entry.avoid == ("타나카",)
    assert entry.rev == glossary.get("E0007").rev + 1
    # 변형 속 이전 표기도 바꾼다 (avoid 와 모순되지 않게)
    assert [(v.src, v.target) for v in entry.variants] == [
        ("田中", "다나카"),
        ("ヒロシ", "히로시"),
        ("ヒロ", "히로"),
    ]


def test_overwrites_llm_entry(glossary: Glossary) -> None:
    updated, report = import_official(
        glossary, [_row("John Miller", "존 밀러")], default_src_lang="en"
    )

    # 같은 표기면 출처·상태만 바뀐다
    assert updated.get("E0003").target_source == "official"
    assert report.updated == ["E0003"]


def test_manual_entry_is_not_overwritten(glossary: Glossary) -> None:
    manual = update_entry(glossary, "E0003", origin="user", target_source="manual")

    updated, report = import_official(
        manual, [_row("John Miller", "존 밀러 3세")], default_src_lang="en"
    )

    assert updated is manual
    assert report.skipped_manual == ["E0003"]


def test_variant_match_updates_variant(glossary: Glossary) -> None:
    updated, report = import_official(glossary, [_row("ヒロ", "히로오")], default_src_lang="ja")
    entry = updated.get("E0007")

    assert report.variants_updated == ["E0007"]
    assert [v.target for v in entry.variants if v.src == "ヒロ"] == ["히로오"]
    assert entry.avoid == ("다나카", "히로")
    assert entry.status == "locked"


def test_new_name_is_added_locked_official(glossary: Glossary) -> None:
    updated, report = import_official(
        glossary, [_row("Kowalski", "코왈스키", src_lang="en")], default_src_lang="ja"
    )
    entry = updated.get(report.added[0])

    assert entry.id == "E0013"
    assert (entry.src_lang, entry.status, entry.target_source, entry.type) == (
        "en",
        "locked",
        "official",
        "person",
    )


def test_reimport_same_value_is_unchanged(glossary: Glossary) -> None:
    once, _ = import_official(
        glossary, [_row("田中ヒロシ", "다나카 히로시")], default_src_lang="ja"
    )

    twice, report = import_official(
        once, [_row("田中ヒロシ", "다나카 히로시")], default_src_lang="ja"
    )

    assert twice is once
    assert report.unchanged == ["E0007"]


@pytest.mark.parametrize(
    ("content", "message"),
    [
        ("name,ko\nA,에이\n", "필수 열"),
        ("source,ko,color\nA,에이,red\n", "모르는 열"),
        ("source,ko\nA,\n", "비울 수 없다"),
        ("source,ko,type\nA,에이,animal\n", "모르는 type"),
        ("source,ko,src_lang\nA,에이,xx\n", "src_lang"),
    ],
)
def test_invalid_csv(tmp_path: Path, content: str, message: str) -> None:
    path = tmp_path / "official.csv"
    path.write_text(content, encoding="utf-8")

    with pytest.raises(GlossaryImportError, match=message):
        read_official_csv(path)


def test_csv_with_bom(tmp_path: Path) -> None:
    path = tmp_path / "official.csv"
    path.write_text("source,ko\n東京,도쿄\n", encoding="utf-8-sig")

    assert read_official_csv(path)[0].source == "東京"


def test_avoid_update_rules() -> None:
    assert avoid_with_old((), old="존 밀러", new="존밀러") == ("존 밀러",)  # 단어 수가 다르면 전체
    assert avoid_with_old(("다나카",), old="타나카", new="다나카") == (
        "타나카",
    )  # 새 표기는 avoid 에서 뺀다
    assert avoid_with_old(("x",), old=None, new="y") == ("x",)


def test_respell_variants() -> None:
    variants = (
        Variant(src="ガラッシア", target="가라시아"),
        Variant(src="ドン ガラシア", target="돈 가라시아"),
        Variant(src="ドン", target="돈"),
    )

    respelled = respell_variants(variants, old="가라시아", new="갈라시아")

    assert [v.target for v in respelled] == ["갈라시아", "돈 갈라시아", "돈"]
    assert respelled[2] is variants[2]
    assert respell_variants(variants, old=None, new="x") is variants


def test_csv_target_column_and_legacy_ko_column(tmp_path: Path) -> None:
    new = tmp_path / "new.csv"
    new.write_text("source,target\n東京,도쿄\n", encoding="utf-8")
    legacy = tmp_path / "legacy.csv"
    legacy.write_text("source,ko\n東京,도쿄\n", encoding="utf-8")
    both = tmp_path / "both.csv"
    both.write_text("source,target,ko\n東京,도쿄,도쿄\n", encoding="utf-8")

    assert read_official_csv(new) == read_official_csv(legacy)
    assert read_official_csv(new)[0].target == "도쿄"
    with pytest.raises(GlossaryImportError, match="함께"):
        read_official_csv(both)
