import { $n as e, A as t, An as n, At as r, Bt as i, C as a, E as o, Fn as s, Ft as c, G as l, Gn as u, Gt as d, H as f, Ht as p, It as m, Jn as h, Jt as g, K as _, Ln as v, Lt as y, Mn as b, Mt as x, Nn as S, Nt as C, O as w, Pt as T, Rn as E, Rt as D, T as O, Tn as k, Tt as A, U as j, Ut as M, Vn as N, Vt as P, W as F, Wt as I, Y as L, Yn as R, _ as z, ar as B, c as V, cr as H, dr as U, er as W, g as ee, gr as G, h as te, ir as ne, it as re, jn as ie, jt as ae, kt as oe, l as se, lt as ce, m as le, mn as ue, mr as de, nr as K, nt as fe, or as q, ot as pe, p as me, qt as he, rr as J, rt as ge, sr as _e, tt as ve, ur as Y, v as ye, vn as X, vt as be, wn as xe, wt as Se, yn as Z, zt as Q } from "./vuetify-C39-WP9g.js";
import { a as Ce, i as we, n as Te, r as Ee, t as De } from "./rounded-1DPtyqNn.js";
import { n as Oe, r as ke, t as Ae } from "./VOverlay-DFwN_aF6.js";
import { a as je, c as Me, l as Ne, n as Pe, s as Fe } from "./define-BovISfN4.js";
import { n as Ie } from "./ripple-BBz9XQtx.js";
import { i as Le, t as Re } from "./scopeId-3i3jaqkB.js";
import { a as ze, i as Be, n as Ve, o as He, t as Ue } from "./VList-BQKDUGEW.js";
import { t as We } from "./resizeObserver-4FxWWYaw.js";
import { i as Ge, s as Ke } from "./VLabel-B80IAw5H.js";
import { t as qe } from "./VDivider-CA-IOlps.js";
import { a as Je, i as Ye, r as Xe } from "./density-9WZgplEH.js";
import { t as Ze } from "./dialog-transition-eRX-4flf.js";
import { n as Qe } from "./transition-Cv515_M1.js";
import { t as $e } from "./VAvatar-DdB1q11O.js";
import { a as et, d as tt, o as nt, u as rt } from "./router-C0qlu-KG.js";
import { t as it } from "./forwardRefs-mn8VYMvs.js";
import { n as at, t as ot } from "./position-UZ3CZfcL.js";
import { t as st } from "./VChip-C-IhEdKW.js";
import { t as ct } from "./VCheckboxBtn-Z27PqfdZ.js";
import { n as lt, t as ut } from "./VTextField-DrXa6-zE.js";
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
	...be(Oe({
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
}, "VMenu"), pt = O()({
	name: "VMenu",
	props: ft(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let n = ee(e, "modelValue"), { scopeId: r } = Re(), { isRtl: i } = te(), a = u(), o = H(() => e.id || `v-menu-${a}`), c = J(), l = ie(ke, null), d = q(/* @__PURE__ */ new Map());
		N(ke, {
			register(e, t) {
				for (let [t, n] of [...d.value]) t !== e && n();
				d.value.set(e, t);
			},
			unregister(e) {
				d.value.delete(e);
			},
			closeParents(t) {
				let r = !t || c.value?.contentEl?._clickOutside?.lastMousedownWasOutside;
				setTimeout(() => {
					!d.value.size && !e.persistent && r && (n.value = !1, l?.closeParents(t));
				}, 40);
			},
			rootOpenedByHover: e.submenu && l ? l.rootOpenedByHover : () => c.value?.openedByHover ?? !1
		}), s(() => l?.unregister(a)), v(() => n.value = !1), h(n, (e) => {
			if (e) l?.register(a, () => {
				n.value = !1;
			});
			else {
				l?.unregister(a);
				for (let [, e] of [...d.value]) e();
			}
		}, { immediate: !0 });
		function f(t) {
			if (!e.disabled) {
				if (t.key === "Tab") {
					if (e.submenu && !e.retainFocus) {
						t.preventDefault(), n.value = !1, c.value?.activatorEl?.focus();
						return;
					}
					!re(fe(c.value?.contentEl, !1), t.shiftKey ? "prev" : "next", (e) => e.tabIndex >= 0) && !e.retainFocus && (n.value = !1);
				} else e.submenu && t.key === (i.value ? "ArrowRight" : "ArrowLeft") && (n.value = !1, c.value?.activatorEl?.focus());
			}
		}
		function p(e) {
			let t = c.value?.contentEl;
			if (!t || !n.value || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
			let r = fe(t), i = (e.key === "ArrowUp" ? r.at(-1) : r[0])?.getAttribute("role") ?? "", a = ["option", "listbox"].includes(i) && r.find((e) => e.getAttribute("role") === "option" && e.getAttribute("aria-selected") === "true" && e.offsetParent != null);
			a ? a.focus() : ve(t, e.key === "ArrowDown" ? "next" : "prev");
		}
		function m(t) {
			if (e.disabled || e._disableKeys || t.isComposing) return;
			let r = c.value?.contentEl;
			if (r && n.value) {
				if (t.key === "ArrowDown" || t.key === "ArrowUp") {
					if (!e.openOnArrow) return;
					t.preventDefault(), t.stopImmediatePropagation(), ve(r, t.key === "ArrowDown" ? "next" : "prev");
				} else e.submenu && (t.key === (i.value ? "ArrowRight" : "ArrowLeft") ? (n.value = !1, c.value?.activatorEl?.focus()) : t.key === (i.value ? "ArrowLeft" : "ArrowRight") && (t.preventDefault(), ve(r, "first")));
			} else (e.submenu ? t.key === (i.value ? "ArrowLeft" : "ArrowRight") : e.openOnArrow && ["ArrowDown", "ArrowUp"].includes(t.key)) && (n.value = !0, t.preventDefault(), g(t));
		}
		function g(e, t = 1) {
			if (!n.value) return;
			let r = c.value?.contentEl;
			r?.contains(ge()) || r && fe(r).length && (["ArrowUp", "ArrowDown"].includes(e.key) ? p(e) : m(e), r.contains(ge())) || t <= 10 && requestAnimationFrame(() => g(e, t + 1));
		}
		let _ = X(() => b({
			"aria-haspopup": "menu",
			"aria-expanded": String(n.value),
			"aria-controls": o.value,
			"aria-owns": o.value,
			onKeydown: m
		}, e.activatorProps));
		return Me(() => {
			let i = Ae.filterProps(e);
			return k(Ae, b({
				ref: c,
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
				default: (...e) => k(Ce, { root: "VMenu" }, { default: () => [t.default?.(...e)] })
			});
		}), it({
			id: o,
			ΨopenChildren: d
		}, c);
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
	...V()
}, "VSheet"), ht = O()({
	name: "VSheet",
	props: mt(),
	setup(e, { slots: t }) {
		let { themeClasses: n } = se(e), { backgroundColorClasses: r, backgroundColorStyles: i } = je(() => e.color), { borderClasses: a } = tt(e), { dimensionStyles: o } = Ye(e), { elevationClasses: s } = nt(e), { locationStyles: c } = we(e), { positionClasses: l } = at(e), { roundedClasses: u, roundedStyles: d } = Te(e);
		return Me(() => k(e.tag, {
			class: de([
				"v-sheet",
				n.value,
				r.value,
				a.value,
				s.value,
				l.value,
				u.value,
				e.class
			]),
			style: G([
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
}, "VVirtualScrollItem"), _t = O()({
	name: "VVirtualScrollItem",
	inheritAttrs: !1,
	props: gt(),
	emits: { "update:height": (e) => !0 },
	setup(e, { attrs: t, emit: n, slots: r }) {
		let { resizeRef: i, contentRect: a } = We(void 0, "border");
		h(() => a.value?.height, (e) => {
			e != null && n("update:height", e);
		}), Me(() => e.renderless ? Z(ue, null, [r.default?.({ itemRef: i })]) : Z("div", b({
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
	let n = me(), r = q(0);
	R(() => {
		r.value = parseFloat(e.itemHeight || 0);
	});
	let i = q(0), a = q(Math.ceil((parseInt(e.height) || n.height.value) / (r.value || 16)) || 1), o = q(0), s = q(0), c = J(), l = J(), u = 0, { resizeRef: d, contentRect: f } = We();
	R(() => {
		d.value = c.value;
	});
	let p = X(() => c.value === document.documentElement ? n.height.value : f.value?.height || parseInt(e.height) || 0), m = X(() => !!(c.value && l.value && p.value && r.value)), g = Array.from({ length: t.value.length }), v = Array.from({ length: t.value.length }), y = /* @__PURE__ */ new Map(), b = q(0), x = -1, C = "start", w = 0;
	function T(e) {
		return g[e] || r.value;
	}
	let E = _(() => {
		let e = performance.now();
		v[0] = 0;
		let n = t.value.length;
		for (let e = 1; e <= n; e++) v[e] = (v[e - 1] || 0) + T(e - 1);
		b.value = Math.max(b.value, performance.now() - e), H();
	}, b), D = h(m, (e) => {
		e && (D(), u = l.value.offsetTop, E.immediate(), H(), ~x && S(() => {
			A && window.requestAnimationFrame(() => {
				~x && G(x, C);
			});
		}));
	});
	W(() => {
		E.clear();
	});
	function O() {
		let e = 0;
		for (let t of y.values()) e += t;
		let t = 0;
		for (let n of [...y.keys()].sort((e, t) => e - t)) if (t += y.get(n), t * 2 >= e) return n;
		return r.value;
	}
	function k(e, t) {
		let n = g[e], i = r.value;
		if (t > 0) {
			if (n) {
				let e = y.get(n) - 1;
				e ? y.set(n, e) : y.delete(n);
			}
			y.set(t, (y.get(t) ?? 0) + 1), r.value = O();
		}
		(n !== t || i !== r.value) && (g[e] = t, E());
	}
	function j(e) {
		e = F(e, 0, t.value.length);
		let n = Math.floor(e), r = e % 1, i = n + 1, a = v[n] || 0;
		return a + ((v[i] || a) - a) * r;
	}
	function M(e) {
		return Ct(v, e);
	}
	let N = 0, P = 0, I = 0;
	h(p, (e, t) => {
		H(), e < t && requestAnimationFrame(() => {
			P = 0, H();
		});
	});
	let L = -1;
	function z() {
		if (!c.value || !l.value) return;
		let e = c.value.scrollTop, t = performance.now();
		t - I > 500 ? (P = Math.sign(e - N), u = l.value.offsetTop) : P = e - N, N = e, I = t, window.clearTimeout(L), L = window.setTimeout(B, 500), H();
	}
	function B() {
		c.value && l.value && (P = 0, I = 0, window.clearTimeout(L), H());
	}
	let V = -1;
	function H() {
		cancelAnimationFrame(V), V = requestAnimationFrame(U);
	}
	function U() {
		if (!c.value || !p.value || !r.value) return;
		let e = N - u, n = Math.sign(P), l = Math.max(0, e - bt), d = F(M(l), 0, t.value.length), f = e + p.value + bt, m = F(M(f) + 1, d + 1, t.value.length);
		if ((n !== vt || d < i.value) && (n !== yt || m > a.value)) {
			let e = j(i.value) - j(d), n = j(m) - j(a.value);
			Math.max(e, n) > bt ? (i.value = d, a.value = m) : (d <= 0 && (i.value = d), m >= t.value.length && (a.value = m, i.value = d));
		}
		o.value = j(i.value), s.value = j(t.value.length) - j(a.value);
	}
	function ee(e, t) {
		let n = j(e);
		if (t === "center") return Math.max(0, n - p.value / 2 + T(e) / 2);
		if (t === "end") {
			let t = c.value?.clientHeight || p.value;
			return Math.max(0, n + u - t + T(e));
		}
		return n;
	}
	function G(e, n = "start") {
		x !== e && (w = 0);
		let l = j(e);
		if (!c.value || e && !l) {
			x = e, C = n;
			return;
		}
		let u = r.value || 16, d = Math.ceil(bt / u), f = Math.max(1, Math.ceil((p.value || 0) / u)), m = n === "center" ? Math.ceil(f / 2) : n === "end" ? f : 0;
		i.value = F(e - m - d, 0, Math.max(0, t.value.length - 1)), a.value = F(e - m + f + d, i.value + 1, t.value.length), o.value = j(i.value), s.value = j(t.value.length) - j(a.value), P = 0, I = 0, x = e, C = n, S(() => {
			let t = c.value;
			if (!t || !~x || x !== e) return;
			let r = ee(e, n);
			t.scrollTop = r, N = t.scrollTop, e && t.scrollTop < r - 1 && t.scrollHeight > w ? (w = t.scrollHeight, A && requestAnimationFrame(() => {
				x === e && G(e, n);
			})) : (x = -1, C = "start", H());
		});
	}
	let te = X(() => t.value.slice(i.value, a.value).map((t, n) => {
		let r = n + i.value;
		return {
			raw: t,
			index: r,
			key: pe(t, e.itemKey, r)
		};
	}));
	return h(t, () => {
		g = Array.from({ length: t.value.length }), v = Array.from({ length: t.value.length }), y = /* @__PURE__ */ new Map(), E.immediate(), H();
	}, { deep: 1 }), {
		calculateVisibleItems: H,
		containerRef: c,
		markerRef: l,
		computedItems: te,
		paddingTop: o,
		paddingBottom: s,
		scrollToIndex: G,
		handleScroll: z,
		handleScrollend: B,
		handleItemResize: k
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
}, "VVirtualScroll"), Tt = O()({
	name: "VVirtualScroll",
	props: wt(),
	setup(e, { slots: t }) {
		let n = w("VVirtualScroll"), { dimensionStyles: r } = Ye(e), { calculateVisibleItems: i, containerRef: a, markerRef: o, handleScroll: s, handleScrollend: c, handleItemResize: u, scrollToIndex: d, paddingTop: f, paddingBottom: p, computedItems: m } = St(e, H(() => e.items));
		return z(() => e.renderless, () => {
			function e(e = !1) {
				let t = e ? "addEventListener" : "removeEventListener";
				A && (a.value === document.documentElement ? (document[t]("scroll", s, { passive: !0 }), document[t]("scrollend", c)) : (a.value?.[t]("scroll", s, { passive: !0 }), a.value?.[t]("scrollend", c)));
			}
			E(() => {
				a.value = Le(n.vnode.el, !0), e(!0);
			}), W(e);
		}), Me(() => {
			let n = m.value.map((n) => k(_t, {
				key: n.key,
				renderless: e.renderless,
				"onUpdate:height": (e) => u(n.index, e)
			}, { default: (e) => t.default?.({
				item: n.raw,
				index: n.index,
				...e
			}) }));
			return e.renderless ? Z(ue, null, [
				Z("div", {
					ref: o,
					class: "v-virtual-scroll__spacer",
					style: { paddingTop: l(f.value) }
				}, null),
				n,
				Z("div", {
					class: "v-virtual-scroll__spacer",
					style: { paddingBottom: l(p.value) }
				}, null)
			]) : Z("div", {
				ref: a,
				class: de(["v-virtual-scroll", e.class]),
				onScrollPassive: s,
				onScrollend: c,
				style: G([r.value, e.style])
			}, [Z("div", {
				ref: o,
				class: "v-virtual-scroll__container",
				style: {
					paddingTop: l(f.value),
					paddingBottom: l(p.value)
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
	let n = ie(e, t);
	if (/* @__PURE__ */ I(n)) throw new r(`Context "${String(e)}" not found. Ensure it's provided by an ancestor.`, {
		code: "V0_CONTEXT_MISSING",
		key: e
	});
	return n;
}
function Dt(e, t, n) {
	return n ? n.provide(e, t) : N(e, t), t;
}
function Ot(e, t) {
	if (/* @__PURE__ */ p(e) || /* @__PURE__ */ M(e)) {
		let n = e;
		function r(e, t) {
			return Dt(n, e, t);
		}
		function i() {
			return Et(n, t);
		}
		return [i, r];
	}
	let n = /* @__PURE__ */ P(e) ? e.suffix : void 0;
	function r(e, t, r) {
		return Dt(n ? `${e}:${n}` : e, t, r);
	}
	function i(e, t) {
		return Et(n ? `${e}:${n}` : e, t);
	}
	return [i, r];
}
function kt(e, t, n) {
	if (/* @__PURE__ */ p(e)) {
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
function Ft(e, t, r) {
	function i(n = {}) {
		let { namespace: r = e, persist: i, ...a } = n;
		return kt(r, t(a));
	}
	function a(t = {}) {
		let { namespace: n = e, persist: a, ...o } = t, s;
		return Mt({
			namespace: n,
			provide: (e) => {
				let [, t, c] = i({
					...o,
					namespace: n
				});
				if (s = c, t(s, e), a && r?.restore) {
					let e = Pt(), t = Nt(n), i = e.get(t);
					/* @__PURE__ */ Q(i.value) || r.restore(s, i.value);
				}
			},
			setup: r?.setup || a ? (e) => {
				let t = s;
				if (r?.setup?.(t, e, o), a && r?.persist) {
					let i = Pt(), a = Nt(n), o = i.get(a), s = h(() => r.persist(t), (e) => {
						o.value = e;
					});
					e.onUnmount(s);
				}
			} : void 0
		});
	}
	function o(t = e) {
		if (r?.fallback) {
			if (!n()) return r.fallback(t);
			let e = ie(t, void 0);
			return /* @__PURE__ */ I(e) ? r.fallback(t) : e;
		}
		return Et(t);
	}
	return [
		i,
		a,
		o
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
	return /* @__PURE__ */ I(e) || !e.trim() ? t : Wt(t, e);
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createRegistry-COW_AjH1.mjs
function Kt(e) {
	let t = Gt(), n = e?.events ?? !1, r = e?.reactive ?? !1, i = r ? ne(/* @__PURE__ */ new Map()) : /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new WeakSet(), u = [], d = q(0), f = 0, p = !1, m = Infinity, h = -Infinity, _ = !1, v = !1, y = [];
	function b(e, t) {
		let n = c.get(e);
		if (n) for (let e of n) e(t);
	}
	function x(e, t = void 0) {
		if (n) {
			if (_) {
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
		c.clear(), F();
	}
	function T(e) {
		return i.get(e);
	}
	function E(e, t = {}, n) {
		p && z();
		let r = T(e);
		if (!r) return B({
			...t,
			id: e
		});
		let a = Object.hasOwn(t, "value"), o = r.value, c = r.valueIsIndex;
		return a && (/* @__PURE__ */ I(t.value) ? (o = r.index, c = !0) : (o = t.value, c = !1), c !== r.valueIsIndex && (c ? f++ : f--), Object.is(o, r.value) || (j(r.value, e), A(o, e))), Object.assign(r, t, {
			id: e,
			index: r.index,
			value: o,
			valueIsIndex: c
		}), i.set(e, r), s.clear(), x("update:ticket", r), n && x(n, r), r;
	}
	function D(e) {
		p && z();
		let t = a.get(e);
		return t ? t.slice() : void 0;
	}
	function O(e) {
		return p && z(), o.get(e);
	}
	function k(e) {
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
		if (!/* @__PURE__ */ I(e)) return e;
		let t = u.map((e) => e.id);
		return s.set("keys", t), t;
	}
	function N() {
		r && d.value;
		let e = s.get("values");
		if (!/* @__PURE__ */ I(e)) return e;
		let t = u.slice();
		return s.set("values", t), t;
	}
	function P() {
		r && d.value;
		let e = s.get("entries");
		if (!/* @__PURE__ */ I(e)) return e;
		let t = u.map((e) => [e.id, e]);
		return s.set("entries", t), t;
	}
	function F() {
		u.length = 0, i.clear(), a.clear(), o.clear(), L(), f = 0, p = !1, m = Infinity, h = -Infinity, x("clear:registry");
	}
	function L() {
		if (s.clear(), _) {
			v = !0;
			return;
		}
		d.value++;
	}
	function R(e) {
		if (_) return e();
		_ = !0, v = !1, y = [];
		try {
			return e();
		} finally {
			_ = !1;
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
		let n = i.size, a = /* @__PURE__ */ Q(e.id), s = e.id ?? /* @__PURE__ */ g();
		if (k(s)) return t.warn(`Ticket "${s}" already exists. Use \`upsert()\` to update or check \`has()\` before registering.`), T(s);
		let c = /* @__PURE__ */ I(e.value), d = n, m = c ? d : e.value, h = e.valueIsIndex ?? c;
		h && f++;
		let _ = {
			unregister: () => V(s),
			...e,
			id: s,
			index: d,
			value: m,
			valueIsIndex: h
		}, v = r ? ne(_) : _;
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
	function U(e) {
		let t = { ...e };
		return delete t.index, delete t.valueIsIndex, delete t.unregister, l.has(e) && delete t.id, e.valueIsIndex && delete t.value, t;
	}
	function W(e) {
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
		}), t.map((e) => U(e)));
	}
	function ee(e, t) {
		p && z();
		let n = i.get(e);
		if (!n) return;
		let r = i.size, a = /* @__PURE__ */ ae(t, 0, r - 1), o = n.index;
		return o === a ? n : R(() => (u.splice(o, 1), u.splice(a, 0, n), m = Math.min(o, a), h = Math.max(o, a), z(), x("update:ticket", n), n));
	}
	function G(e) {
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
	function te(e = "first", t, n) {
		if (i.size === 0) return;
		p && z();
		let r = u.length;
		if (!n && /* @__PURE__ */ I(t)) return e === "first" ? u[0] : u.at(-1);
		let a = /* @__PURE__ */ I(t) ? void 0 : /* @__PURE__ */ ae(t, 0, r - 1);
		if (e === "last") {
			let e = /* @__PURE__ */ I(a) ? r - 1 : a;
			for (let t = e; t >= 0; t--) {
				let e = u[t];
				if (!n || n(e)) return e;
			}
		} else {
			let e = /* @__PURE__ */ I(a) ? 0 : a;
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
		has: k,
		keys: M,
		clear: F,
		browse: D,
		entries: P,
		values: N,
		lookup: O,
		get: T,
		upsert: E,
		register: B,
		unregister: V,
		reindex: z,
		move: ee,
		reorder: G,
		seek: te,
		batch: R,
		onboard: H,
		offboard: W,
		get size() {
			return i.size;
		}
	};
}
//#endregion
//#region node_modules/@vuetify/v0/dist/createSelection-DQNMDMJj.mjs
function qt(t = {}) {
	let { disabled: n = !1, enroll: r = !0, multiple: i = !1, ...a } = t, o = Kt(a), s = ne(/* @__PURE__ */ new Set()), c = X(() => new Set(/* @__PURE__ */ he(s, o.get))), l = X(() => {
		let e = /* @__PURE__ */ new Set();
		for (let t of c.value) e.add(Y(t.value));
		return e;
	});
	function u(e) {
		if (Y(n)) return;
		let t = o.get(e);
		t && !Y(t.disabled) && (Y(i) || s.clear(), s.add(e));
	}
	function d(e) {
		if (Y(n)) return;
		let t = o.get(e);
		t && !Y(t.disabled) && s.delete(e);
	}
	function f(e) {
		Y(n) || (p(e) ? d(e) : u(e));
	}
	function p(e) {
		return s.has(e);
	}
	function m(t, n) {
		let r = t[0], a = !1;
		for (let t of s) {
			let n = o.get(t);
			n && e(n.value) && (/* @__PURE__ */ I(r) || (n.value.value = r), a = !0);
		}
		if (a || (Y(i) || s.clear(), /* @__PURE__ */ I(r))) return;
		let c = o.browse(_e(r))?.values().next().value;
		/* @__PURE__ */ I(c) || u(c);
	}
	function h(e = {}) {
		let t = e.id ?? /* @__PURE__ */ g(), i = {
			disabled: !1,
			unregister: () => _(t),
			...e,
			isSelected: H(() => p(t)),
			id: t
		}, a = o.register(i);
		return Y(r) && !Y(n) && !Y(a.disabled) && u(t), a;
	}
	function _(e) {
		s.delete(e), o.unregister(e);
	}
	function v(e) {
		return o.batch(() => e.map((e) => h(e)));
	}
	function y(e) {
		for (let t of e) s.delete(t);
		return o.offboard(e);
	}
	function b() {
		s.clear();
	}
	function x() {
		b(), o.clear();
	}
	function S() {
		b(), o.dispose();
	}
	return {
		...o,
		disabled: n,
		selectedIds: s,
		selectedItems: c,
		selectedValues: l,
		register: h,
		onboard: v,
		unregister: _,
		offboard: y,
		clear: x,
		dispose: S,
		reset: b,
		select: u,
		unselect: d,
		toggle: f,
		selected: p,
		apply: m,
		get size() {
			return o.size;
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
		return a.seek(e, t, (e) => !Y(e.disabled));
	}
	function s() {
		if (!Y(n) || a.size === 0 || a.selectedIds.size > 0) return;
		let e = o("first");
		e && a.select(e.id);
	}
	function c(e) {
		Y(a.disabled) || Y(n) && a.selectedIds.size === 1 || a.selectedIds.delete(e);
	}
	function l(e) {
		if (Y(a.disabled)) return;
		let t = a.get(e);
		t && !Y(t.disabled) && c(e);
	}
	function u(e) {
		Y(a.disabled) || (a.selectedIds.has(e) ? l(e) : a.select(e));
	}
	function d(e, t) {
		let i = t?.multiple ?? Y(r), o = new Set(a.selectedIds), s = /* @__PURE__ */ new Set();
		if (i) {
			for (let t of e) {
				let e = a.browse(_e(t));
				if (!/* @__PURE__ */ I(e)) for (let t of e) {
					let e = a.get(t);
					e && !Y(e.disabled) && s.add(t);
				}
			}
			if (Y(n) && s.size === 0) return;
			for (let e of o) s.has(e) || a.selectedIds.delete(e);
			for (let e of s) a.selectedIds.add(e);
		} else {
			for (let t of e) {
				let e = a.browse(_e(t));
				if (!/* @__PURE__ */ I(e)) for (let t of e) s.add(t);
			}
			let t = s.values().next().value, n = o.values().next().value;
			/* @__PURE__ */ I(n) || c(n), /* @__PURE__ */ I(t) || a.select(t);
		}
	}
	function f(e = {}) {
		let r = e.id ?? /* @__PURE__ */ g(), i = {
			select: () => a.select(r),
			unselect: () => l(r),
			toggle: () => u(r),
			...e,
			id: r
		}, o = a.register(i);
		return Y(t) && !Y(a.disabled) && !Y(o.disabled) && a.select(o.id), Y(n) === "force" && s(), o;
	}
	function p(e) {
		let t = a.batch(() => e.map((e) => f(e)));
		return Y(n) === "force" && s(), t;
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
	}), i = H(() => r.selectedIds.values().next().value), a = H(() => r.selectedItems.value.values().next().value), o = H(() => a.value?.index ?? -1), s = H(() => a.value?.value);
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
		return /* @__PURE__ */ p(e) && e.length > 2 && e[0] === "{" && e.at(-1) === "}";
	}
	function s(e) {
		return /* @__PURE__ */ P(e) && "$value" in e;
	}
	function c(e, t = /* @__PURE__ */ new Set()) {
		let a = /* @__PURE__ */ p(e) ? e : JSON.stringify(e);
		if (i.has(a)) return i.get(a);
		let l = s(e) ? e.$value : e, u = /* @__PURE__ */ p(l) && o(l);
		if (s(e) && !u) return i.set(a, l), l;
		let d = u ? l.slice(1, -1) : String(l);
		if (t.has(d)) {
			n.warn(`Circular alias detected for "${d}"`), i.set(a, void 0);
			return;
		}
		t.add(d);
		let f = r.get(d), m = [];
		if (!f && d.includes(".")) {
			let e = d.split(".");
			for (let t = e.length - 1; t > 0; t--) {
				let n = e.slice(0, t).join("."), i = e.slice(t), a = r.get(n);
				if (!/* @__PURE__ */ I(a?.value)) {
					f = a, m = i;
					break;
				}
			}
		}
		if (/* @__PURE__ */ I(f?.value)) {
			u && n.warn(`Alias not found for "${String(l)}"`), i.set(a, void 0);
			return;
		}
		let h = f.value;
		if (m.length > 0) {
			s(h) && (h = h.$value);
			for (let e of m) {
				if (!/* @__PURE__ */ P(h) || oe.has(e) || !Object.prototype.hasOwnProperty.call(h, e)) {
					h = void 0;
					break;
				}
				h = h[e], s(h) && (h = h.$value);
			}
			if (/* @__PURE__ */ I(h)) {
				n.warn(`Path not found inside "${d}": ${m.join(".")}`), i.set(a, void 0);
				return;
			}
		} else s(h) && (h = h.$value);
		let g = /* @__PURE__ */ p(h) && o(h) ? c(h, t) : h;
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
			if (!/* @__PURE__ */ P(o)) {
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
				if (/* @__PURE__ */ P(e) && !n) for (let t in e) {
					if (!Object.hasOwn(e, t) || oe.has(t) || t.startsWith("$")) continue;
					let a = e[t], o = `${s}.${t}`;
					/* @__PURE__ */ P(a) ? "$value" in a ? r.push({
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
	return /* @__PURE__ */ Q(e) ? [] : /* @__PURE__ */ c(e) ? e : [e];
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
	let s = h(() => [
		Y(e),
		Y(t),
		U(n),
		Y(r)
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
	return W(c, !0), c;
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
		if (!e.SAFE_IDENT.test(t)) throw new r(`Invalid theme prefix: "${t}". Expected an identifier matching ${e.SAFE_IDENT}.`, {
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
		return /* @__PURE__ */ I(n) || (r += `:root {\n  color-scheme: ${n ? "dark" : "light"};\n}\n`), r;
	}
	decompose(e) {
		let { r: t, g: n, b: r, a: i } = /* @__PURE__ */ T(e);
		return /* @__PURE__ */ I(i) ? `${t}, ${n}, ${r}` : `${t}, ${n}, ${r}, ${i}`;
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
			let r = h([t.colors, t.isDark], ([e, t]) => {
				this.update(e, t);
			});
			if (/* @__PURE__ */ D(n)) {
				this.dispose = () => {
					r(), this.detach();
				};
				return;
			}
			let i = n instanceof HTMLElement ? n : /* @__PURE__ */ p(n) ? document.querySelector(n) : e._container || document.querySelector("#app") || document.body;
			if (!i) {
				this.dispose = () => {
					r(), this.detach();
				};
				return;
			}
			t.selectedId.value && (i.dataset.theme = String(t.selectedId.value));
			let a = h(t.selectedId, (e) => {
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
				}), i = h([
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
	let e = q(!1), t = q(!1);
	function n() {
		e.value = !0;
	}
	function r() {
		t.value = !0;
	}
	return {
		isHydrated: B(e),
		isSettled: B(t),
		hydrate: n,
		settle: r
	};
}
function an() {
	return {
		isHydrated: B(q(!0)),
		isSettled: B(q(!0)),
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
			return S().then(() => {
				e.hydrate(), S().then(() => e.settle());
			}), t.mount = n, i;
		};
	}
});
function ln(e) {
	let t = H(() => Y(e)), n = Y(e), r = $ && dt ? window.matchMedia(n) : null, i = q(r?.matches ?? !1), a = q(r), o = cn(), s = null;
	function c() {
		if (!$ || !dt) return;
		s?.(), s = null;
		let e = window.matchMedia(t.value);
		a.value = e, i.value = e.matches;
		function n(e) {
			i.value = e.matches;
		}
		e.addEventListener("change", n), s = () => e.removeEventListener("change", n);
	}
	let l = h([t, () => o.isHydrated.value], ([e, t]) => {
		t && c();
	}, { immediate: !0 });
	function u() {
		l(), s?.(), s = null;
	}
	return W(u, !0), {
		matches: B(i),
		query: t,
		mediaQueryList: B(a),
		stop: u
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
		S({
			id: e,
			value: n,
			...r
		});
	}
	let l = pn(i, s, c), u = q(!!l);
	!l && a.default && !s.selectedId.value && s.select(a.default);
	let d = H(() => s.keys()), f = X(() => {
		let e = {}, t = s.selectedId.value;
		for (let n of s.values()) {
			if (n.lazy && n.id !== t) continue;
			let i = x(n.value);
			if (r) for (let [e, t] of Object.entries(i)) {
				let n = `on-${e}`;
				!e.startsWith("on-") && !(n in i) && (i[n] = /* @__PURE__ */ C(t));
			}
			e[n.id] = i;
		}
		return e;
	}), p = H(() => s.selectedItem.value?.dark ?? !1), m = H(() => u.value), g = l ? un() : void 0;
	function _() {
		if (!l || !g) return;
		let e = g.matches.value ? l.dark : l.light;
		s.has(e) && s.select(e);
	}
	l && ($ ? _() : a.default && !s.selectedId.value && s.select(a.default), h(() => g.matches.value, () => {
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
	function S(e = {}) {
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
		return s.batch(() => e.map((e) => S(e)));
	}
	return {
		...s,
		colors: f,
		isDark: p,
		isSystem: m,
		select: v,
		reset: y,
		register: S,
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
		colors: X(() => ({})),
		isDark: q(!1),
		isSystem: q(!1),
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
		(/* @__PURE__ */ p(t) || /* @__PURE__ */ i(t)) && e.select(t);
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
	let r = Y(e), i = Y(t), a = Y(n.matches), o = Y(n.matchAll) ?? !1, s = Y(n.ignoreCase) ?? !1, c = Y(n.ignoreAccents) ?? !1;
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
	let { ssr: t, ...n } = e, r = Cn(), { mobileBreakpoint: a, breakpoints: o } = /* @__PURE__ */ d(r, n), s = Object.entries(o).toSorted((e, t) => e[1] - t[1]), c = s.map(([e]) => e), l = /* @__PURE__ */ i(a) ? a : o[a] ?? o.md, u = t ? t.clientWidth : $ ? window.innerWidth : 0, f = t ? t.clientHeight ?? 0 : $ ? window.innerHeight : 0, p = q("xs"), m = q(u), h = q(f), g = q(!1), _ = q(!1), v = q(!1), y = q(!1), b = q(!1), x = q(!1), S = q(!1), C = q(!1), w = q(!1), T = q(!1), E = q(!1), D = q(!1), O = q(!1), k = q(!1), A = q(!1);
	function j(e, t) {
		let n = "xs";
		for (let r = s.length - 1; r >= 0; r--) {
			let i = s[r][1];
			if (t ? window.matchMedia(`(min-width: ${i}px)`).matches : e >= i) {
				n = s[r][0];
				break;
			}
		}
		let r = c.indexOf(n), o = /* @__PURE__ */ i(l) ? t ? !window.matchMedia(`(min-width: ${l}px)`).matches : e < l : r < c.indexOf(a);
		return {
			current: n,
			index: r,
			mobile: o
		};
	}
	function M({ current: e, mobile: t }) {
		let n = Sn.indexOf(e);
		p.value = e, g.value = t, _.value = e === "xs", v.value = e === "sm", y.value = e === "md", b.value = e === "lg", x.value = e === "xl", S.value = e === "xxl", C.value = n >= 1, w.value = n >= 2, T.value = n >= 3, E.value = n >= 4, D.value = n <= 1, O.value = n <= 2, k.value = n <= 3, A.value = n <= 4;
	}
	M(j(u, !t && $ && dt));
	let N = !1;
	function P() {
		!N && $ && (N = !0, en("resize", () => {
			F();
		}, { passive: !0 }));
	}
	function F() {
		$ && (P(), m.value = window.innerWidth, h.value = window.innerHeight, M(j(m.value, dt)));
	}
	return t || P(), {
		breakpoints: o,
		mobileBreakpoint: a,
		name: K(p),
		width: K(m),
		height: K(h),
		isMobile: K(g),
		xs: K(_),
		sm: K(v),
		md: K(y),
		lg: K(b),
		xl: K(x),
		xxl: K(S),
		smAndUp: K(C),
		mdAndUp: K(w),
		lgAndUp: K(T),
		xlAndUp: K(E),
		smAndDown: K(D),
		mdAndDown: K(O),
		lgAndDown: K(k),
		xlAndDown: K(A),
		ssr: !!t,
		update: F
	};
}
function Tn(e = {}) {
	if (e.ssr) return wn(e);
	let t = Cn();
	return {
		breakpoints: t.breakpoints,
		mobileBreakpoint: t.mobileBreakpoint,
		name: K(q("xs")),
		width: K(q(0)),
		height: K(q(0)),
		isMobile: K(q(!0)),
		xs: K(q(!0)),
		sm: K(q(!1)),
		md: K(q(!1)),
		lg: K(q(!1)),
		xl: K(q(!1)),
		xxl: K(q(!1)),
		smAndUp: K(q(!1)),
		mdAndUp: K(q(!1)),
		lgAndUp: K(q(!1)),
		xlAndUp: K(q(!1)),
		smAndDown: K(q(!0)),
		mdAndDown: K(q(!0)),
		lgAndDown: K(q(!0)),
		xlAndDown: K(q(!0)),
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
			e(t.isReduced.value), this.dispose = h(t.isReduced, e);
		} else {
			let n = e._context?.provides?.usehead ?? e._context?.provides?.head;
			if (n?.push) {
				let e = n.push({ bodyAttrs: { "data-reduced-motion": An(t.isReduced.value) } }), r = h(t.isReduced, (t) => e.patch?.({ bodyAttrs: { "data-reduced-motion": An(t) } }));
				this.dispose = () => {
					r(), e.dispose?.();
				};
			}
		}
	}
};
function Mn(e = {}) {
	let t = q(e.mode ?? "system"), n = dn(), r = H(() => t.value === "always" || t.value !== "never" && n.matches.value);
	function i(e) {
		t.value = e;
	}
	return {
		selectedMode: B(t),
		isReduced: r,
		select: i,
		dispose: n.stop
	};
}
function Nn() {
	return {
		selectedMode: B(q("system")),
		isReduced: B(q(!1)),
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
			if (/* @__PURE__ */ D(n)) return;
			let e = n instanceof HTMLElement ? n : /* @__PURE__ */ p(n) ? document.querySelector(n) : document.documentElement;
			if (!e) return;
			e.dir = t.isRtl.value ? "rtl" : "ltr", this.dispose = h(t.isRtl, (t) => {
				e.dir = t ? "rtl" : "ltr";
			});
		} else {
			let n = e._context?.provides?.usehead ?? e._context?.provides?.head;
			if (n?.push) {
				let e = n.push({ htmlAttrs: { dir: t.isRtl.value ? "rtl" : "ltr" } }), r = h(t.isRtl, (t) => e.patch?.({ htmlAttrs: { dir: t ? "rtl" : "ltr" } }));
				this.dispose = () => {
					r(), e.dispose?.();
				};
			}
		}
	}
};
function zn(e = {}) {
	let t = q(e.default ?? !1);
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
		isRtl: q(!1),
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
		/* @__PURE__ */ m(t) && (e.isRtl.value = t);
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
}, "VHighlight"), Gn = a({
	name: "VHighlight",
	props: Wn(),
	setup(e) {
		let t = X(() => /* @__PURE__ */ xn(() => e.text, () => e.query, {
			matches: () => e.matches,
			matchAll: () => e.matchAll,
			ignoreCase: () => e.ignoreCase,
			ignoreAccents: () => e.ignoreAccents ?? !1
		})), { textColorClasses: n, textColorStyles: r } = Fe(() => e.color);
		return () => k(e.tag, { class: "v-highlight" }, { default: () => [t.value.map((t, i) => t.match ? Z("mark", {
			key: i,
			class: de([
				"v-highlight__mark",
				n.value,
				e.markClass
			]),
			style: G([r.value, { "--v-highlight-opacity": e.opacity }])
		}, [t.text]) : Z("span", { key: i }, [t.text]))] });
	}
}), Kn = 1e3;
function qn(e, t) {
	let n = null, r = -1;
	function i(t) {
		return Y(e).find((e) => e.title === t || e.value === t);
	}
	h(() => Y(e), () => {
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
			((r && fe(r)[0]) ?? n())?.focus({ preventScroll: !0 });
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
	let a = q(!1), o, s = 0, c = null;
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
				let t = h(a, () => {
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
	async function p(e, t = !0, r = "center") {
		if (e < 0) return !1;
		if (!t) {
			let t = f(e);
			return t?.focus({ preventScroll: !0 }), !!t;
		}
		let i = ++s, a = d();
		a?.contains(ge()) && a.focus({ preventScroll: !0 }), n.value?.scrollToIndex(e, r);
		let o = f(e), c = performance.now() + 500;
		for (; !o && performance.now() < c;) {
			if (await new Promise((e) => requestAnimationFrame(e)), i !== s) return !0;
			o = f(e);
		}
		return o?.focus({ preventScroll: !0 }), o && a && m(a, o, r), !!o;
	}
	function m(e, t, n) {
		let r = e.getBoundingClientRect().top + e.clientTop, i = e.clientHeight, { top: a, height: o } = t.getBoundingClientRect(), s = n === "start" ? a - r : n === "end" ? a + o - (r + i) : a + o / 2 - (r + i / 2);
		Math.abs(s) > 1 && (e.scrollTop += s);
	}
	async function g() {
		await p(Xn(Y(r), 0, 1)) || e.value?.focus("first");
	}
	async function _() {
		let t = Y(r);
		await p(Xn(t, t.length - 1, -1)) || e.value?.focus("last");
	}
	async function v(e, t = !1) {
		if (!Y(i.noAutoScroll)) {
			let n = i.selectedIndex?.() ?? -1;
			if (n >= 0) {
				let i = t ? n : Xn(Y(r), n + e, e);
				return await p(i, !1) || p(i);
			}
		}
		if (e === 1) {
			let e = i.headerEl?.(), t = e && fe(e)[0];
			if (t) return t.focus();
		}
		if (Xn(Y(r), 0, 1) < 0) {
			let t = i.menuContentEl?.(), n = t ? fe(t) : [];
			return (e === 1 ? n[0] : n.at(-1))?.focus();
		}
		return e === 1 ? g() : _();
	}
	function y(e, t) {
		let n = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : null;
		if (!n) return !1;
		let r = t.value;
		return t.value = !0, d()?.contains(ge()) ? !1 : r ? (e.stopImmediatePropagation(), v(n), !0) : (b(n), !1);
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
		let t = d(), n = ge();
		if (!t || !n || !t.contains(n)) return;
		let i = n.closest("[aria-posinset]");
		if (!i || !t.contains(i)) return;
		let a = t.querySelectorAll("[aria-posinset]");
		if (i !== (e.key === "ArrowUp" ? a[0] : a[a.length - 1])) return;
		let o = Number(i.getAttribute("aria-posinset"));
		if (!o) return;
		let s = e.key === "ArrowUp" ? -1 : 1, c = Xn(Y(r), o - 1 + s, s);
		c < 0 || c === o - 1 || (e.preventDefault(), e.stopImmediatePropagation(), p(c, !0, s === 1 ? "end" : "start"));
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
		focusItem: p,
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
	h(e, (e) => {
		e || (r = !0, S(() => r = !1));
	}), h(t, (t) => {
		!t || r ? r = !1 : Y(n) && (e.value = !0);
	});
}
//#endregion
//#region node_modules/vuetify/lib/components/VSelect/useSelectionMenu.js
function $n(e, t) {
	let n = ee(e, "menu"), r = X({
		get: () => n.value,
		set: (r) => {
			n.value && !r && t.vMenuRef.value?.ΨopenChildren.size || (r || !e.menuProps?.persistent) && (r && Y(t.menuDisabled) || (n.value = r));
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
		return t ? fe(t) : [];
	}
	function i(n) {
		let i = n.target, o = n.shiftKey ? "backward" : "forward", s = e.map(r), c = e.map((e) => e.type === "list" ? e.contentRef.value?.$el : e.contentRef.value).findIndex((e) => e?.contains(i)), l = a(s, c, o, i);
		if (D(l)) {
			let r = e[c], i = s[c];
			if (r.type === "list" || (o === "forward" ? i.at(-1) === n.target : i.at(0) === n.target)) {
				t();
				let e = ge();
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
			if (t.type === "list" && Y(t.displayItemsCount) > 0) t.contentRef.value?.focus(0);
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
			if (t[r].length > 0 || n.type === "list" && Y(n.displayItemsCount) > 0) return r;
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
	if (!(Q(e) || m(e) || e === -1)) return i(e) ? [[e, e + t.length]] : Array.isArray(e[0]) ? e : [e];
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
	let r = [], i = n?.default ?? tr(n?.ignoreAccents), a = n?.filterKeys ? Se(n.filterKeys) : !1, o = Object.keys(n?.customKeyFilter ?? {}).length;
	if (!e?.length) return r;
	let s = [];
	loop: for (let c = 0; c < e.length; c++) {
		let [l, u = l] = Se(e[c]), d = {}, f = {}, p = -1;
		if ((t || o > 0) && !n?.noFilter) {
			let e = !1;
			if (P(l)) {
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
					let r = pe(u, e), a = n?.customKeyFilter?.[e];
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
function ar(e, t, n, r) {
	let a = q([]), o = q(/* @__PURE__ */ new Map()), s = X(() => r?.transform ? U(t).map((e) => [e, r.transform(e)]) : U(t));
	R(() => {
		let c = y(n) ? n() : U(n), l = !p(c) && !i(c) ? "" : String(c), u = ir(s.value, l, {
			customKeyFilter: {
				...e.customKeyFilter,
				...U(r?.customKeyFilter)
			},
			default: e.customFilter,
			filterKeys: e.filterKeys,
			filterMode: e.filterMode,
			ignoreAccents: e.ignoreAccents,
			noFilter: e.noFilter
		}), d = U(t), f = [], m = /* @__PURE__ */ new Map();
		u.forEach(({ index: e, matches: t }) => {
			let n = d[e];
			f.push(n), I(n.value) || m.set(n.value, t);
		}), a.value = f, o.value = m;
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
	let n = u(), r = X(() => `menu-${n}`);
	return {
		menuId: r,
		ariaExpanded: H(() => Y(t)),
		ariaControls: H(() => r.value)
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
		type: ye,
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
	...be(lt({
		modelValue: null,
		role: "combobox"
	}), ["validationValue", "dirty"]),
	...Qe({ transition: { component: Ze } })
}, "VSelect"), ur = O()({
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
		let { t: r } = le(), { elevationClasses: a } = nt(H(() => e.menuElevation)), s = J(), c = J(), l = J(), u = J(), d = J(), p = J(), { items: m, transformIn: g, transformOut: _ } = Be(e), { autofill: v, resetAutofill: x } = qn(m, (e) => Q(e)), C = ee(e, "search", ""), { filteredItems: w, getMatches: T } = ar(e, m, () => C.value), E = ee(e, "modelValue", [], (e) => g(e === null ? [null] : Se(e)), (t) => {
			let n = _(t);
			return e.multiple ? n : n[0] ?? null;
		}), D = X(() => y(e.counterValue) ? e.counterValue(E.value) : i(e.counterValue) ? e.counterValue : E.value.length), O = Ge(e), M = X(() => E.value.map((e) => e.value)), N = q(!1), P = H(() => e.closableChips && !O.isReadonly.value && !O.isDisabled.value), F = o("VChip"), { InputIcon: I } = Ke(e), R = "", z = 0, B, V = !1, U = X(() => {
			let t = C.value ? w.value : m.value;
			return e.hideSelected ? t.filter((t) => !E.value.some((n) => (e.valueComparator || Ie)(n, t))) : t;
		}), W = X(() => e.hideNoData && !U.value.length || O.isReadonly.value || O.isDisabled.value), { menu: G, closeOnSelect: te } = $n(e, {
			vMenuRef: c,
			menuDisabled: W,
			isFocused: N
		}), { menuId: ne, ariaExpanded: re, ariaControls: ie } = sr(e, G), ae = X(() => ({
			...e.menuProps,
			activatorProps: {
				...e.menuProps?.activatorProps || {},
				"aria-haspopup": "listbox"
			}
		})), { listEvents: oe, focusItem: se, focusFirstItem: de, focusLastItem: K, onActivatorKeydown: fe, setPendingFocus: pe, flushPendingFocus: me } = Zn(l, s, p, U, {
			selectedIndex: De,
			menuContentEl: () => c.value?.contentEl,
			noAutoScroll: () => e.noAutoScroll
		}), he = Jn(G, () => c.value?.contentEl, () => s.value?.controlRef), { onTabKeydown: _e } = er({
			groups: [
				{
					type: "element",
					contentRef: u
				},
				{
					type: "list",
					contentRef: l,
					displayItemsCount: () => U.value.length
				},
				{
					type: "element",
					contentRef: d
				}
			],
			onLeave: () => {
				G.value = !1, s.value?.focus();
			}
		});
		function ve(t) {
			e.openOnClear && (G.value = !0);
		}
		function Y() {
			W.value || (V = !1, pe(null), G.value = !G.value);
		}
		function ye(e) {
			e.key === "Tab" && _e(e), l.value?.$el.contains(e.target) && j(e) && be(e);
		}
		function be(n) {
			if (!n.key || O.isReadonly.value) return;
			switch (n.key) {
				case "Escape":
				case "Tab":
					G.value = !1;
					break;
				case "Enter":
				case " ":
					n.preventDefault(), V = !0, G.value = !0;
					break;
				case "ArrowDown":
				case "ArrowUp":
					if (n.preventDefault(), V = !0, fe(n, G)) return;
					break;
				case "Home":
					n.preventDefault(), G.value && de();
					break;
				case "End":
					n.preventDefault(), G.value && K();
					break;
				case "Backspace":
					if (!e.clearable) break;
					n.preventDefault();
					for (let e of E.value) t("item:removed", e);
					E.value = [], ve(n);
					return;
			}
			if (!j(n)) return;
			let r = performance.now();
			r - B > 1e3 && (R = "", z = 0), R += n.key.toLowerCase(), B = r;
			let i = U.value;
			function a() {
				let e = o();
				return e || R.at(-1) === R.at(-2) && (R = R.slice(0, -1), z++, e = o(), e) || (z = 0, e = o(), e) ? e : (R = n.key.toLowerCase(), o());
			}
			function o() {
				for (let e = z; e < i.length; e++) {
					let t = i[e];
					if (t.title.toLowerCase().startsWith(R)) return [t, e];
				}
			}
			let s = a();
			if (!s) return;
			let [c, l] = s;
			z = l, G.value ? (e.multiple || Q(c, !0, !1), se(l)) : e.multiple || Q(c, !0);
		}
		function Q(n, r = !0, i = !0) {
			if (n.props.disabled) return;
			let a = e.valueComparator || Ie;
			if (e.multiple) {
				let e = E.value.findIndex((e) => a(e.value, n.value)), i = r ?? !~e;
				if (~e) {
					let r = i ? [...E.value, n] : [...E.value], [a] = r.splice(e, 1);
					i || t("item:removed", a), E.value = r;
				} else i && (t("item:added", n), E.value = [...E.value, n]);
			} else {
				let e = r !== !1, o = E.value[0];
				e ? (o && !a(o.value, n.value) ? (t("item:removed", o), t("item:added", n)) : o || t("item:added", n), E.value = [n]) : (o && t("item:removed", o), E.value = []), i && S(() => te());
			}
		}
		let we = 0;
		function Te() {
			we = performance.now();
		}
		function Ee(e) {
			let t = e.target;
			s.value?.$el.contains(t) || (G.value = !1);
			let n = e.relatedTarget;
			(c.value?.contentEl?.contains(n) || !n && performance.now() - we < 10) && (N.value = !0);
		}
		function De() {
			return U.value.findIndex((t) => E.value.some((n) => (e.valueComparator || Ie)(n.value, t.value)));
		}
		async function Oe() {
			if (e.eager && p.value?.calculateVisibleItems(), !l.value || !N.value || me() || l.value.$el?.contains(ge())) return;
			let t = De();
			t >= 0 && await se(t, !e.noAutoScroll) || V && de();
		}
		function ke() {
			C.value = "", N.value && (c.value?.contentEl?._clickOutside?.lastMousedownWasOutside ? N.value = !1 : s.value?.focus());
		}
		function Ae(e) {
			N.value = !0;
		}
		function je(e) {
			if (!s.value?.$el.contains(e.relatedTarget) && !e.currentTarget.contains(e.relatedTarget)) {
				if (he(e)) return;
				N.value = !1;
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
			} else Ne ? v(e) : s.value && (s.value.value = "");
		}
		return h(N, (e) => e && x()), h(G, (t) => {
			if (t || (V = !1, pe(null)), !e.hideSelected && G.value && E.value.length) {
				let t = De();
				A && !e.noAutoScroll && window.requestAnimationFrame(() => {
					t >= 0 && p.value?.scrollToIndex(t, "center");
				});
			}
		}), h(m, (t, n) => {
			G.value || N.value && e.hideNoData && !n.length && t.length && (G.value = !0);
		}), Me(() => {
			let t = !!(e.chips || n.chip), i = !!(!e.hideNoData || U.value.length || n["prepend-item"] || n["append-item"] || n["no-data"]), o = E.value.length > 0, m = ut.filterProps(e), h = o || !N.value && e.label && !e.persistentPlaceholder ? void 0 : e.placeholder, g = {
				search: C,
				filteredItems: w.value
			};
			return k(ut, b({ ref: s }, m, {
				modelValue: E.value.map((e) => e.props.title).join(", "),
				name: void 0,
				"onUpdate:modelValue": Fe,
				focused: N.value,
				"onUpdate:focused": (e) => N.value = e,
				validationValue: E.externalValue,
				counterValue: D.value,
				dirty: o,
				class: [
					"v-select",
					{
						"v-select--active-menu": G.value,
						"v-select--chips": !!e.chips,
						[`v-select--${e.multiple ? "multiple" : "single"}`]: !0,
						"v-select--selected": E.value.length,
						"v-select--selection-slot": !!n.selection
					},
					e.class
				],
				style: e.style,
				inputmode: "none",
				placeholder: h,
				"onClick:clear": ve,
				"onMousedown:control": Y,
				onBlur: Ee,
				onKeydown: be,
				onInputCapture: Pe,
				"aria-expanded": re.value,
				"aria-controls": ie.value
			}), {
				...n,
				default: ({ id: o }) => Z(ue, null, [
					M.value.map((t, n) => Z("input", {
						key: n,
						type: "hidden",
						name: e.name,
						value: t,
						form: e.form
					}, null)),
					k(pt, b({
						id: ne.value,
						ref: c,
						modelValue: G.value,
						"onUpdate:modelValue": (e) => G.value = e,
						activator: "parent",
						captureFocus: !1,
						openOnArrow: !1,
						disabled: W.value,
						_disableKeys: !0,
						eager: e.eager,
						maxHeight: 310,
						openOnClick: !1,
						closeOnContentClick: !1,
						transition: e.transition,
						onAfterEnter: Oe,
						onAfterLeave: ke
					}, ae.value, { contentClass: [
						"v-select__content",
						a.value,
						ae.value.contentClass
					] }), { default: () => [k(ht, {
						onFocusin: Ae,
						onFocusout: je,
						onKeydown: ye,
						onMousedown: Te
					}, { default: () => [
						n["menu-header"] && Z("header", { ref: u }, [n["menu-header"](g)]),
						i && k(Ue, b({
							key: "select-list",
							ref: l,
							class: "v-list--navigable",
							selected: M.value,
							selectStrategy: e.multiple ? "independent" : "single-independent",
							tabindex: "-1",
							selectable: !!U.value.length,
							"aria-live": "polite",
							"aria-labelledby": `${o.value}-label`,
							"aria-multiselectable": e.multiple,
							color: e.itemColor ?? e.color
						}, oe, e.listProps), { default: () => [
							n["prepend-item"]?.(),
							!U.value.length && !e.hideNoData && (n["no-data"]?.() ?? k(He, {
								key: "no-data",
								title: r(e.noDataText)
							}, null)),
							k(Tt, {
								ref: p,
								renderless: !0,
								items: U.value,
								itemKey: "value"
							}, { default: ({ item: t, index: r, itemRef: i }) => {
								let a = f(t.props), o = b(t.props, {
									ref: i,
									key: t.value,
									onClick: () => Q(t, null),
									"aria-posinset": r + 1,
									"aria-setsize": U.value.length
								});
								return t.type === "divider" ? n.divider?.({
									props: t.raw,
									index: r
								}) ?? k(qe, b(t.props, {
									ref: i,
									key: `divider-${r}`
								}), null) : t.type === "subheader" ? n.subheader?.({
									props: t.raw,
									index: r
								}) ?? k(ze, b(t.props, {
									ref: i,
									key: `subheader-${r}`
								}), null) : n.item?.({
									item: t.raw,
									internalItem: t,
									index: r,
									props: o
								}) ?? k(He, b(o, { role: "option" }), {
									prepend: ({ isSelected: n }) => Z(ue, null, [
										e.multiple && !e.hideSelected ? k(ct, {
											key: t.value,
											modelValue: n,
											ripple: !1,
											tabindex: "-1",
											"aria-hidden": !0,
											onClick: (e) => e.preventDefault()
										}, null) : void 0,
										a.prependAvatar && k($e, { image: a.prependAvatar }, null),
										a.prependIcon && k(Je, { icon: a.prependIcon }, null)
									]),
									title: () => C.value ? k(Gn, {
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
						n["menu-footer"] && Z("footer", { ref: d }, [n["menu-footer"](g)])
					] })] }),
					E.value.map((r, i) => {
						function a(e) {
							e.stopPropagation(), e.preventDefault(), Q(r, !1);
						}
						let o = b(st.filterProps(r.props), {
							"onClick:close": a,
							onKeydown(e) {
								(e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), a(e));
							},
							onMousedown(e) {
								e.preventDefault(), e.stopPropagation();
							},
							modelValue: !0,
							"onUpdate:modelValue": void 0
						}), s = t ? !!n.chip : !!n.selection, c = s ? L(t ? n.chip({
							item: r.raw,
							internalItem: r,
							index: i,
							props: o
						}) : n.selection({
							item: r.raw,
							internalItem: r,
							index: i
						})) : void 0;
						if (!s || c) return Z("div", {
							key: r.value,
							class: "v-select__selection"
						}, [t ? n.chip ? k(Ce, {
							key: "chip-defaults",
							defaults: { VChip: {
								closable: P.value,
								size: F.value?.size ?? "small",
								text: r.title
							} }
						}, { default: () => [c] }) : k(st, b({
							key: "chip",
							closable: P.value,
							size: F.value?.size ?? "small",
							text: r.title,
							disabled: r.props.disabled
						}, o), null) : c ?? Z("span", { class: "v-select__selection-text" }, [r.title, e.multiple && i < E.value.length - 1 && Z("span", { class: "v-select__selection-comma" }, [xe(",")])])]);
					})
				]),
				"append-inner": (...t) => Z(ue, null, [
					n["append-inner"]?.(...t),
					e.menuIcon ? k(Je, {
						class: "v-select__menu-icon",
						color: s.value?.fieldIconColor,
						icon: e.menuIcon,
						"aria-hidden": !0
					}, null) : void 0,
					e.appendInnerIcon && k(I, {
						key: "append-icon",
						name: "appendInner",
						color: t[0].iconColor.value
					}, null)
				])
			});
		}), it({
			isFocused: N,
			menu: G,
			search: C,
			filteredItems: w,
			select: Q
		}, s);
	}
});
//#endregion
export { ar as a, Zn as c, Gn as d, Tt as f, rr as i, Jn as l, pt as m, cr as n, er as o, ht as p, sr as r, $n as s, ur as t, qn as u };
