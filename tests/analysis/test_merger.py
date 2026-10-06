from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.analysis.merger import MergeOptions, MergeReport, merge_pass1
from subtitle_robot.analysis.reconcile import fold_new_entities
from subtitle_robot.analysis.schema import NewEntity, Pass1Output
from subtitle_robot.glossary.model import Glossary, add_variants
from subtitle_robot.glossary.store import load_glossary

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"
JA = MergeOptions(src_lang="ja")
EN = MergeOptions(src_lang="en")


def _entity(tmp: str, source: str, **fields: Any) -> NewEntity:
    return NewEntity.model_validate({"tmp": tmp, "source": source, **fields})


def _merge(
    entities: list[NewEntity], options: MergeOptions = JA, glossary: Glossary | None = None
) -> tuple[Glossary, MergeReport]:
    return merge_pass1(glossary or Glossary(), Pass1Output(new_entities=entities), options)


def test_japanese_name_is_generated_with_avoid() -> None:
    entity = _entity(
        "n1",
        "田中ヒロシ",
        reading="たなか ひろし",
        reading_confidence="medium",
        origin="japanese",
        ko_suggestion="다나카 히로시",  # 참고용 — 코드 음역이 우선
        variants=[{"src": "田中", "reading": "たなか"}, {"src": "ヒロシ", "reading": "ひろし"}],
        seen_suffixes=["さん"],
        first_seen=33,
    )

    glossary, report = _merge([entity], MergeOptions(src_lang="ja", scope_label="S01E01"))
    entry = glossary.get(report.added["n1"])

    assert entry.id == "E0001"
    assert (entry.target, entry.target_source, entry.status) == (
        "타나카 히로시",
        "generated",
        "auto",
    )
    assert [(v.src, v.target) for v in entry.variants] == [("田中", "타나카"), ("ヒロシ", "히로시")]
    assert entry.avoid == ("다나카",)
    assert entry.first_seen == "S01E01#33"
    assert entry.seen_suffixes == ("さん",)


def test_standard_style_reverses_avoid() -> None:
    entity = _entity("n1", "田中", reading="たなか", origin="japanese")

    glossary, _ = _merge([entity], MergeOptions(src_lang="ja", style="standard"))

    assert (glossary.entries[0].target, glossary.entries[0].avoid) == ("다나카", ("타나카",))


def test_foreign_katakana_name_uses_llm_suggestion() -> None:
    # Q-03 A안
    entity = _entity(
        "n1",
        "アンジェロ",
        reading="あんじぇろ",
        origin="foreign",
        ko_suggestion="안젤로",
        variants=[{"src": "アンジェロ・ラグサ", "ko_suggestion": "안젤로 라구사"}],
    )

    glossary, report = _merge([entity])
    entry = glossary.entries[0]

    assert (entry.target, entry.target_source, entry.avoid) == ("안젤로", "llm", ())
    assert entry.variants[0].target == "안젤로 라구사"
    assert report.llm_fallbacks == []


def test_place_dictionary() -> None:
    glossary, _ = _merge(
        [_entity("n1", "東京", type="place", reading="とうきょう", origin="japanese")]
    )

    assert (glossary.entries[0].target, glossary.entries[0].avoid) == ("도쿄", ("토쿄",))


def test_japanese_without_kana_reading_falls_back_to_llm() -> None:
    entity = _entity("n1", "田中", reading="tanaka", origin="japanese", ko_suggestion="타나카")

    glossary, report = _merge([entity])

    assert glossary.entries[0].target_source == "llm"
    assert report.llm_fallbacks == ["E0001"]


def test_english_name_and_ambiguous() -> None:
    glossary, _ = _merge(
        [
            _entity(
                "n1",
                "John Miller",
                ko_suggestion="존 밀러",
                variants=[{"src": "John", "ko_suggestion": "존"}],
            ),
            _entity("n2", "Will", ko_suggestion="윌"),
        ],
        EN,
    )
    john, will = glossary.entries

    assert (john.target, john.target_source, john.ambiguous) == ("존 밀러", "llm", False)
    assert john.variants[0].target == "존"
    assert will.ambiguous


def test_review_makes_proposed_and_low_confidence_reported() -> None:
    glossary, report = _merge(
        [_entity("n1", "蓮", reading="れん", reading_confidence="low", origin="japanese")],
        MergeOptions(src_lang="ja", review=True),
    )
    entry = glossary.entries[0]

    assert entry.status == "proposed"
    assert entry.ambiguous  # 한 글자
    assert report.low_confidence == [entry.id]


def test_ids_continue_after_existing() -> None:
    _, report = _merge(
        [_entity("n1", "ブルノ", origin="foreign", ko_suggestion="브루노")],
        glossary=load_glossary(EXAMPLE),
    )

    assert report.added == {"n1": "E0013"}


def test_existing_locked_spelling_kept_and_conflict_reported() -> None:
    base = load_glossary(EXAMPLE)
    output = Pass1Output.model_validate(
        {
            "conflicts": [
                {
                    "entity_id": "E0012",
                    "current_ko": "사토",
                    "suggested_ko": "사이토",
                    "reason": "x",
                }
            ]
        }
    )

    glossary, report = merge_pass1(base, output, JA)

    assert glossary.get("E0012").target == "사토"
    assert report.conflicts[0].suggested == "사이토"


def test_new_variant_appended_to_locked_entry_without_rev_bump() -> None:
    base = load_glossary(EXAMPLE)  # E0003 은 locked, rev 2
    output = Pass1Output.model_validate(
        {"new_variants": [{"entity_id": "E0003", "src": "Mr. Miller", "ko_suggestion": "밀러 씨"}]}
    )

    glossary, report = merge_pass1(base, output, EN)
    entry = glossary.get("E0003")

    assert entry.variants[-1].src == "Mr. Miller"
    assert entry.rev == 2
    assert report.variants_added == {"E0003": ["Mr. Miller"]}


def test_same_name_variant_reuses_known_spelling() -> None:
    output = Pass1Output.model_validate(
        {
            "new_variants": [
                {
                    "entity_id": "E0003",
                    "src": "Jon Miller",
                    "ko_suggestion": "존 밀라",
                    "same_name": True,
                },
                {
                    "entity_id": "E0003",
                    "src": "Johnny",
                    "ko_suggestion": "조니",
                    "same_name": False,
                },
            ]
        }
    )

    glossary, _ = merge_pass1(load_glossary(EXAMPLE), output, EN)
    variants = {v.src: v.target for v in glossary.get("E0003").variants}

    assert variants["Jon Miller"] == "존 밀러"  # 모델 제안(존 밀라) 대신 기존 표기
    assert variants["Johnny"] == "조니"


def test_request_schema_requires_same_name() -> None:
    from subtitle_robot.analysis.schema import request_schema

    assert "same_name" in request_schema()["$defs"]["NewVariant"]["required"]


def test_entity_matching_existing_variant_is_not_duplicated() -> None:
    base = load_glossary(EXAMPLE)  # E0007 의 변형 ヒロシ
    entity = _entity(
        "n1", "ヒロシ", reading="ひろし", origin="japanese",
        variants=[{"src": "ヒロっち", "reading": "ひろっち"}],
    )  # fmt: skip

    glossary, report = _merge([entity], glossary=base)

    assert len(glossary.entries) == len(base.entries)
    assert report.folded == {"n1": "E0007"}
    assert glossary.get("E0007").variants[-1].target == "히롯치"


def test_unknown_entity_in_new_variant_is_rejected() -> None:
    output = Pass1Output.model_validate({"new_variants": [{"entity_id": "E0099", "src": "X"}]})

    _, report = merge_pass1(Glossary(), output, EN)

    assert report.rejected == ["E0099"]


def test_entity_without_spelling_is_rejected() -> None:
    _, report = _merge([_entity("n1", "Zork")], EN)

    assert report.rejected == ["n1"]


def test_keep_policy_uses_source() -> None:
    glossary, _ = _merge([_entity("n1", "NERV", type="org", policy="keep")], EN)

    assert glossary.entries[0].target == "NERV"


def test_fold_new_entities_merges_variant_duplicates() -> None:
    full = _entity("n1", "田中ヒロシ", variants=[{"src": "田中"}], count=3, first_seen=10)
    short = _entity("n2", "田中", seen_suffixes=["君"], count=2, first_seen=4)

    remaining, folded = fold_new_entities([full, short])

    assert folded == {"n2": "n1"}
    (merged,) = remaining
    assert (merged.count, merged.first_seen, merged.seen_suffixes) == (5, 4, ["君"])


@pytest.mark.parametrize("src", ["田中", "ヒロシ"])
def test_add_variants_skips_known_surfaces(src: str) -> None:
    base = load_glossary(EXAMPLE)
    from subtitle_robot.glossary.model import Variant

    assert add_variants(base, "E0007", (Variant(src=src),)) is base


def test_source_holding_origin_is_salvaged_from_first_variant() -> None:
    # E2E(NIM): 모델이 source 에 기원을 넣고 이름은 variants 에만 넣었다
    variants = [
        {"src": "ブルノ", "ko_suggestion": "브루노"},
        {"src": "ブルーノ", "ko_suggestion": "브루노"},
    ]
    entity = _entity("n1", "japanese", type="person", variants=variants, note="origin: foreign")

    glossary, report = _merge([entity])
    entry = glossary.entries[0]

    assert report.salvaged == ["n1"]
    assert (entry.source, entry.target) == ("ブルノ", "브루노")
    assert [v.src for v in entry.variants] == ["ブルーノ"]


def test_conflicts_must_reference_known_entries() -> None:
    output = Pass1Output.model_validate(
        {
            "conflicts": [
                {"entity_id": "n3", "current_ko": "바네치", "suggested_ko": "바네티"},
                {"entity_id": "E0012", "current_ko": "사토", "suggested_ko": "사이토"},
                # 표기가 같으면 충돌이 아니다 ("같은 인물일 수 있음" 메모)
                {
                    "entity_id": "E0007",
                    "current_ko": "타나카 히로시",
                    "suggested_ko": "타나카 히로시",
                },
            ]
        }
    )

    _, report = merge_pass1(load_glossary(EXAMPLE), output, JA)

    assert [c.entity_id for c in report.conflicts] == ["E0012"]


def test_request_schema_requires_name_fields() -> None:
    from subtitle_robot.analysis.schema import request_schema

    entity = request_schema()["$defs"]["NewEntity"]

    assert {"tmp", "type", "source", "ko_suggestion"} <= set(entity["required"])
    assert "NOT a language" in entity["properties"]["source"]["description"]


def test_mixed_script_suggestion_falls_back_to_transliteration() -> None:
    # E2E(로컬 Qwen): オルコ 의 제안이 'オル코' 처럼 가나가 섞여 왔다
    entity = _entity(
        "n1",
        "オルコ",
        reading="オルコ",
        origin="foreign",
        ko_suggestion="オル코",
        variants=[{"src": "オルコファミリー", "ko_suggestion": "オル코 패밀리"}],
    )

    glossary, report = _merge([entity])
    entry = glossary.entries[0]

    assert (entry.target, entry.target_source) == ("오루코", "generated")
    assert entry.variants[0].target == "오루코파미리"  # ファ → 파, 장음 미표기
    assert report.dirty_suggestions == ["n1"]


def test_mixed_script_suggestion_in_english_is_rejected() -> None:
    _, report = _merge([_entity("n1", "Orco", ko_suggestion="オル코")], EN)

    assert report.rejected == ["n1"]


def test_full_name_marked_same_name_keeps_its_own_spelling() -> None:
    base, _ = _merge([_entity("n1", "ヴィンセント", origin="foreign", ko_suggestion="빈센트")], JA)
    output = Pass1Output.model_validate(
        {
            "new_variants": [
                {
                    "entity_id": "E0001",
                    "src": "ヴィンセントヴァネッティ",
                    "same_name": True,
                    "ko_suggestion": "빈센트 바네티",
                },
                {"entity_id": "E0001", "src": "Nero", "same_name": True, "ko_suggestion": "네로"},
                {
                    "entity_id": "E0001",
                    "src": "ヴィンセーント",
                    "same_name": True,
                    "ko_suggestion": "빈세엔트",
                },
            ]
        }
    )

    glossary, _ = merge_pass1(base, output, JA)
    variants = {v.src: v.target for v in glossary.get("E0001").variants}

    assert variants["ヴィンセントヴァネッティ"] == "빈센트 바네티"  # 성이 붙은 합성 이름
    assert variants["Nero"] == "네로"  # 닮지 않은 이름은 same_name 을 믿지 않는다
    assert variants["ヴィンセーント"] == "빈센트"  # 장음만 다른 표기


def test_surface_is_never_shared_by_two_entries() -> None:
    base, _ = _merge(
        [
            _entity("n1", "バネッチィ", origin="foreign", ko_suggestion="바네티"),
            _entity("n2", "ネロ", origin="foreign", ko_suggestion="네로"),
        ],
        JA,
    )
    output = Pass1Output.model_validate(
        {
            "new_variants": [
                {"entity_id": "E0001", "src": "ヴァッティ", "same_name": True},
                {"entity_id": "E0002", "src": "バネッチィ", "same_name": False},
            ],
            "new_entities": [
                {
                    "tmp": "n1",
                    "type": "person",
                    "source": "ヴァッティ",
                    "origin": "foreign",
                    "ko_suggestion": "바티",
                    "first_seen": 1,
                    "count": 1,
                    "variants": [{"src": "バネッチィ", "ko_suggestion": "바네티"}],
                },
            ],
        }
    )

    glossary, report = merge_pass1(base, output, JA)

    assert [e.source for e in glossary.entries] == ["バネッチィ", "ネロ"]  # 새 항목 없음
    assert report.folded == {"n1": "E0001"}
    assert glossary.get("E0002").variants == ()
    assert "E0001:バネッチィ" in report.duplicate_surfaces
