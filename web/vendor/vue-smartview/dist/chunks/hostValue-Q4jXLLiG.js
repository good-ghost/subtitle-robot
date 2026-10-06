import { Hn as e, Tn as t, er as n, in as r, xn as i } from "./vuetify-DJ4bsPds.js";
//#region src/runtime/elementHost.ts
var a = Symbol("smartview-element-host");
function o() {
	let e = i();
	return e !== null && Reflect.get(e, "ce") !== void 0 && Reflect.get(e, "ce") !== null;
}
function s() {
	return o() ? r() : t(a, null);
}
//#endregion
//#region src/runtime/hostValue.ts
function c(e) {
	return typeof Reflect.get(e, "_setProp") == "function";
}
function l(e, t) {
	if (Object.is(e, t)) return !0;
	if (Array.isArray(e) || Array.isArray(t)) return Array.isArray(e) && Array.isArray(t) && e.length === t.length && e.every((e, n) => l(e, t[n]));
	if (!u(e) || !u(t)) return !1;
	let n = Object.keys(e);
	return n.length === Object.keys(t).length && n.every((n) => Object.hasOwn(t, n) && l(e[n], t[n]));
}
function u(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function d(t, r, i = {}) {
	let a = i.normalize ?? ((e) => e), o = s(), u = n(a(r())), d = n(u.value), f = null;
	e(r, (e) => {
		if (f && e === f.value) {
			f = null;
			return;
		}
		f = null;
		let t = a(e);
		d.value = t, !l(t, u.value) && (u.value = t, i.onHostValue?.(u.value));
	});
	function p(e) {
		if (u.value = e, o && e !== r()) {
			if (!c(o)) throw Error(`요소 프로퍼티 ${t} 를 맞출 수 없습니다: Vue 요소가 아닙니다 (<${o.localName}>)`);
			f = { value: e }, o._setProp(t, e, !1, !0);
		}
	}
	function m() {
		p(d.value);
	}
	return {
		current: u,
		defaultValue: d,
		commit: p,
		reset: m
	};
}
//#endregion
export { s as n, d as t };
