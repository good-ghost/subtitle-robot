import { Bn as e, En as t, Xn as n, _r as r, bn as i, dr as a, xn as o, yn as s } from "./vuetify-C39-WP9g.js";
import { a as c } from "./density-9WZgplEH.js";
import { t as l } from "./VChip-C-IhEdKW.js";
import { n as u } from "./status-J4FIN71L.js";
//#region src/elements/parts/StatusChipView.vue?vue&type=script&setup=true&lang.ts
var d = { "data-part": "status-label" }, f = /* @__PURE__ */ t({
	__name: "StatusChipView",
	props: {
		status: {},
		size: { default: "small" }
	},
	setup(t) {
		return (f, p) => (e(), i(a(l), {
			color: a(u)(t.status.color),
			variant: "tonal",
			size: t.size,
			label: "",
			"data-part": "status"
		}, {
			default: n(() => [t.status.icon ? (e(), i(a(c), {
				key: 0,
				start: "",
				size: t.size === "x-small" ? 10 : 12,
				icon: t.status.icon,
				"data-part": "status-icon"
			}, null, 8, ["size", "icon"])) : o("", !0), s("span", d, r(t.status.label), 1)]),
			_: 1
		}, 8, ["color", "size"]));
	}
});
//#endregion
export { f as t };
