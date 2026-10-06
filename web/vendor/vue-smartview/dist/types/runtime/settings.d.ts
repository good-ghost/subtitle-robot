import type { SupportedLocale } from './locales';
declare const THEMES: readonly ["light", "dark"];
export type ThemeName = (typeof THEMES)[number];
/** 테마를 바꾸고 document 에 `smartview-theme-change` 이벤트(detail: { theme })를 보낸다. */
export declare function setTheme(theme: string): void;
export declare function getTheme(): string;
/** 패키지 문구(vue-i18n)와 Vuetify 내장 문구를 함께 바꾸고 `smartview-locale-change` 이벤트를 보낸다. */
export declare function setLocale(locale: string): void;
export declare function getLocale(): SupportedLocale;
export {};
