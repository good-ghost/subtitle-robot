import { A as e, Dn as t, En as n, G as r, Hn as i, Ht as a, Jn as o, Mn as s, Pn as c, St as l, T as u, Tn as d, Un as f, Wn as p, Zn as m, _ as h, _t as ee, ar as g, bn as _, c as v, cn as y, cr as te, dr as b, en as x, er as S, fn as C, g as ne, kn as w, l as re, mn as T, pn as E, v as D, vt as O, yn as k, zn as A } from "./vuetify-DJ4bsPds.js";
import { d as j, u as M } from "./settings--jlXedH0.js";
import { a as N, n as ie, r as P, t as F } from "./rounded-CXkAtXly.js";
import { i as I, n as L, t as R } from "./VOverlay-BI1rs3Fd.js";
import { c as ae } from "./define-BG7hCbXs.js";
import { t as oe } from "./scopeId-BKRO7vOB.js";
import { t as z } from "./resizeObserver-iAwW3s60.js";
import { a as se } from "./density-Dh8nVFPw.js";
import { t as B } from "./VAvatar-B5evLdR9.js";
import { c as V, l as H, s as U } from "./router-BNmKTwUJ.js";
import { t as W } from "./forwardRefs-BcUquh0G.js";
import { t as G } from "./VBtn-D2PPPp70.js";
import { t as ce } from "./VProgressCircular-ZunkyD4q.js";
import { i as le } from "./loader-3S-Ajd36.js";
import { n as ue, t as K } from "./position-B7q6NTBl.js";
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
	let e = d(q);
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
	let n = d(J, null);
	if (!n) return null;
	let r = A();
	n.register(r), w(() => n.unregister(r)), i(e, (e) => !e && n.unregister(r), { flush: "sync" });
	let { resizeRef: a, contentRect: o } = z();
	return i(t, (e) => {
		a.value = e ?? null;
	}), i(o, (e) => {
		e?.width && n.setSize(r, e.height, e.width);
	}), {
		id: r,
		offset: C(() => n.getOffset(r))
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VSnackbar/VSnackbar.js
function pe(e) {
	let n = S(e()), r = -1;
	function i() {
		clearInterval(r);
	}
	function a() {
		i(), t(() => n.value = e());
	}
	function s(t) {
		let a = t ? getComputedStyle(t) : { transitionDuration: .2 }, o = parseFloat(a.transitionDuration) * 1e3 || 200;
		if (i(), n.value <= 0) return;
		let s = performance.now();
		r = window.setInterval(() => {
			let t = performance.now() - s + o;
			n.value = Math.max(e() - t, 0), n.value <= 0 && i();
		}, o);
	}
	return o(i), {
		clear: i,
		time: n,
		start: s,
		reset: a
	};
}
var Y = e({
	collapsed: Object,
	loading: Boolean,
	prependAvatar: String,
	prependIcon: D,
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
	...P({ location: "bottom center" }),
	...K(),
	...F(),
	...V(),
	...v(),
	...O(L({
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
}, "VSnackbar"), X = u()({
	name: "VSnackbar",
	props: Y(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: o }) {
		let c = ne(e, "modelValue"), { positionClasses: u } = ue(e), { scopeId: p } = oe(), { themeClasses: g } = re(e), { colorClasses: _, colorStyles: v, variantClasses: b } = H(e), { roundedClasses: x, roundedStyles: w } = ie(e), T = pe(() => Number(e.timeout)), D = m(), O = fe(c, () => D.value?.contentEl), A, j = m(), M = S(!1), P = S(!1), F = S(0), I = m(), L = d(q, void 0);
		h(() => !!L, () => {
			let e = de();
			f(() => {
				I.value = e.mainStyles.value;
			});
		}), i(c, V), i(() => e.timeout, V), s(() => {
			c.value && V();
		});
		let z = -1;
		function V() {
			T.clear(), window.clearTimeout(z);
			let n = Number(e.timeout);
			if (!c.value || n === -1) return;
			T.reset();
			let r = l(j.value);
			t(() => T.start(r)), z = window.setTimeout(() => {
				c.value = !1;
			}, n);
		}
		function G() {
			T.reset(), window.clearTimeout(z);
		}
		function K() {
			M.value = !0, G();
		}
		function J() {
			M.value = !1, P.value || V();
		}
		function Y() {
			P.value = !0, G();
		}
		function X(e) {
			(D.value?.contentEl)?.contains(e.relatedTarget) || (P.value = !1, M.value || V());
		}
		function Z(e) {
			F.value = e.touches[0].clientY;
		}
		function Q(e) {
			Math.abs(F.value - e.changedTouches[0].clientY) > 50 && (c.value = !1);
		}
		function me() {
			M.value && J(), P.value = !1;
		}
		let $ = C(() => e.location.split(" ").reduce((e, t) => (e[`v-snackbar--${t}`] = !0, e), {})), he = C(() => {
			let [t, n] = e.location.split(" ");
			return t === "bottom" || ["left", "right"].includes(t) && n === "end" ? -1 : 1;
		}), ge = C(() => e.collapsed ? {
			"--v-snackbar-collapsed-height": r(e.collapsed.height),
			"--v-snackbar-collapsed-width": r(e.collapsed.width)
		} : null), _e = C(() => {
			if (O) return O.offset.value === null ? A : A = r(O.offset.value);
		}), ve = C(() => {
			if (!a(e.transition) || !e.transition.endsWith("-auto")) return e.transition;
			let t = e.transition.replace("-auto", ""), [n, r] = e.location.split(" ");
			return `${t}-${[
				"start",
				"end",
				"left",
				"right"
			].includes(r) || ["left", "right"].includes(n) ? "x" : "y"}${["end", "right"].includes(r) || !["start", "left"].includes(r) && ["bottom", "right"].includes(n) ? "-reverse" : ""}-transition`;
		});
		return ae(() => {
			let t = R.filterProps({
				...e,
				location: e.location,
				locationStrategy: e.locationStrategy ?? ee
			}), i = !!(e.prependAvatar || e.prependIcon), a = !!(i || e.loading || o.prepend), s = !!(o.default || o.text || o.title || e.text || e.title);
			return k(R, n({
				ref: D,
				class: [
					"v-snackbar",
					{
						"v-snackbar--active": c.value,
						"v-snackbar--collapsed": !!e.collapsed,
						"v-snackbar--timer": !!e.timer,
						"v-snackbar--vertical": e.vertical
					},
					$.value,
					u.value,
					e.class
				],
				style: [
					I.value,
					{
						"--v-snackbar-offset": _e.value,
						"--v-snackbar-gap": r(e.queueGap),
						"--v-snackbar-index": e.queueIndex,
						"--v-snackbar-direction": he.value
					},
					ge.value,
					e.style
				]
			}, t, {
				transition: ve.value,
				modelValue: c.value,
				"onUpdate:modelValue": (e) => c.value = e,
				contentProps: n({
					class: [
						"v-snackbar__wrapper",
						g.value,
						_.value,
						x.value,
						b.value
					],
					style: [v.value, w.value],
					onPointerenter: K,
					onPointerleave: J,
					onFocusin: Y,
					onFocusout: X
				}, t.contentProps),
				persistent: !0,
				noClickAnimation: !0,
				scrim: !1,
				scrollStrategy: "none",
				onTouchstartPassive: Z,
				onTouchend: Q,
				onAfterLeave: me
			}, p), {
				default: () => [
					U(!1, "v-snackbar"),
					o.header && E("div", { class: "v-snackbar__header" }, [o.header?.()]),
					e.timer && Number(e.timeout) > 0 && !M.value && E("div", {
						key: "timer",
						class: te(["v-snackbar__timer", `v-snackbar__timer--${e.timer === "bottom" ? "bottom" : "top"}`])
					}, [k(le, {
						ref: j,
						color: e.timerColor ?? "info",
						max: e.timeout,
						modelValue: e.reverseTimer ? Number(e.timeout) - T.time.value : T.time.value
					}, null)]),
					a && k(N, {
						key: "prepend-defaults",
						disabled: !i && !e.loading,
						defaults: {
							VAvatar: { image: e.prependAvatar },
							VIcon: { icon: e.prependIcon },
							VProgressCircular: {
								indeterminate: !0,
								size: 24,
								width: 3
							}
						}
					}, { default: () => [E("div", { class: "v-snackbar__prepend" }, [o.prepend ? o.prepend() : E(y, null, [
						e.loading && k(ce, null, null),
						!e.loading && e.prependAvatar && k(B, null, null),
						!e.loading && e.prependIcon && k(se, null, null)
					])])] }),
					s && E("div", {
						key: "content",
						class: "v-snackbar__content",
						role: "status",
						"aria-live": "polite"
					}, [
						o.title?.() ?? (e.title ? E("div", {
							class: "v-snackbar__title",
							key: "title"
						}, [e.title]) : ""),
						o.text?.() ?? e.text,
						o.default?.()
					]),
					o.actions && k(N, { defaults: { VBtn: {
						variant: "text",
						ripple: !1,
						slim: !0
					} } }, { default: () => [E("div", { class: "v-snackbar__actions" }, [o.actions({ isActive: c })])] })
				],
				activator: o.activator
			});
		}), W({}, D);
	}
}), Z = { "data-part": "text" }, Q = /* @__PURE__ */ _({
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
		let t = e, { t: n } = x(), { overlayDefaults: r } = I(() => t.overlayTarget), i = S(null);
		s(() => i.value = j()), w(() => i.value?.unregister());
		let a = C(() => M.show && (i.value?.isActive() ?? !1));
		function o(e) {
			M.show = e;
		}
		function l() {
			M.show = !1;
		}
		return (t, i) => (c(), T(g(N), { defaults: g(r) }, {
			default: p(() => [(c(), T(g(X), {
				key: g(M).id,
				"model-value": a.value,
				color: g(M).color,
				timeout: g(M).timeout,
				location: e.location,
				rounded: "lg",
				"data-part": "snackbar",
				"onUpdate:modelValue": o
			}, {
				actions: p(() => [k(g(G), {
					icon: "mdi-close",
					size: "small",
					variant: "text",
					"aria-label": g(n)("smartview.close"),
					"data-part": "close",
					onClick: l
				}, null, 8, ["aria-label"])]),
				default: p(() => [E("span", Z, b(g(M).text), 1)]),
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
