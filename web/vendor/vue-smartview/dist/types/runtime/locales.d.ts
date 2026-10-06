export declare const SUPPORTED_LOCALES: readonly ["en", "ko"];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export declare function isSupportedLocale(value: string): value is SupportedLocale;
/** 언어 이름은 그 언어로 쓴다 (언어를 바꾸는 메뉴에서 읽을 수 있게, 번역하지 않는다) */
export declare const LOCALE_NAMES: Record<SupportedLocale, string>;
/** 목록에서 다음 언어 (원본 드로어 언어 메뉴는 두 언어를 번갈아 바꾼다) */
export declare function nextLocale(locale: SupportedLocale): SupportedLocale;
