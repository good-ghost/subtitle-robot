import { $ as e, A as t, Bt as n, Fn as r, Hn as i, Mn as a, Nn as o, O as s, Rt as c, Tn as l, Wt as u, Xt as d, Yn as f, ar as p, fn as m, g as h, kn as g, nr as _, wt as v, zn as y } from "./vuetify-DJ4bsPds.js";
import { n as b } from "./ripple-B14E6MmL.js";
//#region node_modules/vuetify/lib/composables/group.js
var x = t({
	modelValue: {
		type: null,
		default: void 0
	},
	multiple: Boolean,
	mandatory: [Boolean, String],
	max: Number,
	selectedClass: String,
	disabled: Boolean
}, "group"), S = t({
	value: null,
	disabled: Boolean,
	selectedClass: String
}, "group-item");
function C(e, t, n = !0) {
	let a = s("useGroupItem");
	if (!a) throw Error("[Vuetify] useGroupItem composable must be used inside a component setup function");
	let o = y();
	r(Symbol.for(`${t.description}:id`), o);
	let c = l(t, null);
	if (!c) {
		if (!n) return c;
		throw Error(`[Vuetify] Could not find useGroup injection with symbol ${t.description}`);
	}
	let u = _(() => e.value), d = m(() => !!(c.disabled.value || e.disabled));
	function f() {
		c?.register({
			id: o,
			value: u,
			disabled: d
		}, a);
	}
	function p() {
		c?.unregister(o);
	}
	f(), g(() => p());
	let h = m(() => c.isSelected(o)), v = m(() => c.items.value[0].id === o), b = m(() => c.items.value[c.items.value.length - 1].id === o), x = m(() => h.value && [c.selectedClass.value, e.selectedClass]);
	return i(h, (e) => {
		a.emit("group:selected", { value: e });
	}, { flush: "sync" }), {
		id: o,
		isSelected: h,
		isFirst: v,
		isLast: b,
		toggle: () => c.select(o, !h.value),
		select: (e) => c.select(o, e),
		selectedClass: x,
		value: u,
		disabled: d,
		group: c,
		register: f,
		unregister: p
	};
}
function w(t, i) {
	let l = !1, m = f([]), y = h(t, "modelValue", [], (e) => u(e) ? [] : E(m, c(e) ? [null] : v(e)), (e) => {
		let n = D(m, e);
		return t.multiple ? n : n[0];
	}), b = s("useGroup");
	function x(t, n) {
		let r = t, a = Symbol.for(`${i.description}:id`), o = e(a, b?.vnode).indexOf(n);
		u(p(r.value)) && (r.value = o, r.useIndexAsValue = !0), o > -1 ? m.splice(o, 0, r) : m.push(r);
	}
	function S(e) {
		if (l) return;
		C();
		let t = m.findIndex((t) => t.id === e);
		m.splice(t, 1);
	}
	function C() {
		let e = m.find((e) => !e.disabled);
		e && t.mandatory === "force" && !y.value.length && (y.value = [e.id]);
	}
	a(() => {
		C();
	}), g(() => {
		l = !0;
	}), o(() => {
		for (let e = 0; e < m.length; e++) m[e].useIndexAsValue && (m[e].value = e);
	});
	function w(e, r) {
		let i = m.find((t) => t.id === e);
		if (!(r && i?.disabled)) {
			if (t.multiple) {
				let i = y.value.slice(), a = i.findIndex((t) => t === e), o = ~a;
				if (r ??= !o, o && t.mandatory && i.length <= 1 || !o && n(t.max) && i.length + 1 > t.max) return;
				a < 0 && r ? i.push(e) : a >= 0 && !r && i.splice(a, 1), y.value = i;
			} else {
				let n = y.value.includes(e);
				if (t.mandatory && n || !n && !r) return;
				y.value = r ?? !n ? [e] : [];
			}
		}
	}
	function O(e) {
		if (t.multiple && d("This method is not supported when using \"multiple\" prop"), y.value.length) {
			let t = y.value[0], n = m.findIndex((e) => e.id === t), r = (n + e) % m.length, i = m[r];
			for (; i.disabled && r !== n;) r = (r + e) % m.length, i = m[r];
			if (i.disabled) return;
			y.value = [m[r].id];
		} else {
			let e = m.find((e) => !e.disabled);
			e && (y.value = [e.id]);
		}
	}
	let k = {
		register: x,
		unregister: S,
		selected: y,
		select: w,
		disabled: _(() => t.disabled),
		prev: () => O(m.length - 1),
		next: () => O(1),
		isSelected: (e) => y.value.includes(e),
		selectedClass: _(() => t.selectedClass),
		items: _(() => m),
		getItemIndex: (e) => T(m, e)
	};
	return r(i, k), k;
}
function T(e, t) {
	let n = E(e, [t]);
	return n.length ? e.findIndex((e) => e.id === n[0]) : -1;
}
function E(e, t) {
	let n = [];
	return t.forEach((t) => {
		let r = e.find((e) => b(t, e.value)), i = e[t];
		u(r?.value) ? i?.useIndexAsValue && n.push(i.id) : n.push(r.id);
	}), n;
}
function D(e, t) {
	let n = [];
	return t.forEach((t) => {
		let r = e.findIndex((e) => e.id === t);
		if (~r) {
			let t = e[r];
			n.push(u(t.value) ? r : t.value);
		}
	}), n;
}
//#endregion
export { C as i, x as n, w as r, S as t };
