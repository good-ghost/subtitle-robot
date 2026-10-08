import { A as e, Jn as t, O as n, cr as r, or as i } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/util/getScrollParent.js
function a(e, t = !1) {
	for (; e;) {
		if (t ? c(e) : s(e)) return e;
		e = e.parentElement;
	}
	return document.scrollingElement;
}
function o(e, t) {
	let n = [];
	if (t && e && !t.contains(e)) return n;
	for (; e && (s(e) && n.push(e), e !== t);) e = e.parentElement;
	return n;
}
function s(e) {
	if (!e || e.nodeType !== Node.ELEMENT_NODE) return !1;
	let t = window.getComputedStyle(e), n = t.overflowY === "scroll" || t.overflowY === "auto" && e.scrollHeight > e.clientHeight, r = t.overflowX === "scroll" || t.overflowX === "auto" && e.scrollWidth > e.clientWidth;
	return n || r;
}
function c(e) {
	if (!e || e.nodeType !== Node.ELEMENT_NODE) return !1;
	let t = window.getComputedStyle(e);
	return ["scroll", "auto"].includes(t.overflowY);
}
//#endregion
//#region node_modules/vuetify/lib/composables/lazy.js
var l = e({ eager: Boolean }, "lazy");
function u(e, n) {
	let a = i(!1), o = r(() => a.value || e.eager || n.value);
	t(n, () => a.value = !0);
	function s() {
		e.eager || (a.value = !1);
	}
	return {
		isBooted: a,
		hasContent: o,
		onAfterLeave: s
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/scopeId.js
function d() {
	let e = n("useScopeId").vnode.scopeId;
	return { scopeId: e ? { [e]: "" } : void 0 };
}
//#endregion
export { o as a, a as i, l as n, s as o, u as r, d as t };
