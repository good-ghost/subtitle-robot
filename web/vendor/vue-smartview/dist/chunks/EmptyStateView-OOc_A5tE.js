import { Pn as e, Wn as t, ar as n, bn as r, dr as i, gn as a, hn as o, mn as s, pn as c, vn as l, yn as u } from "./vuetify-DJ4bsPds.js";
import { a as d } from "./density-Dh8nVFPw.js";
import { t as f } from "./VBtn-D2PPPp70.js";
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
}, v = /* @__PURE__ */ r({
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
	setup(r, { emit: v }) {
		let y = v;
		return (v, b) => r.size === "compact" ? (e(), a("div", p, [c("span", m, i(r.heading), 1)])) : (e(), a("div", h, [
			u(n(d), {
				size: "64",
				color: "grey-lighten-1",
				icon: r.icon,
				class: "mb-4",
				"data-part": "empty-icon"
			}, null, 8, ["icon"]),
			c("p", g, i(r.heading), 1),
			r.hint ? (e(), a("p", _, i(r.hint), 1)) : o("", !0),
			r.actionText ? (e(), s(n(f), {
				key: 1,
				color: "primary",
				variant: "tonal",
				rounded: "lg",
				class: "mt-4",
				"prepend-icon": r.actionIcon || void 0,
				href: r.actionHref || void 0,
				"data-part": "empty-action",
				onClick: b[0] ||= (e) => y("action", e)
			}, {
				default: t(() => [l(i(r.actionText), 1)]),
				_: 1
			}, 8, ["prepend-icon", "href"])) : o("", !0)
		]));
	}
});
//#endregion
export { v as t };
