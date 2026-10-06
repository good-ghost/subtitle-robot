import { A as e, Bt as t, Ct as n, Dn as r, En as i, F as a, Fn as o, G as s, Gn as c, Hn as l, Ht as u, I as d, J as f, Jn as p, Kn as m, L as h, Lt as g, Mn as _, O as v, R as y, T as b, Tn as x, Tt as S, Un as C, Vn as w, W as T, Xn as E, Yn as D, Yt as O, Z as k, Zn as A, _ as j, c as M, cn as ee, er as N, fn as P, ft as F, g as I, gt as te, h as ne, i as L, ir as R, kn as re, l as ie, ln as ae, nr as z, nt as B, on as oe, p as se, pn as V, q as H, r as ce, rt as U, tn as le, tr as ue, vt as de, yn as W, z as fe, zt as G } from "./vuetify-DJ4bsPds.js";
import { c as K, l as pe, o as me, s as he, u as q } from "./rounded-CXkAtXly.js";
import { n as ge, t as _e } from "./animation-BZ-bP6So.js";
import { a as ve, c as ye, l as be } from "./define-BG7hCbXs.js";
import { n as xe } from "./ripple-B14E6MmL.js";
import { a as J, i as Se, n as Ce, o as Y, r as we, t as Te } from "./scopeId-BKRO7vOB.js";
import { i as Ee, r as De } from "./density-Dh8nVFPw.js";
import { n as Oe, t as ke } from "./transition-Dl3j6lCH.js";
import { i as Ae, n as je } from "./router-BNmKTwUJ.js";
//#region node_modules/vuetify/lib/util/bindProps.js
var Me = /* @__PURE__ */ new WeakMap();
function Ne(e, t) {
	Object.keys(t).forEach((n) => {
		if (F(n)) {
			let r = k(n), i = Me.get(e);
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
		if (F(t)) {
			let n = k(t), r = Me.get(e);
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
	if (!g(e.getRootNode)) {
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
	return ce(e.shadowRoot, L()), e.shadowRoot;
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
	let t = P(() => e() === "body" ? ze(Re()) : void 0);
	return {
		attachTarget: t,
		overlayDefaults: P(() => {
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
		validator: (e) => g(e) || e in Ge
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
	let n = A({}), r = A();
	S && j(() => !!(t.isActive.value && e.locationStrategy), (s) => {
		l(() => e.locationStrategy, s), p(() => {
			window.removeEventListener("resize", i), visualViewport?.removeEventListener("resize", a), visualViewport?.removeEventListener("scroll", o), r.value = void 0, t.isActive.value && (n.value = {});
		}), window.addEventListener("resize", i, { passive: !0 }), visualViewport?.addEventListener("resize", a, { passive: !0 }), visualViewport?.addEventListener("scroll", o, { passive: !0 }), g(e.locationStrategy) ? r.value = e.locationStrategy(t, e, n)?.updateLocation : r.value = Ge[e.locationStrategy](t, e, n)?.updateLocation;
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
	let { preferredAnchor: o, preferredOrigin: c } = f(() => {
		let t = q(n.location ?? "bottom", e.isRtl.value), r = n.origin === "overlap" ? t : n.origin === "auto" ? K(t) : q(n.origin, e.isRtl.value);
		return t.side === r.side && t.align === me(r).align ? {
			preferredAnchor: he(t),
			preferredOrigin: he(r)
		} : {
			preferredAnchor: t,
			preferredOrigin: r
		};
	}), [m, g, _, v] = [
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
				let e = d(o);
				return parseFloat(a) * (i ? e.width : e.height) / 100;
			}
			return Xe(a, o, i);
		};
	}), b = P(() => {
		if (Array.isArray(n.offset)) return n.offset;
		if (u(n.offset)) {
			let e = n.offset.split(" ").map(parseFloat);
			return e.length < 2 && e.push(0), e;
		}
		return t(n.offset) ? [n.offset, 0] : [0, 0];
	}), x = !1, S = -1, C = new fe(4), w = new ResizeObserver(() => {
		if (!x) return;
		if (requestAnimationFrame((e) => {
			e !== S && C.clear(), requestAnimationFrame((e) => {
				S = e;
			});
		}), C.isFull) {
			let e = C.values();
			if (xe(e.at(-1), e.at(-3)) && !xe(e.at(-1), e.at(-2))) return;
		}
		let e = D();
		e && C.push(e.flipped);
	}), E = new a({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});
	l(e.target, (e, t) => {
		t && !Array.isArray(t) && w.unobserve(t), Array.isArray(e) ? xe(e, t) || D() : e && w.observe(e);
	}, { immediate: !0 }), l(e.contentEl, (e, t) => {
		t && w.unobserve(t), e && w.observe(e);
	}, { immediate: !0 }), p(() => {
		w.disconnect();
	});
	function D() {
		if (x = !1, requestAnimationFrame(() => x = !0), !e.target.value || !e.contentEl.value) return;
		(Array.isArray(e.target.value) || e.target.value.offsetParent || e.target.value.getClientRects().length) && (E = y(e.target.value));
		let t = Ze(e.contentEl.value, e.isRtl.value), r = J(e.contentEl.value), l = Number(n.viewportMargin), u = m(), f = g(), p = _(), S = v();
		r.length || (r.push(document.documentElement), e.contentEl.value.style.top && e.contentEl.value.style.left || (t.x -= parseFloat(document.documentElement.style.getPropertyValue("--v-body-scroll-x") || 0), t.y -= parseFloat(document.documentElement.style.getPropertyValue("--v-body-scroll-y") || 0)));
		let C = r.reduce((e, t) => {
			let n = d(t);
			return e ? new a({
				x: Math.max(e.left, n.left),
				y: Math.max(e.top, n.top),
				width: Math.min(e.right, n.right) - Math.max(e.left, n.left),
				height: Math.min(e.bottom, n.bottom) - Math.max(e.top, n.top)
			}) : n;
		}, void 0);
		n.stickToTarget ? (C.x += Math.min(l, E.x), C.y += Math.min(l, E.y), C.width = Math.max(C.width - l * 2, E.x + E.width - l), C.height = Math.max(C.height - l * 2, E.y + E.height - l)) : (C.x += l, C.y += l, C.width -= l * 2, C.height -= l * 2);
		let w = {
			anchor: o.value,
			origin: c.value
		};
		function D(e) {
			let n = new a(t), { x: r, y: i } = Ue(We(e.anchor, E), We(e.origin, n));
			switch (e.anchor.side) {
				case "top":
					i -= b.value[0];
					break;
				case "bottom":
					i += b.value[0];
					break;
				case "left":
					r -= b.value[0];
					break;
				case "right": r += b.value[0];
			}
			switch (e.anchor.align) {
				case "top":
					i -= b.value[1];
					break;
				case "bottom":
					i += b.value[1];
					break;
				case "left":
					r -= b.value[1];
					break;
				case "right": r += b.value[1];
			}
			return n.x += r, n.y += i, n.width = Math.min(n.width, p), n.height = Math.min(n.height, S), {
				overflows: h(n, C),
				x: r,
				y: i
			};
		}
		let k = 0, A = 0, j = {
			x: 0,
			y: 0
		}, M = {
			x: !1,
			y: !1
		}, ee = -1;
		for (;;) {
			if (ee++ > 10) {
				O("Infinite loop detected in connectedLocationStrategy");
				break;
			}
			let { x: e, y: n, overflows: r } = D(w);
			k += e, A += n, t.x += e, t.y += n;
			{
				let e = pe(w.anchor), t = r.x.before || r.x.after, n = r.y.before || r.y.after, i = !1;
				if (["x", "y"].forEach((a) => {
					if (a === "x" && t && !M.x || a === "y" && n && !M.y) {
						let t = {
							anchor: { ...w.anchor },
							origin: { ...w.origin }
						}, n = a === "x" ? e === "y" ? me : K : e === "y" ? K : me;
						t.anchor = n(t.anchor), t.origin = n(t.origin);
						let { overflows: o } = D(t);
						(o[a].before <= r[a].before && o[a].after <= r[a].after || o[a].before + o[a].after < (r[a].before + r[a].after) / 2) && (w = t, i = M[a] = !0);
					}
				}), i) continue;
			}
			r.x.before && (k += r.x.before, t.x += r.x.before), r.x.after && (k -= r.x.after, t.x -= r.x.after), r.y.before && (A += r.y.before, t.y += r.y.before), r.y.after && (A -= r.y.after, t.y -= r.y.after);
			{
				let e = h(t, C);
				j.x = C.width - e.x.before - e.x.after, j.y = C.height - e.y.before - e.y.after, k += e.x.before, t.x += e.x.before, A += e.y.before, t.y += e.y.before;
			}
			break;
		}
		let N = pe(w.anchor), P = n.origin !== "auto" && n.origin !== "overlap" ? q(n.origin, e.isRtl.value) : w.origin;
		return Object.assign(i.value, {
			"--v-overlay-anchor-origin": `${w.anchor.side} ${w.anchor.align}`,
			transformOrigin: `${P.side} ${P.align}`,
			top: s($e(A)),
			left: e.isRtl.value ? void 0 : s($e(k)),
			right: e.isRtl.value ? s($e(-k)) : void 0,
			minWidth: s(N === "y" ? Math.min(u, E.width) : u),
			maxWidth: s(et(T(j.x, u === Infinity ? 0 : u, p))),
			maxHeight: s(et(T(j.y, f === Infinity ? 0 : f, S)))
		}), {
			available: j,
			contentBox: t,
			flipped: M
		};
	}
	return l(() => [
		o.value,
		c.value,
		n.origin,
		n.offset,
		n.minWidth,
		n.minHeight,
		n.maxWidth,
		n.maxHeight
	], () => D()), r(() => {
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
	validator: (e) => g(e) || e in ot
} }, "VOverlay-scroll-strategies");
function ct(e, t) {
	if (!S) return;
	let n;
	C(async () => {
		n?.stop(), t.isActive.value && e.scrollStrategy && (n = m(), await new Promise((e) => setTimeout(e)), n.active && n.run(() => {
			g(e.scrollStrategy) ? e.scrollStrategy(t, e, n) : ot[e.scrollStrategy]?.(t, e, n);
		}));
	}), p(() => {
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
	let n = e.root.value?.offsetParent, r = ft(e.target.value, e.contentEl.value), i = [.../* @__PURE__ */ new Set([...J(r, t.contained ? n : void 0), ...J(e.contentEl.value, t.contained ? n : void 0)])].filter((e) => !e.classList.contains("v-overlay-scroll-blocked")), a = window.innerWidth - document.documentElement.offsetWidth, o = ((e) => Y(e) && e)(n || document.documentElement);
	o && e.root.value.classList.add("v-overlay--scroll-blocked"), i.forEach((e, t) => {
		e.style.setProperty("--v-body-scroll-x", s(-e.scrollLeft)), e.style.setProperty("--v-body-scroll-y", s(-e.scrollTop)), (e !== document.documentElement || getComputedStyle(e).overflowY !== "scroll") && e.style.setProperty("--v-scrollbar-offset", s(a)), e.classList.add("v-overlay-scroll-blocked");
	}), p(() => {
		i.forEach((e, t) => {
			let n = parseFloat(e.style.getPropertyValue("--v-body-scroll-x")), r = parseFloat(e.style.getPropertyValue("--v-body-scroll-y")), i = e.style.scrollBehavior;
			e.style.scrollBehavior = "auto", e.style.removeProperty("--v-body-scroll-x"), e.style.removeProperty("--v-body-scroll-y"), e.style.removeProperty("--v-scrollbar-offset"), e.classList.remove("v-overlay-scroll-blocked"), e.scrollLeft = -n, e.scrollTop = -r, e.style.scrollBehavior = i;
		}), o && e.root.value.classList.remove("v-overlay--scroll-blocked");
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
	}), p(() => {
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
	}), p(() => {
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
			n = H(o, () => {
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
function _t(e, { isActive: t, isTop: i, contentEl: a, isSubmenu: o = !1 }) {
	let s = v("useActivator"), c = A(), u = x(Z, null), d = !1, f = !1, h = !0, g = A(!1), _ = !1, y = () => !o || (u?.rootOpenedByHover?.() ?? g.value), b = P(() => e.openOnFocus || e.openOnFocus == null && e.openOnHover), w = P(() => e.openOnClick || e.openOnClick == null && !e.openOnHover && !b.value), { runOpenDelay: T, runCloseDelay: E } = ht(e, (n) => {
		n === (e.openOnHover && d || b.value && f) && !(e.openOnHover && t.value && !i.value) && (t.value !== n && (h = !0, n && (_ = !0, g.value = d && e.openOnHover)), t.value = n);
	}), D = !1;
	l(t, (e) => {
		if (!e) {
			D = !0, setTimeout(() => D = !1, 50), g.value = !1, _ = !1;
			return;
		}
		_ || (g.value = !1), _ = !1;
	});
	let O = A(), k = {
		onClick: (e) => {
			(!D || t.value) && (e.stopPropagation(), c.value = e.currentTarget || e.target, t.value || (O.value = [e.clientX, e.clientY]), t.value = !t.value);
		},
		onMouseenter: (t) => {
			d = !0, c.value = t.currentTarget || t.target, e.target === "cursor" && (O.value = [t.clientX, t.clientY]), T();
		},
		onMousemove: (e) => {
			O.value = [e.clientX, e.clientY];
		},
		onMouseleave: (t) => {
			d = !1, e.target === "cursor" && (f = !1), y() && E();
		},
		onFocus: (e) => {
			D || te(e.target, ":focus-visible") !== !1 && (f = !0, e.stopPropagation(), c.value = e.currentTarget || e.target, T());
		},
		onBlur: (e) => {
			let t = e.relatedTarget;
			t && !a.value?.contains(t) && (f = !1, e.stopPropagation(), E({ minDelay: 1 }));
		}
	}, j = P(() => {
		let t = {};
		return w.value && (t.onClick = k.onClick), e.openOnHover && (t.onMouseenter = k.onMouseenter, t.onMouseleave = k.onMouseleave, e.target === "cursor" && !w.value && (t.onMousemove = k.onMousemove)), b.value && (t.onFocus = k.onFocus, t.onBlur = k.onBlur), t;
	}), M = P(() => {
		let n = {};
		if (e.openOnHover && (n.onMouseenter = () => {
			d = !0, T();
		}, n.onMouseleave = () => {
			d = !1, y() && E();
		}), b.value && (n.onFocusin = (e) => {
			e.target.matches(":focus-visible") && (f = !0, T());
		}, n.onFocusout = (e) => {
			let t = e.relatedTarget;
			t && !a.value?.contains(t) && (f = !1, E({ minDelay: 1 }));
		}), e.closeOnContentClick) {
			let e = x(Z, null);
			n.onClick = () => {
				t.value = !1, e?.closeParents();
			};
		}
		return n;
	}), ee = P(() => {
		let t = {};
		return e.openOnHover && (t.onMouseenter = () => {
			h && (d = !0, h = !1, T());
		}, t.onMouseleave = () => {
			d = !1, y() && E();
		}), t;
	});
	l(i, (t) => {
		t && y() && (e.openOnHover && !d && (!b.value || !f) || b.value && !f && (!e.openOnHover || !d)) && !a.value?.contains(U()) && E();
	}), l(t, (e) => {
		e || setTimeout(() => {
			O.value = void 0;
		});
	}, { flush: "post" });
	let N = n();
	C(() => {
		N.value && r(() => {
			c.value = N.el;
		});
	});
	let F = n(), I = P(() => e.target === "cursor" && O.value ? O.value : F.value ? F.el : yt(e.target, s) || c.value), ne = P(() => Array.isArray(I.value) ? void 0 : I.value), L;
	return l(() => !!e.activator, (t) => {
		t && S ? (L = m(), L.run(() => {
			vt(e, s, {
				activatorEl: c,
				activatorEvents: j
			});
		})) : L && L.stop();
	}, {
		flush: "post",
		immediate: !0
	}), p(() => {
		L?.stop();
	}), {
		activatorEl: c,
		activatorRef: N,
		target: I,
		targetEl: ne,
		targetRef: F,
		activatorEvents: j,
		contentEvents: M,
		scrimEvents: ee,
		openedByHover: g
	};
}
function vt(e, t, { activatorEl: n, activatorEvents: a }) {
	l(() => e.activator, (e, t) => {
		if (t && e !== t) {
			let e = c(t);
			e && s(e);
		}
		e && r(() => o());
	}, { immediate: !0 }), l(() => e.activatorProps, () => {
		o();
	}), p(() => {
		s();
	});
	function o(t = c(), n = e.activatorProps) {
		t && Ne(t, i(a.value, n));
	}
	function s(t = c(), n = e.activatorProps) {
		t && Pe(t, i(a.value, n));
	}
	function c(r = e.activator) {
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
	} else n = u(e) ? document.querySelector(e) : "$el" in e ? e.$el : e;
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
	let t = U();
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
		let n = B(t).filter((e) => e.tabIndex >= 0);
		e.preventDefault(), n.length ? e.shiftKey ? n[n.length - 1].focus() : n[0].focus() : t.focus({ preventScroll: !0 });
		return;
	}
	let a = B(r).filter((e) => e.tabIndex >= 0);
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
		document.removeEventListener("pointerdown", s), document.removeEventListener("keydown", u), await new Promise((e) => requestAnimationFrame(e)), t.value && !a && i !== o && r.value && R(n) && ![document, r.value].includes(o) && !r.value.contains(o) && B(r.value)[0]?.focus();
	}
	function u(e) {
		if (e.key === "Tab" && (document.removeEventListener("keydown", u), t.value && r.value && e.target && !r.value.contains(e.target))) {
			let t = B(document.documentElement);
			if (e.shiftKey && e.target === t.at(0) || !e.shiftKey && e.target === t.at(-1)) {
				let t = B(r.value);
				t.length > 0 && (e.preventDefault(), t[0].focus());
			}
		}
	}
	let d = z(() => t.value && e.captureFocus && !e.disableInitialFocus);
	S && (l(() => e.retainFocus, (e) => {
		e ? Q.set(i, {
			isActive: t,
			contentEl: r
		}) : Q.delete(i);
	}, { immediate: !0 }), l(d, (e) => {
		e ? (document.addEventListener("pointerdown", s), document.addEventListener("focusin", c, { once: !0 }), document.addEventListener("keydown", u)) : (document.removeEventListener("pointerdown", s), document.removeEventListener("focusin", c), document.removeEventListener("keydown", u));
	}, { immediate: !0 }), xt++ < 1 && document.addEventListener("keydown", Ct)), p(() => {
		Q.delete(i), S && (clearTimeout(o), document.removeEventListener("pointerdown", s), document.removeEventListener("focusin", c), document.removeEventListener("keydown", u), --xt < 1 && document.removeEventListener("keydown", Ct));
	});
}
//#endregion
//#region node_modules/vuetify/lib/composables/hydration.js
function Tt() {
	if (!S) return N(!1);
	let { ssr: e } = se();
	if (e) {
		let e = N(!1);
		return _(() => {
			e.value = !0;
		}), e;
	}
	return N(!0);
}
//#endregion
//#region node_modules/vuetify/lib/composables/stack.js
var Et = Symbol.for("vuetify:stack"), $ = D([]);
function Dt(e, t, n) {
	let r = v("useStack"), i = !n, a = x(Et, void 0), s = D({ activeChildren: /* @__PURE__ */ new Set() });
	o(Et, s);
	let c = N(Number(R(t)));
	j(e, () => {
		let e = $.at(-1)?.[1];
		c.value = e ? e + 10 : Number(R(t)), i && $.push([r.uid, c.value]), a?.activeChildren.add(r.uid), p(() => {
			if (i) {
				let e = ue($).findIndex((e) => e[0] === r.uid);
				$.splice(e, 1);
			}
			a?.activeChildren.delete(r.uid);
		});
	});
	let l = N(!0);
	i && C(() => {
		let e = $.at(-1)?.[0] === r.uid;
		setTimeout(() => l.value = e);
	});
	let u = z(() => !s.activeChildren.size);
	return {
		globalTop: E(l),
		localTop: u,
		stackStyles: z(() => ({ zIndex: c.value }))
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/teleport.js
function Ot(e) {
	return { teleportTarget: P(() => {
		let t = e();
		if (t === !0 || !S) return;
		let n = t === !1 ? document.body : u(t) ? document.querySelector(t) : t;
		if (!n) {
			w(`Unable to locate target ${t}`);
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
	let a = n.value, o = ((g(a) ? void 0 : a.include) || (() => []))();
	return o.push(t), !o.some((t) => t?.contains(e.target));
}
function jt(e, t) {
	let n = t.value;
	return ((g(n) ? void 0 : n.closeConditional) || kt)(e);
}
function Mt(e, t, n) {
	let r = g(n.value) ? n.value : n.value.handler;
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
	return W(le, {
		name: "fade-transition",
		appear: !0
	}, { default: () => [e.modelValue && V("div", i({
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
	...M(),
	...Oe()
}, "VOverlay"), Rt = b()({
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
		let a = v("VOverlay"), d = A(), f = A(), p = A(), m = I(e, "modelValue"), h = P({
			get: () => m.value,
			set: (t) => {
				t && e.disabled || (m.value = t);
			}
		}), { themeClasses: g } = ie(e), { rtlClasses: _, isRtl: y } = ne(), { hasContent: b, onAfterLeave: w } = we(e, h), T = ve(() => u(e.scrim) ? e.scrim : null), { globalTop: E, localTop: D, stackStyles: O } = Dt(h, () => e.zIndex, e._disableGlobalStack), { activatorEl: k, activatorRef: M, target: N, targetEl: F, targetRef: te, activatorEvents: L, contentEvents: R, scrimEvents: z, openedByHover: se } = _t(e, {
			isActive: h,
			isTop: D,
			contentEl: p,
			isSubmenu: e._submenu
		}), { teleportTarget: H } = Ot(() => {
			let t = e.attach || e.contained;
			if (t) return t;
			let n = k?.value?.getRootNode() || a.proxy?.$el?.getRootNode();
			return n instanceof ShadowRoot && n;
		}), { dimensionStyles: ce } = Ee(e), le = Tt(), ue = P(() => e.locationStrategy === "static" ? Je(e.location) : void 0), { scopeId: de } = Te();
		l(() => e.disabled, (e) => {
			e && (h.value = !1);
		});
		let { contentStyles: fe, updateLocation: G } = qe(e, {
			isRtl: y,
			contentEl: p,
			target: N,
			isActive: h
		});
		ct(e, {
			root: d,
			contentEl: p,
			targetEl: F,
			target: N,
			isActive: h,
			updateLocation: G
		});
		let K = x(Z, null);
		a.parent?.type?.name !== "VMenu" && o(Z, null);
		function pe(t) {
			r("click:outside", t), e.persistent ? Y() : h.value = !1, e.scrim || K?.closeParents(t);
		}
		function me(t) {
			return h.value && D.value && (!e.scrim || t.target === f.value || t instanceof MouseEvent && t.shadowTarget === f.value);
		}
		wt(e, {
			isActive: h,
			localTop: D,
			contentEl: p
		});
		let he = !1;
		C(() => {
			p.value && (k.value ? Ft.set(p.value, k.value) : Ft.delete(p.value));
		});
		function q(e) {
			let t = e, n = /* @__PURE__ */ new Set();
			for (; t;) {
				let e = t.closest(".v-overlay__content");
				if (!e || n.has(e)) return !1;
				if (e === p.value) return !0;
				n.add(e), t = Ft.get(e) ?? null;
			}
			return !1;
		}
		function ge() {
			let e = k.value;
			if (!e || !e.isConnected || e.closest(".v-overlay__content") || p.value?._clickOutside?.lastMousedownWasOutside) return;
			let t = U();
			if (!((!t || t === document.body) && he || t === e || e.contains(t) || q(t))) return;
			let n = e.parentElement, r = n ? B(n) : [], i;
			if (r.includes(e)) i = e;
			else {
				let t = B(e);
				i = t.find((e) => e.tagName === "INPUT" || e.tagName === "TEXTAREA") ?? t[0];
			}
			i?.focus({ preventScroll: !0 });
		}
		l(h, (e) => {
			if (e) {
				let e = U(), t = k.value;
				he = !!t && (e === t || t.contains(e)), p.value && (p.value.inert = !1), p.value?._clickOutside && (p.value._clickOutside.lastMousedownWasOutside = !1);
			} else p.value && (p.value.inert = !0), ge();
		}, { flush: "post" }), S && l(h, (e) => {
			e ? window.addEventListener("keydown", be) : window.removeEventListener("keydown", be);
		}, { immediate: !0 }), re(() => {
			S && window.removeEventListener("keydown", be);
		});
		function be(t) {
			t.key === "Escape" && E.value && (p.value?.contains(U()) || r("keydown", t), e.persistent ? Y() : (h.value = !1, p.value?.contains(U()) && k.value?.focus()));
		}
		function xe(e) {
			(e.key !== "Escape" || E.value) && r("keydown", e);
		}
		let J = Ae();
		j(() => e.closeOnBack, () => {
			je(J, () => {
				if (E.value && h.value) return e.persistent ? Y() : h.value = !1, !1;
			});
		});
		let Ce = A();
		l(() => h.value && (e.absolute || e.contained) && H.value == null, (e) => {
			if (e) {
				let e = Se(d.value);
				e && e !== document.scrollingElement && (Ce.value = e.scrollTop);
			}
		});
		function Y() {
			e.noClickAnimation || p.value && _e(p.value, [
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
		return ye(() => V(ee, null, [t.activator?.({
			isActive: h.value,
			targetRef: te,
			props: i({ ref: M }, L.value, e.activatorProps)
		}), le.value && b.value && W(ae, {
			disabled: !H.value,
			to: H.value
		}, { default: () => [V("div", i({
			class: [
				"v-overlay",
				{
					"v-overlay--absolute": e.absolute || e.contained,
					"v-overlay--active": h.value,
					"v-overlay--contained": e.contained
				},
				ue.value,
				g.value,
				_.value,
				e.class
			],
			style: [
				O.value,
				{
					"--v-overlay-opacity": e.opacity,
					top: s(Ce.value)
				},
				e.style
			],
			ref: d,
			onKeydown: xe
		}, de, n), [W(It, i({
			color: T,
			modelValue: h.value && !!e.scrim,
			ref: f
		}, z.value), null), W(ke, {
			appear: !0,
			persisted: !0,
			transition: e.transition,
			target: N.value,
			onAfterEnter: De,
			onAfterLeave: Oe
		}, { default: () => [c(V("div", i({
			ref: p,
			class: ["v-overlay__content", e.contentClass],
			style: [ce.value, fe.value]
		}, R.value, e.contentProps), [t.default?.({ isActive: h })]), [[oe, h.value], [Pt, {
			handler: pe,
			closeConditional: me,
			include: () => h.value ? [k.value, ...Array.from(document.querySelectorAll(".v-overlay__content")).filter(q)] : []
		}]])] })])] })])), {
			activatorEl: k,
			scrimEl: f,
			target: N,
			animateClick: Y,
			contentEl: p,
			rootEl: d,
			globalTop: E,
			localTop: D,
			updateLocation: G,
			openedByHover: se
		};
	}
});
//#endregion
export { Re as a, Ve as i, Lt as n, Z as r, Rt as t };
