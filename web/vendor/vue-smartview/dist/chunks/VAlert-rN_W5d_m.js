import { A as e, It as t, Mn as n, T as r, Tn as i, c as a, cr as o, g as s, gr as c, l, m as u, mr as d, v as f, vn as p, yn as m } from "./vuetify-C39-WP9g.js";
import { a as h, i as g, n as _, r as v, t as y } from "./rounded-1DPtyqNn.js";
import { l as b, n as x, s as S } from "./define-BovISfN4.js";
import { t as C } from "./createSimpleFunctional-ue-6VwwS.js";
import { a as w, i as T, n as E, r as D, t as O } from "./density-9WZgplEH.js";
import { a as k, c as A, l as j, o as M, s as N } from "./router-C0qlu-KG.js";
import { t as P } from "./VBtn-CV2MWNTN.js";
import { n as F, t as I } from "./position-UZ3CZfcL.js";
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
	return { iconSize: p(() => {
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
		validator: (e) => t(e) || [
			"top",
			"end",
			"bottom",
			"start"
		].includes(e)
	},
	borderColor: String,
	closable: Boolean,
	closeIcon: {
		type: f,
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
	...a(),
	...A({ variant: "flat" })
}, "VAlert"), H = r()({
	name: "VAlert",
	props: V(),
	emits: {
		"click:close": (e) => !0,
		"update:modelValue": (e) => !0
	},
	setup(e, { emit: t, slots: r }) {
		let a = s(e, "modelValue"), f = o(() => {
			if (e.icon !== !1) return e.type ? e.icon ?? `$${e.type}` : e.icon;
		}), { iconSize: p } = z(e, () => e.prominent ? 44 : void 0), { themeClasses: v } = l(e), { colorClasses: y, colorStyles: b, variantClasses: x } = j(() => ({
			color: e.color ?? e.type,
			variant: e.variant
		})), { densityClasses: C } = E(e), { dimensionStyles: D } = T(e), { elevationClasses: O } = M(e), { locationStyles: k } = g(e), { positionClasses: A } = F(e), { roundedClasses: I, roundedStyles: R } = _(e), { textColorClasses: B, textColorStyles: V } = S(() => e.borderColor), { t: H } = u(), U = o(() => ({
			"aria-label": H(e.closeLabel),
			onClick(e) {
				a.value = !1, t("click:close", e);
			}
		}));
		return () => {
			let t = !!(r.prepend || f.value), o = !!(r.title || e.title), s = !!(r.close || e.closable), l = {
				density: e.density,
				icon: f.value,
				size: e.iconSize || e.prominent ? p.value : void 0
			};
			return a.value && i(e.tag, {
				class: d([
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
				style: c([
					b.value,
					D.value,
					k.value,
					R.value,
					e.style
				]),
				role: "alert"
			}, { default: () => [
				N(!1, "v-alert"),
				e.border && m("div", {
					key: "border",
					class: d(["v-alert__border", B.value]),
					style: c(V.value)
				}, null),
				t && m("div", {
					key: "prepend",
					class: "v-alert__prepend"
				}, [r.prepend ? i(h, {
					key: "prepend-defaults",
					disabled: !f.value,
					defaults: { VIcon: { ...l } }
				}, r.prepend) : i(w, n({ key: "prepend-icon" }, l), null)]),
				m("div", { class: "v-alert__content" }, [
					o && i(L, { key: "title" }, { default: () => [r.title?.() ?? e.title] }),
					r.text?.() ?? e.text,
					r.default?.()
				]),
				r.append && m("div", {
					key: "append",
					class: "v-alert__append"
				}, [r.append()]),
				s && m("div", {
					key: "close",
					class: "v-alert__close"
				}, [r.close ? i(h, {
					key: "close-defaults",
					defaults: { VBtn: {
						icon: e.closeIcon,
						size: "x-small",
						variant: "text"
					} }
				}, { default: () => [r.close?.({ props: U.value })] }) : i(P, n({
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
