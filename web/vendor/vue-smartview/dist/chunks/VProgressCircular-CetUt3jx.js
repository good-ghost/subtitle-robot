import { A as e, Et as t, G as n, T as r, Tn as i, Vt as a, W as o, Yn as s, c, cr as l, gr as u, l as d, mr as f, rr as p, vn as m, yn as h } from "./vuetify-C39-WP9g.js";
import { c as g, i as _, l as v, n as y, r as b, s as x } from "./define-BovISfN4.js";
import { t as S } from "./resizeObserver-4FxWWYaw.js";
import { n as C, r as w, t as T } from "./reveal-61xKjn-t.js";
//#region node_modules/vuetify/lib/components/VProgressCircular/VProgressCircular.js
var E = e({
	bgColor: String,
	color: String,
	indeterminate: [Boolean, String],
	rounded: Boolean,
	modelValue: {
		type: [Number, String],
		default: 0
	},
	rotate: {
		type: [Number, String],
		default: 0
	},
	transition: {
		type: [Boolean, Object],
		default: void 0
	},
	width: {
		type: [Number, String],
		default: 4
	},
	...v(),
	...T(),
	...b(),
	...y({ tag: "div" }),
	...c()
}, "VProgressCircular"), D = r()({
	name: "VProgressCircular",
	props: E(),
	setup(e, { slots: r }) {
		let c = 2 * Math.PI * 20, v = p(), { themeClasses: y } = d(e), { sizeClasses: b, sizeStyles: T } = _(e), { textColorClasses: E, textColorStyles: D } = x(() => e.color), { textColorClasses: O, textColorStyles: k } = x(() => e.bgColor), { intersectionRef: A, isIntersecting: j } = w(), { resizeRef: M, contentRect: N } = S(), { state: P, duration: F } = C(e), I = l(() => P.value === "initial" ? 0 : o(parseFloat(e.modelValue), 0, 100)), L = l(() => Number(e.width)), R = l(() => e.transition === !1 ? void 0 : n(a(e.transition) ? e.transition.duration : void 0, "ms")), z = l(() => T.value ? Number(e.size) : N.value ? N.value.width : Math.max(L.value, 32)), B = l(() => 20 / (1 - L.value / z.value) * 2), V = l(() => L.value / z.value * B.value), H = l(() => {
			let t = (100 - I.value) / 100 * c;
			return e.rounded && I.value > 0 && I.value < 100 ? n(Math.min(c - .01, t + V.value)) : n(t);
		}), U = m(() => {
			let t = Number(e.rotate);
			return e.rounded ? t + V.value / 2 / c * 360 : t;
		});
		return s(() => {
			A.value = v.value, M.value = v.value;
		}), g(() => i(e.tag, {
			ref: v,
			class: f([
				"v-progress-circular",
				{
					"v-progress-circular--indeterminate": !!e.indeterminate,
					"v-progress-circular--visible": j.value,
					"v-progress-circular--disable-shrink": e.indeterminate && (e.indeterminate === "disable-shrink" || t()),
					"v-progress-circular--revealing": ["initial", "pending"].includes(P.value),
					"v-progress-circular--no-transition": e.transition === !1
				},
				y.value,
				b.value,
				E.value,
				e.class
			]),
			style: u([
				T.value,
				D.value,
				{
					"--v-progress-reveal-duration": `${F.value}ms`,
					"--v-progress-circular-transition-duration": R.value
				},
				e.style
			]),
			role: "progressbar",
			"aria-valuemin": "0",
			"aria-valuemax": "100",
			"aria-valuenow": e.indeterminate ? void 0 : I.value
		}, { default: () => [h("svg", {
			style: { transform: `rotate(calc(-90deg + ${U.value}deg))` },
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: `0 0 ${B.value} ${B.value}`
		}, [h("circle", {
			class: f(["v-progress-circular__underlay", O.value]),
			style: u(k.value),
			fill: "transparent",
			cx: "50%",
			cy: "50%",
			r: 20,
			"stroke-width": V.value,
			"stroke-dasharray": c,
			"stroke-dashoffset": 0
		}, null), h("circle", {
			class: "v-progress-circular__overlay",
			fill: "transparent",
			cx: "50%",
			cy: "50%",
			r: 20,
			"stroke-width": V.value,
			"stroke-dasharray": c,
			"stroke-dashoffset": H.value,
			"stroke-linecap": e.rounded ? "round" : void 0
		}, null)]), r.default && h("div", { class: "v-progress-circular__content" }, [r.default({ value: I.value })])] })), {};
	}
});
//#endregion
export { D as t };
