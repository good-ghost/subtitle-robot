import { Qt as e, Yn as t, n } from "./vuetify-DJ4bsPds.js";
//#region src/runtime/notifyStore.ts
var r = t({
	id: 0,
	show: !1,
	text: "",
	color: "success",
	timeout: 3e3
}), i = t([]), a = 0;
function o() {
	a += 1;
	let e = a;
	return i.push(e), {
		id: e,
		unregister: () => {
			let t = i.indexOf(e);
			t >= 0 && i.splice(t, 1);
		},
		isActive: () => i[i.length - 1] === e
	};
}
//#endregion
//#region src/runtime/locales.ts
var s = ["en", "ko"];
function c(e) {
	return s.some((t) => t === e);
}
var l = {
	en: "English",
	ko: "한국어"
};
function u(e) {
	return s[(s.indexOf(e) + 1) % s.length] ?? e;
}
//#endregion
//#region src/runtime/settings.ts
var d = ["light", "dark"];
function f(e) {
	return d.some((t) => t === e);
}
function p(e) {
	if (!f(e)) throw Error(`지원하지 않는 테마입니다: ${e} (가능: ${d.join(", ")})`);
	n.theme.change(e), document.dispatchEvent(new CustomEvent("smartview-theme-change", { detail: { theme: e } }));
}
function m() {
	return n.theme.global.name.value;
}
function h(t) {
	if (!c(t)) throw Error(`지원하지 않는 언어입니다: ${t} (가능: ${s.join(", ")})`);
	e.global.locale.value = t, n.locale.current.value = t, document.dispatchEvent(new CustomEvent("smartview-locale-change", { detail: { locale: t } }));
}
function g() {
	return e.global.locale.value;
}
//#endregion
export { l as a, u as c, o as d, p as i, i as l, m as n, s as o, h as r, c as s, g as t, r as u };
