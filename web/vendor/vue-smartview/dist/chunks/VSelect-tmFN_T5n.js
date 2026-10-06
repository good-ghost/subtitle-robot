import { $n as e, A as t, At as n, Bt as r, C as i, Dn as a, E as o, En as s, Fn as c, Ft as l, G as u, Gt as d, H as f, Hn as p, Ht as m, It as h, Jn as g, Jt as _, K as v, Lt as y, Mn as b, Mt as x, Nt as S, O as C, Pt as w, Qn as T, Rt as E, T as D, Tn as O, Tt as k, U as ee, Un as A, Ut as j, Vt as M, W as N, Wt as P, Xn as F, Y as I, Zn as L, _ as R, ar as z, c as B, cn as V, cr as H, er as U, fn as W, g as G, h as te, ir as K, it as ne, jn as re, jt as ie, kn as ae, kt as oe, l as se, lt as ce, m as le, nr as q, nt as J, ot as ue, p as de, pn as Y, qn as fe, qt as pe, rt as X, tr as me, tt as he, ur as ge, v as _e, vn as ve, vt as ye, wn as be, wt as xe, yn as Z, zn as Se, zt as Q } from "./vuetify-DJ4bsPds.js";
import { a as Ce, i as we, n as Te, r as Ee, t as De } from "./rounded-CXkAtXly.js";
import { n as Oe, r as ke, t as Ae } from "./VOverlay-BI1rs3Fd.js";
import { a as je, c as Me, l as Ne, n as Pe, s as Fe } from "./define-BG7hCbXs.js";
import { n as Ie } from "./ripple-B14E6MmL.js";
import { i as Le, t as Re } from "./scopeId-BKRO7vOB.js";
import { a as ze, i as Be, n as Ve, o as He, t as Ue } from "./VList-BOnRbwg2.js";
import { t as We } from "./resizeObserver-iAwW3s60.js";
import { i as Ge, s as Ke } from "./VLabel-slD1mVUb.js";
import { n as qe } from "./ssrBoot-BMVtmVZ_.js";
import { a as Je, i as Ye, r as Xe } from "./density-Dh8nVFPw.js";
import { t as Ze } from "./dialog-transition-CImwpYBr.js";
import { n as Qe } from "./transition-Dl3j6lCH.js";
import { t as $e } from "./VAvatar-B5evLdR9.js";
import { a as et, d as tt, o as nt, u as rt } from "./router-BNmKTwUJ.js";
import { t as it } from "./forwardRefs-BcUquh0G.js";
import { n as at, t as ot } from "./position-B7q6NTBl.js";
import { t as st } from "./VChip-Dqfk0_yh.js";
import { t as ct } from "./VCheckboxBtn-BD1XFHaj.js";
import { n as lt, t as ut } from "./VTextField-uapT17Ep.js";
//#region node_modules/@vuetify/v0/dist/globals-Bxw-y98v.mjs
var $ = typeof window < "u";
$ && ("ontouchstart" in window || window.navigator.maxTouchPoints);
var dt = $ && "matchMedia" in window && typeof window.matchMedia == "function";
$ && "ResizeObserver" in window, $ && "IntersectionObserver" in window, $ && "MutationObserver" in window;
//#endregion
//#region node_modules/vuetify/lib/components/VMenu/VMenu.js
var ft = t({
	_disableKeys: Boolean,
	id: String,
	submenu: Boolean,
	openOnArrow: {
		type: Boolean,
		default: !0
	},
	...ye(Oe({
		captureFocus: !0,
		closeDelay: 250,
		closeOnContentClick: !0,
		locationStrategy: "connected",
		location: void 0,
		openDelay: 300,
		scrim: !1,
		scrollStrategy: "reposition",
		transition: { component: Ze }
	}), ["absolute"])
}, "VMenu"), pt = D()({
	name: "VMenu",
	props: ft(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let n = G(e, "modelValue"), { scopeId: r } = Re(), { isRtl: i } = te(), a = Se(), o = q(() => e.id || `v-menu-${a}`), l = L(), u = O(ke, null), d = U(/* @__PURE__ */ new Map());
		c(ke, {
			register(e, t) {
				for (let [t, n] of [...d.value]) t !== e && n();
				d.value.set(e, t);
			},
			unregister(e) {
				d.value.delete(e);
			},
			closeParents(t) {
				let r = !t || l.value?.contentEl?._clickOutside?.lastMousedownWasOutside;
				setTimeout(() => {
					!d.value.size && !e.persistent && r && (n.value = !1, u?.closeParents(t));
				}, 40);
			},
			rootOpenedByHover: e.submenu && u ? u.rootOpenedByHover : () => l.value?.openedByHover ?? !1
		}), ae(() => u?.unregister(a)), re(() => n.value = !1), p(n, (e) => {
			if (e) u?.register(a, () => {
				n.value = !1;
			});
			else {
				u?.unregister(a);
				for (let [, e] of [...d.value]) e();
			}
		}, { immediate: !0 });
		function f(t) {
			if (!e.disabled) {
				if (t.key === "Tab") {
					if (e.submenu && !e.retainFocus) {
						t.preventDefault(), n.value = !1, l.value?.activatorEl?.focus();
						return;
					}
					!ne(J(l.value?.contentEl, !1), t.shiftKey ? "prev" : "next", (e) => e.tabIndex >= 0) && !e.retainFocus && (n.value = !1);
				} else e.submenu && t.key === (i.value ? "ArrowRight" : "ArrowLeft") && (n.value = !1, l.value?.activatorEl?.focus());
			}
		}
		function m(e) {
			let t = l.value?.contentEl;
			if (!t || !n.value || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
			let r = J(t), i = (e.key === "ArrowUp" ? r.at(-1) : r[0])?.getAttribute("role") ?? "", a = ["option", "listbox"].includes(i) && r.find((e) => e.getAttribute("role") === "option" && e.getAttribute("aria-selected") === "true" && e.offsetParent != null);
			a ? a.focus() : he(t, e.key === "ArrowDown" ? "next" : "prev");
		}
		function h(t) {
			if (e.disabled || e._disableKeys || t.isComposing) return;
			let r = l.value?.contentEl;
			if (r && n.value) {
				if (t.key === "ArrowDown" || t.key === "ArrowUp") {
					if (!e.openOnArrow) return;
					t.preventDefault(), t.stopImmediatePropagation(), he(r, t.key === "ArrowDown" ? "next" : "prev");
				} else e.submenu && (t.key === (i.value ? "ArrowRight" : "ArrowLeft") ? (n.value = !1, l.value?.activatorEl?.focus()) : t.key === (i.value ? "ArrowLeft" : "ArrowRight") && (t.preventDefault(), he(r, "first")));
			} else (e.submenu ? t.key === (i.value ? "ArrowLeft" : "ArrowRight") : e.openOnArrow && ["ArrowDown", "ArrowUp"].includes(t.key)) && (n.value = !0, t.preventDefault(), g(t));
		}
		function g(e, t = 1) {
			if (!n.value) return;
			let r = l.value?.contentEl;
			r?.contains(X()) || r && J(r).length && (["ArrowUp", "ArrowDown"].includes(e.key) ? m(e) : h(e), r.contains(X())) || t <= 10 && requestAnimationFrame(() => g(e, t + 1));
		}
		let _ = W(() => s({
			"aria-haspopup": "menu",
			"aria-expanded": String(n.value),
			"aria-controls": o.value,
			"aria-owns": o.value,
			onKeydown: h
		}, e.activatorProps));
		return Me(() => {
			let i = Ae.filterProps(e);
			return Z(Ae, s({
				ref: l,
				id: o.value,
				class: ["v-menu", e.class],
				style: e.style
			}, i, {
				modelValue: n.value,
				"onUpdate:modelValue": (e) => n.value = e,
				absolute: !0,
				_submenu: e.submenu,
				activatorProps: _.value,
				location: e.location ?? (e.submenu ? "end" : "bottom"),
				onKeydown: f
			}, r), {
				activator: t.activator,
				default: (...e) => Z(Ce, { root: "VMenu" }, { default: () => [t.default?.(...e)] })
			});
		}), it({
			id: o,
			ΨopenChildren: d
		}, l);
	}
}), mt = t({
	color: String,
	...rt(),
	...Ne(),
	...Xe(),
	...et(),
	...Ee(),
	...ot(),
	...De(),
	...Pe(),
	...B()
}, "VSheet"), ht = D()({
	name: "VSheet",
	props: mt(),
	setup(e, { slots: t }) {
		let { themeClasses: n } = se(e), { backgroundColorClasses: r, backgroundColorStyles: i } = je(() => e.color), { borderClasses: a } = tt(e), { dimensionStyles: o } = Ye(e), { elevationClasses: s } = nt(e), { locationStyles: c } = we(e), { positionClasses: l } = at(e), { roundedClasses: u, roundedStyles: d } = Te(e);
		return Me(() => Z(e.tag, {
			class: H([
				"v-sheet",
				n.value,
				r.value,
				a.value,
				s.value,
				l.value,
				u.value,
				e.class
			]),
			style: ge([
				i.value,
				o.value,
				c.value,
				d.value,
				e.style
			])
		}, t)), {};
	}
}), gt = t({
	renderless: Boolean,
	...Ne()
}, "VVirtualScrollItem"), _t = D()({
	name: "VVirtualScrollItem",
	inheritAttrs: !1,
	props: gt(),
	emits: { "update:height": (e) => !0 },
	setup(e, { attrs: t, emit: n, slots: r }) {
		let { resizeRef: i, contentRect: a } = We(void 0, "border");
		p(() => a.value?.height, (e) => {
			e != null && n("update:height", e);
		}), Me(() => e.renderless ? Y(V, null, [r.default?.({ itemRef: i })]) : Y("div", s({
			ref: i,
			class: ["v-virtual-scroll__item", e.class],
			style: e.style
		}, t), [r.default?.()]));
	}
}), vt = -1, yt = 1, bt = 100, xt = t({
	itemHeight: {
		type: [Number, String],
		default: null
	},
	itemKey: {
		type: [
			String,
			Array,
			Function
		],
		default: null
	},
	height: [Number, String]
}, "virtual");
function St(e, t) {
	let n = de(), r = U(0);
	A(() => {
		r.value = parseFloat(e.itemHeight || 0);
	});
	let i = U(0), o = U(Math.ceil((parseInt(e.height) || n.height.value) / (r.value || 16)) || 1), s = U(0), c = U(0), l = L(), u = L(), d = 0, { resizeRef: f, contentRect: m } = We();
	A(() => {
		f.value = l.value;
	});
	let h = W(() => l.value === document.documentElement ? n.height.value : m.value?.height || parseInt(e.height) || 0), _ = W(() => !!(l.value && u.value && h.value && r.value)), y = Array.from({ length: t.value.length }), b = Array.from({ length: t.value.length }), x = /* @__PURE__ */ new Map(), S = U(0), C = -1, w = "start", T = 0;
	function E(e) {
		return y[e] || r.value;
	}
	let D = v(() => {
		let e = performance.now();
		b[0] = 0;
		let n = t.value.length;
		for (let e = 1; e <= n; e++) b[e] = (b[e - 1] || 0) + E(e - 1);
		S.value = Math.max(S.value, performance.now() - e), G();
	}, S), O = p(_, (e) => {
		e && (O(), d = u.value.offsetTop, D.immediate(), G(), ~C && a(() => {
			k && window.requestAnimationFrame(() => {
				~C && ne(C, w);
			});
		}));
	});
	g(() => {
		D.clear();
	});
	function ee() {
		let e = 0;
		for (let t of x.values()) e += t;
		let t = 0;
		for (let n of [...x.keys()].sort((e, t) => e - t)) if (t += x.get(n), t * 2 >= e) return n;
		return r.value;
	}
	function j(e, t) {
		let n = y[e], i = r.value;
		if (t > 0) {
			if (n) {
				let e = x.get(n) - 1;
				e ? x.set(n, e) : x.delete(n);
			}
			x.set(t, (x.get(t) ?? 0) + 1), r.value = ee();
		}
		(n !== t || i !== r.value) && (y[e] = t, D());
	}
	function M(e) {
		e = N(e, 0, t.value.length);
		let n = Math.floor(e), r = e % 1, i = n + 1, a = b[n] || 0;
		return a + ((b[i] || a) - a) * r;
	}
	function P(e) {
		return Ct(b, e);
	}
	let F = 0, I = 0, R = 0;
	p(h, (e, t) => {
		G(), e < t && requestAnimationFrame(() => {
			I = 0, G();
		});
	});
	let z = -1;
	function B() {
		if (!l.value || !u.value) return;
		let e = l.value.scrollTop, t = performance.now();
		t - R > 500 ? (I = Math.sign(e - F), d = u.value.offsetTop) : I = e - F, F = e, R = t, window.clearTimeout(z), z = window.setTimeout(V, 500), G();
	}
	function V() {
		l.value && u.value && (I = 0, R = 0, window.clearTimeout(z), G());
	}
	let H = -1;
	function G() {
		cancelAnimationFrame(H), H = requestAnimationFrame(te);
	}
	function te() {
		if (!l.value || !h.value || !r.value) return;
		let e = F - d, n = Math.sign(I), a = Math.max(0, e - bt), u = N(P(a), 0, t.value.length), f = e + h.value + bt, p = N(P(f) + 1, u + 1, t.value.length);
		if ((n !== vt || u < i.value) && (n !== yt || p > o.value)) {
			let e = M(i.value) - M(u), n = M(p) - M(o.value);
			Math.max(e, n) > bt ? (i.value = u, o.value = p) : (u <= 0 && (i.value = u), p >= t.value.length && (o.value = p, i.value = u));
		}
		s.value = M(i.value), c.value = M(t.value.length) - M(o.value);
	}
	function K(e, t) {
		let n = M(e);
		if (t === "center") return Math.max(0, n - h.value / 2 + E(e) / 2);
		if (t === "end") {
			let t = l.value?.clientHeight || h.value;
			return Math.max(0, n + d - t + E(e));
		}
		return n;
	}
	function ne(e, n = "start") {
		C !== e && (T = 0);
		let u = M(e);
		if (!l.value || e && !u) {
			C = e, w = n;
			return;
		}
		let d = r.value || 16, f = Math.ceil(bt / d), p = Math.max(1, Math.ceil((h.value || 0) / d)), m = n === "center" ? Math.ceil(p / 2) : n === "end" ? p : 0;
		i.value = N(e - m - f, 0, Math.max(0, t.value.length - 1)), o.value = N(e - m + p + f, i.value + 1, t.value.length), s.value = M(i.value), c.value = M(t.value.length) - M(o.value), I = 0, R = 0, C = e, w = n, a(() => {
			let t = l.value;
			if (!t || !~C || C !== e) return;
			let r = K(e, n);
			t.scrollTop = r, F = t.scrollTop, e && t.scrollTop < r - 1 && t.scrollHeight > T ? (T = t.scrollHeight, k && requestAnimationFrame(() => {
				C === e && ne(e, n);
			})) : (C = -1, w = "start", G());
		});
	}
	let re = W(() => t.value.slice(i.value, o.value).map((t, n) => {
		let r = n + i.value;
		return {
			raw: t,
			index: r,
			key: ue(t, e.itemKey, r)
		};
	}));
	return p(t, () => {
		y = Array.from({ length: t.value.length }), b = Array.from({ length: t.value.length }), x = /* @__PURE__ */ new Map(), D.immediate(), G();
	}, { deep: 1 }), {
		calculateVisibleItems: G,
		containerRef: l,
		markerRef: u,
		computedItems: re,
		paddingTop: s,
		paddingBottom: c,
		scrollToIndex: ne,
		handleScroll: B,
		handleScrollend: V,
		handleItemResize: j
	};
}
function Ct(e, t) {
	let n = e.length - 1, r = 0, i = 0, a = null, o = -1;
	if (e[n] < t) return n;
	for (; r <= n;) if (i = r + n >> 1, a = e[i], a > t) n = i - 1;
	else if (a < t) o = i, r = i + 1;
	else if (a === t) return i;
	else return r;
	return o;
}
//#endregion
//#region node_modules/vuetify/lib/components/VVirtualScroll/VVirtualScroll.js
var wt = t({
	items: {
		type: Array,
		default: () => []
	},
	renderless: Boolean,
	...xt(),
	...Ne(),
	...Xe()
}, "VVirtualScroll"), Tt = D()({
	name: "VVirtualScroll",
	props: wt(),
	setup(e, { slots: t }) {
		let n = C("VVirtualScroll"), { dimensionStyles: r } = Ye(e), { calculateVisibleItems: i, containerRef: a, markerRef: o, handleScroll: s, handleScrollend: c, handleItemResize: l, scrollToIndex: d, paddingTop: f, paddingBottom: p, computedItems: m } = St(e, q(() => e.items));
		return R(() => e.renderless, () => {
			function e(e = !1) {
				let t = e ? "addEventListener" : "removeEventListener";
				k && (a.value === document.documentElement ? (document[t]("scroll", s, { passive: !0 }), document[t]("scrollend", c)) : (a.value?.[t]("scroll", s, { passive: !0 }), a.value?.[t]("scrollend", c)));
			}
			b(() => {
				a.value = Le(n.vnode.el, !0), e(!0);
			}), g(e);
		}), Me(() => {
			let n = m.value.map((n) => Z(_t, {
				key: n.key,
				renderless: e.renderless,
				"onUpdate:height": (e) => l(n.index, e)
			}, { default: (e) => t.default?.({
				item: n.raw,
				index: n.index,
				...e
			}) }));
			return e.renderless ? Y(V, null, [
				Y("div", {
					ref: o,
					class: "v-virtual-scroll__spacer",
					style: { paddingTop: u(f.value) }
				}, null),
				n,
				Y("div", {
					class: "v-virtual-scroll__spacer",
					style: { paddingBottom: u(p.value) }
				}, null)
			]) : Y("div", {
				ref: a,
				class: H(["v-virtual-scroll", e.class]),
				onScrollPassive: s,
				onScrollend: c,
				style: ge([r.value, e.style])
			}, [Y("div", {
				ref: o,
				class: "v-virtual-scroll__container",
				style: {
					paddingTop: u(f.value),
					paddingBottom: u(p.value)
				}
			}, [n])]);
		}), {
			calculateVisibleItems: i,
			scrollToIndex: d
		};
	}
});
//#endregion
//#region node_modules/@vuetify/v0/dist/createTrinity-DJROWgXU.mjs
function Et(e, t) {
	let r = O(e, t);
	if (/* @__PURE__ */ P(r)) throw new n(`Context "${String(e)}" not found. Ensure it's provided by an ancestor.`, {
		code: "V0_CONTEXT_MISSING",
		key: e
	});
	return r;
}
function Dt(e, t, n) {
	return n ? n.provide(e, t) : c(e, t), t;
}
function Ot(e, t) {
	if (/* @__PURE__ */ m(e) || /* @__PURE__ */ j(e)) {
		let n = e;
		function r(e, t) {
			return Dt(n, e, t);
		}
		function i() {
			return Et(n, t);
		}
		return [i, r];
	}
	let n = /* @__PURE__ */ M(e) ? e.suffix : void 0;
	function r(e, t, r) {
		return Dt(n ? `${e}:${n}` : e, t, r);
	}
	function i(e, t) {
		return Et(n ? `${e}:${n}` : e, t);
	}
	return [i, r];
}
function kt(e, t, n) {
	if (/* @__PURE__ */ m(e)) {
		let [n, r] = Ot(e), i = t;
		return [
			n,
			(e = i, t) => r(e, t),
			i
		];
	}
	let r = t, i = n;
	return [
		e,
		(e = i, t) => r(e, t),
		i
	];
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createPlugin-YYkwbiUd.mjs
var At = Symbol.for("v0:installed-plugins");
function jt(e) {
	let t = e._context;
	return t[At] ??= /* @__PURE__ */ new Set();
}
function Mt(e) {
	return { install(t) {
		t.runWithContext(() => {
			let n = jt(t);
			n.has(e.namespace) || (n.add(e.namespace), e.provide(t), e.setup?.(t));
		});
	} };
}
function Nt(e) {
	return e.startsWith("v0:") ? e.slice(3) : e;
}
function Pt() {
	return Et("v0:storage");
}
function Ft(e, t, n) {
	function r(n = {}) {
		let { namespace: r = e, persist: i, ...a } = n;
		return kt(r, t(a));
	}
	function i(t = {}) {
		let { namespace: i = e, persist: a, ...o } = t, s;
		return Mt({
			namespace: i,
			provide: (e) => {
				let [, t, c] = r({
					...o,
					namespace: i
				});
				if (s = c, t(s, e), a && n?.restore) {
					let e = Pt(), t = Nt(i), r = e.get(t);
					/* @__PURE__ */ Q(r.value) || n.restore(s, r.value);
				}
			},
			setup: n?.setup || a ? (e) => {
				let t = s;
				if (n?.setup?.(t, e, o), a && n?.persist) {
					let r = Pt(), a = Nt(i), o = r.get(a), s = p(() => n.persist(t), (e) => {
						o.value = e;
					});
					e.onUnmount(s);
				}
			} : void 0
		});
	}
	function a(t = e) {
		if (n?.fallback) {
			if (!be()) return n.fallback(t);
			let e = O(t, void 0);
			return /* @__PURE__ */ P(e) ? n.fallback(t) : e;
		}
		return Et(t);
	}
	return [
		r,
		i,
		a
	];
}
//#endregion
//#region node_modules/@vuetify/v0/dist/adapter-B5mEUP5W.mjs
var It = class {}, Lt = class extends It {
	prefix;
	colors;
	timestamps;
	constructor(e = {}) {
		super(), this.prefix = e.prefix || "v0", this.colors = e.colors !== !1, this.timestamps = e.timestamps !== !1;
	}
	debug(e, ...t) {
		this.log("debug", "debug", e, ...t);
	}
	info(e, ...t) {
		this.log("info", "info", e, ...t);
	}
	warn(e, ...t) {
		this.log("warn", "warn", e, ...t);
	}
	error(e, ...t) {
		this.log("error", "error", e, ...t);
	}
	trace(e, ...t) {
		this.log("trace", "trace", e, ...t);
	}
	fatal(e, ...t) {
		this.log("fatal", "error", e, ...t);
	}
	format(e, t, ...n) {
		return [[
			this.timestamps ? this.timestamp() : "",
			`[${this.prefix} ${e.toLowerCase()}]`,
			t
		].filter(Boolean).join(" "), ...n];
	}
	timestamp() {
		/* v8 ignore next -- defensive fallback, toTimeString always returns valid format */
		return $ ? (/* @__PURE__ */ new Date()).toTimeString().split(" ")[0] ?? "" : (/* @__PURE__ */ new Date()).toISOString();
	}
	style(e) {
		/* v8 ignore next -- LogLevel union is exhaustive */
		return !this.colors || !$ ? "" : {
			trace: "color: #64748b",
			debug: "color: #3b82f6",
			info: "color: #10b981",
			warn: "color: #f59e0b",
			error: "color: #ef4444",
			fatal: "color: #dc2626; font-weight: bold",
			silent: ""
		}[e] || "";
	}
	log(e, t, n, ...r) {
		let [i, ...a] = this.format(e, n, ...r), o = this.style(e);
		$ && o && /* @__PURE__ */ y(console[t]) ? console[t](`%c${i}`, o, ...a) : /* @__PURE__ */ y(console[t]) && console[t](i, ...a);
	}
};
//#endregion
//#region node_modules/@vuetify/v0/dist/useLogger-BIAZ6Iyu.mjs
function Rt(e = {}) {
	let { adapter: t = new Lt({ prefix: e.prefix }), level: n = "info", enabled: r = !1 } = e, i = n, a = r;
	function o(e) {
		return {
			trace: 0,
			debug: 1,
			info: 2,
			warn: 3,
			error: 4,
			fatal: 5,
			silent: 6
		}[e] ?? 2;
	}
	function s(e) {
		return a ? o(e) >= o(i) : !1;
	}
	function c(e) {
		return e;
	}
	function l(e, ...n) {
		s("debug") && t.debug(c(e), ...n);
	}
	function u(e, ...n) {
		s("info") && t.info(c(e), ...n);
	}
	function d(e, ...n) {
		s("warn") && t.warn(c(e), ...n);
	}
	function f(e, ...n) {
		s("error") && t.error(c(e), ...n);
	}
	function p(e, ...n) {
		s("trace") && t.trace?.(c(e), ...n);
	}
	function m(e, ...n) {
		s("fatal") && t.fatal?.(c(e), ...n);
	}
	function h(e) {
		i = e;
	}
	function g() {
		return i;
	}
	function _() {
		return a;
	}
	function v() {
		a = !0;
	}
	function y() {
		a = !1;
	}
	return {
		debug: l,
		info: u,
		warn: d,
		error: f,
		trace: p,
		fatal: m,
		level: h,
		current: g,
		enabled: _,
		enable: v,
		disable: y
	};
}
var zt = "v0:logger";
function Bt(e = zt) {
	function t(t, n) {
		return `[${e} ${n}] ${t}`;
	}
	return {
		debug: (e, ...n) => console.debug(t(e, "debug"), ...n),
		info: (e, ...n) => console.info(t(e, "info"), ...n),
		warn: (e, ...n) => console.warn(t(e, "warn"), ...n),
		error: (e, ...n) => console.error(t(e, "error"), ...n),
		trace: (e, ...n) => console.trace(t(e, "trace"), ...n),
		fatal: (e, ...n) => console.error(t(e, "fatal"), ...n),
		level: () => {},
		current: () => "info",
		enabled: () => !0,
		enable: () => {},
		disable: () => {}
	};
}
var [Vt, Ht, Ut] = Ft(zt, (e) => Rt(e), {
	fallback: (e) => Bt(e),
	setup: (e, t, n) => {}
});
function Wt(e, t) {
	let n = `[${t}]`;
	function r(e) {
		return (t, ...r) => e(`${n} ${t}`, ...r);
	}
	return {
		...e,
		debug: r(e.debug),
		info: r(e.info),
		warn: r(e.warn),
		error: r(e.error),
		trace: r(e.trace),
		fatal: r(e.fatal)
	};
}
function Gt(e) {
	let t = Ut();
	return /* @__PURE__ */ P(e) || !e.trim() ? t : Wt(t, e);
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createRegistry-COW_AjH1.mjs
function Kt(e) {
	let t = Gt(), n = e?.events ?? !1, r = e?.reactive ?? !1, i = r ? T(/* @__PURE__ */ new Map()) : /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new WeakSet(), u = [], d = U(0), f = 0, p = !1, m = Infinity, h = -Infinity, g = !1, v = !1, y = [];
	function b(e, t) {
		let n = c.get(e);
		if (n) for (let e of n) e(t);
	}
	function x(e, t = void 0) {
		if (n) {
			if (g) {
				y.push({
					event: e,
					data: t
				});
				return;
			}
			b(e, t);
		}
	}
	function S(e, r) {
		if (!n) {
			t.warn("Events are disabled. Initialize with `createRegistry({ events: true })` to enable.");
			return;
		}
		c.has(e) || c.set(e, /* @__PURE__ */ new Set()), c.get(e).add(r);
	}
	function C(e, r) {
		if (!n) {
			t.warn("Events are disabled. Initialize with `createRegistry({ events: true })` to enable.");
			return;
		}
		c.get(e)?.delete(r);
	}
	function w() {
		c.clear(), I();
	}
	function E(e) {
		return i.get(e);
	}
	function D(e, t = {}, n) {
		p && z();
		let r = E(e);
		if (!r) return B({
			...t,
			id: e
		});
		let a = Object.hasOwn(t, "value"), o = r.value, c = r.valueIsIndex;
		return a && (/* @__PURE__ */ P(t.value) ? (o = r.index, c = !0) : (o = t.value, c = !1), c !== r.valueIsIndex && (c ? f++ : f--), Object.is(o, r.value) || (j(r.value, e), A(o, e))), Object.assign(r, t, {
			id: e,
			index: r.index,
			value: o,
			valueIsIndex: c
		}), i.set(e, r), s.clear(), x("update:ticket", r), n && x(n, r), r;
	}
	function O(e) {
		p && z();
		let t = a.get(e);
		return t ? t.slice() : void 0;
	}
	function k(e) {
		return p && z(), o.get(e);
	}
	function ee(e) {
		return i.has(e);
	}
	function A(e, t) {
		let n = a.get(e);
		n ? n.includes(t) || n.push(t) : a.set(e, [t]);
	}
	function j(e, t) {
		let n = a.get(e);
		if (!n) return;
		let r = n.filter((e) => e !== t);
		r.length === 0 ? a.delete(e) : a.set(e, r);
	}
	function M() {
		r && d.value;
		let e = s.get("keys");
		if (!/* @__PURE__ */ P(e)) return e;
		let t = u.map((e) => e.id);
		return s.set("keys", t), t;
	}
	function N() {
		r && d.value;
		let e = s.get("values");
		if (!/* @__PURE__ */ P(e)) return e;
		let t = u.slice();
		return s.set("values", t), t;
	}
	function F() {
		r && d.value;
		let e = s.get("entries");
		if (!/* @__PURE__ */ P(e)) return e;
		let t = u.map((e) => [e.id, e]);
		return s.set("entries", t), t;
	}
	function I() {
		u.length = 0, i.clear(), a.clear(), o.clear(), L(), f = 0, p = !1, m = Infinity, h = -Infinity, x("clear:registry");
	}
	function L() {
		if (s.clear(), g) {
			v = !0;
			return;
		}
		d.value++;
	}
	function R(e) {
		if (g) return e();
		g = !0, v = !1, y = [];
		try {
			return e();
		} finally {
			g = !1;
			let e = y;
			y = [], s.clear();
			try {
				for (let { event: t, data: n } of e) b(t, n);
			} finally {
				v && d.value++;
			}
		}
	}
	function z() {
		let e = u.length, t = m === Infinity ? 0 : m, n = h === -Infinity ? e - 1 : Math.min(h, e - 1), r = t === 0 && n === e - 1;
		if (L(), r) a.clear(), o.clear();
		else for (let e = t; e <= n; e++) {
			let t = u[e];
			o.delete(t.index), t.valueIsIndex && j(t.value, t.id);
		}
		for (let e = t; e <= n; e++) {
			let t = u[e];
			t.valueIsIndex ? (t.value = e, A(t.value, t.id)) : r && A(t.value, t.id), t.index = e, o.set(e, t.id);
		}
		p = !1, m = Infinity, h = -Infinity, x("reindex:registry");
	}
	function B(e = {}) {
		p && z();
		let n = i.size, a = /* @__PURE__ */ Q(e.id), s = e.id ?? /* @__PURE__ */ _();
		if (ee(s)) return t.warn(`Ticket "${s}" already exists. Use \`upsert()\` to update or check \`has()\` before registering.`), E(s);
		let c = /* @__PURE__ */ P(e.value), d = n, m = c ? d : e.value, h = e.valueIsIndex ?? c;
		h && f++;
		let g = {
			unregister: () => V(s),
			...e,
			id: s,
			index: d,
			value: m,
			valueIsIndex: h
		}, v = r ? T(g) : g;
		return a && l.add(v), i.set(v.id, v), u.push(v), o.set(v.index, v.id), A(v.value, v.id), L(), x("register:ticket", v), v;
	}
	function V(e) {
		let t = i.get(e);
		if (!t) return;
		t.valueIsIndex && f--;
		let n = t.index;
		u[n] !== t && (n = u.indexOf(t)), n !== -1 && u.splice(n, 1), i.delete(t.id), o.delete(t.index), j(t.value, t.id);
		let r = f > 0 && t.index < i.size;
		r || L(), m = Math.min(m, t.index), r ? z() : p = !0, x("unregister:ticket", t);
	}
	function H(e) {
		return R(() => e.map((e) => B(e)));
	}
	function W(e) {
		let t = { ...e };
		return delete t.index, delete t.valueIsIndex, delete t.unregister, l.has(e) && delete t.id, e.valueIsIndex && delete t.value, t;
	}
	function G(e) {
		let t = [], n = /* @__PURE__ */ new Set();
		for (let r of e) {
			if (n.has(r)) continue;
			let e = i.get(r);
			e && (t.push(e), n.add(r));
		}
		return t.length === 0 ? [] : (R(() => {
			let e = 0;
			for (let t of u) n.has(t.id) || (u[e++] = t);
			u.length = e, L();
			for (let e of t) e.valueIsIndex && f--, m = Math.min(m, e.index), i.delete(e.id), o.delete(e.index), j(e.value, e.id);
			for (let e of t) x("unregister:ticket", e);
			f > 0 && m < i.size ? z() : p = !0;
		}), t.map((e) => W(e)));
	}
	function te(e, t) {
		p && z();
		let n = i.get(e);
		if (!n) return;
		let r = i.size, a = /* @__PURE__ */ ie(t, 0, r - 1), o = n.index;
		return o === a ? n : R(() => (u.splice(o, 1), u.splice(a, 0, n), m = Math.min(o, a), h = Math.max(o, a), z(), x("update:ticket", n), n));
	}
	function K(e) {
		if (p && z(), e.length !== i.size) return;
		let t = /* @__PURE__ */ new Set(), n = [];
		for (let r of e) {
			if (t.has(r)) return;
			let e = i.get(r);
			if (!e) return;
			t.add(r), n.push(e);
		}
		R(() => {
			for (let [e, t] of n.entries()) u[e] = t;
			m = 0, h = -Infinity, z();
		});
	}
	function ne(e = "first", t, n) {
		if (i.size === 0) return;
		p && z();
		let r = u.length;
		if (!n && /* @__PURE__ */ P(t)) return e === "first" ? u[0] : u.at(-1);
		let a = /* @__PURE__ */ P(t) ? void 0 : /* @__PURE__ */ ie(t, 0, r - 1);
		if (e === "last") {
			let e = /* @__PURE__ */ P(a) ? r - 1 : a;
			for (let t = e; t >= 0; t--) {
				let e = u[t];
				if (!n || n(e)) return e;
			}
		} else {
			let e = /* @__PURE__ */ P(a) ? 0 : a;
			for (let t = e; t < r; t++) {
				let e = u[t];
				if (!n || n(e)) return e;
			}
		}
	}
	return {
		collection: i,
		emit: x,
		on: S,
		off: C,
		dispose: w,
		has: ee,
		keys: M,
		clear: I,
		browse: O,
		entries: F,
		values: N,
		lookup: k,
		get: E,
		upsert: D,
		register: B,
		unregister: V,
		reindex: z,
		move: te,
		reorder: K,
		seek: ne,
		batch: R,
		onboard: H,
		offboard: G,
		get size() {
			return i.size;
		}
	};
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createSelection-DQNMDMJj.mjs
function qt(e = {}) {
	let { disabled: t = !1, enroll: n = !0, multiple: r = !1, ...i } = e, a = Kt(i), o = T(/* @__PURE__ */ new Set()), s = W(() => new Set(/* @__PURE__ */ pe(o, a.get))), c = W(() => {
		let e = /* @__PURE__ */ new Set();
		for (let t of s.value) e.add(K(t.value));
		return e;
	});
	function l(e) {
		if (K(t)) return;
		let n = a.get(e);
		n && !K(n.disabled) && (K(r) || o.clear(), o.add(e));
	}
	function u(e) {
		if (K(t)) return;
		let n = a.get(e);
		n && !K(n.disabled) && o.delete(e);
	}
	function d(e) {
		K(t) || (f(e) ? u(e) : l(e));
	}
	function f(e) {
		return o.has(e);
	}
	function p(e, t) {
		let n = e[0], i = !1;
		for (let e of o) {
			let t = a.get(e);
			t && fe(t.value) && (/* @__PURE__ */ P(n) || (t.value.value = n), i = !0);
		}
		if (i || (K(r) || o.clear(), /* @__PURE__ */ P(n))) return;
		let s = a.browse(me(n))?.values().next().value;
		/* @__PURE__ */ P(s) || l(s);
	}
	function m(e = {}) {
		let r = e.id ?? /* @__PURE__ */ _(), i = {
			disabled: !1,
			unregister: () => h(r),
			...e,
			isSelected: q(() => f(r)),
			id: r
		}, o = a.register(i);
		return K(n) && !K(t) && !K(o.disabled) && l(r), o;
	}
	function h(e) {
		o.delete(e), a.unregister(e);
	}
	function g(e) {
		return a.batch(() => e.map((e) => m(e)));
	}
	function v(e) {
		for (let t of e) o.delete(t);
		return a.offboard(e);
	}
	function y() {
		o.clear();
	}
	function b() {
		y(), a.clear();
	}
	function x() {
		y(), a.dispose();
	}
	return {
		...a,
		disabled: t,
		selectedIds: o,
		selectedItems: s,
		selectedValues: c,
		register: m,
		onboard: g,
		unregister: h,
		offboard: v,
		clear: b,
		dispose: x,
		reset: y,
		select: l,
		unselect: u,
		toggle: d,
		selected: f,
		apply: p,
		get size() {
			return a.size;
		}
	};
}
function Jt(e = {}) {
	let { enroll: t = !1, mandatory: n = !1, multiple: r = !1, ...i } = e, a = qt({
		...i,
		multiple: r,
		enroll: !1
	});
	function o(e = "first", t) {
		return a.seek(e, t, (e) => !K(e.disabled));
	}
	function s() {
		if (!K(n) || a.size === 0 || a.selectedIds.size > 0) return;
		let e = o("first");
		e && a.select(e.id);
	}
	function c(e) {
		K(a.disabled) || K(n) && a.selectedIds.size === 1 || a.selectedIds.delete(e);
	}
	function l(e) {
		if (K(a.disabled)) return;
		let t = a.get(e);
		t && !K(t.disabled) && c(e);
	}
	function u(e) {
		K(a.disabled) || (a.selectedIds.has(e) ? l(e) : a.select(e));
	}
	function d(e, t) {
		let i = t?.multiple ?? K(r), o = new Set(a.selectedIds), s = /* @__PURE__ */ new Set();
		if (i) {
			for (let t of e) {
				let e = a.browse(me(t));
				if (!/* @__PURE__ */ P(e)) for (let t of e) {
					let e = a.get(t);
					e && !K(e.disabled) && s.add(t);
				}
			}
			if (K(n) && s.size === 0) return;
			for (let e of o) s.has(e) || a.selectedIds.delete(e);
			for (let e of s) a.selectedIds.add(e);
		} else {
			for (let t of e) {
				let e = a.browse(me(t));
				if (!/* @__PURE__ */ P(e)) for (let t of e) s.add(t);
			}
			let t = s.values().next().value, n = o.values().next().value;
			/* @__PURE__ */ P(n) || c(n), /* @__PURE__ */ P(t) || a.select(t);
		}
	}
	function f(e = {}) {
		let r = e.id ?? /* @__PURE__ */ _(), i = {
			select: () => a.select(r),
			unselect: () => l(r),
			toggle: () => u(r),
			...e,
			id: r
		}, o = a.register(i);
		return K(t) && !K(a.disabled) && !K(o.disabled) && a.select(o.id), K(n) === "force" && s(), o;
	}
	function p(e) {
		let t = a.batch(() => e.map((e) => f(e)));
		return K(n) === "force" && s(), t;
	}
	return {
		...a,
		multiple: r,
		register: f,
		onboard: p,
		unselect: l,
		toggle: u,
		apply: d,
		mandate: s,
		seek: o,
		get size() {
			return a.size;
		}
	};
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createSingle-BcLDttSx.mjs
function Yt(e = {}) {
	let { mandatory: t = !1, ...n } = e, r = Jt({
		...n,
		mandatory: t,
		multiple: !1
	}), i = q(() => r.selectedIds.values().next().value), a = q(() => r.selectedItems.value.values().next().value), o = q(() => a.value?.index ?? -1), s = q(() => a.value?.value);
	return {
		...r,
		selectedId: i,
		selectedItem: a,
		selectedIndex: o,
		selectedValue: s,
		get size() {
			return r.size;
		}
	};
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createTokens-D-xtNt9m.mjs
function Xt(e = {}, t = {}) {
	let n = Gt(), r = Kt({
		...t,
		events: !0
	}), i = /* @__PURE__ */ new Map();
	function a() {
		i.clear();
	}
	r.on("register:ticket", a), r.on("unregister:ticket", a), r.on("update:ticket", a), r.on("reindex:registry", a), r.on("clear:registry", a), r.onboard(/* @__PURE__ */ Zt(e, t.prefix, !!t.flat));
	function o(e) {
		return /* @__PURE__ */ m(e) && e.length > 2 && e[0] === "{" && e.at(-1) === "}";
	}
	function s(e) {
		return /* @__PURE__ */ M(e) && "$value" in e;
	}
	function c(e, t = /* @__PURE__ */ new Set()) {
		let a = /* @__PURE__ */ m(e) ? e : JSON.stringify(e);
		if (i.has(a)) return i.get(a);
		let l = s(e) ? e.$value : e, u = /* @__PURE__ */ m(l) && o(l);
		if (s(e) && !u) return i.set(a, l), l;
		let d = u ? l.slice(1, -1) : String(l);
		if (t.has(d)) {
			n.warn(`Circular alias detected for "${d}"`), i.set(a, void 0);
			return;
		}
		t.add(d);
		let f = r.get(d), p = [];
		if (!f && d.includes(".")) {
			let e = d.split(".");
			for (let t = e.length - 1; t > 0; t--) {
				let n = e.slice(0, t).join("."), i = e.slice(t), a = r.get(n);
				if (!/* @__PURE__ */ P(a?.value)) {
					f = a, p = i;
					break;
				}
			}
		}
		if (/* @__PURE__ */ P(f?.value)) {
			u && n.warn(`Alias not found for "${String(l)}"`), i.set(a, void 0);
			return;
		}
		let h = f.value;
		if (p.length > 0) {
			s(h) && (h = h.$value);
			for (let e of p) {
				if (!/* @__PURE__ */ M(h) || oe.has(e) || !Object.prototype.hasOwnProperty.call(h, e)) {
					h = void 0;
					break;
				}
				h = h[e], s(h) && (h = h.$value);
			}
			if (/* @__PURE__ */ P(h)) {
				n.warn(`Path not found inside "${d}": ${p.join(".")}`), i.set(a, void 0);
				return;
			}
		} else s(h) && (h = h.$value);
		let g = /* @__PURE__ */ m(h) && o(h) ? c(h, t) : h;
		return i.set(a, g), g;
	}
	return {
		...r,
		resolve: c,
		isAlias: o,
		get size() {
			return r.size;
		}
	};
}
/* #__NO_SIDE_EFFECTS__ */
function Zt(e, t = "", n = !1) {
	let r = [], i = [{
		tokens: e,
		prefix: t,
		flat: n
	}];
	for (; i.length > 0;) {
		let { tokens: e, prefix: t, flat: n } = i.pop(), a = {};
		for (let t in e) Object.hasOwn(e, t) && t.startsWith("$") && (a[t] = e[t]);
		Object.keys(a).length > 0 && t && r.push({
			id: t,
			value: a
		});
		for (let a in e) {
			if (!Object.hasOwn(e, a) || oe.has(a) || a.startsWith("$")) continue;
			let o = e[a], s = t ? `${t}.${a}` : a;
			if (!/* @__PURE__ */ M(o)) {
				r.push({
					id: s,
					value: o
				});
				continue;
			}
			if ("$value" in o) {
				r.push({
					id: s,
					value: o
				});
				let e = o.$value;
				if (/* @__PURE__ */ M(e) && !n) for (let t in e) {
					if (!Object.hasOwn(e, t) || oe.has(t) || t.startsWith("$")) continue;
					let a = e[t], o = `${s}.${t}`;
					/* @__PURE__ */ M(a) ? "$value" in a ? r.push({
						id: o,
						value: a
					}) : i.push({
						tokens: a,
						prefix: o,
						flat: n
					}) : r.push({
						id: o,
						value: a
					});
				}
				continue;
			}
			if (n) {
				r.push({
					id: s,
					value: o
				});
				continue;
			}
			i.push({
				tokens: o,
				prefix: s,
				flat: n
			});
		}
	}
	return r;
}
//#endregion
//#region node_modules/@vuetify/v0/dist/toArray-DCZRopC6.mjs
/* #__NO_SIDE_EFFECTS__ */
function Qt(e) {
	return /* @__PURE__ */ Q(e) ? [] : /* @__PURE__ */ l(e) ? e : [e];
}
//#endregion
//#region node_modules/@vuetify/v0/dist/useEventListener-C1aOe4Iy.mjs
function $t(e, t, n, r) {
	let i = [];
	function a() {
		for (let e of i) e();
		i.length = 0;
	}
	function o(e, t, n, r) {
		return e.addEventListener(t, n, r), () => e.removeEventListener(t, n, r);
	}
	let s = p(() => [
		K(e),
		K(t),
		z(n),
		K(r)
	], ([e, t, n, r]) => {
		if (a(), !e) return;
		let s = /* @__PURE__ */ Qt(t), c = /* @__PURE__ */ Qt(n);
		for (let t of s) for (let n of c) i.push(o(e, t, n, r));
	}, {
		immediate: !0,
		flush: "post"
	});
	function c() {
		s(), a();
	}
	return g(c, !0), c;
}
function en(e, t, n) {
	return $ ? $t(window, e, t, n) : () => {};
}
//#endregion
//#region node_modules/@vuetify/v0/dist/adapter-B6R54NMr.mjs
var tn = class e {
	static SAFE_IDENT = /^[a-zA-Z0-9_-]+$/;
	static UNSAFE_CSS = /url\s*\(|src\s*\(|image\s*\(|image-set\s*\(|cross-fade\s*\(|@import|expression\s*\(|[;{}<>\\]|\/\*/i;
	stylesheetId = "v0-theme-stylesheet";
	prefix;
	rgb = !1;
	dispose;
	constructor(t) {
		if (!e.SAFE_IDENT.test(t)) throw new n(`Invalid theme prefix: "${t}". Expected an identifier matching ${e.SAFE_IDENT}.`, {
			code: "V0_THEME_INVALID_PREFIX",
			prefix: t
		});
		this.prefix = t;
	}
	generate(t, n) {
		let r = "";
		for (let n in t) {
			let i = t[n];
			if (!i || !e.SAFE_IDENT.test(n)) continue;
			let a = Object.entries(i).filter(([t, n]) => e.SAFE_IDENT.test(t) && !e.UNSAFE_CSS.test(n)).map(([e, t]) => `  --${this.prefix}-${e}: ${this.rgb ? this.decompose(t) : t};`).join("\n");
			r += `[data-theme="${n}"] {\n${a}\n}\n`;
		}
		return /* @__PURE__ */ P(n) || (r += `:root {\n  color-scheme: ${n ? "dark" : "light"};\n}\n`), r;
	}
	decompose(e) {
		let { r: t, g: n, b: r, a: i } = /* @__PURE__ */ w(e);
		return /* @__PURE__ */ P(i) ? `${t}, ${n}, ${r}` : `${t}, ${n}, ${r}, ${i}`;
	}
}, nn = class extends tn {
	cspNonce;
	sheet;
	constructor(e = {}) {
		super(e.prefix ?? "v0"), this.cspNonce = e.cspNonce, this.stylesheetId = e.stylesheetId ?? this.stylesheetId;
	}
	setup(e, t, n) {
		if ($) {
			this.update(t.colors.value, t.isDark.value);
			let r = p([t.colors, t.isDark], ([e, t]) => {
				this.update(e, t);
			});
			if (/* @__PURE__ */ E(n)) {
				this.dispose = () => {
					r(), this.detach();
				};
				return;
			}
			let i = n instanceof HTMLElement ? n : /* @__PURE__ */ m(n) ? document.querySelector(n) : e._container || document.querySelector("#app") || document.body;
			if (!i) {
				this.dispose = () => {
					r(), this.detach();
				};
				return;
			}
			t.selectedId.value && (i.dataset.theme = String(t.selectedId.value));
			let a = p(t.selectedId, (e) => {
				e && (i.dataset.theme = String(e));
			});
			this.dispose = () => {
				r(), a(), this.detach();
			};
		} else {
			let n = e._context?.provides?.usehead ?? e._context?.provides?.head;
			if (n?.push) {
				let e = t.selectedId.value, r = n.push({
					htmlAttrs: { "data-theme": e ? String(e) : "" },
					style: [{
						innerHTML: this.generate(t.colors.value, t.isDark.value),
						id: this.stylesheetId,
						...this.cspNonce ? { nonce: this.cspNonce } : {}
					}]
				}), i = p([
					t.selectedId,
					t.colors,
					t.isDark
				], ([e, t, n]) => {
					r.patch?.({
						htmlAttrs: { "data-theme": e ? String(e) : "" },
						style: [{
							innerHTML: this.generate(t, n),
							id: this.stylesheetId,
							...this.cspNonce ? { nonce: this.cspNonce } : {}
						}]
					});
				});
				this.dispose = () => {
					i(), r.dispose?.();
				};
			}
		}
	}
	update(e, t) {
		$ && this.upsert(this.generate(e, t));
	}
	upsert(e) {
		$ && (this.sheet || (this.sheet = new CSSStyleSheet(), document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.sheet]), this.sheet.replaceSync(e));
	}
	detach() {
		$ && (document.adoptedStyleSheets = document.adoptedStyleSheets.filter((e) => e !== this.sheet), this.sheet = void 0);
	}
};
//#endregion
//#region node_modules/@vuetify/v0/dist/useTheme-Dh-EW4wo.mjs
function rn() {
	let t = U(!1), n = U(!1);
	function r() {
		t.value = !0;
	}
	function i() {
		n.value = !0;
	}
	return {
		isHydrated: e(t),
		isSettled: e(n),
		hydrate: r,
		settle: i
	};
}
function an() {
	return {
		isHydrated: e(U(!0)),
		isSettled: e(U(!0)),
		hydrate: () => {},
		settle: () => {}
	};
}
var [on, sn, cn] = Ft("v0:hydration", () => rn(), {
	fallback: () => an(),
	setup: (e, t) => {
		let { mount: n } = t;
		t.mount = (...r) => {
			let i = n(...r);
			return a().then(() => {
				e.hydrate(), a().then(() => e.settle());
			}), t.mount = n, i;
		};
	}
});
function ln(t) {
	let n = q(() => K(t)), r = K(t), i = $ && dt ? window.matchMedia(r) : null, a = U(i?.matches ?? !1), o = U(i), s = cn(), c = null;
	function l() {
		if (!$ || !dt) return;
		c?.(), c = null;
		let e = window.matchMedia(n.value);
		o.value = e, a.value = e.matches;
		function t(e) {
			a.value = e.matches;
		}
		e.addEventListener("change", t), c = () => e.removeEventListener("change", t);
	}
	let u = p([n, () => s.isHydrated.value], ([e, t]) => {
		t && l();
	}, { immediate: !0 });
	function d() {
		u(), c?.(), c = null;
	}
	return g(d, !0), {
		matches: e(a),
		query: n,
		mediaQueryList: e(o),
		stop: d
	};
}
function un() {
	return ln("(prefers-color-scheme: dark)");
}
function dn() {
	return ln("(prefers-reduced-motion: reduce)");
}
function fn(e = {}) {
	let { themes: t = {}, palette: n = {}, foreground: r, system: i, ...a } = e, o = Xt({
		palette: n,
		...t
	}, { flat: !0 }), s = Yt({
		...a,
		reactive: !0
	}), c = Gt();
	for (let e in t) {
		let { colors: n, ...r } = t[e];
		C({
			id: e,
			value: n,
			...r
		});
	}
	let l = pn(i, s, c), u = U(!!l);
	!l && a.default && !s.selectedId.value && s.select(a.default);
	let d = q(() => s.keys()), f = W(() => {
		let e = {}, t = s.selectedId.value;
		for (let n of s.values()) {
			if (n.lazy && n.id !== t) continue;
			let i = x(n.value);
			if (r) for (let [e, t] of Object.entries(i)) {
				let n = `on-${e}`;
				!e.startsWith("on-") && !(n in i) && (i[n] = /* @__PURE__ */ S(t));
			}
			e[n.id] = i;
		}
		return e;
	}), m = q(() => s.selectedItem.value?.dark ?? !1), h = q(() => u.value), g = l ? un() : void 0;
	function _() {
		if (!l || !g) return;
		let e = g.matches.value ? l.dark : l.light;
		s.has(e) && s.select(e);
	}
	l && ($ ? _() : a.default && !s.selectedId.value && s.select(a.default), p(() => g.matches.value, () => {
		u.value && _();
	}));
	function v(e) {
		u.value = !1, s.select(e);
	}
	function y() {
		if (l) {
			u.value = !0, _();
			return;
		}
		a.default && s.select(a.default);
	}
	function b(e = d.value) {
		let t = e.indexOf(s.selectedId.value ?? "");
		v(e[t === -1 ? 0 : (t + 1) % e.length]);
	}
	function x(e) {
		let t = {};
		for (let [n, r] of Object.entries(e)) t[n] = o.isAlias(r) ? o.resolve(r) : r;
		return t;
	}
	function C(e = {}) {
		let { colors: t, ...n } = e;
		t && n.id && !s.has(n.id) && o.onboard(/* @__PURE__ */ Zt({ [n.id]: { colors: t } }, "", !0));
		let r = {
			lazy: !1,
			dark: !1,
			...n,
			...t ? { value: t } : {}
		};
		return s.register(r);
	}
	function w(e) {
		return s.batch(() => e.map((e) => C(e)));
	}
	return {
		...s,
		colors: f,
		isDark: m,
		isSystem: h,
		select: v,
		reset: y,
		register: C,
		onboard: w,
		cycle: b,
		dispose: () => {
			g?.stop();
		},
		get size() {
			return s.size;
		}
	};
}
function pn(e, t, n) {
	if (!e) return;
	let r = t.get(e.light), i = t.get(e.dark);
	if (!r) {
		n.warn(`[v0:theme] system.light "${String(e.light)}" is not registered`);
		return;
	}
	if (!i) {
		n.warn(`[v0:theme] system.dark "${String(e.dark)}" is not registered`);
		return;
	}
	return i.dark || n.warn(`[v0:theme] system.dark "${String(e.dark)}" should have dark: true`), e;
}
function mn() {
	return {
		size: 0,
		colors: W(() => ({})),
		isDark: U(!1),
		isSystem: U(!1),
		cycle: () => {},
		reset: () => {},
		onboard: () => [],
		dispose: () => {}
	};
}
var [hn, gn, _n] = Ft("v0:theme", (e) => fn(e), {
	fallback: () => mn(),
	setup: (e, t, { adapter: n = new nn(), target: r, rgb: i }) => {
		i && (n.rgb = !0), n.setup(t, e, r), t.onUnmount(() => n.dispose?.());
	},
	persist: (e) => e.isSystem.value ? null : e.selectedId.value,
	restore: (e, t) => {
		(/* @__PURE__ */ m(t) || /* @__PURE__ */ r(t)) && e.select(t);
	}
});
//#endregion
//#region node_modules/@vuetify/v0/dist/composables-DEmU2w8H.mjs
function vn(e) {
	let t = e.filter((e) => e[0] < e[1]).toSorted((e, t) => e[0] - t[0]), n = [];
	for (let e of t) {
		let t = n.at(-1);
		t && e[0] <= t[1] ? t[1] = Math.max(t[1], e[1]) : n.push([e[0], e[1]]);
	}
	return n;
}
function yn(e, t) {
	let n = [], r = 0;
	for (let [i, a] of t) r < i && n.push({
		text: e.slice(r, i),
		match: !1
	}), n.push({
		text: e.slice(i, a),
		match: !0
	}), r = a;
	return r < e.length && n.push({
		text: e.slice(r),
		match: !1
	}), n;
}
function bn(e, t, n) {
	let r = [];
	for (let i of (/* @__PURE__ */ Qt(t)).filter(Boolean)) r.push(.../* @__PURE__ */ x(e, i, n));
	return vn(r);
}
/* #__NO_SIDE_EFFECTS__ */
function xn(e, t, n = {}) {
	let r = K(e), i = K(t), a = K(n.matches), o = K(n.matchAll) ?? !1, s = K(n.ignoreCase) ?? !1, c = K(n.ignoreAccents) ?? !1;
	if (a?.length) return yn(r, vn(a));
	if (i) {
		let e = bn(r, i, {
			matchAll: o,
			ignoreCase: s,
			ignoreAccents: c
		});
		return e.length > 0 ? yn(r, e) : [{
			text: r,
			match: !1
		}];
	}
	return [{
		text: r,
		match: !1
	}];
}
var Sn = [
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
	"xxl"
];
function Cn() {
	return {
		mobileBreakpoint: "lg",
		breakpoints: {
			xs: 0,
			sm: 600,
			md: 840,
			lg: 1145,
			xl: 1545,
			xxl: 2138
		}
	};
}
function wn(e = {}) {
	let { ssr: t, ...n } = e, i = Cn(), { mobileBreakpoint: a, breakpoints: o } = /* @__PURE__ */ d(i, n), s = Object.entries(o).toSorted((e, t) => e[1] - t[1]), c = s.map(([e]) => e), l = /* @__PURE__ */ r(a) ? a : o[a] ?? o.md, u = t ? t.clientWidth : $ ? window.innerWidth : 0, f = t ? t.clientHeight ?? 0 : $ ? window.innerHeight : 0, p = U("xs"), m = U(u), h = U(f), g = U(!1), _ = U(!1), v = U(!1), y = U(!1), b = U(!1), x = U(!1), S = U(!1), C = U(!1), w = U(!1), T = U(!1), E = U(!1), D = U(!1), O = U(!1), k = U(!1), ee = U(!1);
	function A(e, t) {
		let n = "xs";
		for (let r = s.length - 1; r >= 0; r--) {
			let i = s[r][1];
			if (t ? window.matchMedia(`(min-width: ${i}px)`).matches : e >= i) {
				n = s[r][0];
				break;
			}
		}
		let i = c.indexOf(n), o = /* @__PURE__ */ r(l) ? t ? !window.matchMedia(`(min-width: ${l}px)`).matches : e < l : i < c.indexOf(a);
		return {
			current: n,
			index: i,
			mobile: o
		};
	}
	function j({ current: e, mobile: t }) {
		let n = Sn.indexOf(e);
		p.value = e, g.value = t, _.value = e === "xs", v.value = e === "sm", y.value = e === "md", b.value = e === "lg", x.value = e === "xl", S.value = e === "xxl", C.value = n >= 1, w.value = n >= 2, T.value = n >= 3, E.value = n >= 4, D.value = n <= 1, O.value = n <= 2, k.value = n <= 3, ee.value = n <= 4;
	}
	j(A(u, !t && $ && dt));
	let M = !1;
	function N() {
		!M && $ && (M = !0, en("resize", () => {
			P();
		}, { passive: !0 }));
	}
	function P() {
		$ && (N(), m.value = window.innerWidth, h.value = window.innerHeight, j(A(m.value, dt)));
	}
	return t || N(), {
		breakpoints: o,
		mobileBreakpoint: a,
		name: F(p),
		width: F(m),
		height: F(h),
		isMobile: F(g),
		xs: F(_),
		sm: F(v),
		md: F(y),
		lg: F(b),
		xl: F(x),
		xxl: F(S),
		smAndUp: F(C),
		mdAndUp: F(w),
		lgAndUp: F(T),
		xlAndUp: F(E),
		smAndDown: F(D),
		mdAndDown: F(O),
		lgAndDown: F(k),
		xlAndDown: F(ee),
		ssr: !!t,
		update: P
	};
}
function Tn(e = {}) {
	if (e.ssr) return wn(e);
	let t = Cn();
	return {
		breakpoints: t.breakpoints,
		mobileBreakpoint: t.mobileBreakpoint,
		name: F(U("xs")),
		width: F(U(0)),
		height: F(U(0)),
		isMobile: F(U(!0)),
		xs: F(U(!0)),
		sm: F(U(!1)),
		md: F(U(!1)),
		lg: F(U(!1)),
		xl: F(U(!1)),
		xxl: F(U(!1)),
		smAndUp: F(U(!1)),
		mdAndUp: F(U(!1)),
		lgAndUp: F(U(!1)),
		xlAndUp: F(U(!1)),
		smAndDown: F(U(!0)),
		mdAndDown: F(U(!0)),
		lgAndDown: F(U(!0)),
		xlAndDown: F(U(!0)),
		ssr: !1,
		update: () => {}
	};
}
var [En, Dn, On] = Ft("v0:breakpoints", (e) => wn(e), {
	fallback: () => Tn(),
	setup: (e, t, n) => {
		if (!n?.ssr) {
			$ && e.update();
			return;
		}
		let { mount: r } = t;
		t.mount = (...n) => {
			let i = r(...n);
			return e.update(), t.mount = r, i;
		};
	}
});
$ && /mac|iphone|ipad|ipod/i.test(navigator?.userAgent ?? "");
var kn = class {
	dispose;
};
function An(e) {
	return e ? "reduce" : "no-preference";
}
var jn = class extends kn {
	setup(e, t) {
		if ($) {
			function e(e) {
				document.body.dataset.reducedMotion = An(e);
			}
			e(t.isReduced.value), this.dispose = p(t.isReduced, e);
		} else {
			let n = e._context?.provides?.usehead ?? e._context?.provides?.head;
			if (n?.push) {
				let e = n.push({ bodyAttrs: { "data-reduced-motion": An(t.isReduced.value) } }), r = p(t.isReduced, (t) => e.patch?.({ bodyAttrs: { "data-reduced-motion": An(t) } }));
				this.dispose = () => {
					r(), e.dispose?.();
				};
			}
		}
	}
};
function Mn(t = {}) {
	let n = U(t.mode ?? "system"), r = dn(), i = q(() => n.value === "always" || n.value !== "never" && r.matches.value);
	function a(e) {
		n.value = e;
	}
	return {
		selectedMode: e(n),
		isReduced: i,
		select: a,
		dispose: r.stop
	};
}
function Nn() {
	return {
		selectedMode: e(U("system")),
		isReduced: e(U(!1)),
		select: () => {},
		dispose: () => {}
	};
}
var [Pn, Fn, In] = Ft("v0:reduced-motion", (e) => Mn(e), {
	fallback: () => Nn(),
	persist: (e) => e.selectedMode.value,
	restore: (e, t) => {
		(t === "system" || t === "always" || t === "never") && e.select(t);
	},
	setup: (e, t, { adapter: n = new jn() }) => {
		t.onUnmount(() => e.dispose()), n.setup(t, e), t.onUnmount(() => n.dispose?.());
	}
}), Ln = class {
	dispose;
}, Rn = class extends Ln {
	setup(e, t, n) {
		if ($) {
			if (/* @__PURE__ */ E(n)) return;
			let e = n instanceof HTMLElement ? n : /* @__PURE__ */ m(n) ? document.querySelector(n) : document.documentElement;
			if (!e) return;
			e.dir = t.isRtl.value ? "rtl" : "ltr", this.dispose = p(t.isRtl, (t) => {
				e.dir = t ? "rtl" : "ltr";
			});
		} else {
			let n = e._context?.provides?.usehead ?? e._context?.provides?.head;
			if (n?.push) {
				let e = n.push({ htmlAttrs: { dir: t.isRtl.value ? "rtl" : "ltr" } }), r = p(t.isRtl, (t) => e.patch?.({ htmlAttrs: { dir: t ? "rtl" : "ltr" } }));
				this.dispose = () => {
					r(), e.dispose?.();
				};
			}
		}
	}
};
function zn(e = {}) {
	let t = U(e.default ?? !1);
	function n() {
		t.value = !t.value;
	}
	return {
		isRtl: t,
		toggle: n,
		dispose: () => {}
	};
}
function Bn() {
	return {
		isRtl: U(!1),
		toggle: () => {},
		dispose: () => {}
	};
}
var [Vn, Hn, Un] = Ft("v0:rtl", (e) => zn(e), {
	fallback: () => Bn(),
	setup: (e, t, { adapter: n = new Rn(), target: r }) => {
		n.setup(t, e, r), t.onUnmount(() => n.dispose?.());
	},
	persist: (e) => e.isRtl.value,
	restore: (e, t) => {
		/* @__PURE__ */ h(t) && (e.isRtl.value = t);
	}
}), Wn = t({
	text: {
		type: String,
		default: ""
	},
	query: [String, Array],
	matches: Array,
	matchAll: Boolean,
	ignoreCase: Boolean,
	ignoreAccents: [Boolean, String],
	color: String,
	opacity: [String, Number],
	markClass: String,
	...Pe({ tag: "span" })
}, "VHighlight"), Gn = i({
	name: "VHighlight",
	props: Wn(),
	setup(e) {
		let t = W(() => /* @__PURE__ */ xn(() => e.text, () => e.query, {
			matches: () => e.matches,
			matchAll: () => e.matchAll,
			ignoreCase: () => e.ignoreCase,
			ignoreAccents: () => e.ignoreAccents ?? !1
		})), { textColorClasses: n, textColorStyles: r } = Fe(() => e.color);
		return () => Z(e.tag, { class: "v-highlight" }, { default: () => [t.value.map((t, i) => t.match ? Y("mark", {
			key: i,
			class: H([
				"v-highlight__mark",
				n.value,
				e.markClass
			]),
			style: ge([r.value, { "--v-highlight-opacity": e.opacity }])
		}, [t.text]) : Y("span", { key: i }, [t.text]))] });
	}
}), Kn = 1e3;
function qn(e, t) {
	let n = null, r = -1;
	function i(t) {
		return K(e).find((e) => e.title === t || e.value === t);
	}
	p(() => K(e), () => {
		if (!n) return;
		let e = i(n);
		e && (n = null, t(e));
	});
	function a(e) {
		let a = i(e);
		if (a) return t(a);
		o(), n = e, r = window.setTimeout(o, Kn);
	}
	function o() {
		n = null, clearTimeout(r);
	}
	return {
		autofill: a,
		resetAutofill: o
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSelect/useFocusRepair.js
function Jn(e, t, n) {
	return function(r) {
		return !r.relatedTarget && document.activeElement === document.body && e.value ? (requestAnimationFrame(() => {
			if (!e.value) return;
			let r = t();
			((r && J(r)[0]) ?? n())?.focus({ preventScroll: !0 });
		}), !0) : !1;
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSelect/useScrolling.js
function Yn(e) {
	return !!e && e.type !== "divider" && e.type !== "subheader" && !e.props?.disabled;
}
function Xn(e, t, n) {
	let r = e.length;
	for (let i = 0; i < r; i++) {
		let a = ((t + i * n) % r + r) % r;
		if (Yn(e[a])) return a;
	}
	return -1;
}
function Zn(e, t, n, r, i = {}) {
	let a = U(!1), o, s = 0, c = null;
	function l(e) {
		cancelAnimationFrame(o), a.value = !0, o = requestAnimationFrame(() => {
			o = requestAnimationFrame(() => {
				a.value = !1;
			});
		});
	}
	async function u() {
		await new Promise((e) => requestAnimationFrame(e)), await new Promise((e) => requestAnimationFrame(e)), await new Promise((e) => requestAnimationFrame(e)), await new Promise((e) => {
			if (a.value) {
				let t = p(a, () => {
					t(), e();
				});
			} else e();
		});
	}
	function d() {
		return e.value?.$el;
	}
	function f(e) {
		return d()?.querySelector(`[aria-posinset="${e + 1}"]`) ?? null;
	}
	async function m(e, t = !0, r = "center") {
		if (e < 0) return !1;
		if (!t) {
			let t = f(e);
			return t?.focus({ preventScroll: !0 }), !!t;
		}
		let i = ++s, a = d();
		a?.contains(X()) && a.focus({ preventScroll: !0 }), n.value?.scrollToIndex(e, r);
		let o = f(e), c = performance.now() + 500;
		for (; !o && performance.now() < c;) {
			if (await new Promise((e) => requestAnimationFrame(e)), i !== s) return !0;
			o = f(e);
		}
		return o?.focus({ preventScroll: !0 }), o && a && h(a, o, r), !!o;
	}
	function h(e, t, n) {
		let r = e.getBoundingClientRect().top + e.clientTop, i = e.clientHeight, { top: a, height: o } = t.getBoundingClientRect(), s = n === "start" ? a - r : n === "end" ? a + o - (r + i) : a + o / 2 - (r + i / 2);
		Math.abs(s) > 1 && (e.scrollTop += s);
	}
	async function g() {
		await m(Xn(K(r), 0, 1)) || e.value?.focus("first");
	}
	async function _() {
		let t = K(r);
		await m(Xn(t, t.length - 1, -1)) || e.value?.focus("last");
	}
	async function v(e, t = !1) {
		if (!K(i.noAutoScroll)) {
			let n = i.selectedIndex?.() ?? -1;
			if (n >= 0) {
				let i = t ? n : Xn(K(r), n + e, e);
				return await m(i, !1) || m(i);
			}
		}
		if (e === 1) {
			let e = i.headerEl?.(), t = e && J(e)[0];
			if (t) return t.focus();
		}
		if (Xn(K(r), 0, 1) < 0) {
			let t = i.menuContentEl?.(), n = t ? J(t) : [];
			return (e === 1 ? n[0] : n.at(-1))?.focus();
		}
		return e === 1 ? g() : _();
	}
	function y(e, t) {
		let n = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : null;
		if (!n) return !1;
		let r = t.value;
		return t.value = !0, d()?.contains(X()) ? !1 : r ? (e.stopImmediatePropagation(), v(n), !0) : (b(n), !1);
	}
	function b(e) {
		c = e;
	}
	function x() {
		if (!c) return !1;
		let e = c;
		return c = null, v(e, !0), !0;
	}
	function S(e) {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		let t = d(), n = X();
		if (!t || !n || !t.contains(n)) return;
		let i = n.closest("[aria-posinset]");
		if (!i || !t.contains(i)) return;
		let a = t.querySelectorAll("[aria-posinset]");
		if (i !== (e.key === "ArrowUp" ? a[0] : a[a.length - 1])) return;
		let o = Number(i.getAttribute("aria-posinset"));
		if (!o) return;
		let s = e.key === "ArrowUp" ? -1 : 1, c = Xn(K(r), o - 1 + s, s);
		c < 0 || c === o - 1 || (e.preventDefault(), e.stopImmediatePropagation(), m(c, !0, s === 1 ? "end" : "start"));
	}
	async function C(e) {
		if (e.key === "Tab") {
			t.value?.focus();
			return;
		}
		if (e.key === "Home" || e.key === "End") {
			e.preventDefault(), e.stopImmediatePropagation(), await (e.key === "Home" ? g() : _());
			return;
		}
		if (e.key !== "PageDown" && e.key !== "PageUp") return;
		let n = d();
		if (!n) return;
		await u();
		let r = n.querySelectorAll(":scope > :not(.v-virtual-scroll__spacer)");
		if (e.key === "PageDown") {
			let e = n.getBoundingClientRect().top;
			for (let t of r) if (t.getBoundingClientRect().top >= e) {
				t.focus();
				break;
			}
		} else {
			let e = n.getBoundingClientRect().bottom;
			for (let t of [...r].reverse()) if (t.getBoundingClientRect().bottom <= e) {
				t.focus();
				break;
			}
		}
	}
	return {
		listEvents: {
			onScrollPassive: l,
			onKeydownCapture: S,
			onKeydown: C
		},
		focusItem: m,
		focusFirstItem: g,
		focusLastItem: _,
		focusFromActivator: v,
		onActivatorKeydown: y,
		setPendingFocus: b,
		flushPendingFocus: x
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/openOnFocus.js
function Qn(e, t, n) {
	let r = !1;
	p(e, (e) => {
		e || (r = !0, a(() => r = !1));
	}), p(t, (t) => {
		!t || r ? r = !1 : K(n) && (e.value = !0);
	});
}
//#endregion
//#region node_modules/vuetify/lib/components/VSelect/useSelectionMenu.js
function $n(e, t) {
	let n = G(e, "menu"), r = W({
		get: () => n.value,
		set: (r) => {
			n.value && !r && t.vMenuRef.value?.ΨopenChildren.size || (r || !e.menuProps?.persistent) && (r && K(t.menuDisabled) || (n.value = r));
		}
	});
	Qn(r, t.isFocused, () => e.openOnFocus);
	function i() {
		e.multiple || e.menuProps?.closeOnContentClick === !1 || (r.value = !1);
	}
	return {
		menu: r,
		closeOnSelect: i
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/focusGroups.js
function er({ groups: e, onLeave: t }) {
	function n(e) {
		return e.type === "list" ? e.contentRef.value?.$el : e.contentRef.value;
	}
	function r(e) {
		let t = n(e);
		return t ? J(t) : [];
	}
	function i(n) {
		let i = n.target, o = n.shiftKey ? "backward" : "forward", s = e.map(r), c = e.map((e) => e.type === "list" ? e.contentRef.value?.$el : e.contentRef.value).findIndex((e) => e?.contains(i)), l = a(s, c, o, i);
		if (E(l)) {
			let r = e[c], i = s[c];
			if (r.type === "list" || (o === "forward" ? i.at(-1) === n.target : i.at(0) === n.target)) {
				t();
				let e = X();
				if (e) {
					let t = new KeyboardEvent("keydown", {
						key: "Tab",
						shiftKey: n.shiftKey,
						bubbles: !0,
						cancelable: !0
					});
					e.dispatchEvent(t), t.defaultPrevented && n.preventDefault();
				}
			}
		} else {
			n.preventDefault(), n.stopImmediatePropagation();
			let t = e[l];
			if (t.type === "list" && K(t.displayItemsCount) > 0) t.contentRef.value?.focus(0);
			else {
				let e = o === "forward";
				s[l].at(e ? 0 : -1).focus();
			}
		}
	}
	function a(t, n, r, i) {
		let a = e[n], o = t[n];
		if (a.type !== "list" && !(r === "forward" ? o.at(-1) === i : o.at(0) === i)) return null;
		let s = r === "forward" ? 1 : -1;
		for (let r = n + s; r >= 0 && r < e.length; r += s) {
			let n = e[r];
			if (t[r].length > 0 || n.type === "list" && K(n.displayItemsCount) > 0) return r;
		}
		return null;
	}
	return { onTabKeydown: i };
}
//#endregion
//#region node_modules/vuetify/lib/composables/filter.js
function tr(e) {
	return (t, n) => {
		if (Q(t) || Q(n)) return -1;
		if (!n.length) return 0;
		let r = x(t.toString(), n.toString(), {
			ignoreCase: !0,
			ignoreAccents: e,
			matchAll: !0
		});
		return r.length ? r : -1;
	};
}
function nr(e, t) {
	if (!(Q(e) || h(e) || e === -1)) return r(e) ? [[e, e + t.length]] : Array.isArray(e[0]) ? e : [e];
}
var rr = t({
	customFilter: Function,
	customKeyFilter: Object,
	filterKeys: [Array, String],
	filterMode: {
		type: String,
		default: "intersection"
	},
	ignoreAccents: [Boolean, String],
	noFilter: Boolean
}, "filter");
function ir(e, t, n) {
	let r = [], i = n?.default ?? tr(n?.ignoreAccents), a = n?.filterKeys ? xe(n.filterKeys) : !1, o = Object.keys(n?.customKeyFilter ?? {}).length;
	if (!e?.length) return r;
	let s = [];
	loop: for (let c = 0; c < e.length; c++) {
		let [l, u = l] = xe(e[c]), d = {}, f = {}, p = -1;
		if ((t || o > 0) && !n?.noFilter) {
			let e = !1;
			if (M(l)) {
				if (l.type === "divider" || l.type === "subheader") {
					(s.at(-1)?.type !== "divider" || l.type !== "subheader") && (s = []), s.push({
						index: c,
						matches: {},
						type: l.type
					});
					continue;
				}
				let r = a || Object.keys(u);
				e = r.length === o;
				for (let e of r) {
					let r = ue(u, e), a = n?.customKeyFilter?.[e];
					if (p = a ? a(r, t, l) : i(r, t, l), p !== -1 && p !== !1) a ? d[e] = nr(p, t) : f[e] = nr(p, t);
					else if (n?.filterMode === "every") continue loop;
				}
			} else p = i(l, t, l), p !== -1 && p !== !1 && (f.title = nr(p, t));
			let r = Object.keys(f).length, m = Object.keys(d).length;
			if (!r && !m || n?.filterMode === "union" && m !== o && !r || n?.filterMode === "intersection" && (m !== o || !r && o > 0 && !e)) continue;
		}
		s.length && (r.push(...s), s = []), r.push({
			index: c,
			matches: {
				...f,
				...d
			}
		});
	}
	return r;
}
function ar(e, t, n, i) {
	let a = U([]), o = U(/* @__PURE__ */ new Map()), s = W(() => i?.transform ? z(t).map((e) => [e, i.transform(e)]) : z(t));
	A(() => {
		let c = y(n) ? n() : z(n), l = !m(c) && !r(c) ? "" : String(c), u = ir(s.value, l, {
			customKeyFilter: {
				...e.customKeyFilter,
				...z(i?.customKeyFilter)
			},
			default: e.customFilter,
			filterKeys: e.filterKeys,
			filterMode: e.filterMode,
			ignoreAccents: e.ignoreAccents,
			noFilter: e.noFilter
		}), d = z(t), f = [], p = /* @__PURE__ */ new Map();
		u.forEach(({ index: e, matches: t }) => {
			let n = d[e];
			f.push(n), P(n.value) || p.set(n.value, t);
		}), a.value = f, o.value = p;
	});
	function c(e) {
		return o.value.get(e.value);
	}
	return {
		filteredItems: a,
		filteredMatches: o,
		getMatches: c
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/menuActivator.js
var or = t({
	closeText: {
		type: String,
		default: "$vuetify.close"
	},
	openText: {
		type: String,
		default: "$vuetify.open"
	}
}, "autocomplete");
function sr(e, t) {
	let n = Se(), r = W(() => `menu-${n}`);
	return {
		menuId: r,
		ariaExpanded: q(() => K(t)),
		ariaControls: q(() => r.value)
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSelect/VSelect.js
var cr = t({
	chips: Boolean,
	closableChips: Boolean,
	eager: Boolean,
	form: String,
	hideNoData: Boolean,
	hideSelected: Boolean,
	listProps: { type: Object },
	menu: Boolean,
	menuElevation: [Number, String],
	menuIcon: {
		type: _e,
		default: "$dropdown"
	},
	menuProps: { type: Object },
	multiple: Boolean,
	noDataText: {
		type: String,
		default: "$vuetify.noDataText"
	},
	openOnClear: Boolean,
	openOnFocus: Boolean,
	itemColor: String,
	noAutoScroll: Boolean,
	...or(),
	...Ve({ itemChildren: !1 })
}, "Select"), lr = t({
	search: String,
	...rr({ filterKeys: ["title"] }),
	...cr(),
	...ye(lt({
		modelValue: null,
		role: "combobox"
	}), ["validationValue", "dirty"]),
	...Qe({ transition: { component: Ze } })
}, "VSelect"), ur = D()({
	name: "VSelect",
	props: lr(),
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:menu": (e) => !0,
		"update:search": (e) => !0,
		"item:added": (e) => !0,
		"item:removed": (e) => !0
	},
	setup(e, { emit: t, slots: n }) {
		let { t: i } = le(), { elevationClasses: c } = nt(q(() => e.menuElevation)), l = L(), u = L(), d = L(), m = L(), h = L(), g = L(), { items: _, transformIn: v, transformOut: b } = Be(e), { autofill: x, resetAutofill: S } = qn(_, (e) => Q(e)), C = G(e, "search", ""), { filteredItems: w, getMatches: T } = ar(e, _, () => C.value), E = G(e, "modelValue", [], (e) => v(e === null ? [null] : xe(e)), (t) => {
			let n = b(t);
			return e.multiple ? n : n[0] ?? null;
		}), D = W(() => y(e.counterValue) ? e.counterValue(E.value) : r(e.counterValue) ? e.counterValue : E.value.length), O = Ge(e), A = W(() => E.value.map((e) => e.value)), j = U(!1), M = q(() => e.closableChips && !O.isReadonly.value && !O.isDisabled.value), N = o("VChip"), { InputIcon: P } = Ke(e), F = "", R = 0, z, B = !1, H = W(() => {
			let t = C.value ? w.value : _.value;
			return e.hideSelected ? t.filter((t) => !E.value.some((n) => (e.valueComparator || Ie)(n, t))) : t;
		}), te = W(() => e.hideNoData && !H.value.length || O.isReadonly.value || O.isDisabled.value), { menu: K, closeOnSelect: ne } = $n(e, {
			vMenuRef: u,
			menuDisabled: te,
			isFocused: j
		}), { menuId: re, ariaExpanded: ie, ariaControls: ae } = sr(e, K), oe = W(() => ({
			...e.menuProps,
			activatorProps: {
				...e.menuProps?.activatorProps || {},
				"aria-haspopup": "listbox"
			}
		})), { listEvents: se, focusItem: J, focusFirstItem: ue, focusLastItem: de, onActivatorKeydown: fe, setPendingFocus: pe, flushPendingFocus: me } = Zn(d, l, g, H, {
			selectedIndex: De,
			menuContentEl: () => u.value?.contentEl,
			noAutoScroll: () => e.noAutoScroll
		}), he = Jn(K, () => u.value?.contentEl, () => l.value?.controlRef), { onTabKeydown: ge } = er({
			groups: [
				{
					type: "element",
					contentRef: m
				},
				{
					type: "list",
					contentRef: d,
					displayItemsCount: () => H.value.length
				},
				{
					type: "element",
					contentRef: h
				}
			],
			onLeave: () => {
				K.value = !1, l.value?.focus();
			}
		});
		function _e(t) {
			e.openOnClear && (K.value = !0);
		}
		function ye() {
			te.value || (B = !1, pe(null), K.value = !K.value);
		}
		function be(e) {
			e.key === "Tab" && ge(e), d.value?.$el.contains(e.target) && ee(e) && Se(e);
		}
		function Se(n) {
			if (!n.key || O.isReadonly.value) return;
			switch (n.key) {
				case "Escape":
				case "Tab":
					K.value = !1;
					break;
				case "Enter":
				case " ":
					n.preventDefault(), B = !0, K.value = !0;
					break;
				case "ArrowDown":
				case "ArrowUp":
					if (n.preventDefault(), B = !0, fe(n, K)) return;
					break;
				case "Home":
					n.preventDefault(), K.value && ue();
					break;
				case "End":
					n.preventDefault(), K.value && de();
					break;
				case "Backspace":
					if (!e.clearable) break;
					n.preventDefault();
					for (let e of E.value) t("item:removed", e);
					E.value = [], _e(n);
					return;
			}
			if (!ee(n)) return;
			let r = performance.now();
			r - z > 1e3 && (F = "", R = 0), F += n.key.toLowerCase(), z = r;
			let i = H.value;
			function a() {
				let e = o();
				return e || F.at(-1) === F.at(-2) && (F = F.slice(0, -1), R++, e = o(), e) || (R = 0, e = o(), e) ? e : (F = n.key.toLowerCase(), o());
			}
			function o() {
				for (let e = R; e < i.length; e++) {
					let t = i[e];
					if (t.title.toLowerCase().startsWith(F)) return [t, e];
				}
			}
			let s = a();
			if (!s) return;
			let [c, l] = s;
			R = l, K.value ? (e.multiple || Q(c, !0, !1), J(l)) : e.multiple || Q(c, !0);
		}
		function Q(n, r = !0, i = !0) {
			if (n.props.disabled) return;
			let o = e.valueComparator || Ie;
			if (e.multiple) {
				let e = E.value.findIndex((e) => o(e.value, n.value)), i = r ?? !~e;
				if (~e) {
					let r = i ? [...E.value, n] : [...E.value], [a] = r.splice(e, 1);
					i || t("item:removed", a), E.value = r;
				} else i && (t("item:added", n), E.value = [...E.value, n]);
			} else {
				let e = r !== !1, s = E.value[0];
				e ? (s && !o(s.value, n.value) ? (t("item:removed", s), t("item:added", n)) : s || t("item:added", n), E.value = [n]) : (s && t("item:removed", s), E.value = []), i && a(() => ne());
			}
		}
		let we = 0;
		function Te() {
			we = performance.now();
		}
		function Ee(e) {
			let t = e.target;
			l.value?.$el.contains(t) || (K.value = !1);
			let n = e.relatedTarget;
			(u.value?.contentEl?.contains(n) || !n && performance.now() - we < 10) && (j.value = !0);
		}
		function De() {
			return H.value.findIndex((t) => E.value.some((n) => (e.valueComparator || Ie)(n.value, t.value)));
		}
		async function Oe() {
			if (e.eager && g.value?.calculateVisibleItems(), !d.value || !j.value || me() || d.value.$el?.contains(X())) return;
			let t = De();
			t >= 0 && await J(t, !e.noAutoScroll) || B && ue();
		}
		function ke() {
			C.value = "", j.value && (u.value?.contentEl?._clickOutside?.lastMousedownWasOutside ? j.value = !1 : l.value?.focus());
		}
		function Ae(e) {
			j.value = !0;
		}
		function je(e) {
			if (!l.value?.$el.contains(e.relatedTarget) && !e.currentTarget.contains(e.relatedTarget)) {
				if (he(e)) return;
				j.value = !1;
			}
		}
		let Ne = !1;
		function Pe(e) {
			Ne = ce(e);
		}
		function Fe(e) {
			if (e == null) {
				for (let e of E.value) t("item:removed", e);
				E.value = [];
			} else Ne ? x(e) : l.value && (l.value.value = "");
		}
		return p(j, (e) => e && S()), p(K, (t) => {
			if (t || (B = !1, pe(null)), !e.hideSelected && K.value && E.value.length) {
				let t = De();
				k && !e.noAutoScroll && window.requestAnimationFrame(() => {
					t >= 0 && g.value?.scrollToIndex(t, "center");
				});
			}
		}), p(_, (t, n) => {
			K.value || j.value && e.hideNoData && !n.length && t.length && (K.value = !0);
		}), Me(() => {
			let t = !!(e.chips || n.chip), r = !!(!e.hideNoData || H.value.length || n["prepend-item"] || n["append-item"] || n["no-data"]), a = E.value.length > 0, o = ut.filterProps(e), p = a || !j.value && e.label && !e.persistentPlaceholder ? void 0 : e.placeholder, _ = {
				search: C,
				filteredItems: w.value
			};
			return Z(ut, s({ ref: l }, o, {
				modelValue: E.value.map((e) => e.props.title).join(", "),
				name: void 0,
				"onUpdate:modelValue": Fe,
				focused: j.value,
				"onUpdate:focused": (e) => j.value = e,
				validationValue: E.externalValue,
				counterValue: D.value,
				dirty: a,
				class: [
					"v-select",
					{
						"v-select--active-menu": K.value,
						"v-select--chips": !!e.chips,
						[`v-select--${e.multiple ? "multiple" : "single"}`]: !0,
						"v-select--selected": E.value.length,
						"v-select--selection-slot": !!n.selection
					},
					e.class
				],
				style: e.style,
				inputmode: "none",
				placeholder: p,
				"onClick:clear": _e,
				"onMousedown:control": ye,
				onBlur: Ee,
				onKeydown: Se,
				onInputCapture: Pe,
				"aria-expanded": ie.value,
				"aria-controls": ae.value
			}), {
				...n,
				default: ({ id: a }) => Y(V, null, [
					A.value.map((t, n) => Y("input", {
						key: n,
						type: "hidden",
						name: e.name,
						value: t,
						form: e.form
					}, null)),
					Z(pt, s({
						id: re.value,
						ref: u,
						modelValue: K.value,
						"onUpdate:modelValue": (e) => K.value = e,
						activator: "parent",
						captureFocus: !1,
						openOnArrow: !1,
						disabled: te.value,
						_disableKeys: !0,
						eager: e.eager,
						maxHeight: 310,
						openOnClick: !1,
						closeOnContentClick: !1,
						transition: e.transition,
						onAfterEnter: Oe,
						onAfterLeave: ke
					}, oe.value, { contentClass: [
						"v-select__content",
						c.value,
						oe.value.contentClass
					] }), { default: () => [Z(ht, {
						onFocusin: Ae,
						onFocusout: je,
						onKeydown: be,
						onMousedown: Te
					}, { default: () => [
						n["menu-header"] && Y("header", { ref: m }, [n["menu-header"](_)]),
						r && Z(Ue, s({
							key: "select-list",
							ref: d,
							class: "v-list--navigable",
							selected: A.value,
							selectStrategy: e.multiple ? "independent" : "single-independent",
							tabindex: "-1",
							selectable: !!H.value.length,
							"aria-live": "polite",
							"aria-labelledby": `${a.value}-label`,
							"aria-multiselectable": e.multiple,
							color: e.itemColor ?? e.color
						}, se, e.listProps), { default: () => [
							n["prepend-item"]?.(),
							!H.value.length && !e.hideNoData && (n["no-data"]?.() ?? Z(He, {
								key: "no-data",
								title: i(e.noDataText)
							}, null)),
							Z(Tt, {
								ref: g,
								renderless: !0,
								items: H.value,
								itemKey: "value"
							}, { default: ({ item: t, index: r, itemRef: i }) => {
								let a = f(t.props), o = s(t.props, {
									ref: i,
									key: t.value,
									onClick: () => Q(t, null),
									"aria-posinset": r + 1,
									"aria-setsize": H.value.length
								});
								return t.type === "divider" ? n.divider?.({
									props: t.raw,
									index: r
								}) ?? Z(qe, s(t.props, {
									ref: i,
									key: `divider-${r}`
								}), null) : t.type === "subheader" ? n.subheader?.({
									props: t.raw,
									index: r
								}) ?? Z(ze, s(t.props, {
									ref: i,
									key: `subheader-${r}`
								}), null) : n.item?.({
									item: t.raw,
									internalItem: t,
									index: r,
									props: o
								}) ?? Z(He, s(o, { role: "option" }), {
									prepend: ({ isSelected: n }) => Y(V, null, [
										e.multiple && !e.hideSelected ? Z(ct, {
											key: t.value,
											modelValue: n,
											ripple: !1,
											tabindex: "-1",
											"aria-hidden": !0,
											onClick: (e) => e.preventDefault()
										}, null) : void 0,
										a.prependAvatar && Z($e, { image: a.prependAvatar }, null),
										a.prependIcon && Z(Je, { icon: a.prependIcon }, null)
									]),
									title: () => C.value ? Z(Gn, {
										text: t.title,
										matches: T(t)?.title,
										markClass: "v-select__mask",
										matchAll: !0,
										ignoreCase: !0
									}, null) : t.title
								});
							} }),
							n["append-item"]?.()
						] }),
						n["menu-footer"] && Y("footer", { ref: h }, [n["menu-footer"](_)])
					] })] }),
					E.value.map((r, i) => {
						function a(e) {
							e.stopPropagation(), e.preventDefault(), Q(r, !1);
						}
						let o = s(st.filterProps(r.props), {
							"onClick:close": a,
							onKeydown(e) {
								(e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), a(e));
							},
							onMousedown(e) {
								e.preventDefault(), e.stopPropagation();
							},
							modelValue: !0,
							"onUpdate:modelValue": void 0
						}), c = t ? !!n.chip : !!n.selection, l = c ? I(t ? n.chip({
							item: r.raw,
							internalItem: r,
							index: i,
							props: o
						}) : n.selection({
							item: r.raw,
							internalItem: r,
							index: i
						})) : void 0;
						if (!c || l) return Y("div", {
							key: r.value,
							class: "v-select__selection"
						}, [t ? n.chip ? Z(Ce, {
							key: "chip-defaults",
							defaults: { VChip: {
								closable: M.value,
								size: N.value?.size ?? "small",
								text: r.title
							} }
						}, { default: () => [l] }) : Z(st, s({
							key: "chip",
							closable: M.value,
							size: N.value?.size ?? "small",
							text: r.title,
							disabled: r.props.disabled
						}, o), null) : l ?? Y("span", { class: "v-select__selection-text" }, [r.title, e.multiple && i < E.value.length - 1 && Y("span", { class: "v-select__selection-comma" }, [ve(",")])])]);
					})
				]),
				"append-inner": (...t) => Y(V, null, [
					n["append-inner"]?.(...t),
					e.menuIcon ? Z(Je, {
						class: "v-select__menu-icon",
						color: l.value?.fieldIconColor,
						icon: e.menuIcon,
						"aria-hidden": !0
					}, null) : void 0,
					e.appendInnerIcon && Z(P, {
						key: "append-icon",
						name: "appendInner",
						color: t[0].iconColor.value
					}, null)
				])
			});
		}), it({
			isFocused: j,
			menu: K,
			search: C,
			filteredItems: w,
			select: Q
		}, l);
	}
});
//#endregion
export { ar as a, Zn as c, Gn as d, Tt as f, rr as i, Jn as l, pt as m, cr as n, er as o, ht as p, sr as r, $n as s, ur as t, qn as u };
