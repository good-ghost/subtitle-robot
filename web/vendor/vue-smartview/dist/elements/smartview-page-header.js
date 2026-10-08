import { Bn as e, En as t, Sn as n, Tn as r, Un as i, Xn as a, Zn as o, _r as s, bn as c, dr as l, fn as u, on as d, rr as f, un as p, wn as m, xn as h, yn as g } from "../chunks/vuetify-C39-WP9g.js";
import { t as _ } from "../chunks/define-BovISfN4.js";
import { n as v } from "../chunks/cancelableLink-DUAoXNUy.js";
import { a as y } from "../chunks/density-9WZgplEH.js";
import { t as b } from "../chunks/VBtn-CV2MWNTN.js";
import { t as x } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
//#region src/elements/SmartviewPageHeader.ce.vue?vue&type=script&setup=true&lang.ts
var S = {
	class: "smartview-page-header d-flex align-center justify-space-between flex-wrap ga-3",
	"data-part": "root"
}, C = { class: "smartview-page-header__title d-flex align-center ga-3" }, w = { class: "smartview-page-header__text" }, T = {
	class: "text-headline-large font-weight-bold ma-0",
	"data-part": "title"
}, E = {
	class: "text-body-medium text-medium-emphasis mt-1 mb-0",
	"data-part": "subtitle"
}, D = {
	class: "d-flex align-center flex-wrap ga-2",
	"data-part": "actions"
};
//#endregion
//#region src/entries/smartview-page-header.ts
_("smartview-page-header", /* @__PURE__ */ x(/* @__PURE__ */ t({
	__name: "SmartviewPageHeader.ce",
	props: {
		heading: {
			default: "",
			type: String
		},
		subtitle: {
			default: "",
			type: String
		},
		backHref: {
			default: "",
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
	emits: ["action", "back"],
	setup(t, { emit: _ }) {
		let x = t, O = _, { t: k } = d(), A = p(), j = f(!1);
		function M(e) {
			e.target instanceof HTMLSlotElement && (j.value = e.target.assignedNodes().length > 0);
		}
		function N(e) {
			v(A, "back", x.backHref, e);
		}
		return (d, f) => (e(), n("header", S, [g("div", C, [t.backHref ? (e(), c(l(b), {
			key: 0,
			icon: "",
			variant: "text",
			size: "small",
			href: t.backHref,
			"aria-label": l(k)("smartview.back"),
			"data-part": "back",
			onClick: N
		}, {
			default: a(() => [r(l(y), { icon: "mdi-arrow-left" })]),
			_: 1
		}, 8, ["href", "aria-label"])) : h("", !0), g("div", w, [g("h1", T, s(t.heading), 1), o(g("p", E, [i(d.$slots, "subtitle", { onSlotchange: M }, () => [m(s(t.subtitle), 1)])], 512), [[u, t.subtitle || j.value]])])]), g("div", D, [i(d.$slots, "actions"), t.actionText ? (e(), c(l(b), {
			key: 0,
			color: "primary",
			rounded: "lg",
			size: "large",
			class: "font-weight-bold",
			"prepend-icon": t.actionIcon,
			disabled: t.actionDisabled,
			"data-part": "action",
			onClick: f[0] ||= (e) => O("action")
		}, {
			default: a(() => [m(s(t.actionText), 1)]),
			_: 1
		}, 8, ["prepend-icon", "disabled"])) : h("", !0)])]));
	}
}), [["styles", [".smartview-page-header__title,.smartview-page-header__text{min-width:0}.smartview-page-header__text h1{overflow-wrap:anywhere}"]]]));
//#endregion
