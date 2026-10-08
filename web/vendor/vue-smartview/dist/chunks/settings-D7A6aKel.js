import { $t as e, n as t, nn as n, rn as r } from "./vuetify-C39-WP9g.js";
//#region src/runtime/settings.ts
var i = ["light", "dark"];
function a(e) {
	return i.some((t) => t === e);
}
function o(e) {
	if (!a(e)) throw Error(`지원하지 않는 테마입니다: ${e} (가능: ${i.join(", ")})`);
	t.theme.change(e), document.dispatchEvent(new CustomEvent("smartview-theme-change", { detail: { theme: e } }));
}
function s() {
	return t.theme.global.name.value;
}
function c(i) {
	if (!r(i)) throw Error(`지원하지 않는 언어입니다: ${i} (가능: ${n.join(", ")})`);
	e.global.locale.value = i, t.locale.current.value = i, document.dispatchEvent(new CustomEvent("smartview-locale-change", { detail: { locale: i } }));
}
function l() {
	return e.global.locale.value;
}
//#endregion
export { o as i, s as n, c as r, l as t };
