import type { SmartviewElementTagNameMap } from './element-types';
/** 등록할 수 있는 태그. 공개 타입의 태그 맵(element-types.ts)에서 온다. */
export type SmartviewTag = keyof SmartviewElementTagNameMap;
export declare const SMARTVIEW_TAGS: readonly SmartviewTag[];
export declare function isSmartviewTag(value: string): value is SmartviewTag;
/**
 * 요소를 불러와 `customElements` 에 등록한다. 인자가 없으면 전체를 등록한다.
 * 요소 모듈은 한 번만 평가되므로 여러 번 불러도 된다.
 * 다른 정의가 같은 태그를 먼저 차지했으면 거부된다 (runtime/define.ts registerSmartviewElement).
 */
export declare function register(tags?: readonly string[]): Promise<void>;
