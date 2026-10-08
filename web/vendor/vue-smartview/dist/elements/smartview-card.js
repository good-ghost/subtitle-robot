import { Bn as e, En as t, Sn as n, Tn as r, Un as i, Xn as a, _r as o, bn as s, dr as c, mn as l, wn as u, xn as d, yn as f } from "../chunks/vuetify-C39-WP9g.js";
import { t as p } from "../chunks/define-BovISfN4.js";
import { t as m } from "../chunks/VDivider-CA-IOlps.js";
import { a as h } from "../chunks/density-9WZgplEH.js";
import { t as g } from "../chunks/VBtn-CV2MWNTN.js";
import { t as _ } from "../chunks/VChip-C-IhEdKW.js";
import { t as v } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as y, r as b, t as x } from "../chunks/VCard-Z58vOTy1.js";
import { t as S } from "../chunks/VSpacer-BKsHyVbj.js";
//#region src/elements/parts/CardTitleView.vue?vue&type=script&setup=true&lang.ts
var C = ["id"], w = /* @__PURE__ */ t({
	__name: "CardTitleView",
	props: {
		heading: {},
		icon: { default: "" },
		count: { default: void 0 },
		headingId: { default: "" }
	},
	setup(t) {
		return (p, g) => (e(), n(l, null, [r(c(b), {
			class: "smartview-card__title d-flex align-center ga-2 pa-5",
			"data-part": "title-row"
		}, {
			default: a(() => [
				t.icon ? (e(), s(c(h), {
					key: 0,
					icon: t.icon,
					size: "20",
					"data-part": "icon"
				}, null, 8, ["icon"])) : d("", !0),
				f("h2", {
					id: t.headingId || void 0,
					class: "text-title-medium font-weight-bold ma-0",
					"data-part": "title"
				}, o(t.heading), 9, C),
				t.count === void 0 ? d("", !0) : (e(), s(c(_), {
					key: 1,
					size: "small",
					variant: "tonal",
					color: "primary",
					label: "",
					"data-part": "count"
				}, {
					default: a(() => [u(o(t.count), 1)]),
					_: 1
				})),
				r(c(S)),
				i(p.$slots, "default")
			]),
			_: 3
		}), r(c(m), { "data-part": "title-divider" })], 64));
	}
}), T = { class: "smartview-root" };
//#endregion
//#region src/entries/smartview-card.ts
p("smartview-card", /* @__PURE__ */ v(/* @__PURE__ */ t({
	__name: "SmartviewCard.ce",
	props: {
		heading: {
			default: "",
			type: String
		},
		icon: {
			default: "",
			type: String
		},
		count: {
			default: void 0,
			type: Number
		},
		variant: {
			default: "elevated",
			type: String
		},
		actionText: {
			default: "",
			type: String
		},
		actionIcon: {
			default: "mdi-plus",
			type: String
		},
		actionDisabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["action"],
	setup(t, { emit: l }) {
		let f = l;
		return (l, p) => (e(), n("div", T, [r(c(x), {
			variant: t.variant,
			elevation: t.variant === "outlined" ? 0 : 2,
			rounded: "xl",
			"data-part": "root"
		}, {
			default: a(() => [r(w, {
				heading: t.heading,
				icon: t.icon,
				count: t.count
			}, {
				default: a(() => [i(l.$slots, "title-append"), t.actionText ? (e(), s(c(g), {
					key: 0,
					variant: "tonal",
					rounded: "lg",
					size: "small",
					"prepend-icon": t.actionIcon,
					disabled: t.actionDisabled,
					"data-part": "action",
					onClick: p[0] ||= (e) => f("action")
				}, {
					default: a(() => [u(o(t.actionText), 1)]),
					_: 1
				}, 8, ["prepend-icon", "disabled"])) : d("", !0)]),
				_: 3
			}, 8, [
				"heading",
				"icon",
				"count"
			]), r(c(y), {
				class: "pa-5",
				"data-part": "body"
			}, {
				default: a(() => [i(l.$slots, "default")]),
				_: 3
			})]),
			_: 3
		}, 8, ["variant", "elevation"])]));
	}
}), [["styles", [".smartview-card__title{white-space:normal;flex-wrap:wrap;line-height:1.5}"]]]));
//#endregion
