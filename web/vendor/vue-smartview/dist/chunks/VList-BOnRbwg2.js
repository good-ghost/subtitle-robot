import { A as e, B as t, C as n, D as r, Dn as i, En as a, Fn as o, G as s, Gn as c, Hn as l, Ht as u, Lt as d, O as f, On as p, Rt as m, T as h, Tn as g, Un as _, Vt as v, Wt as y, Yt as b, Zn as x, Zt as S, bt as C, c as w, cn as T, cr as E, dr as D, er as O, fn as k, g as A, ir as j, kn as M, l as N, nr as P, on as F, ot as I, pn as L, pt as R, rt as z, tr as B, tt as ee, ur as V, v as H, vt as U, wt as W, yn as G, zn as te, zt as K } from "./vuetify-DJ4bsPds.js";
import { a as q, n as ne, t as J } from "./rounded-CXkAtXly.js";
import { a as re, c as Y, l as X, n as Z, s as ie } from "./define-BG7hCbXs.js";
import { t as ae } from "./createSimpleFunctional-CnJMTOVx.js";
import { n as oe, t as se } from "./ripple-B14E6MmL.js";
import { n as ce, t as le } from "./ssrBoot-BMVtmVZ_.js";
import { a as ue, i as de, n as fe, r as pe, t as me } from "./density-Dh8nVFPw.js";
import { t as he } from "./transitions-CbTxUG_W.js";
import { t as ge } from "./transition-Dl3j6lCH.js";
import { t as _e } from "./VAvatar-B5evLdR9.js";
import { a as ve, c as ye, d as be, l as xe, o as Se, r as Ce, s as we, t as Te, u as Ee } from "./router-BNmKTwUJ.js";
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
	let t = g(Oe, {
		filterable: !1,
		hasPrepend: O(!1),
		updateHasPrepend: () => null,
		trackingIndex: O(-1),
		navigationStrategy: O("focus"),
		uid: ""
	}), { filterable: n, trackingIndex: r = t.trackingIndex, navigationStrategy: i = t.navigationStrategy, uid: a = t.uid || te() } = e, s = {
		filterable: t.filterable || n,
		hasPrepend: O(!1),
		updateHasPrepend: (e) => {
			e && (s.hasPrepend.value = e);
		},
		trackingIndex: r,
		navigationStrategy: i,
		uid: a
	};
	return o(Oe, s), t;
}
function Ae() {
	return g(Oe, null);
}
//#endregion
//#region node_modules/vuetify/lib/composables/nested/activeStrategies.js
var je = (e) => {
	let t = {
		activate: ({ id: t, value: n, activated: r }) => (t = B(t), e && !n && r.size === 1 && r.has(t) || (n ? r.add(t) : r.delete(t)), r),
		in: (e, n, r) => {
			let i = /* @__PURE__ */ new Set();
			if (!K(e)) for (let a of W(e)) i = t.activate({
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
			n = B(n);
			let i = e.has(n) ? /* @__PURE__ */ new Set([n]) : /* @__PURE__ */ new Set();
			return t.activate({
				...r,
				id: n,
				activated: i
			});
		},
		in: (e, n, r) => {
			let i = /* @__PURE__ */ new Set();
			if (!K(e)) {
				let a = W(e);
				a.length && (i = t.in(a.slice(0, 1), n, r));
			}
			return i;
		},
		out: (e, n, r) => t.out(e, n, r)
	};
}, Ne = (e) => {
	let t = je(e);
	return {
		activate: ({ id: e, activated: n, children: r, ...i }) => (e = B(e), r.has(e) ? n : t.activate({
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
		activate: ({ id: e, activated: n, children: r, ...i }) => (e = B(e), r.has(e) ? n : t.activate({
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
			for (; !K(n);) t.add(n), n = r.get(n);
			return t;
		}
		return n.delete(e), n;
	},
	select: () => null
}, Ie = {
	open: ({ id: e, value: t, opened: n, parents: r }) => {
		if (t) {
			let t = r.get(e);
			for (n.add(e); !K(t) && t !== e;) n.add(t), t = r.get(t);
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
		for (; !K(a);) i.push(a), a = r.get(a);
		return new Set(i);
	}
}, Re = (e) => {
	let t = {
		select: ({ id: t, value: n, selected: r }) => {
			if (t = B(t), e && !n) {
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
			n = B(n);
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
		select: ({ id: e, selected: n, children: r, ...i }) => (e = B(e), r.has(e) ? n : t.select({
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
		select: ({ id: e, selected: n, children: r, ...i }) => (e = B(e), r.has(e) ? n : t.select({
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
			t = B(t);
			let s = new Map(r), c = [t];
			for (; c.length;) {
				let e = c.shift();
				o.has(e) || r.set(B(e), n ? "on" : "off"), i.has(e) && c.push(...i.get(e));
			}
			let l = B(a.get(t));
			for (; l;) {
				let e = !0, t = !0;
				for (let n of i.get(l)) {
					let i = B(n);
					if (!o.has(i) && (r.get(i) !== "on" && (e = !1), r.has(i) && r.get(i) !== "off" && (t = !1), !e && !t)) break;
				}
				r.set(l, e ? "on" : t ? "off" : "indeterminate"), l = B(a.get(l));
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
	id: O(),
	root: {
		itemsRegistration: x("render"),
		register: () => null,
		unregister: () => null,
		updateDisabled: () => null,
		children: x(/* @__PURE__ */ new Map()),
		parents: x(/* @__PURE__ */ new Map()),
		disabled: x(/* @__PURE__ */ new Set()),
		open: () => null,
		openOnSelect: () => null,
		activate: () => null,
		select: () => null,
		activatable: x(!1),
		scrollToActive: x(!1),
		selectable: x(!1),
		opened: x(/* @__PURE__ */ new Set()),
		activated: x(/* @__PURE__ */ new Set()),
		selected: x(/* @__PURE__ */ new Map()),
		selectedValues: x([]),
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
	let s = !1, c = O(/* @__PURE__ */ new Map()), u = O(/* @__PURE__ */ new Map()), p = O(/* @__PURE__ */ new Set()), m = A(e, "opened", e.opened, (e) => new Set(Array.isArray(e) ? e.map((e) => B(e)) : e), (e) => [...e.values()]), h = null;
	function g() {
		return h || queueMicrotask(() => {
			h = null;
		}), h ?? m.value;
	}
	function _(e) {
		h = e, m.value = e;
	}
	let x = k(() => {
		if (d(e.activeStrategy)) return e.activeStrategy(e.mandatory);
		if (v(e.activeStrategy)) return e.activeStrategy;
		switch (e.activeStrategy) {
			case "leaf": return Ne(e.mandatory);
			case "single-leaf": return Pe(e.mandatory);
			case "independent": return je(e.mandatory);
			default: return Me(e.mandatory);
		}
	}), S = k(() => {
		if (d(e.selectStrategy)) return e.selectStrategy(e.mandatory);
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
	}), C = k(() => {
		if (v(e.openStrategy)) return e.openStrategy;
		switch (e.openStrategy) {
			case "list": return Le;
			case "single": return Fe;
			default: return Ie;
		}
	}), w = k(() => {
		let e = [], n = [...t.value];
		for (; n.length;) {
			let t = n.pop();
			e.push(t), t.children && n.push(...t.children);
		}
		return e;
	});
	function T(e) {
		let t = j(a);
		if (!t) return e;
		let r = j(n);
		for (let n of w.value) {
			let i = r ? B(n.raw) : n.value;
			if (t(e, i)) return i;
		}
		return e;
	}
	let E = A(e, "activated", e.activated, (e) => x.value.in(Array.isArray(e) ? e.map(T) : e, c.value, u.value), (e) => x.value.out(e, c.value, u.value)), D = A(e, "selected", e.selected, (e) => S.value.in(Array.isArray(e) ? e.map(T) : e, c.value, u.value, p.value), (e) => S.value.out(e, c.value, u.value));
	M(() => {
		s = !0;
	});
	function N(e) {
		let t = [], n = B(e);
		for (; !y(n);) t.unshift(n), n = u.value.get(n);
		return t;
	}
	let F = f("nested"), I = /* @__PURE__ */ new Set(), L = De(() => {
		i(() => {
			c.value = new Map(c.value), u.value = new Map(u.value);
		});
	}, 100);
	l(() => [t.value, j(n)], () => {
		e.itemsRegistration === "props" && R();
	}, { immediate: !0 });
	function R() {
		let e = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = j(n) ? (e) => B(e.raw) : (e) => e.value, o = [...t.value], s = 0;
		for (; s < o.length;) {
			let t = o[s++], n = a(t);
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
		c.value = r, u.value = e, p.value = i;
	}
	let z = {
		id: O(),
		root: {
			opened: m,
			activatable: P(() => e.activatable),
			scrollToActive: P(() => j(r)),
			selectable: P(() => e.selectable),
			activated: E,
			selected: D,
			selectedValues: k(() => {
				let e = [];
				for (let [t, n] of D.value.entries()) n === "on" && e.push(t);
				return e;
			}),
			itemsRegistration: P(() => e.itemsRegistration),
			register: (e, t, n, r) => {
				if (I.has(e)) {
					let n = N(e).map(String).join(" -> "), r = N(t).concat(e).map(String).join(" -> ");
					b(`Multiple nodes with the same ID\n\t${n}\n\t${r}`);
					return;
				}
				I.add(e), t && e !== t && u.value.set(e, t), n && p.value.add(e), r && c.value.set(e, []), K(t) || c.value.set(t, [...c.value.get(t) || [], e]), L();
			},
			unregister: (e) => {
				if (s) return;
				I.delete(e), c.value.delete(e), p.value.delete(e);
				let t = u.value.get(e);
				if (t) {
					let n = c.value.get(t) ?? [];
					c.value.set(t, n.filter((t) => t !== e));
				}
				u.value.delete(e), L();
			},
			updateDisabled: (e, t) => {
				t ? p.value.add(e) : p.value.delete(e);
			},
			open: (e, t, n) => {
				F.emit("click:open", {
					id: e,
					value: t,
					path: N(e),
					event: n
				});
				let r = C.value.open({
					id: e,
					value: t,
					opened: new Set(g()),
					children: c.value,
					parents: u.value,
					event: n
				});
				r && _(r);
			},
			openOnSelect: (e, t, n) => {
				let r = C.value.select({
					id: e,
					value: t,
					selected: new Map(D.value),
					opened: new Set(g()),
					children: c.value,
					parents: u.value,
					event: n
				});
				r && _(r);
			},
			select: (e, t, n) => {
				F.emit("click:select", {
					id: e,
					value: t,
					path: N(e),
					event: n
				});
				let r = S.value.select({
					id: e,
					value: t,
					selected: new Map(D.value),
					children: c.value,
					parents: u.value,
					disabled: p.value,
					event: n
				});
				r && (D.value = r), z.root.openOnSelect(e, t, n);
			},
			activate: (t, n, r) => {
				if (!e.activatable) return z.root.select(t, !0, r);
				F.emit("click:activate", {
					id: t,
					value: n,
					path: N(t),
					event: r
				});
				let i = x.value.activate({
					id: t,
					value: n,
					activated: new Set(E.value),
					children: c.value,
					parents: u.value,
					event: r
				});
				if (i.size !== E.value.size) E.value = i;
				else {
					for (let e of i) if (!E.value.has(e)) {
						E.value = i;
						return;
					}
					for (let e of E.value) if (!i.has(e)) {
						E.value = i;
						return;
					}
				}
			},
			children: c,
			parents: u,
			disabled: p,
			getPath: N
		}
	};
	return o(Q, z), z.root;
}, Je = (e, t, n) => {
	let r = g(Q, Ge), a = Symbol("nested item"), s = k(() => {
		let t = B(j(e));
		return y(t) ? a : t;
	}), c = {
		...r,
		id: s,
		open: (e, t) => r.root.open(s.value, e, t),
		openOnSelect: (e, t) => r.root.openOnSelect(s.value, e, t),
		isOpen: k(() => r.root.opened.value.has(s.value)),
		parent: k(() => r.root.parents.value.get(s.value)),
		activate: (e, t) => r.root.activate(s.value, e, t),
		isActivated: k(() => r.root.activated.value.has(s.value)),
		scrollToActive: r.root.scrollToActive,
		select: (e, t) => r.root.select(s.value, e, t),
		isSelected: k(() => r.root.selected.value.get(s.value) === "on"),
		isIndeterminate: k(() => r.root.selected.value.get(s.value) === "indeterminate"),
		isLeaf: k(() => !r.root.children.value.get(s.value)),
		isGroupActivator: r.isGroupActivator
	};
	return p(() => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || i(() => {
			r.root.register(s.value, r.id.value, j(t), n);
		});
	}), M(() => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || r.root.unregister(s.value);
	}), l(s, (e, a) => {
		r.isGroupActivator || r.root.itemsRegistration.value === "props" || (r.root.unregister(a), i(() => {
			r.root.register(e, r.id.value, j(t), n);
		}));
	}), l(() => j(t), (e) => {
		r.root.updateDisabled(s.value, e);
	}), n && o(Q, c), c;
}, Ye = () => {
	let e = g(Q, Ge);
	o(Q, {
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
		type: H,
		default: "$collapse"
	},
	disabled: Boolean,
	expandIcon: {
		type: H,
		default: "$expand"
	},
	rawId: [String, Number],
	prependIcon: H,
	appendIcon: H,
	fluid: Boolean,
	subgroup: Boolean,
	title: String,
	value: null,
	...X(),
	...Z()
}, "VListGroup"), Qe = h()({
	name: "VListGroup",
	props: Ze(),
	setup(e, { slots: t }) {
		let { isOpen: n, open: r, id: i } = Je(() => e.value, () => e.disabled, !0), a = k(() => `v-list-group--id-${String(e.rawId ?? i.value)}`), o = Ae(), { isBooted: s } = le(), l = g(Q), u = P(() => l?.root?.itemsRegistration.value === "render");
		function d(e) {
			["INPUT", "TEXTAREA"].includes(e.target?.tagName) || r(!n.value, e);
		}
		let f = k(() => ({
			onClick: d,
			class: "v-list-group__header",
			id: a.value
		})), p = k(() => n.value ? e.collapseIcon : e.expandIcon), m = k(() => ({ VListItem: {
			activeColor: e.activeColor,
			baseColor: e.baseColor,
			color: e.color,
			prependIcon: e.prependIcon || e.subgroup && p.value,
			appendIcon: e.appendIcon || !e.subgroup && p.value,
			title: e.title,
			value: e.value
		} }));
		return Y(() => G(e.tag, {
			class: E([
				"v-list-group",
				{
					"v-list-group--prepend": o?.hasPrepend.value,
					"v-list-group--fluid": e.fluid,
					"v-list-group--subgroup": e.subgroup,
					"v-list-group--open": n.value
				},
				e.class
			]),
			style: V(e.style)
		}, { default: () => [t.activator && G(q, { defaults: m.value }, { default: () => [G(Xe, null, { default: () => [t.activator({
			props: f.value,
			isOpen: n.value
		})] })] }), G(ge, {
			transition: { component: he },
			disabled: !s.value
		}, { default: () => [u.value ? c(L("div", {
			class: "v-list-group__items",
			role: "group",
			"aria-labelledby": a.value,
			inert: !n.value
		}, [t.default?.()]), [[F, n.value]]) : n.value && L("div", {
			class: "v-list-group__items",
			role: "group",
			"aria-labelledby": a.value
		}, [t.default?.()])] })] })), { isOpen: n };
	}
}), $e = e({
	opacity: [Number, String],
	...X(),
	...Z()
}, "VListItemSubtitle"), et = h()({
	name: "VListItemSubtitle",
	props: $e(),
	setup(e, { slots: t }) {
		return Y(() => G(e.tag, {
			class: E(["v-list-item-subtitle", e.class]),
			style: V([{ "--v-list-item-subtitle-opacity": e.opacity }, e.style])
		}, t)), {};
	}
}), tt = ae("v-list-item-title"), nt = e({
	active: {
		type: Boolean,
		default: void 0
	},
	activeClass: String,
	activeColor: String,
	appendAvatar: String,
	appendIcon: H,
	baseColor: String,
	disabled: Boolean,
	lines: [Boolean, String],
	link: {
		type: Boolean,
		default: void 0
	},
	nav: Boolean,
	prependAvatar: String,
	prependIcon: H,
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
	...X(),
	...me(),
	...pe(),
	...ve(),
	...J(),
	...Te(),
	...Z(),
	...w(),
	...ye({ variant: "text" })
}, "VListItem"), rt = h()({
	name: "VListItem",
	directives: { vRipple: se },
	props: nt(),
	emits: { click: (e) => !0 },
	setup(e, { attrs: t, slots: n, emit: r }) {
		let o = Ce(e, t), u = x(), { activate: d, isActivated: f, select: m, isOpen: h, isSelected: g, isIndeterminate: _, isGroupActivator: v, root: y, parent: b, openOnSelect: C, scrollToActive: w, id: E } = Je(k(() => e.value === void 0 ? o.href.value : e.value), () => e.disabled, !1), O = Ae(), A = k(() => e.active !== !1 && (e.active || o.isActive?.value || (y.activatable.value ? f.value : g.value))), j = P(() => e.link !== !1 && o.isLink.value), M = k(() => !!O && (y.selectable.value || y.activatable.value || e.value != null)), F = k(() => !e.disabled && e.link !== !1 && (e.link || o.isClickable.value || M.value)), I = k(() => O && O.navigationStrategy.value === "track" && e.index !== void 0 && O.trackingIndex.value === e.index), R = k(() => O ? j.value ? "link" : M.value ? "option" : "listitem" : void 0), z = k(() => {
			if (M.value) return y.activatable.value ? f.value : y.selectable.value ? g.value : A.value;
		}), B = P(() => e.rounded || e.nav), ee = P(() => e.color ?? e.activeColor), V = P(() => ({
			color: A.value ? ee.value ?? e.baseColor : e.baseColor,
			variant: e.variant
		}));
		l(() => o.isActive?.value, (e) => {
			e && H();
		}), l(f, (e) => {
			e && w && u.value?.scrollIntoView({
				block: "nearest",
				behavior: "instant"
			});
		}), l(I, (e) => {
			e && u.value?.scrollIntoView({
				block: "nearest",
				behavior: "instant"
			});
		}), p(() => {
			o.isActive?.value && i(() => H());
		});
		function H() {
			b.value != null && y.open(b.value, !0), C(!0);
		}
		let { themeClasses: U } = N(e), { borderClasses: W } = be(e), { colorClasses: te, colorStyles: K, variantClasses: J } = xe(V), { densityClasses: re } = fe(e), { dimensionStyles: X } = de(e), { elevationClasses: Z } = Se(e), { roundedClasses: ie, roundedStyles: ae } = ne(B), oe = P(() => e.lines ? `v-list-item--${e.lines}-line` : void 0), ce = P(() => e.ripple !== void 0 && e.ripple && O?.filterable ? { keys: ["Enter"] } : e.ripple), le = k(() => ({
			isActive: A.value,
			select: m,
			isOpen: h.value,
			isSelected: g.value,
			isIndeterminate: _.value,
			isDisabled: e.disabled
		}));
		function pe(t) {
			r("click", t), !["INPUT", "TEXTAREA"].includes(t.target?.tagName) && F.value && (o.navigate.value?.(t), !v && (y.activatable.value ? d(!f.value, t) : (y.selectable.value || e.value != null && !j.value) && m(!g.value, t)));
		}
		function me(e) {
			let t = e.target;
			["INPUT", "TEXTAREA"].includes(t.tagName) || e.currentTarget?.getAttribute("role") !== "treeitem" && (e.key === "Enter" || e.key === " " && !O?.filterable) && (e.preventDefault(), e.stopPropagation(), e.target.dispatchEvent(new MouseEvent("click", e)));
		}
		return Y(() => {
			let t = j.value ? "a" : e.tag, r = n.title || e.title != null, i = n.subtitle || e.subtitle != null, l = !!(e.appendAvatar || e.appendIcon || n.append), d = !!(e.prependAvatar || e.prependIcon || n.prepend);
			return O?.updateHasPrepend(d), e.activeColor && S("active-color", ["color", "base-color"]), c(G(t, a(o.linkProps, {
				ref: u,
				id: e.index !== void 0 && O ? `v-list-item-${O.uid}-${e.index}` : void 0,
				class: [
					"v-list-item",
					{
						"v-list-item--active": A.value,
						"v-list-item--disabled": e.disabled,
						"v-list-item--link": F.value,
						"v-list-item--nav": e.nav,
						"v-list-item--prepend": !d && O?.hasPrepend.value,
						"v-list-item--slim": e.slim,
						"v-list-item--focus-visible": I.value,
						[`${e.activeClass}`]: e.activeClass && A.value
					},
					U.value,
					W.value,
					te.value,
					re.value,
					Z.value,
					oe.value,
					ie.value,
					J.value,
					e.class
				],
				style: [
					{ "--v-list-prepend-gap": s(e.prependGap) },
					K.value,
					X.value,
					ae.value,
					e.style
				],
				tabindex: e.tabindex ?? (F.value ? O ? -2 : 0 : void 0),
				"aria-selected": z.value,
				role: R.value,
				onClick: (F.value || e.onClick || e.onClickOnce) && pe,
				onKeydown: F.value && !j.value && me
			}), { default: () => [
				we(F.value || A.value, "v-list-item"),
				d && L("div", {
					key: "prepend",
					class: "v-list-item__prepend"
				}, [n.prepend ? G(q, {
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
				}, { default: () => [n.prepend?.(le.value)] }) : L(T, null, [e.prependAvatar && G(_e, {
					key: "prepend-avatar",
					density: e.density,
					image: e.prependAvatar
				}, null), e.prependIcon && G(ue, {
					key: "prepend-icon",
					density: e.density,
					icon: e.prependIcon
				}, null)]), L("div", { class: "v-list-item__spacer" }, null)]),
				L("div", {
					class: "v-list-item__content",
					"data-no-activator": ""
				}, [
					r && G(tt, { key: "title" }, { default: () => [n.title?.({ title: e.title }) ?? D(e.title)] }),
					i && G(et, { key: "subtitle" }, { default: () => [n.subtitle?.({ subtitle: e.subtitle }) ?? D(e.subtitle)] }),
					n.default?.(le.value)
				]),
				l && L("div", {
					key: "append",
					class: "v-list-item__append"
				}, [n.append ? G(q, {
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
				}, { default: () => [n.append?.(le.value)] }) : L(T, null, [e.appendIcon && G(ue, {
					key: "append-icon",
					density: e.density,
					icon: e.appendIcon
				}, null), e.appendAvatar && G(_e, {
					key: "append-avatar",
					density: e.density,
					image: e.appendAvatar
				}, null)]), L("div", { class: "v-list-item__spacer" }, null)])
			] }), [[se, F.value && ce.value]]);
		}), {
			activate: d,
			isActivated: f,
			isGroupActivator: v,
			isSelected: g,
			list: O,
			select: m,
			root: y,
			id: E,
			link: o
		};
	}
}), it = e({
	color: String,
	inset: Boolean,
	sticky: Boolean,
	title: String,
	...X(),
	...Z()
}, "VListSubheader"), at = h()({
	name: "VListSubheader",
	props: it(),
	setup(e, { slots: t }) {
		let { textColorClasses: n, textColorStyles: r } = ie(() => e.color);
		return Y(() => {
			let i = !!(t.default || e.title);
			return G(e.tag, {
				class: E([
					"v-list-subheader",
					{
						"v-list-subheader--inset": e.inset,
						"v-list-subheader--sticky": e.sticky
					},
					n.value,
					e.class
				]),
				style: V([{ textColorStyles: r }, e.style])
			}, { default: () => [i && L("div", { class: "v-list-subheader__text" }, [t.default?.() ?? e.title])] });
		}), {};
	}
}), ot = e({
	items: Array,
	returnObject: Boolean
}, "VListChildren"), st = h()({
	name: "VListChildren",
	props: ot(),
	setup(e, { slots: t }) {
		return ke(), () => t.default?.() ?? e.items?.map(({ children: n, props: r, type: i, raw: o }, s) => {
			if (i === "divider") return t.divider?.({ props: r }) ?? G(ce, r, null);
			if (i === "subheader") return t.subheader?.({ props: r }) ?? G(at, r, null);
			let c = {
				subtitle: t.subtitle ? (e) => t.subtitle?.({
					...e,
					item: o
				}) : void 0,
				prepend: t.prepend ? (e) => t.prepend?.({
					...e,
					item: o
				}) : void 0,
				append: t.append ? (e) => t.append?.({
					...e,
					item: o
				}) : void 0,
				title: t.title ? (e) => t.title?.({
					...e,
					item: o
				}) : void 0
			}, l = Qe.filterProps(r);
			return n ? G(Qe, a(l, {
				value: e.returnObject ? o : r?.value,
				rawId: r?.value
			}), {
				activator: ({ props: n }) => {
					let i = a(r, n, { value: e.returnObject ? o : r.value });
					return t.header ? t.header({ props: i }) : G(rt, a(i, { index: s }), c);
				},
				default: () => G(st, {
					items: n,
					returnObject: e.returnObject
				}, t)
			}) : t.item ? t.item({ props: {
				...r,
				index: s
			} }) : G(rt, a(r, {
				index: s,
				value: e.returnObject ? o : r.value
			}), c);
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
	let n = I(t, e.itemTitle, t), r = I(t, e.itemValue, n), i = I(t, e.itemChildren), a = e.itemProps === !0 ? v(t) ? "children" in t ? U(t, ["children"]) : t : void 0 : I(t, e.itemProps), o = I(t, e.itemType, "item");
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
	let n = C(e, $.neededProps), r = [];
	for (let e of t) r.push($(n, e));
	return r;
}
function dt(e) {
	let t = k(() => ut(e, e.items)), n = k(() => t.value.some((e) => m(e.value))), r = O(/* @__PURE__ */ new Map()), i = O([]);
	_(() => {
		let e = t.value, n = /* @__PURE__ */ new Map(), a = [];
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			if (R(r.value) || m(r.value)) {
				let e = n.get(r.value);
				e || (e = [], n.set(r.value, e)), e.push(r);
			} else a.push(r);
		}
		r.value = n, i.value = a;
	});
	function a(a) {
		let o = r.value, s = t.value, c = i.value, l = n.value, d = e.returnObject, f = !!e.valueComparator, p = e.valueComparator || oe, h = C(e, $.neededProps), g = [];
		main: for (let e of a) {
			if (!l && m(e)) continue;
			if (d && u(e)) {
				g.push($(h, e));
				continue;
			}
			let t = o.get(e);
			if (f || !t) {
				for (let t of f ? s : c) if (p(e, t.value)) {
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
	let n = R(t) ? t : I(t, e.itemTitle), r = R(t) ? t : I(t, e.itemValue, void 0), i = I(t, e.itemChildren), a = e.itemProps === !0 ? U(t, ["children"]) : I(t, e.itemProps), o = I(t, e.itemType, "item");
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
	return { items: k(() => mt(e, e.items)) };
}
var gt = e({
	baseColor: String,
	activeColor: String,
	activeClass: String,
	bgColor: String,
	disabled: Boolean,
	filterable: Boolean,
	expandIcon: H,
	collapseIcon: H,
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
	...X(),
	...me(),
	...pe(),
	...ve(),
	...ct(),
	...J(),
	...Z(),
	...w(),
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
		let { items: a } = ht(e), { themeClasses: o } = N(e), { backgroundColorClasses: c, backgroundColorStyles: u } = re(() => e.bgColor), { borderClasses: d } = be(e), { densityClasses: f } = fe(e), { dimensionStyles: p } = de(e), { elevationClasses: m } = Se(e), { roundedClasses: h, roundedStyles: g } = ne(e), { children: _, open: v, parents: y, select: b, getPath: S } = qe(e, {
			items: a,
			returnObject: P(() => e.returnObject),
			scrollToActive: P(() => e.navigationStrategy === "track"),
			valueComparator: P(() => e.valueComparator)
		}), C = P(() => e.lines ? `v-list--${e.lines}-line` : void 0), w = P(() => e.activeColor), T = P(() => e.baseColor), D = P(() => e.color), k = P(() => e.selectable || e.activatable), j = A(e, "navigationIndex", -1, (e) => e ?? -1), M = te();
		ke({
			filterable: e.filterable,
			trackingIndex: j,
			navigationStrategy: P(() => e.navigationStrategy),
			uid: M
		}), l(a, () => {
			e.navigationStrategy === "track" && (j.value = -1);
		}), r({
			VListGroup: {
				activeColor: w,
				baseColor: T,
				color: D,
				expandIcon: P(() => e.expandIcon),
				collapseIcon: P(() => e.collapseIcon)
			},
			VListItem: {
				activeClass: P(() => e.activeClass),
				activeColor: w,
				baseColor: T,
				color: D,
				density: P(() => e.density),
				disabled: P(() => e.disabled),
				lines: P(() => e.lines),
				nav: P(() => e.nav),
				slim: P(() => e.slim),
				variant: P(() => e.variant),
				tabindex: P(() => e.navigationStrategy === "track" ? -1 : void 0)
			}
		});
		let F = O(!1), I = x();
		function L(e) {
			F.value = !0;
		}
		function R(e) {
			F.value = !1;
		}
		function B(t) {
			e.navigationStrategy === "track" ? ~j.value || (j.value = W("first")) : !F.value && !(t.relatedTarget && I.value?.contains(t.relatedTarget)) && J();
		}
		function H() {
			e.navigationStrategy === "track" && (j.value = -1);
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
			let t = a.value.length;
			if (t === 0) return -1;
			let n;
			e === "first" ? n = 0 : e === "last" ? n = t - 1 : (n = j.value + (e === "next" ? 1 : -1), n < 0 && (n = t - 1), n >= t && (n = 0));
			let r = n, i = 0;
			for (; i < t;) {
				let o = a.value[n];
				if (o && o.type !== "divider" && o.type !== "subheader") return n;
				if (n += e === "next" || e === "first" ? 1 : -1, n < 0 && (n = t - 1), n >= t && (n = 0), n === r) return -1;
				i++;
			}
			return -1;
		}
		function K(t) {
			let n = t.target;
			if (!I.value || n.tagName === "INPUT" && ["Home", "End"].includes(t.key) || n.tagName === "TEXTAREA") return;
			let r = U(t.key);
			if (r !== null) {
				if (t.preventDefault(), e.navigationStrategy === "track") {
					let e = W(r);
					e !== -1 && (j.value = e);
				} else {
					J(r, { preventScroll: !0 });
					let e = z();
					e && I.value?.contains(e) && e.scrollIntoView({ block: "nearest" });
				}
			}
		}
		function q(e) {
			F.value = !0;
		}
		function J(e, t) {
			if (I.value) return ee(I.value, e, t);
		}
		return Y(() => {
			let r = e.indent ?? (e.prependGap ? Number(e.prependGap) + 24 : void 0), i = k.value ? t.ariaMultiselectable ?? !String(e.selectStrategy).startsWith("single-") : void 0;
			return G(e.tag, {
				ref: I,
				class: E([
					"v-list",
					{
						"v-list--disabled": e.disabled,
						"v-list--nav": e.nav,
						"v-list--slim": e.slim
					},
					o.value,
					c.value,
					d.value,
					f.value,
					m.value,
					C.value,
					h.value,
					e.class
				]),
				style: V([
					{
						"--v-list-indent": s(r),
						"--v-list-group-prepend": r ? "0px" : void 0,
						"--v-list-prepend-gap": s(e.prependGap)
					},
					u.value,
					p.value,
					g.value,
					e.style
				]),
				tabindex: e.disabled || F.value ? -1 : 0,
				role: k.value ? "listbox" : "list",
				"aria-activedescendant": e.navigationStrategy === "track" && j.value >= 0 ? `v-list-item-${M}-${j.value}` : void 0,
				"aria-multiselectable": i,
				onFocusin: L,
				onFocusout: R,
				onFocus: B,
				onBlur: H,
				onKeydown: K,
				onMousedown: q
			}, { default: () => [G(st, {
				items: a.value,
				returnObject: e.returnObject
			}, n)] });
		}), {
			open: v,
			select: b,
			focus: J,
			children: _,
			parents: y,
			getPath: S,
			navigationIndex: j
		};
	}
});
//#endregion
export { at as a, et as c, dt as i, ct as n, rt as o, $ as r, tt as s, _t as t };
