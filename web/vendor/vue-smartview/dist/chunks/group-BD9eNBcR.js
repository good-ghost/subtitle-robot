import { $ as e, A as t, Bt as n, Fn as r, Gn as i, Jn as a, O as o, Rn as s, Rt as c, Vn as l, Wt as u, Xt as d, cr as f, dr as p, g as m, jn as h, tr as g, vn as _, wt as v, zn as y } from "./vuetify-C39-WP9g.js";
import { n as b } from "./ripple-BBz9XQtx.js";
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
	let s = o("useGroupItem");
	if (!s) throw Error("[Vuetify] useGroupItem composable must be used inside a component setup function");
	let c = i();
	l(Symbol.for(`${t.description}:id`), c);
	let u = h(t, null);
	if (!u) {
		if (!n) return u;
		throw Error(`[Vuetify] Could not find useGroup injection with symbol ${t.description}`);
	}
	let d = f(() => e.value), p = _(() => !!(u.disabled.value || e.disabled));
	function m() {
		u?.register({
			id: c,
			value: d,
			disabled: p
		}, s);
	}
	function g() {
		u?.unregister(c);
	}
	m(), r(() => g());
	let v = _(() => u.isSelected(c)), y = _(() => u.items.value[0].id === c), b = _(() => u.items.value[u.items.value.length - 1].id === c), x = _(() => v.value && [u.selectedClass.value, e.selectedClass]);
	return a(v, (e) => {
		s.emit("group:selected", { value: e });
	}, { flush: "sync" }), {
		id: c,
		isSelected: v,
		isFirst: y,
		isLast: b,
		toggle: () => u.select(c, !v.value),
		select: (e) => u.select(c, e),
		selectedClass: x,
		value: d,
		disabled: p,
		group: u,
		register: m,
		unregister: g
	};
}
function w(t, i) {
	let a = !1, h = g([]), _ = m(t, "modelValue", [], (e) => u(e) ? [] : E(h, c(e) ? [null] : v(e)), (e) => {
		let n = D(h, e);
		return t.multiple ? n : n[0];
	}), b = o("useGroup");
	function x(t, n) {
		let r = t, a = Symbol.for(`${i.description}:id`), o = e(a, b?.vnode).indexOf(n);
		u(p(r.value)) && (r.value = o, r.useIndexAsValue = !0), o > -1 ? h.splice(o, 0, r) : h.push(r);
	}
	function S(e) {
		if (a) return;
		C();
		let t = h.findIndex((t) => t.id === e);
		h.splice(t, 1);
	}
	function C() {
		let e = h.find((e) => !e.disabled);
		e && t.mandatory === "force" && !_.value.length && (_.value = [e.id]);
	}
	s(() => {
		C();
	}), r(() => {
		a = !0;
	}), y(() => {
		for (let e = 0; e < h.length; e++) h[e].useIndexAsValue && (h[e].value = e);
	});
	function w(e, r) {
		let i = h.find((t) => t.id === e);
		if (!(r && i?.disabled)) {
			if (t.multiple) {
				let i = _.value.slice(), a = i.findIndex((t) => t === e), o = ~a;
				if (r ??= !o, o && t.mandatory && i.length <= 1 || !o && n(t.max) && i.length + 1 > t.max) return;
				a < 0 && r ? i.push(e) : a >= 0 && !r && i.splice(a, 1), _.value = i;
			} else {
				let n = _.value.includes(e);
				if (t.mandatory && n || !n && !r) return;
				_.value = r ?? !n ? [e] : [];
			}
		}
	}
	function O(e) {
		if (t.multiple && d("This method is not supported when using \"multiple\" prop"), _.value.length) {
			let t = _.value[0], n = h.findIndex((e) => e.id === t), r = (n + e) % h.length, i = h[r];
			for (; i.disabled && r !== n;) r = (r + e) % h.length, i = h[r];
			if (i.disabled) return;
			_.value = [h[r].id];
		} else {
			let e = h.find((e) => !e.disabled);
			e && (_.value = [e.id]);
		}
	}
	let k = {
		register: x,
		unregister: S,
		selected: _,
		select: w,
		disabled: f(() => t.disabled),
		prev: () => O(h.length - 1),
		next: () => O(1),
		isSelected: (e) => _.value.includes(e),
		selectedClass: f(() => t.selectedClass),
		items: f(() => h),
		getItemIndex: (e) => T(h, e)
	};
	return l(i, k), k;
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
