import { A as e, Bt as t, Ct as n, F as r, Fn as i, G as a, Ht as o, I as s, J as c, Jn as l, L as u, Lt as d, Mn as f, Nn as p, O as m, Qn as h, R as g, Rn as _, T as v, Tn as y, Tt as b, Vn as x, W as S, Yn as C, Yt as w, Z as T, Zn as E, _ as D, c as O, cr as k, er as A, fn as j, ft as M, g as N, gt as ee, h as P, hn as te, i as F, jn as I, l as ne, mn as re, nr as ie, nt as L, or as R, p as ae, q as oe, qn as se, r as ce, rr as z, rt as B, sn as V, sr as le, tr as ue, ur as H, vn as U, vt as de, yn as W, z as fe, zt as G } from "./vuetify-C39-WP9g.js";
import { c as K, l as pe, o as me, s as he, u as q } from "./rounded-1DPtyqNn.js";
import { n as ge, t as _e } from "./animation-B_ZSS1p4.js";
import { a as ve, c as ye, l as be } from "./define-BovISfN4.js";
import { n as xe } from "./ripple-BBz9XQtx.js";
import { a as J, i as Se, n as Ce, o as Y, r as we, t as Te } from "./scopeId-3i3jaqkB.js";
import { i as Ee, r as De } from "./density-9WZgplEH.js";
import { n as Oe, t as ke } from "./transition-Cv515_M1.js";
import { i as Ae, n as je } from "./router-C0qlu-KG.js";
//#region node_modules/vuetify/lib/util/bindProps.js
var Me = /* @__PURE__ */ new WeakMap();
function Ne(e, t) {
	Object.keys(t).forEach((n) => {
		if (M(n)) {
			let r = T(n), i = Me.get(e);
			if (G(t[n])) i?.forEach((t) => {
				let [n, a] = t;
				n === r && (e.removeEventListener(r, a), i.delete(t));
			});
			else if (!i || ![...i].some((e) => e[0] === r && e[1] === t[n])) {
				e.addEventListener(r, t[n]);
				let a = i || /* @__PURE__ */ new Set();
				a.add([r, t[n]]), Me.has(e) || Me.set(e, a);
			}
		} else G(t[n]) ? e.removeAttribute(n) : e.setAttribute(n, t[n]);
	});
}
function Pe(e, t) {
	Object.keys(t).forEach((t) => {
		if (M(t)) {
			let n = T(t), r = Me.get(e);
			r?.forEach((t) => {
				let [i, a] = t;
				i === n && (e.removeEventListener(n, a), r.delete(t));
			});
		} else e.removeAttribute(t);
	});
}
//#endregion
//#region node_modules/vuetify/lib/util/dom.js
function Fe(e) {
	/* istanbul ignore next */
	if (!d(e.getRootNode)) {
		for (; e.parentNode;) e = e.parentNode;
		return e === document ? document : null;
	}
	let t = e.getRootNode();
	return t !== document && t.getRootNode({ composed: !0 }) !== document ? null : t;
}
//#endregion
//#region node_modules/vuetify/lib/util/isFixedPosition.js
function Ie(e) {
	for (; e;) {
		if (window.getComputedStyle(e).position === "fixed") return !0;
		e = e.offsetParent;
	}
	return !1;
}
//#endregion
//#region src/runtime/overlayHost.ts
var X = "smartview-overlay-host", Le = class extends HTMLElement {
	constructor() {
		super(), this.attachShadow({ mode: "open" });
	}
};
function Re() {
	customElements.get(X) || customElements.define(X, Le);
	let e = document.body.querySelector(`:scope > ${X}`);
	if (e || (e = document.createElement(X), document.body.appendChild(e)), !e.shadowRoot) throw Error(`<${X}> 에 Shadow Root 가 없습니다`);
	return ce(e.shadowRoot, F()), e.shadowRoot;
}
function ze(e) {
	return e;
}
//#endregion
//#region src/runtime/overlayTarget.ts
var Be = [
	"VOverlay",
	"VDialog",
	"VMenu",
	"VTooltip",
	"VSnackbar"
];
function Ve(e) {
	let t = U(() => e() === "body" ? ze(Re()) : void 0);
	return {
		attachTarget: t,
		overlayDefaults: U(() => {
			let e = t.value;
			return e ? Object.fromEntries(Be.map((t) => [t, { attach: e }])) : {};
		})
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VMenu/shared.js
var Z = Symbol.for("vuetify:v-menu");
//#endregion
//#region node_modules/vuetify/lib/components/VOverlay/util/point.js
function He(e, t) {
	return {
		x: e.x + t.x,
		y: e.y + t.y
	};
}
function Ue(e, t) {
	return {
		x: e.x - t.x,
		y: e.y - t.y
	};
}
function We(e, t) {
	if (e.side === "top" || e.side === "bottom") {
		let { side: n, align: r } = e;
		return He({
			x: r === "left" ? 0 : r === "center" ? t.width / 2 : r === "right" ? t.width : r,
			y: n === "top" ? 0 : n === "bottom" ? t.height : n
		}, t);
	}
	if (e.side === "left" || e.side === "right") {
		let { side: n, align: r } = e;
		return He({
			x: n === "left" ? 0 : n === "right" ? t.width : n,
			y: r === "top" ? 0 : r === "center" ? t.height / 2 : r === "bottom" ? t.height : r
		}, t);
	}
	return He({
		x: t.width / 2,
		y: t.height / 2
	}, t);
}
//#endregion
//#region node_modules/vuetify/lib/components/VOverlay/locationStrategies.js
var Ge = {
	static: Ye,
	connected: Qe
}, Ke = e({
	locationStrategy: {
		type: [String, Function],
		default: "static",
		validator: (e) => d(e) || e in Ge
	},
	location: String,
	origin: {
		type: String,
		default: "auto"
	},
	offset: [
		Number,
		String,
		Array
	],
	stickToTarget: Boolean,
	viewportMargin: {
		type: [Number, String],
		default: 12
	}
}, "VOverlay-location-strategies");
function qe(e, t) {
	let n = z({}), r = z();
	b && D(() => !!(t.isActive.value && e.locationStrategy), (s) => {
		l(() => e.locationStrategy, s), A(() => {
			window.removeEventListener("resize", i), visualViewport?.removeEventListener("resize", a), visualViewport?.removeEventListener("scroll", o), r.value = void 0, t.isActive.value && (n.value = {});
		}), window.addEventListener("resize", i, { passive: !0 }), visualViewport?.addEventListener("resize", a, { passive: !0 }), visualViewport?.addEventListener("scroll", o, { passive: !0 }), d(e.locationStrategy) ? r.value = e.locationStrategy(t, e, n)?.updateLocation : r.value = Ge[e.locationStrategy](t, e, n)?.updateLocation;
	});
	function i(e) {
		r.value?.(e);
	}
	function a(e) {
		r.value?.(e);
	}
	function o(e) {
		r.value?.(e);
	}
	return {
		contentStyles: n,
		updateLocation: r
	};
}
function Je(e) {
	if (!e) return;
	let t = e.includes(" ") ? e : `${e} center`, n = "center", r = "center", i = {
		left: "start",
		start: "start",
		right: "end",
		end: "end"
	}, a = {
		top: "start",
		bottom: "end"
	};
	for (let e of t.split(" ")) e in i ? n = i[e] : e in a && (r = a[e]);
	return {
		[`v-overlay--justify-${n}`]: !0,
		[`v-overlay--align-${r}`]: !0
	};
}
function Ye(e, t, n) {
	function r() {
		if (t.origin !== "auto" && t.origin !== "overlap") {
			let { side: r, align: i } = q(t.origin, e.isRtl.value);
			n.value = { transformOrigin: `${r} ${i}` };
		} else n.value = {};
	}
	return l([() => t.origin, e.isRtl], r, { immediate: !0 }), { updateLocation: () => {} };
}
function Xe(e, t, n) {
	let r = document.createElement("div");
	r.style.position = "absolute", r.style.visibility = "hidden", r.style[n ? "width" : "height"] = e, t.appendChild(r);
	let i = n ? r.offsetWidth : r.offsetHeight;
	return t.removeChild(r), i > 0 ? i : Infinity;
}
function Ze(e, t) {
	let n = ge(e), r = getComputedStyle(e);
	function i(t) {
		return e.style[t] && parseFloat(r[t]) || 0;
	}
	return t ? n.x += i("right") : n.x -= i("left"), n.y -= i("top"), n;
}
function Qe(e, n, i) {
	(Array.isArray(e.target.value) || Ie(e.target.value)) && Object.assign(i.value, {
		position: "fixed",
		top: 0,
		[e.isRtl.value ? "right" : "left"]: 0
	});
	let { preferredAnchor: d, preferredOrigin: f } = c(() => {
		let t = q(n.location ?? "bottom", e.isRtl.value), r = n.origin === "overlap" ? t : n.origin === "auto" ? K(t) : q(n.origin, e.isRtl.value);
		return t.side === r.side && t.align === me(r).align ? {
			preferredAnchor: he(t),
			preferredOrigin: he(r)
		} : {
			preferredAnchor: t,
			preferredOrigin: r
		};
	}), [m, h, _, v] = [
		"minWidth",
		"minHeight",
		"maxWidth",
		"maxHeight"
	].map((r) => {
		let i = r.endsWith("Width");
		return () => {
			let a = n[r];
			if (a == null) return Infinity;
			let o = e.contentEl.value?.parentElement ?? document.documentElement;
			if (t(a) || /^-?[\d.]+(?:px)?$/.test(a.trim())) return parseFloat(a);
			if (a.endsWith("%")) {
				let e = s(o);
				return parseFloat(a) * (i ? e.width : e.height) / 100;
			}
			return Xe(a, o, i);
		};
	}), y = U(() => {
		if (Array.isArray(n.offset)) return n.offset;
		if (o(n.offset)) {
			let e = n.offset.split(" ").map(parseFloat);
			return e.length < 2 && e.push(0), e;
		}
		return t(n.offset) ? [n.offset, 0] : [0, 0];
	}), b = !1, x = -1, C = new fe(4), T = new ResizeObserver(() => {
		if (!b) return;
		if (requestAnimationFrame((e) => {
			e !== x && C.clear(), requestAnimationFrame((e) => {
				x = e;
			});
		}), C.isFull) {
			let e = C.values();
			if (xe(e.at(-1), e.at(-3)) && !xe(e.at(-1), e.at(-2))) return;
		}
		let e = D();
		e && C.push(e.flipped);
	}), E = new r({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});
	l(e.target, (e, t) => {
		t && !Array.isArray(t) && T.unobserve(t), Array.isArray(e) ? xe(e, t) || D() : e && T.observe(e);
	}, { immediate: !0 }), l(e.contentEl, (e, t) => {
		t && T.unobserve(t), e && T.observe(e);
	}, { immediate: !0 }), A(() => {
		T.disconnect();
	});
	function D() {
		if (b = !1, requestAnimationFrame(() => b = !0), !e.target.value || !e.contentEl.value) return;
		(Array.isArray(e.target.value) || e.target.value.offsetParent || e.target.value.getClientRects().length) && (E = g(e.target.value));
		let t = Ze(e.contentEl.value, e.isRtl.value), o = J(e.contentEl.value), c = Number(n.viewportMargin), l = m(), p = h(), x = _(), C = v();
		o.length || (o.push(document.documentElement), e.contentEl.value.style.top && e.contentEl.value.style.left || (t.x -= parseFloat(document.documentElement.style.getPropertyValue("--v-body-scroll-x") || 0), t.y -= parseFloat(document.documentElement.style.getPropertyValue("--v-body-scroll-y") || 0)));
		let T = o.reduce((e, t) => {
			let n = s(t);
			return e ? new r({
				x: Math.max(e.left, n.left),
				y: Math.max(e.top, n.top),
				width: Math.min(e.right, n.right) - Math.max(e.left, n.left),
				height: Math.min(e.bottom, n.bottom) - Math.max(e.top, n.top)
			}) : n;
		}, void 0);
		n.stickToTarget ? (T.x += Math.min(c, E.x), T.y += Math.min(c, E.y), T.width = Math.max(T.width - c * 2, E.x + E.width - c), T.height = Math.max(T.height - c * 2, E.y + E.height - c)) : (T.x += c, T.y += c, T.width -= c * 2, T.height -= c * 2);
		let D = {
			anchor: d.value,
			origin: f.value
		};
		function O(e) {
			let n = new r(t), { x: i, y: a } = Ue(We(e.anchor, E), We(e.origin, n));
			switch (e.anchor.side) {
				case "top":
					a -= y.value[0];
					break;
				case "bottom":
					a += y.value[0];
					break;
				case "left":
					i -= y.value[0];
					break;
				case "right": i += y.value[0];
			}
			switch (e.anchor.align) {
				case "top":
					a -= y.value[1];
					break;
				case "bottom":
					a += y.value[1];
					break;
				case "left":
					i -= y.value[1];
					break;
				case "right": i += y.value[1];
			}
			return n.x += i, n.y += a, n.width = Math.min(n.width, x), n.height = Math.min(n.height, C), {
				overflows: u(n, T),
				x: i,
				y: a
			};
		}
		let k = 0, A = 0, j = {
			x: 0,
			y: 0
		}, M = {
			x: !1,
			y: !1
		}, N = -1;
		for (;;) {
			if (N++ > 10) {
				w("Infinite loop detected in connectedLocationStrategy");
				break;
			}
			let { x: e, y: n, overflows: r } = O(D);
			k += e, A += n, t.x += e, t.y += n;
			{
				let e = pe(D.anchor), t = r.x.before || r.x.after, n = r.y.before || r.y.after, i = !1;
				if (["x", "y"].forEach((a) => {
					if (a === "x" && t && !M.x || a === "y" && n && !M.y) {
						let t = {
							anchor: { ...D.anchor },
							origin: { ...D.origin }
						}, n = a === "x" ? e === "y" ? me : K : e === "y" ? K : me;
						t.anchor = n(t.anchor), t.origin = n(t.origin);
						let { overflows: o } = O(t);
						(o[a].before <= r[a].before && o[a].after <= r[a].after || o[a].before + o[a].after < (r[a].before + r[a].after) / 2) && (D = t, i = M[a] = !0);
					}
				}), i) continue;
			}
			r.x.before && (k += r.x.before, t.x += r.x.before), r.x.after && (k -= r.x.after, t.x -= r.x.after), r.y.before && (A += r.y.before, t.y += r.y.before), r.y.after && (A -= r.y.after, t.y -= r.y.after);
			{
				let e = u(t, T);
				j.x = T.width - e.x.before - e.x.after, j.y = T.height - e.y.before - e.y.after, k += e.x.before, t.x += e.x.before, A += e.y.before, t.y += e.y.before;
			}
			break;
		}
		let ee = pe(D.anchor), P = n.origin !== "auto" && n.origin !== "overlap" ? q(n.origin, e.isRtl.value) : D.origin;
		return Object.assign(i.value, {
			"--v-overlay-anchor-origin": `${D.anchor.side} ${D.anchor.align}`,
			transformOrigin: `${P.side} ${P.align}`,
			top: a($e(A)),
			left: e.isRtl.value ? void 0 : a($e(k)),
			right: e.isRtl.value ? a($e(-k)) : void 0,
			minWidth: a(ee === "y" ? Math.min(l, E.width) : l),
			maxWidth: a(et(S(j.x, l === Infinity ? 0 : l, x))),
			maxHeight: a(et(S(j.y, p === Infinity ? 0 : p, C)))
		}), {
			available: j,
			contentBox: t,
			flipped: M
		};
	}
	return l(() => [
		d.value,
		f.value,
		n.origin,
		n.offset,
		n.minWidth,
		n.minHeight,
		n.maxWidth,
		n.maxHeight
	], () => D()), p(() => {
		let e = D();
		if (!e) return;
		let { available: t, contentBox: n } = e;
		n.height > t.y && requestAnimationFrame(() => {
			D(), requestAnimationFrame(() => {
				D();
			});
		});
	}), { updateLocation: D };
}
function $e(e) {
	return Math.round(e * devicePixelRatio) / devicePixelRatio;
}
function et(e) {
	return Math.ceil(e * devicePixelRatio) / devicePixelRatio;
}
//#endregion
//#region node_modules/vuetify/lib/components/VOverlay/requestNewFrame.js
var tt = !0, nt = [];
function rt(e) {
	!tt || nt.length ? (nt.push(e), at()) : (tt = !1, e(), at());
}
var it = -1;
function at() {
	cancelAnimationFrame(it), it = requestAnimationFrame(() => {
		let e = nt.shift();
		e && e(), nt.length ? at() : tt = !0;
	});
}
//#endregion
//#region node_modules/vuetify/lib/components/VOverlay/scrollStrategies.js
var ot = {
	none: null,
	close: lt,
	block: ut,
	reposition: dt
}, st = e({ scrollStrategy: {
	type: [String, Function],
	default: "block",
	validator: (e) => d(e) || e in ot
} }, "VOverlay-scroll-strategies");
function ct(e, t) {
	if (!b) return;
	let n;
	C(async () => {
		n?.stop(), t.isActive.value && e.scrollStrategy && (n = h(), await new Promise((e) => setTimeout(e)), n.active && n.run(() => {
			d(e.scrollStrategy) ? e.scrollStrategy(t, e, n) : ot[e.scrollStrategy]?.(t, e, n);
		}));
	}), A(() => {
		n?.stop();
	});
}
function lt(e) {
	function t(t) {
		e.isActive.value = !1;
	}
	pt(ft(e.target.value, e.contentEl.value), t);
}
function ut(e, t) {
	let n = e.root.value?.offsetParent, r = ft(e.target.value, e.contentEl.value), i = [.../* @__PURE__ */ new Set([...J(r, t.contained ? n : void 0), ...J(e.contentEl.value, t.contained ? n : void 0)])].filter((e) => !e.classList.contains("v-overlay-scroll-blocked")), o = window.innerWidth - document.documentElement.offsetWidth, s = ((e) => Y(e) && e)(n || document.documentElement);
	s && e.root.value.classList.add("v-overlay--scroll-blocked"), i.forEach((e, t) => {
		e.style.setProperty("--v-body-scroll-x", a(-e.scrollLeft)), e.style.setProperty("--v-body-scroll-y", a(-e.scrollTop)), (e !== document.documentElement || getComputedStyle(e).overflowY !== "scroll") && e.style.setProperty("--v-scrollbar-offset", a(o)), e.classList.add("v-overlay-scroll-blocked");
	}), A(() => {
		i.forEach((e, t) => {
			let n = parseFloat(e.style.getPropertyValue("--v-body-scroll-x")), r = parseFloat(e.style.getPropertyValue("--v-body-scroll-y")), i = e.style.scrollBehavior;
			e.style.scrollBehavior = "auto", e.style.removeProperty("--v-body-scroll-x"), e.style.removeProperty("--v-body-scroll-y"), e.style.removeProperty("--v-scrollbar-offset"), e.classList.remove("v-overlay-scroll-blocked"), e.scrollLeft = -n, e.scrollTop = -r, e.style.scrollBehavior = i;
		}), s && e.root.value.classList.remove("v-overlay--scroll-blocked");
	});
}
function dt(e, t, n) {
	let r = !1, i = -1, a = -1;
	function o(t) {
		rt(() => {
			let n = performance.now();
			e.updateLocation.value?.(t), r = (performance.now() - n) / (1e3 / 60) > 2;
		});
	}
	a = (typeof requestIdleCallback > "u" ? (e) => e() : requestIdleCallback)(() => {
		n.run(() => {
			pt(ft(e.target.value, e.contentEl.value), (e) => {
				r ? (cancelAnimationFrame(i), i = requestAnimationFrame(() => {
					i = requestAnimationFrame(() => {
						o(e);
					});
				})) : o(e);
			});
		});
	}), A(() => {
		typeof cancelIdleCallback < "u" && cancelIdleCallback(a), cancelAnimationFrame(i);
	});
}
function ft(e, t) {
	return Array.isArray(e) ? document.elementsFromPoint(...e).find((e) => !t?.contains(e)) : e ?? t;
}
function pt(e, t) {
	let n = [document, ...J(e)];
	n.forEach((e) => {
		e.addEventListener("scroll", t, { passive: !0 });
	}), A(() => {
		n.forEach((e) => {
			e.removeEventListener("scroll", t);
		});
	});
}
//#endregion
//#region node_modules/vuetify/lib/composables/delay.js
var mt = e({
	closeDelay: [Number, String],
	openDelay: [Number, String]
}, "delay");
function ht(e, t) {
	let n = () => {};
	function r(r, i) {
		n?.();
		let a = r ? e.openDelay : e.closeDelay, o = Math.max(i?.minDelay ?? 0, Number(a ?? 0));
		return new Promise((e) => {
			n = oe(o, () => {
				t?.(r), e(r);
			});
		});
	}
	function i() {
		return r(!0);
	}
	function a(e) {
		return r(!1, e);
	}
	return {
		clearDelay: n,
		runOpenDelay: i,
		runCloseDelay: a
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VOverlay/useActivator.js
var gt = e({
	target: [String, Object],
	activator: [String, Object],
	activatorProps: {
		type: Object,
		default: () => ({})
	},
	openOnClick: {
		type: Boolean,
		default: void 0
	},
	openOnHover: Boolean,
	openOnFocus: {
		type: Boolean,
		default: void 0
	},
	closeOnContentClick: Boolean,
	...mt()
}, "VOverlay-activator");
function _t(e, { isActive: t, isTop: r, contentEl: i, isSubmenu: a = !1 }) {
	let o = m("useActivator"), s = z(), c = I(Z, null), u = !1, d = !1, f = !0, g = z(!1), _ = !1, v = () => !a || (c?.rootOpenedByHover?.() ?? g.value), y = U(() => e.openOnFocus || e.openOnFocus == null && e.openOnHover), x = U(() => e.openOnClick || e.openOnClick == null && !e.openOnHover && !y.value), { runOpenDelay: S, runCloseDelay: w } = ht(e, (n) => {
		n === (e.openOnHover && u || y.value && d) && !(e.openOnHover && t.value && !r.value) && (t.value !== n && (f = !0, n && (_ = !0, g.value = u && e.openOnHover)), t.value = n);
	}), T = !1;
	l(t, (e) => {
		if (!e) {
			T = !0, setTimeout(() => T = !1, 50), g.value = !1, _ = !1;
			return;
		}
		_ || (g.value = !1), _ = !1;
	});
	let E = z(), D = {
		onClick: (e) => {
			(!T || t.value) && (e.stopPropagation(), s.value = e.currentTarget || e.target, t.value || (E.value = [e.clientX, e.clientY]), t.value = !t.value);
		},
		onMouseenter: (t) => {
			u = !0, s.value = t.currentTarget || t.target, e.target === "cursor" && (E.value = [t.clientX, t.clientY]), S();
		},
		onMousemove: (e) => {
			E.value = [e.clientX, e.clientY];
		},
		onMouseleave: (t) => {
			u = !1, e.target === "cursor" && (d = !1), v() && w();
		},
		onFocus: (e) => {
			T || ee(e.target, ":focus-visible") !== !1 && (d = !0, e.stopPropagation(), s.value = e.currentTarget || e.target, S());
		},
		onBlur: (e) => {
			let t = e.relatedTarget;
			t && !i.value?.contains(t) && (d = !1, e.stopPropagation(), w({ minDelay: 1 }));
		}
	}, O = U(() => {
		let t = {};
		return x.value && (t.onClick = D.onClick), e.openOnHover && (t.onMouseenter = D.onMouseenter, t.onMouseleave = D.onMouseleave, e.target === "cursor" && !x.value && (t.onMousemove = D.onMousemove)), y.value && (t.onFocus = D.onFocus, t.onBlur = D.onBlur), t;
	}), k = U(() => {
		let n = {};
		if (e.openOnHover && (n.onMouseenter = () => {
			u = !0, S();
		}, n.onMouseleave = () => {
			u = !1, v() && w();
		}), y.value && (n.onFocusin = (e) => {
			e.target.matches(":focus-visible") && (d = !0, S());
		}, n.onFocusout = (e) => {
			let t = e.relatedTarget;
			t && !i.value?.contains(t) && (d = !1, w({ minDelay: 1 }));
		}), e.closeOnContentClick) {
			let e = I(Z, null);
			n.onClick = () => {
				t.value = !1, e?.closeParents();
			};
		}
		return n;
	}), j = U(() => {
		let t = {};
		return e.openOnHover && (t.onMouseenter = () => {
			f && (u = !0, f = !1, S());
		}, t.onMouseleave = () => {
			u = !1, v() && w();
		}), t;
	});
	l(r, (t) => {
		t && v() && (e.openOnHover && !u && (!y.value || !d) || y.value && !d && (!e.openOnHover || !u)) && !i.value?.contains(B()) && w();
	}), l(t, (e) => {
		e || setTimeout(() => {
			E.value = void 0;
		});
	}, { flush: "post" });
	let M = n();
	C(() => {
		M.value && p(() => {
			s.value = M.el;
		});
	});
	let N = n(), P = U(() => e.target === "cursor" && E.value ? E.value : N.value ? N.el : yt(e.target, o) || s.value), te = U(() => Array.isArray(P.value) ? void 0 : P.value), F;
	return l(() => !!e.activator, (t) => {
		t && b ? (F = h(), F.run(() => {
			vt(e, o, {
				activatorEl: s,
				activatorEvents: O
			});
		})) : F && F.stop();
	}, {
		flush: "post",
		immediate: !0
	}), A(() => {
		F?.stop();
	}), {
		activatorEl: s,
		activatorRef: M,
		target: P,
		targetEl: te,
		targetRef: N,
		activatorEvents: O,
		contentEvents: k,
		scrimEvents: j,
		openedByHover: g
	};
}
function vt(e, t, { activatorEl: n, activatorEvents: r }) {
	l(() => e.activator, (e, t) => {
		if (t && e !== t) {
			let e = o(t);
			e && a(e);
		}
		e && p(() => i());
	}, { immediate: !0 }), l(() => e.activatorProps, () => {
		i();
	}), A(() => {
		a();
	});
	function i(t = o(), n = e.activatorProps) {
		t && Ne(t, f(r.value, n));
	}
	function a(t = o(), n = e.activatorProps) {
		t && Pe(t, f(r.value, n));
	}
	function o(r = e.activator) {
		let i = yt(r, t);
		return n.value = i?.nodeType === Node.ELEMENT_NODE ? i : void 0, n.value;
	}
}
function yt(e, t) {
	if (!e) return;
	let n;
	if (e === "parent") {
		let e = t?.proxy?.$el?.parentNode;
		for (; e?.hasAttribute("data-no-activator");) e = e.parentNode;
		n = e;
	} else n = o(e) ? document.querySelector(e) : "$el" in e ? e.$el : e;
	return n;
}
//#endregion
//#region node_modules/vuetify/lib/composables/focusTrap.js
var bt = e({
	retainFocus: Boolean,
	captureFocus: Boolean,
	disableInitialFocus: Boolean
}, "focusTrap"), Q = /* @__PURE__ */ new Map(), xt = 0;
function St() {
	let e;
	for (let { isActive: t, contentEl: n } of Q.values()) t.value && n.value && (e = n.value);
	return e;
}
function Ct(e) {
	let t = B();
	if (e.key !== "Tab" || !t) return;
	let n = Array.from(Q.values()).filter(({ isActive: e, contentEl: n }) => e.value && n.value?.contains(t)).map((e) => e.contentEl.value), r, i = t;
	for (; i;) {
		if (n.includes(i)) {
			r = i;
			break;
		}
		i = i.parentElement;
	}
	if (!r) {
		let t = St();
		if (!t) return;
		let n = L(t).filter((e) => e.tabIndex >= 0);
		e.preventDefault(), n.length ? e.shiftKey ? n[n.length - 1].focus() : n[0].focus() : t.focus({ preventScroll: !0 });
		return;
	}
	let a = L(r).filter((e) => e.tabIndex >= 0);
	if (!a.length) return;
	if (a.length === 1 && a[0].classList.contains("v-list") && a[0].contains(t)) {
		e.preventDefault();
		return;
	}
	let o = a[0], s = a[a.length - 1], c = t === o || t === r || o.classList.contains("v-list") && o.contains(t), l = t === s || s.classList.contains("v-list") && s.contains(t);
	e.shiftKey && c && (e.preventDefault(), s.focus()), !e.shiftKey && l && (e.preventDefault(), o.focus());
}
function wt(e, { isActive: t, localTop: n, contentEl: r }) {
	let i = Symbol("trap"), a = !1, o = -1;
	async function s() {
		a = !0, o = window.setTimeout(() => {
			a = !1;
		}, 100);
	}
	async function c(e) {
		let i = e.relatedTarget, o = e.target;
		document.removeEventListener("pointerdown", s), document.removeEventListener("keydown", u), await new Promise((e) => requestAnimationFrame(e)), t.value && !a && i !== o && r.value && H(n) && ![document, r.value].includes(o) && !r.value.contains(o) && L(r.value)[0]?.focus();
	}
	function u(e) {
		if (e.key === "Tab" && (document.removeEventListener("keydown", u), t.value && r.value && e.target && !r.value.contains(e.target))) {
			let t = L(document.documentElement);
			if (e.shiftKey && e.target === t.at(0) || !e.shiftKey && e.target === t.at(-1)) {
				let t = L(r.value);
				t.length > 0 && (e.preventDefault(), t[0].focus());
			}
		}
	}
	let d = k(() => t.value && e.captureFocus && !e.disableInitialFocus);
	b && (l(() => e.retainFocus, (e) => {
		e ? Q.set(i, {
			isActive: t,
			contentEl: r
		}) : Q.delete(i);
	}, { immediate: !0 }), l(d, (e) => {
		e ? (document.addEventListener("pointerdown", s), document.addEventListener("focusin", c, { once: !0 }), document.addEventListener("keydown", u)) : (document.removeEventListener("pointerdown", s), document.removeEventListener("focusin", c), document.removeEventListener("keydown", u));
	}, { immediate: !0 }), xt++ < 1 && document.addEventListener("keydown", Ct)), A(() => {
		Q.delete(i), b && (clearTimeout(o), document.removeEventListener("pointerdown", s), document.removeEventListener("focusin", c), document.removeEventListener("keydown", u), --xt < 1 && document.removeEventListener("keydown", Ct));
	});
}
//#endregion
//#region node_modules/vuetify/lib/composables/hydration.js
function Tt() {
	if (!b) return R(!1);
	let { ssr: e } = ae();
	if (e) {
		let e = R(!1);
		return _(() => {
			e.value = !0;
		}), e;
	}
	return R(!0);
}
//#endregion
//#region node_modules/vuetify/lib/composables/stack.js
var Et = Symbol.for("vuetify:stack"), $ = ue([]);
function Dt(e, t, n) {
	let r = m("useStack"), i = !n, a = I(Et, void 0), o = ue({ activeChildren: /* @__PURE__ */ new Set() });
	x(Et, o);
	let s = R(Number(H(t)));
	D(e, () => {
		let e = $.at(-1)?.[1];
		s.value = e ? e + 10 : Number(H(t)), i && $.push([r.uid, s.value]), a?.activeChildren.add(r.uid), A(() => {
			if (i) {
				let e = le($).findIndex((e) => e[0] === r.uid);
				$.splice(e, 1);
			}
			a?.activeChildren.delete(r.uid);
		});
	});
	let c = R(!0);
	i && C(() => {
		let e = $.at(-1)?.[0] === r.uid;
		setTimeout(() => c.value = e);
	});
	let l = k(() => !o.activeChildren.size);
	return {
		globalTop: ie(c),
		localTop: l,
		stackStyles: k(() => ({ zIndex: s.value }))
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/teleport.js
function Ot(e) {
	return { teleportTarget: U(() => {
		let t = e();
		if (t === !0 || !b) return;
		let n = t === !1 ? document.body : o(t) ? document.querySelector(t) : t;
		if (!n) {
			se(`Unable to locate target ${t}`);
			return;
		}
		let r = [...n.children].find((e) => e.matches(".v-overlay-container"));
		return r || (r = document.createElement("div"), r.className = "v-overlay-container", n.appendChild(r)), r;
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/directives/click-outside/index.js
function kt() {
	return !0;
}
function At(e, t, n, r = !1) {
	if (!e || !r && jt(e, n) === !1) return !1;
	let i = Fe(t);
	if (typeof ShadowRoot < "u" && i instanceof ShadowRoot && i.host === e.target) return !1;
	let a = n.value, o = ((d(a) ? void 0 : a.include) || (() => []))();
	return o.push(t), !o.some((t) => t?.contains(e.target));
}
function jt(e, t) {
	let n = t.value;
	return ((d(n) ? void 0 : n.closeConditional) || kt)(e);
}
function Mt(e, t, n) {
	let r = d(n.value) ? n.value : n.value.handler;
	e.shadowTarget = e.target, t._clickOutside.lastMousedownWasOutside && At(e, t, n) && setTimeout(() => {
		jt(e, n) && r && r(e);
	}, 0);
}
function Nt(e, t) {
	let n = Fe(e);
	t(document), typeof ShadowRoot < "u" && n instanceof ShadowRoot && t(n);
}
var Pt = {
	mounted(e, t) {
		let n = (n) => Mt(n, e, t), r = (n) => {
			e._clickOutside.lastMousedownWasOutside = At(n, e, t, !0);
		};
		Nt(e, (e) => {
			e.addEventListener("click", n, !0), e.addEventListener("mousedown", r, !0);
		}), e._clickOutside ||= { lastMousedownWasOutside: !1 }, e._clickOutside[t.instance.$.uid] = {
			onClick: n,
			onMousedown: r
		};
	},
	beforeUnmount(e, t) {
		e._clickOutside && (Nt(e, (n) => {
			if (!n || !e._clickOutside?.[t.instance.$.uid]) return;
			let { onClick: r, onMousedown: i } = e._clickOutside[t.instance.$.uid];
			n.removeEventListener("click", r, !0), n.removeEventListener("mousedown", i, !0);
		}), delete e._clickOutside[t.instance.$.uid]);
	}
}, Ft = /* @__PURE__ */ new WeakMap();
function It(e) {
	let { modelValue: t, color: n, ...r } = e;
	return y(V, {
		name: "fade-transition",
		appear: !0
	}, { default: () => [e.modelValue && W("div", f({
		class: ["v-overlay__scrim", e.color.backgroundColorClasses.value],
		style: e.color.backgroundColorStyles.value
	}, r), null)] });
}
var Lt = e({
	absolute: Boolean,
	attach: [
		Boolean,
		String,
		Object
	],
	closeOnBack: {
		type: Boolean,
		default: !0
	},
	contained: Boolean,
	contentClass: null,
	contentProps: null,
	disabled: Boolean,
	opacity: [Number, String],
	noClickAnimation: Boolean,
	modelValue: Boolean,
	persistent: Boolean,
	scrim: {
		type: [Boolean, String],
		default: !0
	},
	zIndex: {
		type: [Number, String],
		default: 2e3
	},
	...gt(),
	...be(),
	...De(),
	...Ce(),
	...Ke(),
	...st(),
	...bt(),
	...O(),
	...Oe()
}, "VOverlay"), Rt = v()({
	name: "VOverlay",
	directives: { vClickOutside: Pt },
	inheritAttrs: !1,
	props: {
		_disableGlobalStack: Boolean,
		_submenu: Boolean,
		...de(Lt(), ["disableInitialFocus"])
	},
	emits: {
		"click:outside": (e) => !0,
		"update:modelValue": (e) => !0,
		keydown: (e) => !0,
		afterEnter: () => !0,
		afterLeave: () => !0
	},
	setup(e, { slots: t, attrs: n, emit: r }) {
		let s = m("VOverlay"), c = z(), u = z(), d = z(), p = N(e, "modelValue"), h = U({
			get: () => p.value,
			set: (t) => {
				t && e.disabled || (p.value = t);
			}
		}), { themeClasses: g } = ne(e), { rtlClasses: _, isRtl: v } = P(), { hasContent: S, onAfterLeave: w } = we(e, h), T = ve(() => o(e.scrim) ? e.scrim : null), { globalTop: O, localTop: k, stackStyles: A } = Dt(h, () => e.zIndex, e._disableGlobalStack), { activatorEl: M, activatorRef: ee, target: F, targetEl: ie, targetRef: R, activatorEvents: ae, contentEvents: oe, scrimEvents: se, openedByHover: ce } = _t(e, {
			isActive: h,
			isTop: k,
			contentEl: d,
			isSubmenu: e._submenu
		}), { teleportTarget: V } = Ot(() => {
			let t = e.attach || e.contained;
			if (t) return t;
			let n = M?.value?.getRootNode() || s.proxy?.$el?.getRootNode();
			return n instanceof ShadowRoot && n;
		}), { dimensionStyles: le } = Ee(e), ue = Tt(), H = U(() => e.locationStrategy === "static" ? Je(e.location) : void 0), { scopeId: de } = Te();
		l(() => e.disabled, (e) => {
			e && (h.value = !1);
		});
		let { contentStyles: fe, updateLocation: G } = qe(e, {
			isRtl: v,
			contentEl: d,
			target: F,
			isActive: h
		});
		ct(e, {
			root: c,
			contentEl: d,
			targetEl: ie,
			target: F,
			isActive: h,
			updateLocation: G
		});
		let K = I(Z, null);
		s.parent?.type?.name !== "VMenu" && x(Z, null);
		function pe(t) {
			r("click:outside", t), e.persistent ? Y() : h.value = !1, e.scrim || K?.closeParents(t);
		}
		function me(t) {
			return h.value && k.value && (!e.scrim || t.target === u.value || t instanceof MouseEvent && t.shadowTarget === u.value);
		}
		wt(e, {
			isActive: h,
			localTop: k,
			contentEl: d
		});
		let he = !1;
		C(() => {
			d.value && (M.value ? Ft.set(d.value, M.value) : Ft.delete(d.value));
		});
		function q(e) {
			let t = e, n = /* @__PURE__ */ new Set();
			for (; t;) {
				let e = t.closest(".v-overlay__content");
				if (!e || n.has(e)) return !1;
				if (e === d.value) return !0;
				n.add(e), t = Ft.get(e) ?? null;
			}
			return !1;
		}
		function ge() {
			let e = M.value;
			if (!e || !e.isConnected || e.closest(".v-overlay__content") || d.value?._clickOutside?.lastMousedownWasOutside) return;
			let t = B();
			if (!((!t || t === document.body) && he || t === e || e.contains(t) || q(t))) return;
			let n = e.parentElement, r = n ? L(n) : [], i;
			if (r.includes(e)) i = e;
			else {
				let t = L(e);
				i = t.find((e) => e.tagName === "INPUT" || e.tagName === "TEXTAREA") ?? t[0];
			}
			i?.focus({ preventScroll: !0 });
		}
		l(h, (e) => {
			if (e) {
				let e = B(), t = M.value;
				he = !!t && (e === t || t.contains(e)), d.value && (d.value.inert = !1), d.value?._clickOutside && (d.value._clickOutside.lastMousedownWasOutside = !1);
			} else d.value && (d.value.inert = !0), ge();
		}, { flush: "post" }), b && l(h, (e) => {
			e ? window.addEventListener("keydown", be) : window.removeEventListener("keydown", be);
		}, { immediate: !0 }), i(() => {
			b && window.removeEventListener("keydown", be);
		});
		function be(t) {
			t.key === "Escape" && O.value && (d.value?.contains(B()) || r("keydown", t), e.persistent ? Y() : (h.value = !1, d.value?.contains(B()) && M.value?.focus()));
		}
		function xe(e) {
			(e.key !== "Escape" || O.value) && r("keydown", e);
		}
		let J = Ae();
		D(() => e.closeOnBack, () => {
			je(J, () => {
				if (O.value && h.value) return e.persistent ? Y() : h.value = !1, !1;
			});
		});
		let Ce = z();
		l(() => h.value && (e.absolute || e.contained) && V.value == null, (e) => {
			if (e) {
				let e = Se(c.value);
				e && e !== document.scrollingElement && (Ce.value = e.scrollTop);
			}
		});
		function Y() {
			e.noClickAnimation || d.value && _e(d.value, [
				{ transformOrigin: "center" },
				{ transform: "scale(1.03)" },
				{ transformOrigin: "center" }
			], {
				duration: 150,
				easing: "cubic-bezier(0.4, 0, 0.2, 1)"
			});
		}
		function De() {
			r("afterEnter");
		}
		function Oe() {
			w(), r("afterLeave");
		}
		return ye(() => W(re, null, [t.activator?.({
			isActive: h.value,
			targetRef: R,
			props: f({ ref: ee }, ae.value, e.activatorProps)
		}), ue.value && S.value && y(te, {
			disabled: !V.value,
			to: V.value
		}, { default: () => [W("div", f({
			class: [
				"v-overlay",
				{
					"v-overlay--absolute": e.absolute || e.contained,
					"v-overlay--active": h.value,
					"v-overlay--contained": e.contained
				},
				H.value,
				g.value,
				_.value,
				e.class
			],
			style: [
				A.value,
				{
					"--v-overlay-opacity": e.opacity,
					top: a(Ce.value)
				},
				e.style
			],
			ref: c,
			onKeydown: xe
		}, de, n), [y(It, f({
			color: T,
			modelValue: h.value && !!e.scrim,
			ref: u
		}, se.value), null), y(ke, {
			appear: !0,
			persisted: !0,
			transition: e.transition,
			target: F.value,
			onAfterEnter: De,
			onAfterLeave: Oe
		}, { default: () => [E(W("div", f({
			ref: d,
			class: ["v-overlay__content", e.contentClass],
			style: [le.value, fe.value]
		}, oe.value, e.contentProps), [t.default?.({ isActive: h })]), [[j, h.value], [Pt, {
			handler: pe,
			closeConditional: me,
			include: () => h.value ? [M.value, ...Array.from(document.querySelectorAll(".v-overlay__content")).filter(q)] : []
		}]])] })])] })])), {
			activatorEl: M,
			scrimEl: u,
			target: F,
			animateClick: Y,
			contentEl: d,
			rootEl: c,
			globalTop: O,
			localTop: k,
			updateLocation: G,
			openedByHover: ce
		};
	}
});
//#endregion
export { Re as a, Ve as i, Lt as n, Z as r, Rt as t };
