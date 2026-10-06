import { Pn as e, Wn as t, ar as n, bn as r, dr as i, en as a, fn as o, gn as s, pn as c, yn as l } from "../chunks/vuetify-DJ4bsPds.js";
import { t as u } from "../chunks/define-BG7hCbXs.js";
import { t as d } from "../chunks/VChip-Dqfk0_yh.js";
import { t as f } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as p, t as m } from "../chunks/format-CSc3hJdu.js";
//#region src/elements/SmartviewRefreshedAt.ce.vue?vue&type=script&setup=true&lang.ts
var h = { class: "smartview-root" }, g = ["datetime"], _ = "--:--:--";
//#endregion
//#region src/entries/smartview-refreshed-at.ts
u("smartview-refreshed-at", /* @__PURE__ */ f(/* @__PURE__ */ r({
	__name: "SmartviewRefreshedAt.ce",
	props: { time: {
		default: "",
		type: String
	} },
	setup(r) {
		let u = r, { t: f } = a(), v = o(() => m(u.time)), y = o(() => p(u.time)?.toISOString());
		return (r, a) => (e(), s("span", h, [l(n(d), {
			variant: "tonal",
			color: "primary",
			size: "small",
			"prepend-icon": "mdi-refresh",
			"data-part": "chip"
		}, {
			default: t(() => [c("time", {
				datetime: y.value,
				"data-part": "time"
			}, i(n(f)("smartview.refreshedAt", { time: v.value || _ })), 9, g)]),
			_: 1
		})]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-block}"]]]));
//#endregion
