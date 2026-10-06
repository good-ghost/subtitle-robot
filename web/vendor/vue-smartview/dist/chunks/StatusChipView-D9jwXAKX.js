import { Pn as e, Wn as t, ar as n, bn as r, dr as i, hn as a, mn as o, pn as s } from "./vuetify-DJ4bsPds.js";
import { a as c } from "./density-Dh8nVFPw.js";
import { t as l } from "./VChip-Dqfk0_yh.js";
import { n as u } from "./status-J4FIN71L.js";
//#region src/elements/parts/StatusChipView.vue?vue&type=script&setup=true&lang.ts
var d = { "data-part": "status-label" }, f = /* @__PURE__ */ r({
	__name: "StatusChipView",
	props: {
		status: {},
		size: { default: "small" }
	},
	setup(r) {
		return (f, p) => (e(), o(n(l), {
			color: n(u)(r.status.color),
			variant: "tonal",
			size: r.size,
			label: "",
			"data-part": "status"
		}, {
			default: t(() => [r.status.icon ? (e(), o(n(c), {
				key: 0,
				start: "",
				size: r.size === "x-small" ? 10 : 12,
				icon: r.status.icon,
				"data-part": "status-icon"
			}, null, 8, ["size", "icon"])) : a("", !0), s("span", d, i(r.status.label), 1)]),
			_: 1
		}, 8, ["color", "size"]));
	}
});
//#endregion
export { f as t };
