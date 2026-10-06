import { A as e, En as t, It as n, T as r, c as i, cr as a, fn as o, g as s, l as c, m as l, nr as u, pn as d, ur as f, v as p, yn as m } from "./vuetify-DJ4bsPds.js";
import { a as h, i as g, n as _, r as v, t as y } from "./rounded-CXkAtXly.js";
import { l as b, n as x, s as S } from "./define-BG7hCbXs.js";
import { t as C } from "./createSimpleFunctional-CnJMTOVx.js";
import { a as w, i as T, n as E, r as D, t as O } from "./density-Dh8nVFPw.js";
import { a as k, c as A, l as j, o as M, s as N } from "./router-BNmKTwUJ.js";
import { t as P } from "./VBtn-D2PPPp70.js";
import { n as F, t as I } from "./position-B7q6NTBl.js";
//#region node_modules/vuetify/lib/components/VAlert/VAlertTitle.js
var L = C("v-alert-title"), R = e({
	iconSize: [Number, String],
	iconSizes: {
		type: Array,
		default: () => [
			["x-small", 10],
			["small", 16],
			["default", 24],
			["large", 28],
			["x-large", 32]
		]
	}
}, "iconSize");
function z(e, t) {
	return { iconSize: o(() => {
		let n = new Map(e.iconSizes), r = e.iconSize ?? t() ?? "default";
		return n.has(r) ? n.get(r) : r;
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/components/VAlert/VAlert.js
var B = [
	"success",
	"info",
	"warning",
	"error"
], V = e({
	border: {
		type: [Boolean, String],
		validator: (e) => n(e) || [
			"top",
			"end",
			"bottom",
			"start"
		].includes(e)
	},
	borderColor: String,
	closable: Boolean,
	closeIcon: {
		type: p,
		default: "$close"
	},
	closeLabel: {
		type: String,
		default: "$vuetify.close"
	},
	icon: {
		type: [
			Boolean,
			String,
			Function,
			Object
		],
		default: null
	},
	modelValue: {
		type: Boolean,
		default: !0
	},
	prominent: Boolean,
	title: String,
	text: String,
	type: {
		type: String,
		validator: (e) => B.includes(e)
	},
	...b(),
	...O(),
	...D(),
	...k(),
	...R(),
	...v(),
	...I(),
	...y(),
	...x(),
	...i(),
	...A({ variant: "flat" })
}, "VAlert"), H = r()({
	name: "VAlert",
	props: V(),
	emits: {
		"click:close": (e) => !0,
		"update:modelValue": (e) => !0
	},
	setup(e, { emit: n, slots: r }) {
		let i = s(e, "modelValue"), o = u(() => {
			if (e.icon !== !1) return e.type ? e.icon ?? `$${e.type}` : e.icon;
		}), { iconSize: p } = z(e, () => e.prominent ? 44 : void 0), { themeClasses: v } = c(e), { colorClasses: y, colorStyles: b, variantClasses: x } = j(() => ({
			color: e.color ?? e.type,
			variant: e.variant
		})), { densityClasses: C } = E(e), { dimensionStyles: D } = T(e), { elevationClasses: O } = M(e), { locationStyles: k } = g(e), { positionClasses: A } = F(e), { roundedClasses: I, roundedStyles: R } = _(e), { textColorClasses: B, textColorStyles: V } = S(() => e.borderColor), { t: H } = l(), U = u(() => ({
			"aria-label": H(e.closeLabel),
			onClick(e) {
				i.value = !1, n("click:close", e);
			}
		}));
		return () => {
			let n = !!(r.prepend || o.value), s = !!(r.title || e.title), c = !!(r.close || e.closable), l = {
				density: e.density,
				icon: o.value,
				size: e.iconSize || e.prominent ? p.value : void 0
			};
			return i.value && m(e.tag, {
				class: a([
					"v-alert",
					e.border && {
						"v-alert--border": !!e.border,
						[`v-alert--border-${e.border === !0 ? "start" : e.border}`]: !0
					},
					{ "v-alert--prominent": e.prominent },
					v.value,
					y.value,
					C.value,
					O.value,
					A.value,
					I.value,
					x.value,
					e.class
				]),
				style: f([
					b.value,
					D.value,
					k.value,
					R.value,
					e.style
				]),
				role: "alert"
			}, { default: () => [
				N(!1, "v-alert"),
				e.border && d("div", {
					key: "border",
					class: a(["v-alert__border", B.value]),
					style: f(V.value)
				}, null),
				n && d("div", {
					key: "prepend",
					class: "v-alert__prepend"
				}, [r.prepend ? m(h, {
					key: "prepend-defaults",
					disabled: !o.value,
					defaults: { VIcon: { ...l } }
				}, r.prepend) : m(w, t({ key: "prepend-icon" }, l), null)]),
				d("div", { class: "v-alert__content" }, [
					s && m(L, { key: "title" }, { default: () => [r.title?.() ?? e.title] }),
					r.text?.() ?? e.text,
					r.default?.()
				]),
				r.append && d("div", {
					key: "append",
					class: "v-alert__append"
				}, [r.append()]),
				c && d("div", {
					key: "close",
					class: "v-alert__close"
				}, [r.close ? m(h, {
					key: "close-defaults",
					defaults: { VBtn: {
						icon: e.closeIcon,
						size: "x-small",
						variant: "text"
					} }
				}, { default: () => [r.close?.({ props: U.value })] }) : m(P, t({
					key: "close-btn",
					icon: e.closeIcon,
					size: "x-small",
					variant: "text"
				}, U.value), null)])
			] });
		};
	}
});
//#endregion
export { H as t };
