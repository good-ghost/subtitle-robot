import { Ln as e, Pn as t, Wn as n, ar as r, bn as i, dr as a, gn as o, hn as s, mn as c, pn as l, vn as u, yn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { a as p } from "../chunks/density-Dh8nVFPw.js";
import { t as m } from "../chunks/VBtn-D2PPPp70.js";
import { t as h } from "../chunks/VChip-Dqfk0_yh.js";
import { t as g } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as _, r as v, t as y } from "../chunks/VCard-CIgInzZL.js";
import { t as b } from "../chunks/VSpacer-BDzqg2jm.js";
//#region src/elements/parts/CardTitleView.vue?vue&type=script&setup=true&lang.ts
var x = ["id"], S = /* @__PURE__ */ i({
	__name: "CardTitleView",
	props: {
		heading: {},
		icon: { default: "" },
		count: { default: void 0 },
		headingId: { default: "" }
	},
	setup(i) {
		return (o, f) => (t(), c(r(v), {
			class: "smartview-card__title d-flex align-center ga-2 pa-5 pb-0",
			"data-part": "title-row"
		}, {
			default: n(() => [
				i.icon ? (t(), c(r(p), {
					key: 0,
					icon: i.icon,
					size: "20",
					"data-part": "icon"
				}, null, 8, ["icon"])) : s("", !0),
				l("h2", {
					id: i.headingId || void 0,
					class: "text-title-medium font-weight-bold ma-0",
					"data-part": "title"
				}, a(i.heading), 9, x),
				i.count === void 0 ? s("", !0) : (t(), c(r(h), {
					key: 1,
					size: "small",
					variant: "tonal",
					color: "primary",
					label: "",
					"data-part": "count"
				}, {
					default: n(() => [u(a(i.count), 1)]),
					_: 1
				})),
				d(r(b)),
				e(o.$slots, "default")
			]),
			_: 3
		}));
	}
}), C = { class: "smartview-root" };
//#endregion
//#region src/entries/smartview-card.ts
f("smartview-card", /* @__PURE__ */ g(/* @__PURE__ */ i({
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
	setup(i, { emit: l }) {
		let f = l;
		return (l, p) => (t(), o("div", C, [d(r(y), {
			variant: i.variant,
			elevation: i.variant === "outlined" ? 0 : 2,
			rounded: "xl",
			"data-part": "root"
		}, {
			default: n(() => [d(S, {
				heading: i.heading,
				icon: i.icon,
				count: i.count
			}, {
				default: n(() => [e(l.$slots, "title-append"), i.actionText ? (t(), c(r(m), {
					key: 0,
					variant: "tonal",
					rounded: "lg",
					size: "small",
					"prepend-icon": i.actionIcon,
					disabled: i.actionDisabled,
					"data-part": "action",
					onClick: p[0] ||= (e) => f("action")
				}, {
					default: n(() => [u(a(i.actionText), 1)]),
					_: 1
				}, 8, ["prepend-icon", "disabled"])) : s("", !0)]),
				_: 3
			}, 8, [
				"heading",
				"icon",
				"count"
			]), d(r(_), {
				class: "pa-5",
				"data-part": "body"
			}, {
				default: n(() => [e(l.$slots, "default")]),
				_: 3
			})]),
			_: 3
		}, 8, ["variant", "elevation"])]));
	}
}), [["styles", [".smartview-card__title{white-space:normal;flex-wrap:wrap;line-height:1.5}"]]]));
//#endregion
