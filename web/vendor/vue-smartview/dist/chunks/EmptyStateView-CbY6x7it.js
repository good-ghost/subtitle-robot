import { Bn as e, En as t, Sn as n, Tn as r, Xn as i, _r as a, bn as o, dr as s, wn as c, xn as l, yn as u } from "./vuetify-C39-WP9g.js";
import { a as d } from "./density-9WZgplEH.js";
import { t as f } from "./VBtn-CV2MWNTN.js";
//#region src/elements/parts/EmptyStateView.vue?vue&type=script&setup=true&lang.ts
var p = {
	key: 0,
	class: "text-center pa-6 text-body-medium text-medium-emphasis",
	"data-part": "empty"
}, m = { "data-part": "empty-title" }, h = {
	key: 1,
	class: "text-center pa-8",
	"data-part": "empty"
}, g = {
	class: "text-title-large text-medium-emphasis ma-0",
	"data-part": "empty-title"
}, _ = {
	key: 0,
	class: "text-body-medium text-medium-emphasis mt-1 mb-0",
	"data-part": "empty-hint"
}, v = /* @__PURE__ */ t({
	__name: "EmptyStateView",
	props: {
		heading: {},
		icon: { default: "mdi-inbox-outline" },
		hint: { default: "" },
		actionText: { default: "" },
		actionIcon: { default: "mdi-plus" },
		actionHref: { default: "" },
		size: { default: "default" }
	},
	emits: ["action"],
	setup(t, { emit: v }) {
		let y = v;
		return (v, b) => t.size === "compact" ? (e(), n("div", p, [u("span", m, a(t.heading), 1)])) : (e(), n("div", h, [
			r(s(d), {
				size: "64",
				color: "grey-lighten-1",
				icon: t.icon,
				class: "mb-4",
				"data-part": "empty-icon"
			}, null, 8, ["icon"]),
			u("p", g, a(t.heading), 1),
			t.hint ? (e(), n("p", _, a(t.hint), 1)) : l("", !0),
			t.actionText ? (e(), o(s(f), {
				key: 1,
				color: "primary",
				variant: "tonal",
				rounded: "lg",
				class: "mt-4",
				"prepend-icon": t.actionIcon || void 0,
				href: t.actionHref || void 0,
				"data-part": "empty-action",
				onClick: b[0] ||= (e) => y("action", e)
			}, {
				default: i(() => [c(a(t.actionText), 1)]),
				_: 1
			}, 8, ["prepend-icon", "href"])) : l("", !0)
		]));
	}
});
//#endregion
export { v as t };
