import { A as e, B as t, C as n, D as r, Fn as i, G as a, Gn as o, Ht as s, Jn as c, Lt as l, Mn as u, Nn as d, O as f, Pn as p, Rt as m, T as h, Tn as g, Vn as _, Vt as v, Wt as y, Yn as b, Yt as ee, Zn as x, Zt as S, _r as C, bt as w, c as T, cr as E, fn as D, g as O, gr as k, jn as A, l as j, mn as M, mr as N, or as P, ot as F, pt as I, rr as L, rt as te, sr as R, tt as ne, ur as z, v as B, vn as V, vt as H, wt as U, yn as W, zt as G } from "./vuetify-C39-WP9g.js";
import { a as K, n as re, t as q } from "./rounded-1DPtyqNn.js";
import { a as ie, c as J, l as Y, n as X, s as ae } from "./define-BovISfN4.js";
import { t as oe } from "./createSimpleFunctional-ue-6VwwS.js";
import { n as se, t as ce } from "./ripple-BBz9XQtx.js";
import { t as le } from "./VDivider-CA-IOlps.js";
import { a as ue, i as de, n as fe, r as Z, t as pe } from "./density-9WZgplEH.js";
import { t as me } from "./transitions-DYv6opPi.js";
import { t as he } from "./ssrBoot-SlAOwzRN.js";
import { t as ge } from "./transition-Cv515_M1.js";
import { t as _e } from "./VAvatar-DdB1q11O.js";
import { a as ve, c as ye, d as be, l as xe, o as Se, r as Ce, s as we, t as Te, u as Ee } from "./router-C0qlu-KG.js";
//#region node_modules/vuetify/lib/util/throttle.js
function De(e, t, n = {
	leading: !0,
	trailing: !0
}) {
	let r = 0, i = 0, a = !1, o = 0;
	function s() {
		clearTimeout(r), a = !1, o = 0;
	}
	let c = (...c) => {
		clearTimeout(r);
		let l = Date.now();
		o ||= l;
		let u = l - Math.max(o, i);
		function d() {
			i = Date.now(), r = setTimeout(s, t), e(...c);
		}
		a ? u >= t ? d() : n.trailing && (r = setTimeout(d, t - u)) : (a = !0, n.leading && d());
	};
	return c.clear = s, c.immediate = e, c;
}
//#endregion
//#region node_modules/vuetify/lib/components/VList/list.js
var Oe = Symbol.for("vuetify:list");
function ke(e = { filterable: !1 }) {
	let t = A(Oe, {
		filterable: !1,
		hasPrepend: P(!1),
		updateHasPrepend: () => null,
		trackingIndex: P(-1),
		navigationStrategy: P("focus"),
		uid: ""
	}), { filterable: n, trackingIndex: r = t.trackingIndex, navigationStrategy: i = t.navigationStrategy, uid: a = t.uid || o() } = e, s = {
		filterable: t.filterable || n,
		hasPrepend: P(!1),
		updateHasPrepend: (e) => {
			e && (s.hasPrepend.value = e);
		},
		trackingIndex: r,
		navigationStrategy: i,
		uid: a
	};
	return _(Oe, s), t;
}
function Ae() {
	return A(Oe, null);
}
//#endregion
//#region node_modules/vuetify/lib/composables/nested/activeStrategies.js
var je = (e) => {
	let t = {
		activate: ({ id: t, value: n, activated: r }) => (t = R(t), e && !n && r.size === 1 && r.has(t) || (n ? r.add(t) : r.delete(t)), r),
		in: (e, n, r) => {
			let i = /* @__PURE__ */ new Set();
			if (!G(e)) for (let a of U(e)) i = t.activate({
				id: a,
				value: !0,
				activated: new Set(i),
				children: n,
				parents: r
			});
			return i;
		},
		out: (e) => Array.from(e)
	};
	return t;
}, Me = (e) => {
	let t = je(e);
	return {
		activate: ({ activated: e, id: n, ...r }) => {
			n = R(n);
			let i = e.has(n) ? /* @__PURE__ */ new Set([n]) : /* @__PURE__ */ new Set();
			return t.activate({
				...r,
				id: n,
				activated: i
			});
		},
		in: (e, n, r) => {
			let i = /* @__PURE__ */ new Set();
			if (!G(e)) {
				let a = U(e);
				a.length && (i = t.in(a.slice(0, 1), n, r));
			}
			return i;
		},
		out: (e, n, r) => t.out(e, n, r)
	};
}, Ne = (e) => {
	let t = je(e);
	return {
		activate: ({ id: e, activated: n, children: r, ...i }) => (e = R(e), r.has(e) ? n : t.activate({
			id: e,
			activated: n,
			children: r,
			...i
		})),
		in: t.in,
		out: t.out
	};
}, Pe = (e) => {
	let t = Me(e);
	return {
		activate: ({ id: e, activated: n, children: r, ...i }) => (e = R(e), r.has(e) ? n : t.activate({
			id: e,
			activated: n,
			children: r,
			...i
		})),
		in: t.in,
		out: t.out
	};
}, Fe = {
	open: ({ id: e, value: t, opened: n, parents: r }) => {
		if (t) {
			let t = /* @__PURE__ */ new Set();
			t.add(e);
			let n = r.get(e);
			for (; !G(n);) t.add(n), n = r.get(n);
			return t;
		}
		return n.delete(e), n;
	},
	select: () => null
}, Ie = {
	open: ({ id: e, value: t, opened: n, parents: r }) => {
		if (t) {
			let t = r.get(e);
			for (n.add(e); !G(t) && t !== e;) n.add(t), t = r.get(t);
			return n;
		}
		return n.delete(e), n;
	},
	select: () => null
}, Le = {
	open: Ie.open,
	select: ({ id: e, value: t, opened: n, parents: r }) => {
		if (!t) return n;
		let i = [], a = r.get(e);
		for (; !G(a);) i.push(a), a = r.get(a);
		return new Set(i);
	}
}, Re = (e) => {
	let t = {
		select: ({ id: t, value: n, selected: r }) => {
			if (t = R(t), e && !n) {
				let e = Array.from(r.entries()).reduce((e, [t, n]) => (n === "on" && e.push(t), e), []);
				if (e.length === 1 && e[0] === t) return r;
			}
			return r.set(t, n ? "on" : "off"), r;
		},
		in: (e, n, r, i) => {
			let a = /* @__PURE__ */ new Map();
			for (let o of e || []) t.select({
				id: o,
				value: !0,
				selected: a,
				children: n,
				parents: r,
				disabled: i
			});
			return a;
		},
		out: (e) => {
			let t = [];
			for (let [n, r] of e.entries()) r === "on" && t.push(n);
			return t;
		}
	};
	return t;
}, ze = (e) => {
	let t = Re(e);
	return {
		select: ({ selected: e, id: n, ...r }) => {
			n = R(n);
			let i = e.has(n) ? /* @__PURE__ */ new Map([[n, e.get(n)]]) : /* @__PURE__ */ new Map();
			return t.select({
				...r,
				id: n,
				selected: i
			});
		},
		in: (e, n, r, i) => e?.length ? t.in(e.slice(0, 1), n, r, i) : /* @__PURE__ */ new Map(),
		out: (e, n, r) => t.out(e, n, r)
	};
}, Be = (e) => {
	let t = Re(e);
	return {
		select: ({ id: e, selected: n, children: r, ...i }) => (e = R(e), r.has(e) ? n : t.select({
			id: e,
			selected: n,
			children: r,
			...i
		})),
		in: t.in,
		out: t.out
	};
}, Ve = (e) => {
	let t = ze(e);
	return {
		select: ({ id: e, selected: n, children: r, ...i }) => (e = R(e), r.has(e) ? n : t.select({
			id: e,
			selected: n,
			children: r,
			...i
		})),
		in: t.in,
		out: t.out
	};
}, He = (e) => {
	let t = {
		select: ({ id: t, value: n, selected: r, children: i, parents: a, disabled: o }) => {
			t = R(t);
			let s = new Map(r), c = [t];
			for (; c.length;) {
				let e = c.shift();
				o.has(e) || r.set(R(e), n ? "on" : "off"), i.has(e) && c.push(...i.get(e));
			}
			let l = R(a.get(t));
			for (; l;) {
				let e = !0, t = !0;
				for (let n of i.get(l)) {
					let i = R(n);
					if (!o.has(i) && (r.get(i) !== "on" && (e = !1), r.has(i) && r.get(i) !== "off" && (t = !1), !e && !t)) break;
				}
				r.set(l, e ? "on" : t ? "off" : "indeterminate"), l = R(a.get(l));
			}
			return e && !n && Array.from(r.entries()).reduce((e, [t, n]) => (n === "on" && e.push(t), e), []).length === 0 ? s : r;
		},
		in: (e, n, r) => {
			let i = /* @__PURE__ */ new Map();
			for (let a of e || []) i = t.select({
				id: a,
				value: !0,
				selected: i,
				children: n,
				parents: r,
				disabled: /* @__PURE__ */ new Set()
			});
			return i;
		},
		out: (e, t) => {
			let n = [];
			for (let [r, i] of e.entries()) i === "on" && !t.has(r) && n.push(r);
			return n;
		}
	};
	return t;
}, Ue = (e) => {
	let t = He(e);
	return {
		select: t.select,
		in: t.in,
		out: (e, t, n) => {
			let r = [];
			for (let [t, i] of e.entries()) if (i === "on") {
				if (n.has(t)) {
					let r = n.get(t);
					if (e.get(r) === "on") continue;
				}
				r.push(t);
			}
			return r;
		}
	};
}, We = (e) => {
	let t = {
		select: He(e).select,
		in: (e, n, r, i) => {
			let a = /* @__PURE__ */ new Map();
			for (let o of e || []) n.has(o) || (a = t.select({
				id: o,
				value: !0,
				selected: a,
				children: n,
				parents: r,
				disabled: i
			}));
			return a;
		},
		out: (e) => {
			let t = [];
			for (let [n, r] of e.entries()) (r === "on" || r === "indeterminate") && t.push(n);
			return t;
		}
	};
	return t;
}, Q = Symbol.for("vuetify:nested"), Ge = {
	id: P(),
	root: {
		itemsRegistration: L("render"),
		register: () => null,
		unregister: () => null,
		updateDisabled: () => null,
		children: L(/* @__PURE__ */ new Map()),
		parents: L(/* @__PURE__ */ new Map()),
		disabled: L(/* @__PURE__ */ new Set()),
		open: () => null,
		openOnSelect: () => null,
		activate: () => null,
		select: () => null,
		activatable: L(!1),
		scrollToActive: L(!1),
		selectable: L(!1),
		opened: L(/* @__PURE__ */ new Set()),
		activated: L(/* @__PURE__ */ new Set()),
		selected: L(/* @__PURE__ */ new Map()),
		selectedValues: L([]),
		getPath: () => []
	}
}, Ke = e({
	activatable: Boolean,
	selectable: Boolean,
	activeStrategy: [
		String,
		Function,
		Object
	],
	selectStrategy: [
		String,
		Function,
		Object
	],
	openStrategy: [String, Object],
	opened: null,
	activated: null,
	selected: null,
	mandatory: Boolean,
	itemsRegistration: {
		type: String,
		default: "render"
	}
}, "nested"), qe = (e, { items: t, returnObject: n, scrollToActive: r, valueComparator: a }) => {
	let o = !1, s = P(/* @__PURE__ */ new Map()), u = P(/* @__PURE__ */ new Map()), p = P(/* @__PURE__ */ new Set()), m = O(e, "opened", e.opened, (e) => new Set(Array.isArray(e) ? e.map((e) => R(e)) : e), (e) => [...e.values()]), h = null;
	function g() {
		return h || queueMicrotask(() => {
			h = null;
		}), h ?? m.value;
	}
	function b(e) {
		h = e, m.value = e;
	}
	let x = V(() => {
		if (l(e.activeStrategy)) return e.activeStrategy(e.mandatory);
		if (v(e.activeStrategy)) return e.activeStrategy;
		switch (e.activeStrategy) {
			case "leaf": return Ne(e.mandatory);
			case "single-leaf": return Pe(e.mandatory);
			case "independent": return je(e.mandatory);
			default: return Me(e.mandatory);
		}
	}), S = V(() => {
		if (l(e.selectStrategy)) return e.selectStrategy(e.mandatory);
		if (v(e.selectStrategy)) return e.selectStrategy;
		switch (e.selectStrategy) {
			case "single-leaf": return Ve(e.mandatory);
			case "leaf": return Be(e.mandatory);
			case "independent": return Re(e.mandatory);
			case "single-independent": return ze(e.mandatory);
			case "trunk": return Ue(e.mandatory);
			case "branch": return We(e.mandatory);
			default: return He(e.mandatory);
		}
	}), C = V(() => {
		if (v(e.openStrategy)) return e.openStrategy;
		switch (e.openStrategy) {
			case "list": return Le;
			case "single": return Fe;
			default: return Ie;
		}
	}), w = V(() => {
		let e = [], n = [...t.value];
		for (; n.length;) {
			let t = n.pop();
			e.push(t), t.children && n.push(...t.children);
		}
		return e;
	});
	function T(e) {
		let t = z(a);
		if (!t) return e;
		let r = z(n);
		for (let n of w.value) {
			let i = r ? R(n.raw) : n.value;
			if (t(e, i)) return i;
		}
		return e;
	}
	let D = O(e, "activated", e.activated, (e) => x.value.in(Array.isArray(e) ? e.map(T) : e, s.value, u.value), (e) => x.value.out(e, s.value, u.value)), k = O(e, "selected", e.selected, (e) => S.value.in(Array.isArray(e) ? e.map(T) : e, s.value, u.value, p.value), (e) => S.value.out(e, s.value, u.value));
	i(() => {
		o = !0;
	});
	function A(e) {
		let t = [], n = R(e);
		for (; !y(n);) t.unshift(n), n = u.value.get(n);
		return t;
	}
	let j = f("nested"), M = /* @__PURE__ */ new Set(), N = De(() => {
		d(() => {
			s.value = new Map(s.value), u.value = new Map(u.value);
		});
	}, 100);
	c(() => [t.value, z(n)], () => {
		e.itemsRegistration === "props" && F();
	}, { immediate: !0 });
	function F() {
		let e = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = z(n) ? (e) => R(e.raw) : (e) => e.value, o = [...t.value], c = 0;
		for (; c < o.length;) {
			let t = o[c++], n = a(t);
			if (t.children) {
				let i = [];
				for (let r of t.children) {
					let t = a(r);
					e.set(t, n), i.push(t), o.push(r);
				}
				r.set(n, i);
			}
			t.props.disabled && i.add(n);
		}
		s.value = r, u.value = e, p.value = i;
	}
	let I = {
		id: P(),
		root: {
			opened: m,
			activatable: E(() => e.activatable),
			scrollToActive: E(() => z(r)),
			selectable: E(() => e.selectable),
			activated: D,
			selected: k,
			selectedValues: V(() => {
				let e = [];
				for (let [t, n] of k.value.entries()) n === "on" && e.push(t);
				return e;
			}),
			itemsRegistration: E(() => e.itemsRegistration),
			register: (e, t, n, r) => {
				if (M.has(e)) {
					let n = A(e).map(String).join(" -> "), r = A(t).concat(e).map(String).join(" -> ");
					ee(`Multiple nodes with the same ID\n\t${n}\n\t${r}`);
					return;
				}
				M.add(e), t && e !== t && u.value.set(e, t), n && p.value.add(e), r && s.value.set(e, []), G(t) || s.value.set(t, [...s.value.get(t) || [], e]), N();
			},
			unregister: (e) => {
				if (o) return;
				M.delete(e), s.value.delete(e), p.value.delete(e);
				let t = u.value.get(e);
				if (t) {
					let n = s.value.get(t) ?? [];
					s.value.set(t, n.filter((t) => t !== e));
				}
				u.value.delete(e), N();
			},
			updateDisabled: (e, t) => {
				t ? p.value.add(e) : p.value.delete(e);
			},
			open: (e, t, n) => {
				j.emit("click:open", {
					id: e,
					value: t,
					path: A(e),
					event: n
				});
				let r = C.value.open({
					id: e,
					value: t,
					opened: new Set(g()),
					children: s.value,
					parents: u.value,
					event: n
				});
				r && b(r);
			},
			openOnSelect: (e, t, n) => {
				let r = C.value.select({
					id: e,
					value: t,
					selected: new Map(k.value),
					opened: new Set(g()),
					children: s.value,
					parents: u.value,
					event: n
				});
				r && b(r);
			},
			select: (e, t, n) => {
				j.emit("click:select", {
					id: e,
					value: t,
					path: A(e),
					event: n
				});
				let r = S.value.select({
					id: e,
					value: t,
					selected: new Map(k.value),
					children: s.value,
					parents: u.value,
					disabled: p.value,
					event: n
				});
				r && (k.value = r), I.root.openOnSelect(e, t, n);
			},
			activate: (t, n, r) => {
				if (!e.activatable) return I.root.select(t, !0, r);
				j.emit("click:activate", {
					id: t,
					value: n,
					path: A(t),
					event: r
				});
				let i = x.value.activate({
					id: t,
					value: n,
					activated: new Set(D.value),
					children: s.value,
					parents: u.value,
					event: r
				});
				if (i.size !== D.value.size) D.value = i;
				else {
					for (let e of i) if (!D.value.has(e)) {
						D.value = i;
						return;
					}
					for (let e of D.value) if (!i.has(e)) {
						D.value = i;
						return;
					}
				}
			},
			children: s,
			parents: u,
			disabled: p,
			getPath: A
		}
	};
	return _(Q, I), I.root;
}, Je = (e, t, n) => {
	let r = A(Q, Ge), a = Symbol("nested item"), o = V(() => {
		let t = R(z(e));
		return y(t) ? a : t;
	}), s = {
		...r,
		id: o,
		open: (e, t) => r.root.open(o.value, e, t),
		openOnSelect: (e, t) => r.root.openOnSelect(o.value, e, t),
		isOpen: V(() => r.root.opened.value.has(o.value)),
		parent: V(() => r.root.parents.value.get(o.value)),
		activate: (e, t) => r.root.activate(o.value, e, t),
		isActivated: V(() => r.root.activated.value.has(o.value)),
		scrollToActive: r.root.scrollToActive,
		select: (e, t) => r.root.select(o.value, e, t),
		isSelected: V(() => r.root.selected.value.get(o.value) === "on"),
		isIndeterminate: V(() => r.root.selected.value.get(o.value) === "indeterminate"),
		isLeaf: V(() => !r.root.children.value.get(o.value)),
		isGroupActivator: r.isGroupActivator
	};
	return p(() => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || d(() => {
			r.root.register(o.value, r.id.value, z(t), n);
		});
	}), i(() => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || r.root.unregister(o.value);
	}), c(o, (e, i) => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || (r.root.unregister(i), d(() => {
			r.root.register(e, r.id.value, z(t), n);
		}));
	}), c(() => z(t), (e) => {
		r.root.updateDisabled(o.value, e);
	}), n && _(Q, s), s;
}, Ye = () => {
	let e = A(Q, Ge);
	_(Q, {
		...e,
		isGroupActivator: !0
	});
}, Xe = n({
	name: "VListGroupActivator",
	setup(e, { slots: t }) {
		return Ye(), () => t.default?.();
	}
}), Ze = e({
	activeColor: String,
	baseColor: String,
	color: String,
	collapseIcon: {
		type: B,
		default: "$collapse"
	},
	disabled: Boolean,
	expandIcon: {
		type: B,
		default: "$expand"
	},
	rawId: [String, Number],
	prependIcon: B,
	appendIcon: B,
	fluid: Boolean,
	subgroup: Boolean,
	title: String,
	value: null,
	...Y(),
	...X()
}, "VListGroup"), Qe = h()({
	name: "VListGroup",
	props: Ze(),
	setup(e, { slots: t }) {
		let { isOpen: n, open: r, id: i } = Je(() => e.value, () => e.disabled, !0), a = V(() => `v-list-group--id-${String(e.rawId ?? i.value)}`), o = Ae(), { isBooted: s } = he(), c = A(Q), l = E(() => c?.root?.itemsRegistration.value === "render");
		function u(e) {
			["INPUT", "TEXTAREA"].includes(e.target?.tagName) || r(!n.value, e);
		}
		let d = V(() => ({
			onClick: u,
			class: "v-list-group__header",
			id: a.value
		})), f = V(() => n.value ? e.collapseIcon : e.expandIcon), p = V(() => ({ VListItem: {
			activeColor: e.activeColor,
			baseColor: e.baseColor,
			color: e.color,
			prependIcon: e.prependIcon || e.subgroup && f.value,
			appendIcon: e.appendIcon || !e.subgroup && f.value,
			title: e.title,
			value: e.value
		} }));
		return J(() => g(e.tag, {
			class: N([
				"v-list-group",
				{
					"v-list-group--prepend": o?.hasPrepend.value,
					"v-list-group--fluid": e.fluid,
					"v-list-group--subgroup": e.subgroup,
					"v-list-group--open": n.value
				},
				e.class
			]),
			style: k(e.style)
		}, { default: () => [t.activator && g(K, { defaults: p.value }, { default: () => [g(Xe, null, { default: () => [t.activator({
			props: d.value,
			isOpen: n.value
		})] })] }), g(ge, {
			transition: { component: me },
			disabled: !s.value
		}, { default: () => [l.value ? x(W("div", {
			class: "v-list-group__items",
			role: "group",
			"aria-labelledby": a.value,
			inert: !n.value
		}, [t.default?.()]), [[D, n.value]]) : n.value && W("div", {
			class: "v-list-group__items",
			role: "group",
			"aria-labelledby": a.value
		}, [t.default?.()])] })] })), { isOpen: n };
	}
}), $e = e({
	opacity: [Number, String],
	...Y(),
	...X()
}, "VListItemSubtitle"), et = h()({
	name: "VListItemSubtitle",
	props: $e(),
	setup(e, { slots: t }) {
		return J(() => g(e.tag, {
			class: N(["v-list-item-subtitle", e.class]),
			style: k([{ "--v-list-item-subtitle-opacity": e.opacity }, e.style])
		}, t)), {};
	}
}), tt = oe("v-list-item-title"), nt = e({
	active: {
		type: Boolean,
		default: void 0
	},
	activeClass: String,
	activeColor: String,
	appendAvatar: String,
	appendIcon: B,
	baseColor: String,
	disabled: Boolean,
	lines: [Boolean, String],
	link: {
		type: Boolean,
		default: void 0
	},
	nav: Boolean,
	prependAvatar: String,
	prependIcon: B,
	ripple: {
		type: [Boolean, Object],
		default: !0
	},
	slim: Boolean,
	prependGap: [Number, String],
	subtitle: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	title: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	value: null,
	index: Number,
	tabindex: [Number, String],
	onClick: t(),
	onClickOnce: t(),
	...Ee(),
	...Y(),
	...pe(),
	...Z(),
	...ve(),
	...q(),
	...Te(),
	...X(),
	...T(),
	...ye({ variant: "text" })
}, "VListItem"), rt = h()({
	name: "VListItem",
	directives: { vRipple: ce },
	props: nt(),
	emits: { click: (e) => !0 },
	setup(e, { attrs: t, slots: n, emit: r }) {
		let i = Ce(e, t), o = L(), { activate: s, isActivated: l, select: f, isOpen: m, isSelected: h, isIndeterminate: _, isGroupActivator: v, root: y, parent: b, openOnSelect: ee, scrollToActive: w, id: T } = Je(V(() => e.value === void 0 ? i.href.value : e.value), () => e.disabled, !1), D = Ae(), O = V(() => e.active !== !1 && (e.active || i.isActive?.value || (y.activatable.value ? l.value : h.value))), k = E(() => e.link !== !1 && i.isLink.value), A = V(() => !!D && (y.selectable.value || y.activatable.value || e.value != null)), N = V(() => !e.disabled && e.link !== !1 && (e.link || i.isClickable.value || A.value)), P = V(() => D && D.navigationStrategy.value === "track" && e.index !== void 0 && D.trackingIndex.value === e.index), F = V(() => D ? k.value ? "link" : A.value ? "option" : "listitem" : void 0), I = V(() => {
			if (A.value) return y.activatable.value ? l.value : y.selectable.value ? h.value : O.value;
		}), te = E(() => e.rounded || e.nav), R = E(() => e.color ?? e.activeColor), ne = E(() => ({
			color: O.value ? R.value ?? e.baseColor : e.baseColor,
			variant: e.variant
		}));
		c(() => i.isActive?.value, (e) => {
			e && z();
		}), c(l, (e) => {
			e && w && o.value?.scrollIntoView({
				block: "nearest",
				behavior: "instant"
			});
		}), c(P, (e) => {
			e && o.value?.scrollIntoView({
				block: "nearest",
				behavior: "instant"
			});
		}), p(() => {
			i.isActive?.value && d(() => z());
		});
		function z() {
			b.value != null && y.open(b.value, !0), ee(!0);
		}
		let { themeClasses: B } = j(e), { borderClasses: H } = be(e), { colorClasses: U, colorStyles: G, variantClasses: q } = xe(ne), { densityClasses: ie } = fe(e), { dimensionStyles: Y } = de(e), { elevationClasses: X } = Se(e), { roundedClasses: ae, roundedStyles: oe } = re(te), se = E(() => e.lines ? `v-list-item--${e.lines}-line` : void 0), le = E(() => e.ripple !== void 0 && e.ripple && D?.filterable ? { keys: ["Enter"] } : e.ripple), Z = V(() => ({
			isActive: O.value,
			select: f,
			isOpen: m.value,
			isSelected: h.value,
			isIndeterminate: _.value,
			isDisabled: e.disabled
		}));
		function pe(t) {
			r("click", t), !["INPUT", "TEXTAREA"].includes(t.target?.tagName) && N.value && (i.navigate.value?.(t), !v && (y.activatable.value ? s(!l.value, t) : (y.selectable.value || e.value != null && !k.value) && f(!h.value, t)));
		}
		function me(e) {
			let t = e.target;
			["INPUT", "TEXTAREA"].includes(t.tagName) || e.currentTarget?.getAttribute("role") !== "treeitem" && (e.key === "Enter" || e.key === " " && !D?.filterable) && (e.preventDefault(), e.stopPropagation(), e.target.dispatchEvent(new MouseEvent("click", e)));
		}
		return J(() => {
			let t = k.value ? "a" : e.tag, r = n.title || e.title != null, s = n.subtitle || e.subtitle != null, c = !!(e.appendAvatar || e.appendIcon || n.append), l = !!(e.prependAvatar || e.prependIcon || n.prepend);
			return D?.updateHasPrepend(l), e.activeColor && S("active-color", ["color", "base-color"]), x(g(t, u(i.linkProps, {
				ref: o,
				id: e.index !== void 0 && D ? `v-list-item-${D.uid}-${e.index}` : void 0,
				class: [
					"v-list-item",
					{
						"v-list-item--active": O.value,
						"v-list-item--disabled": e.disabled,
						"v-list-item--link": N.value,
						"v-list-item--nav": e.nav,
						"v-list-item--prepend": !l && D?.hasPrepend.value,
						"v-list-item--slim": e.slim,
						"v-list-item--focus-visible": P.value,
						[`${e.activeClass}`]: e.activeClass && O.value
					},
					B.value,
					H.value,
					U.value,
					ie.value,
					X.value,
					se.value,
					ae.value,
					q.value,
					e.class
				],
				style: [
					{ "--v-list-prepend-gap": a(e.prependGap) },
					G.value,
					Y.value,
					oe.value,
					e.style
				],
				tabindex: e.tabindex ?? (N.value ? D ? -2 : 0 : void 0),
				"aria-selected": I.value,
				role: F.value,
				onClick: (N.value || e.onClick || e.onClickOnce) && pe,
				onKeydown: N.value && !k.value && me
			}), { default: () => [
				we(N.value || O.value, "v-list-item"),
				l && W("div", {
					key: "prepend",
					class: "v-list-item__prepend"
				}, [n.prepend ? g(K, {
					key: "prepend-defaults",
					defaults: {
						VAvatar: {
							density: e.density,
							image: e.prependAvatar
						},
						VIcon: {
							density: e.density,
							icon: e.prependIcon
						},
						VListItemAction: { start: !0 },
						VCheckboxBtn: { density: e.density }
					}
				}, { default: () => [n.prepend?.(Z.value)] }) : W(M, null, [e.prependAvatar && g(_e, {
					key: "prepend-avatar",
					density: e.density,
					image: e.prependAvatar
				}, null), e.prependIcon && g(ue, {
					key: "prepend-icon",
					density: e.density,
					icon: e.prependIcon
				}, null)]), W("div", { class: "v-list-item__spacer" }, null)]),
				W("div", {
					class: "v-list-item__content",
					"data-no-activator": ""
				}, [
					r && g(tt, { key: "title" }, { default: () => [n.title?.({ title: e.title }) ?? C(e.title)] }),
					s && g(et, { key: "subtitle" }, { default: () => [n.subtitle?.({ subtitle: e.subtitle }) ?? C(e.subtitle)] }),
					n.default?.(Z.value)
				]),
				c && W("div", {
					key: "append",
					class: "v-list-item__append"
				}, [n.append ? g(K, {
					key: "append-defaults",
					defaults: {
						VAvatar: {
							density: e.density,
							image: e.appendAvatar
						},
						VIcon: {
							density: e.density,
							icon: e.appendIcon
						},
						VListItemAction: { end: !0 },
						VCheckboxBtn: { density: e.density }
					}
				}, { default: () => [n.append?.(Z.value)] }) : W(M, null, [e.appendIcon && g(ue, {
					key: "append-icon",
					density: e.density,
					icon: e.appendIcon
				}, null), e.appendAvatar && g(_e, {
					key: "append-avatar",
					density: e.density,
					image: e.appendAvatar
				}, null)]), W("div", { class: "v-list-item__spacer" }, null)])
			] }), [[ce, N.value && le.value]]);
		}), {
			activate: s,
			isActivated: l,
			isGroupActivator: v,
			isSelected: h,
			list: D,
			select: f,
			root: y,
			id: T,
			link: i
		};
	}
}), it = e({
	color: String,
	inset: Boolean,
	sticky: Boolean,
	title: String,
	...Y(),
	...X()
}, "VListSubheader"), at = h()({
	name: "VListSubheader",
	props: it(),
	setup(e, { slots: t }) {
		let { textColorClasses: n, textColorStyles: r } = ae(() => e.color);
		return J(() => {
			let i = !!(t.default || e.title);
			return g(e.tag, {
				class: N([
					"v-list-subheader",
					{
						"v-list-subheader--inset": e.inset,
						"v-list-subheader--sticky": e.sticky
					},
					n.value,
					e.class
				]),
				style: k([{ textColorStyles: r }, e.style])
			}, { default: () => [i && W("div", { class: "v-list-subheader__text" }, [t.default?.() ?? e.title])] });
		}), {};
	}
}), ot = e({
	items: Array,
	returnObject: Boolean
}, "VListChildren"), st = h()({
	name: "VListChildren",
	props: ot(),
	setup(e, { slots: t }) {
		return ke(), () => t.default?.() ?? e.items?.map(({ children: n, props: r, type: i, raw: a }, o) => {
			if (i === "divider") return t.divider?.({ props: r }) ?? g(le, r, null);
			if (i === "subheader") return t.subheader?.({ props: r }) ?? g(at, r, null);
			let s = {
				subtitle: t.subtitle ? (e) => t.subtitle?.({
					...e,
					item: a
				}) : void 0,
				prepend: t.prepend ? (e) => t.prepend?.({
					...e,
					item: a
				}) : void 0,
				append: t.append ? (e) => t.append?.({
					...e,
					item: a
				}) : void 0,
				title: t.title ? (e) => t.title?.({
					...e,
					item: a
				}) : void 0
			}, c = Qe.filterProps(r);
			return n ? g(Qe, u(c, {
				value: e.returnObject ? a : r?.value,
				rawId: r?.value
			}), {
				activator: ({ props: n }) => {
					let i = u(r, n, { value: e.returnObject ? a : r.value });
					return t.header ? t.header({ props: i }) : g(rt, u(i, { index: o }), s);
				},
				default: () => g(st, {
					items: n,
					returnObject: e.returnObject
				}, t)
			}) : t.item ? t.item({ props: {
				...r,
				index: o
			} }) : g(rt, u(r, {
				index: o,
				value: e.returnObject ? a : r.value
			}), s);
		});
	}
}), ct = e({
	items: {
		type: Array,
		default: () => []
	},
	itemTitle: {
		type: [
			String,
			Array,
			Function
		],
		default: "title"
	},
	itemValue: {
		type: [
			String,
			Array,
			Function
		],
		default: "value"
	},
	itemChildren: {
		type: [
			Boolean,
			String,
			Array,
			Function
		],
		default: "children"
	},
	itemProps: {
		type: [
			Boolean,
			String,
			Array,
			Function
		],
		default: "props"
	},
	itemType: {
		type: [
			Boolean,
			String,
			Array,
			Function
		],
		default: "type"
	},
	returnObject: Boolean,
	valueComparator: Function
}, "list-items"), lt = /* @__PURE__ */ new Set([
	"item",
	"divider",
	"subheader"
]);
function $(e, t) {
	let n = F(t, e.itemTitle, t), r = F(t, e.itemValue, n), i = F(t, e.itemChildren), a = e.itemProps === !0 ? v(t) ? "children" in t ? H(t, ["children"]) : t : void 0 : F(t, e.itemProps), o = F(t, e.itemType, "item");
	lt.has(o) || (o = "item");
	let s = {
		title: n,
		value: r,
		...a
	};
	return {
		type: o,
		title: String(s.title ?? ""),
		value: s.value,
		props: s,
		children: o === "item" && Array.isArray(i) ? ut(e, i) : void 0,
		raw: t
	};
}
$.neededProps = [
	"itemTitle",
	"itemValue",
	"itemChildren",
	"itemProps",
	"itemType"
];
function ut(e, t) {
	let n = w(e, $.neededProps), r = [];
	for (let e of t) r.push($(n, e));
	return r;
}
function dt(e) {
	let t = V(() => ut(e, e.items)), n = V(() => t.value.some((e) => m(e.value))), r = P(/* @__PURE__ */ new Map()), i = P([]);
	b(() => {
		let e = t.value, n = /* @__PURE__ */ new Map(), a = [];
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			if (I(r.value) || m(r.value)) {
				let e = n.get(r.value);
				e || (e = [], n.set(r.value, e)), e.push(r);
			} else a.push(r);
		}
		r.value = n, i.value = a;
	});
	function a(a) {
		let o = r.value, c = t.value, l = i.value, u = n.value, d = e.returnObject, f = !!e.valueComparator, p = e.valueComparator || se, h = w(e, $.neededProps), g = [];
		main: for (let e of a) {
			if (!u && m(e)) continue;
			if (d && s(e)) {
				g.push($(h, e));
				continue;
			}
			let t = o.get(e);
			if (f || !t) {
				for (let t of f ? c : l) if (p(e, t.value)) {
					g.push(t);
					continue main;
				}
				g.push($(h, e));
				continue;
			}
			g.push(...t);
		}
		return g;
	}
	function o(t) {
		return e.returnObject ? t.map(({ raw: e }) => e) : t.map(({ value: e }) => e);
	}
	return {
		items: t,
		transformIn: a,
		transformOut: o
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VList/VList.js
var ft = /* @__PURE__ */ new Set([
	"item",
	"divider",
	"subheader"
]);
function pt(e, t) {
	let n = I(t) ? t : F(t, e.itemTitle), r = I(t) ? t : F(t, e.itemValue, void 0), i = F(t, e.itemChildren), a = e.itemProps === !0 ? H(t, ["children"]) : F(t, e.itemProps), o = F(t, e.itemType, "item");
	ft.has(o) || (o = "item");
	let s = {
		title: n,
		value: r,
		...a
	};
	return {
		type: o,
		title: s.title,
		value: s.value,
		props: s,
		children: o === "item" && i ? mt(e, i) : void 0,
		raw: t
	};
}
function mt(e, t) {
	let n = [];
	for (let r of t) n.push(pt(e, r));
	return n;
}
function ht(e) {
	return { items: V(() => mt(e, e.items)) };
}
var gt = e({
	baseColor: String,
	activeColor: String,
	activeClass: String,
	bgColor: String,
	disabled: Boolean,
	filterable: Boolean,
	expandIcon: B,
	collapseIcon: B,
	lines: {
		type: [Boolean, String],
		default: "one"
	},
	slim: Boolean,
	prependGap: [Number, String],
	indent: [Number, String],
	nav: Boolean,
	navigationStrategy: {
		type: String,
		default: "focus"
	},
	navigationIndex: Number,
	"onClick:open": t(),
	"onClick:select": t(),
	"onUpdate:opened": t(),
	...Ke({
		selectStrategy: "single-leaf",
		openStrategy: "list"
	}),
	...Ee(),
	...Y(),
	...pe(),
	...Z(),
	...ve(),
	...ct(),
	...q(),
	...X(),
	...T(),
	...ye({ variant: "text" })
}, "VList"), _t = h()({
	name: "VList",
	props: gt(),
	emits: {
		"update:selected": (e) => !0,
		"update:activated": (e) => !0,
		"update:opened": (e) => !0,
		"update:navigationIndex": (e) => !0,
		"click:open": (e) => !0,
		"click:activate": (e) => !0,
		"click:select": (e) => !0
	},
	setup(e, { attrs: t, slots: n, emit: i }) {
		let { items: s } = ht(e), { themeClasses: l } = j(e), { backgroundColorClasses: u, backgroundColorStyles: d } = ie(() => e.bgColor), { borderClasses: f } = be(e), { densityClasses: p } = fe(e), { dimensionStyles: m } = de(e), { elevationClasses: h } = Se(e), { roundedClasses: _, roundedStyles: v } = re(e), { children: y, open: b, parents: ee, select: x, getPath: S } = qe(e, {
			items: s,
			returnObject: E(() => e.returnObject),
			scrollToActive: E(() => e.navigationStrategy === "track"),
			valueComparator: E(() => e.valueComparator)
		}), C = E(() => e.lines ? `v-list--${e.lines}-line` : void 0), w = E(() => e.activeColor), T = E(() => e.baseColor), D = E(() => e.color), A = E(() => e.selectable || e.activatable), M = O(e, "navigationIndex", -1, (e) => e ?? -1), F = o();
		ke({
			filterable: e.filterable,
			trackingIndex: M,
			navigationStrategy: E(() => e.navigationStrategy),
			uid: F
		}), c(s, () => {
			e.navigationStrategy === "track" && (M.value = -1);
		}), r({
			VListGroup: {
				activeColor: w,
				baseColor: T,
				color: D,
				expandIcon: E(() => e.expandIcon),
				collapseIcon: E(() => e.collapseIcon)
			},
			VListItem: {
				activeClass: E(() => e.activeClass),
				activeColor: w,
				baseColor: T,
				color: D,
				density: E(() => e.density),
				disabled: E(() => e.disabled),
				lines: E(() => e.lines),
				nav: E(() => e.nav),
				slim: E(() => e.slim),
				variant: E(() => e.variant),
				tabindex: E(() => e.navigationStrategy === "track" ? -1 : void 0)
			}
		});
		let I = P(!1), R = L();
		function z(e) {
			I.value = !0;
		}
		function B(e) {
			I.value = !1;
		}
		function V(t) {
			e.navigationStrategy === "track" ? ~M.value || (M.value = W("first")) : !I.value && !(t.relatedTarget && R.value?.contains(t.relatedTarget)) && q();
		}
		function H() {
			e.navigationStrategy === "track" && (M.value = -1);
		}
		function U(e) {
			switch (e) {
				case "ArrowDown": return "next";
				case "ArrowUp": return "prev";
				case "Home": return "first";
				case "End": return "last";
				default: return null;
			}
		}
		function W(e) {
			let t = s.value.length;
			if (t === 0) return -1;
			let n;
			e === "first" ? n = 0 : e === "last" ? n = t - 1 : (n = M.value + (e === "next" ? 1 : -1), n < 0 && (n = t - 1), n >= t && (n = 0));
			let r = n, i = 0;
			for (; i < t;) {
				let a = s.value[n];
				if (a && a.type !== "divider" && a.type !== "subheader") return n;
				if (n += e === "next" || e === "first" ? 1 : -1, n < 0 && (n = t - 1), n >= t && (n = 0), n === r) return -1;
				i++;
			}
			return -1;
		}
		function G(t) {
			let n = t.target;
			if (!R.value || n.tagName === "INPUT" && ["Home", "End"].includes(t.key) || n.tagName === "TEXTAREA") return;
			let r = U(t.key);
			if (r !== null) {
				if (t.preventDefault(), e.navigationStrategy === "track") {
					let e = W(r);
					e !== -1 && (M.value = e);
				} else {
					q(r, { preventScroll: !0 });
					let e = te();
					e && R.value?.contains(e) && e.scrollIntoView({ block: "nearest" });
				}
			}
		}
		function K(e) {
			I.value = !0;
		}
		function q(e, t) {
			if (R.value) return ne(R.value, e, t);
		}
		return J(() => {
			let r = e.indent ?? (e.prependGap ? Number(e.prependGap) + 24 : void 0), i = A.value ? t.ariaMultiselectable ?? !String(e.selectStrategy).startsWith("single-") : void 0;
			return g(e.tag, {
				ref: R,
				class: N([
					"v-list",
					{
						"v-list--disabled": e.disabled,
						"v-list--nav": e.nav,
						"v-list--slim": e.slim
					},
					l.value,
					u.value,
					f.value,
					p.value,
					h.value,
					C.value,
					_.value,
					e.class
				]),
				style: k([
					{
						"--v-list-indent": a(r),
						"--v-list-group-prepend": r ? "0px" : void 0,
						"--v-list-prepend-gap": a(e.prependGap)
					},
					d.value,
					m.value,
					v.value,
					e.style
				]),
				tabindex: e.disabled || I.value ? -1 : 0,
				role: A.value ? "listbox" : "list",
				"aria-activedescendant": e.navigationStrategy === "track" && M.value >= 0 ? `v-list-item-${F}-${M.value}` : void 0,
				"aria-multiselectable": i,
				onFocusin: z,
				onFocusout: B,
				onFocus: V,
				onBlur: H,
				onKeydown: G,
				onMousedown: K
			}, { default: () => [g(st, {
				items: s.value,
				returnObject: e.returnObject
			}, n)] });
		}), {
			open: b,
			select: x,
			focus: q,
			children: y,
			parents: ee,
			getPath: S,
			navigationIndex: M
		};
	}
});
//#endregion
export { at as a, et as c, dt as i, ct as n, rt as o, $ as r, tt as s, _t as t };
