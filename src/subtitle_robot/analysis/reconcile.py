"""새 엔티티끼리의 코드 reconcile (PROJECT-PLAN §9.1 규칙 3, WI-3.003).

LLM 이 같은 인물을 두 엔티티로 낸 경우(`田中ヒロシ` 와 `田中`)를 합친다:
어떤 엔티티의 원문이 다른 엔티티의 변형과 같으면 그 엔티티에 흡수한다.
변형·경칭은 합집합, count 는 합, first_seen 은 최솟값.
"""

from __future__ import annotations

from subtitle_robot.analysis.schema import NewEntity, Pass1Variant


def fold_new_entities(entities: list[NewEntity]) -> tuple[list[NewEntity], dict[str, str]]:
    """원문이 다른 엔티티의 변형인 엔티티를 흡수한다.

    Returns:
        (남은 엔티티, 흡수된 tmp → 흡수한 tmp).
    """
    owner_of_variant: dict[str, str] = {}
    for entity in entities:
        for variant in entity.variants:
            if variant.src != entity.source:
                owner_of_variant.setdefault(variant.src, entity.tmp)

    by_tmp = {entity.tmp: entity for entity in entities}
    folded: dict[str, str] = {}
    for entity in entities:
        owner = owner_of_variant.get(entity.source)
        if owner is None or owner == entity.tmp or owner in folded:
            continue
        by_tmp[owner] = absorb(by_tmp[owner], entity)
        folded[entity.tmp] = owner
    remaining = [by_tmp[entity.tmp] for entity in entities if entity.tmp not in folded]
    return remaining, folded


def absorb(target: NewEntity, other: NewEntity) -> NewEntity:
    """`other` 의 변형·경칭·출현 정보를 `target` 에 합친다."""
    surfaces = {target.source, *(variant.src for variant in target.variants)}
    extra: list[Pass1Variant] = []
    for variant in [Pass1Variant(src=other.source, reading=other.reading,
                                 suggestion=other.suggestion), *other.variants]:  # fmt: skip
        if variant.src not in surfaces:
            extra.append(variant)
            surfaces.add(variant.src)
    first_seen = [value for value in (target.first_seen, other.first_seen) if value is not None]
    counts = [value for value in (target.count, other.count) if value is not None]
    return target.model_copy(
        update={
            "variants": [*target.variants, *extra],
            "seen_suffixes": list(dict.fromkeys([*target.seen_suffixes, *other.seen_suffixes])),
            "first_seen": min(first_seen) if first_seen else None,
            "count": sum(counts) if counts else None,
        }
    )
