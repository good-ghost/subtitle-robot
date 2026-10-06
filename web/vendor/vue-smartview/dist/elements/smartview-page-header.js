import { Gn as e, Ln as t, Pn as n, Wn as r, Zn as i, ar as a, bn as o, dr as s, en as c, gn as l, hn as u, in as d, mn as f, on as p, pn as m, vn as h, yn as g } from "../chunks/vuetify-DJ4bsPds.js";
import { t as _ } from "../chunks/define-BG7hCbXs.js";
import { n as v } from "../chunks/cancelableLink-DUAoXNUy.js";
import { a as y } from "../chunks/density-Dh8nVFPw.js";
import { t as b } from "../chunks/VBtn-D2PPPp70.js";
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
_("smartview-page-header", /* @__PURE__ */ x(/* @__PURE__ */ o({
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
	setup(o, { emit: _ }) {
		let x = o, O = _, { t: k } = c(), A = d(), j = i(!1);
		function M(e) {
			e.target instanceof HTMLSlotElement && (j.value = e.target.assignedNodes().length > 0);
		}
		function N(e) {
			v(A, "back", x.backHref, e);
		}
		return (i, c) => (n(), l("header", S, [m("div", C, [o.backHref ? (n(), f(a(b), {
			key: 0,
			icon: "",
			variant: "text",
			size: "small",
			href: o.backHref,
			"aria-label": a(k)("smartview.back"),
			"data-part": "back",
			onClick: N
		}, {
			default: r(() => [g(a(y), { icon: "mdi-arrow-left" })]),
			_: 1
		}, 8, ["href", "aria-label"])) : u("", !0), m("div", w, [m("h1", T, s(o.heading), 1), e(m("p", E, [t(i.$slots, "subtitle", { onSlotchange: M }, () => [h(s(o.subtitle), 1)])], 512), [[p, o.subtitle || j.value]])])]), m("div", D, [t(i.$slots, "actions"), o.actionText ? (n(), f(a(b), {
			key: 0,
			color: "primary",
			rounded: "lg",
			size: "large",
			class: "font-weight-bold",
			"prepend-icon": o.actionIcon,
			disabled: o.actionDisabled,
			"data-part": "action",
			onClick: c[0] ||= (e) => O("action")
		}, {
			default: r(() => [h(s(o.actionText), 1)]),
			_: 1
		}, 8, ["prepend-icon", "disabled"])) : u("", !0)])]));
	}
}), [["styles", [".smartview-page-header__title,.smartview-page-header__text{min-width:0}.smartview-page-header__text h1{overflow-wrap:anywhere}"]]]));
//#endregion
