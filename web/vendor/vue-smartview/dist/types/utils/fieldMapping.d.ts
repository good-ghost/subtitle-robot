import type { SmartviewFieldMapping, SmartviewMappingField } from '../types';
/** 타입 분류 (호환 판정용) */
export type FieldTypeCategory = 'boolean' | 'datetime' | 'date' | 'time' | 'number' | 'string' | 'other';
/** 호환 판정: ok 그대로, warn 변환 확인 필요, bad 호환되지 않음 */
export type TypeCompatibility = 'ok' | 'warn' | 'bad';
type MappingField = SmartviewMappingField;
type FieldMapping = SmartviewFieldMapping;
/** 타입 문자열을 분류한다. 원본 정규식 순서를 그대로 따른다 (datetime 을 date·time 보다 먼저) */
export declare function typeCategory(type: string | null | undefined): FieldTypeCategory;
/**
 * 소스 타입을 타깃 타입에 넣을 때의 호환 판정 (원본 compatLevel). boolean·date·datetime 은 민감하게 본다.
 * 분류할 수 없는 타입(other)이 끼면 판단하지 않는다(ok). 수식 매핑은 호출하는 쪽에서 ok 로 본다 (수식 결과는 사용자 책임).
 */
export declare function typeCompatibility(sourceType: string | null | undefined, targetType: string | null | undefined): TypeCompatibility;
/** 매핑 한 건의 판정. 타깃이 없거나 수식이면 ok */
export declare function mappingCompatibility(mapping: FieldMapping | null | undefined, sourceFields: readonly MappingField[], targetFields: readonly MappingField[]): TypeCompatibility;
/**
 * 타입 칩 색 (원본 typeColor 의 blue·orange·teal·purple·pink·grey).
 * 이름 붙은 색은 tonal 칩 글자 대비가 모자라 테마 색으로 바꾼다 (WI-5.001c): 문자열 primary, 숫자 warning, 날짜·시각 secondary,
 * 불리언 accent, id·참조 info, 그 밖은 색 없음(중립).
 */
export declare function typeColor(type: string | null | undefined): string | undefined;
/**
 * 이름으로 자동 매핑한다 (원본 autoMap). 이미 매핑된 소스는 그대로 두고, 이름이 같은 타깃을 먼저, 없으면 한쪽이 다른 쪽을 포함하는 타깃을 고른다.
 * 새 매핑 배열과 새로 매핑한 수를 돌려준다 (입력 배열은 바꾸지 않는다).
 */
export declare function autoMapFields(sourceFields: readonly MappingField[], targetFields: readonly MappingField[], mappings: readonly FieldMapping[]): {
    mappings: FieldMapping[];
    count: number;
};
export {};
