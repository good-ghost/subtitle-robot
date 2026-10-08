import { A as e, Bn as t, En as n, Fn as r, G as i, Gn as a, Ht as o, Jn as s, Mn as c, Nn as l, Rn as u, St as ee, T as d, Tn as f, Xn as p, Yn as m, _ as te, _r as h, _t as ne, bn as g, c as _, dr as v, er as y, g as re, jn as b, l as ie, mn as x, mr as ae, on as S, or as C, rr as w, v as T, vn as E, vt as D, yn as O } from "./vuetify-C39-WP9g.js";
import { n as k, r as A } from "./notifyStore-DTKHnvLP.js";
import { a as j, n as M, r as N, t as P } from "./rounded-1DPtyqNn.js";
import { i as F, n as I, t as L } from "./VOverlay-DFwN_aF6.js";
import { c as oe } from "./define-BovISfN4.js";
import { t as se } from "./scopeId-3i3jaqkB.js";
import { t as R } from "./resizeObserver-4FxWWYaw.js";
import { a as z } from "./density-9WZgplEH.js";
import { t as B } from "./VAvatar-DdB1q11O.js";
import { c as V, l as H, s as U } from "./router-C0qlu-KG.js";
import { t as W } from "./forwardRefs-mn8VYMvs.js";
import { t as G } from "./VBtn-CV2MWNTN.js";
import { t as ce } from "./VProgressCircular-CetUt3jx.js";
import { i as le } from "./loader-DtB2K0GR.js";
import { n as ue, t as K } from "./position-UZ3CZfcL.js";
//#region node_modules/vuetify/lib/composables/layout.js
var q = Symbol.for("vuetify:layout");
e({
	overlaps: {
		type: Array,
		default: () => []
	},
	fullHeight: Boolean
}, "layout"), e({
	name: { type: String },
	order: {
		type: [Number, String],
		default: 0
	},
	absolute: Boolean
}, "layout-item");
function de() {
	let e = b(q);
	if (!e) throw Error("[Vuetify] Could not find injected layout");
	return {
		getLayoutItem: e.getLayoutItem,
		mainRect: e.mainRect,
		mainStyles: e.mainStyles,
		layoutRect: e.layoutRect
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSnackbarQueue/queue.js
var J = Symbol.for("vuetify:v-snackbar-queue");
function fe(e, t) {
	let n = b(J, null);
	if (!n) return null;
	let i = a();
	n.register(i), r(() => n.unregister(i)), s(e, (e) => !e && n.unregister(i), { flush: "sync" });
	let { resizeRef: o, contentRect: c } = R();
	return s(t, (e) => {
		o.value = e ?? null;
	}), s(c, (e) => {
		e?.width && n.setSize(i, e.height, e.width);
	}), {
		id: i,
		offset: E(() => n.getOffset(i))
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSnackbar/VSnackbar.js
function pe(e) {
	let t = C(e()), n = -1;
	function r() {
		clearInterval(n);
	}
	function i() {
		r(), l(() => t.value = e());
	}
	function a(i) {
		let a = i ? getComputedStyle(i) : { transitionDuration: .2 }, o = parseFloat(a.transitionDuration) * 1e3 || 200;
		if (r(), t.value <= 0) return;
		let s = performance.now();
		n = window.setInterval(() => {
			let n = performance.now() - s + o;
			t.value = Math.max(e() - n, 0), t.value <= 0 && r();
		}, o);
	}
	return y(r), {
		clear: r,
		time: t,
		start: a,
		reset: i
	};
}
var Y = e({
	collapsed: Object,
	loading: Boolean,
	prependAvatar: String,
	prependIcon: T,
	queueGap: Number,
	queueIndex: Number,
	title: String,
	text: String,
	reverseTimer: Boolean,
	timer: {
		type: [Boolean, String],
		default: !1
	},
	timerColor: String,
	timeout: {
		type: [Number, String],
		default: 5e3
	},
	vertical: Boolean,
	...N({ location: "bottom center" }),
	...K(),
	...P(),
	...V(),
	..._(),
	...D(I({
		closeOnBack: !1,
		locationStrategy: null,
		transition: "v-snackbar-transition"
	}), [
		"persistent",
		"noClickAnimation",
		"offset",
		"retainFocus",
		"captureFocus",
		"disableInitialFocus",
		"location",
		"scrim",
		"scrollStrategy",
		"stickToTarget",
		"viewportMargin"
	])
}, "VSnackbar"), X = d()({
	name: "VSnackbar",
	props: Y(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let n = re(e, "modelValue"), { positionClasses: r } = ue(e), { scopeId: a } = se(), { themeClasses: d } = ie(e), { colorClasses: p, colorStyles: h, variantClasses: g } = H(e), { roundedClasses: _, roundedStyles: v } = M(e), y = pe(() => Number(e.timeout)), S = w(), T = fe(n, () => S.value?.contentEl), D, k = w(), A = C(!1), N = C(!1), P = C(0), F = w(), I = b(q, void 0);
		te(() => !!I, () => {
			let e = de();
			m(() => {
				F.value = e.mainStyles.value;
			});
		}), s(n, V), s(() => e.timeout, V), u(() => {
			n.value && V();
		});
		let R = -1;
		function V() {
			y.clear(), window.clearTimeout(R);
			let t = Number(e.timeout);
			if (!n.value || t === -1) return;
			y.reset();
			let r = ee(k.value);
			l(() => y.start(r)), R = window.setTimeout(() => {
				n.value = !1;
			}, t);
		}
		function G() {
			y.reset(), window.clearTimeout(R);
		}
		function K() {
			A.value = !0, G();
		}
		function J() {
			A.value = !1, N.value || V();
		}
		function Y() {
			N.value = !0, G();
		}
		function X(e) {
			(S.value?.contentEl)?.contains(e.relatedTarget) || (N.value = !1, A.value || V());
		}
		function Z(e) {
			P.value = e.touches[0].clientY;
		}
		function Q(e) {
			Math.abs(P.value - e.changedTouches[0].clientY) > 50 && (n.value = !1);
		}
		function $() {
			A.value && J(), N.value = !1;
		}
		let me = E(() => e.location.split(" ").reduce((e, t) => (e[`v-snackbar--${t}`] = !0, e), {})), he = E(() => {
			let [t, n] = e.location.split(" ");
			return t === "bottom" || ["left", "right"].includes(t) && n === "end" ? -1 : 1;
		}), ge = E(() => e.collapsed ? {
			"--v-snackbar-collapsed-height": i(e.collapsed.height),
			"--v-snackbar-collapsed-width": i(e.collapsed.width)
		} : null), _e = E(() => {
			if (T) return T.offset.value === null ? D : D = i(T.offset.value);
		}), ve = E(() => {
			if (!o(e.transition) || !e.transition.endsWith("-auto")) return e.transition;
			let t = e.transition.replace("-auto", ""), [n, r] = e.location.split(" ");
			return `${t}-${[
				"start",
				"end",
				"left",
				"right"
			].includes(r) || ["left", "right"].includes(n) ? "x" : "y"}${["end", "right"].includes(r) || !["start", "left"].includes(r) && ["bottom", "right"].includes(n) ? "-reverse" : ""}-transition`;
		});
		return oe(() => {
			let o = L.filterProps({
				...e,
				location: e.location,
				locationStrategy: e.locationStrategy ?? ne
			}), s = !!(e.prependAvatar || e.prependIcon), l = !!(s || e.loading || t.prepend), u = !!(t.default || t.text || t.title || e.text || e.title);
			return f(L, c({
				ref: S,
				class: [
					"v-snackbar",
					{
						"v-snackbar--active": n.value,
						"v-snackbar--collapsed": !!e.collapsed,
						"v-snackbar--timer": !!e.timer,
						"v-snackbar--vertical": e.vertical
					},
					me.value,
					r.value,
					e.class
				],
				style: [
					F.value,
					{
						"--v-snackbar-offset": _e.value,
						"--v-snackbar-gap": i(e.queueGap),
						"--v-snackbar-index": e.queueIndex,
						"--v-snackbar-direction": he.value
					},
					ge.value,
					e.style
				]
			}, o, {
				transition: ve.value,
				modelValue: n.value,
				"onUpdate:modelValue": (e) => n.value = e,
				contentProps: c({
					class: [
						"v-snackbar__wrapper",
						d.value,
						p.value,
						_.value,
						g.value
					],
					style: [h.value, v.value],
					onPointerenter: K,
					onPointerleave: J,
					onFocusin: Y,
					onFocusout: X
				}, o.contentProps),
				persistent: !0,
				noClickAnimation: !0,
				scrim: !1,
				scrollStrategy: "none",
				onTouchstartPassive: Z,
				onTouchend: Q,
				onAfterLeave: $
			}, a), {
				default: () => [
					U(!1, "v-snackbar"),
					t.header && O("div", { class: "v-snackbar__header" }, [t.header?.()]),
					e.timer && Number(e.timeout) > 0 && !A.value && O("div", {
						key: "timer",
						class: ae(["v-snackbar__timer", `v-snackbar__timer--${e.timer === "bottom" ? "bottom" : "top"}`])
					}, [f(le, {
						ref: k,
						color: e.timerColor ?? "info",
						max: e.timeout,
						modelValue: e.reverseTimer ? Number(e.timeout) - y.time.value : y.time.value
					}, null)]),
					l && f(j, {
						key: "prepend-defaults",
						disabled: !s && !e.loading,
						defaults: {
							VAvatar: { image: e.prependAvatar },
							VIcon: { icon: e.prependIcon },
							VProgressCircular: {
								indeterminate: !0,
								size: 24,
								width: 3
							}
						}
					}, { default: () => [O("div", { class: "v-snackbar__prepend" }, [t.prepend ? t.prepend() : O(x, null, [
						e.loading && f(ce, null, null),
						!e.loading && e.prependAvatar && f(B, null, null),
						!e.loading && e.prependIcon && f(z, null, null)
					])])] }),
					u && O("div", {
						key: "content",
						class: "v-snackbar__content",
						role: "status",
						"aria-live": "polite"
					}, [
						t.title?.() ?? (e.title ? O("div", {
							class: "v-snackbar__title",
							key: "title"
						}, [e.title]) : ""),
						t.text?.() ?? e.text,
						t.default?.()
					]),
					t.actions && f(j, { defaults: { VBtn: {
						variant: "text",
						ripple: !1,
						slim: !0
					} } }, { default: () => [O("div", { class: "v-snackbar__actions" }, [t.actions({ isActive: n })])] })
				],
				activator: t.activator
			});
		}), W({}, S);
	}
}), Z = { "data-part": "text" }, Q = /* @__PURE__ */ n({
	__name: "SmartviewToast.ce",
	props: {
		location: {
			default: "top right",
			type: String
		},
		overlayTarget: {
			default: "body",
			type: String
		}
	},
	setup(e) {
		let n = e, { t: i } = S(), { overlayDefaults: a } = F(() => n.overlayTarget), o = C(null);
		u(() => o.value = A()), r(() => o.value?.unregister());
		let s = E(() => k.show && (o.value?.isActive() ?? !1));
		function c(e) {
			k.show = e;
		}
		function l() {
			k.show = !1;
		}
		return (n, r) => (t(), g(v(j), { defaults: v(a) }, {
			default: p(() => [(t(), g(v(X), {
				key: v(k).id,
				"model-value": s.value,
				color: v(k).color,
				timeout: v(k).timeout,
				location: e.location,
				rounded: "lg",
				"data-part": "snackbar",
				"onUpdate:modelValue": c
			}, {
				actions: p(() => [f(v(G), {
					icon: "mdi-close",
					size: "small",
					variant: "text",
					"aria-label": v(i)("smartview.close"),
					"data-part": "close",
					onClick: l
				}, null, 8, ["aria-label"])]),
				default: p(() => [O("span", Z, h(v(k).text), 1)]),
				_: 1
			}, 8, [
				"model-value",
				"color",
				"timeout",
				"location"
			]))]),
			_: 1
		}, 8, ["defaults"]));
	}
});
//#endregion
export { Q as t };
