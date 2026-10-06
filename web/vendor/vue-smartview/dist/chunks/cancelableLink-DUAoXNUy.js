//#region src/runtime/cancelableLink.ts
function e(e) {
	return e instanceof MouseEvent && e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
}
function t(t, n, r, i, a = {}) {
	if (e(i)) return !1;
	let o = new CustomEvent(n, {
		cancelable: !0,
		detail: [{
			...a,
			href: r
		}]
	});
	return t && !t.dispatchEvent(o) && i.preventDefault(), !0;
}
function n(e, n, r, i, a = {}) {
	if (r) {
		t(e, n, r, i, a);
		return;
	}
	e?.dispatchEvent(new CustomEvent(n, {
		cancelable: !0,
		detail: [{
			...a,
			href: ""
		}]
	}));
}
//#endregion
export { t as n, n as t };
