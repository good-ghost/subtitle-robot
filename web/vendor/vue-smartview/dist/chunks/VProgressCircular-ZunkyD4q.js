import { A as e, Et as t, G as n, T as r, Un as i, Vt as a, W as o, Zn as s, c, cr as l, fn as u, l as d, nr as f, pn as p, ur as m, yn as h } from "./vuetify-DJ4bsPds.js";
import { c as g, i as _, l as v, n as y, r as b, s as x } from "./define-BG7hCbXs.js";
import { t as S } from "./resizeObserver-iAwW3s60.js";
import { n as C, r as w, t as T } from "./reveal-BpRkxe7j.js";
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
		let c = 2 * Math.PI * 20, v = s(), { themeClasses: y } = d(e), { sizeClasses: b, sizeStyles: T } = _(e), { textColorClasses: E, textColorStyles: D } = x(() => e.color), { textColorClasses: O, textColorStyles: k } = x(() => e.bgColor), { intersectionRef: A, isIntersecting: j } = w(), { resizeRef: M, contentRect: N } = S(), { state: P, duration: F } = C(e), I = f(() => P.value === "initial" ? 0 : o(parseFloat(e.modelValue), 0, 100)), L = f(() => Number(e.width)), R = f(() => e.transition === !1 ? void 0 : n(a(e.transition) ? e.transition.duration : void 0, "ms")), z = f(() => T.value ? Number(e.size) : N.value ? N.value.width : Math.max(L.value, 32)), B = f(() => 20 / (1 - L.value / z.value) * 2), V = f(() => L.value / z.value * B.value), H = f(() => {
			let t = (100 - I.value) / 100 * c;
			return e.rounded && I.value > 0 && I.value < 100 ? n(Math.min(c - .01, t + V.value)) : n(t);
		}), U = u(() => {
			let t = Number(e.rotate);
			return e.rounded ? t + V.value / 2 / c * 360 : t;
		});
		return i(() => {
			A.value = v.value, M.value = v.value;
		}), g(() => h(e.tag, {
			ref: v,
			class: l([
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
			style: m([
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
		}, { default: () => [p("svg", {
			style: { transform: `rotate(calc(-90deg + ${U.value}deg))` },
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: `0 0 ${B.value} ${B.value}`
		}, [p("circle", {
			class: l(["v-progress-circular__underlay", O.value]),
			style: m(k.value),
			fill: "transparent",
			cx: "50%",
			cy: "50%",
			r: 20,
			"stroke-width": V.value,
			"stroke-dasharray": c,
			"stroke-dashoffset": 0
		}, null), p("circle", {
			class: "v-progress-circular__overlay",
			fill: "transparent",
			cx: "50%",
			cy: "50%",
			r: 20,
			"stroke-width": V.value,
			"stroke-dasharray": c,
			"stroke-dashoffset": H.value,
			"stroke-linecap": e.rounded ? "round" : void 0
		}, null)]), r.default && p("div", { class: "v-progress-circular__content" }, [r.default({ value: I.value })])] })), {};
	}
});
//#endregion
export { D as t };
