import { Un as e, Zn as t, in as n, kn as r } from "./vuetify-DJ4bsPds.js";
//#region src/runtime/formField.ts
function i(e) {
	return !!e && "internals" in e && "formHooks" in e;
}
function a(e, t) {
	if (t === null || typeof t == "string") return t;
	let n = new FormData();
	if (o(t)) {
		let r = e.getAttribute("name");
		if (!r) return null;
		for (let e of t) n.append(r, e);
		return n;
	}
	for (let [e, r] of Object.entries(t)) n.append(e, r);
	return n;
}
function o(e) {
	return Array.isArray(e);
}
function s(o) {
	let s = n(), c = t(!1), l = t(!1);
	if (!i(s)) return {
		formDisabled: c,
		touched: l
	};
	c.value = s.formDisabled, s.formHooks = {
		reset: () => {
			l.value = !1, o.reset();
		},
		setDisabled: (e) => c.value = e
	};
	let u = s.internals;
	function d() {
		let e = o.validationError?.() ?? "";
		o.required() && o.isEmpty() ? u.setValidity({ valueMissing: !0 }, o.requiredMessage(), o.anchor()) : e ? u.setValidity({ customError: !0 }, e, o.anchor()) : u.setValidity({});
	}
	e(() => {
		s.internals.setFormValue(a(s, o.value())), d();
	}, { flush: "post" });
	let f = () => {
		l.value = !0, d();
	};
	return s.addEventListener("invalid", f), r(() => {
		s.removeEventListener("invalid", f), s.formHooks = null;
	}), {
		formDisabled: c,
		touched: l
	};
}
//#endregion
export { s as n, i as t };
