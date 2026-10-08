import { Bn as e, En as t, Qt as n, Sn as r, Tn as i, Xn as a, _r as o, dr as s, en as c, on as l, vn as u, yn as d } from "../chunks/vuetify-C39-WP9g.js";
import { t as f } from "../chunks/define-BovISfN4.js";
import { t as p } from "../chunks/VChip-C-IhEdKW.js";
import { t as m } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as h, t as g } from "../chunks/format-CSc3hJdu.js";
//#region src/messages/SmartviewRefreshedAt.ts
var _ = n({
	en: { refreshedAt: "{time} updated" },
	ko: { refreshedAt: "{time} 갱신" }
}), v = { class: "smartview-root" }, y = ["datetime"], b = "--:--:--";
//#endregion
//#region src/entries/smartview-refreshed-at.ts
f("smartview-refreshed-at", /* @__PURE__ */ m(/* @__PURE__ */ t({
	__name: "SmartviewRefreshedAt.ce",
	props: { time: {
		default: "",
		type: String
	} },
	setup(t) {
		let n = t, { t: f } = l();
		c(_);
		let m = u(() => g(n.time)), x = u(() => h(n.time)?.toISOString());
		return (t, n) => (e(), r("span", v, [i(s(p), {
			variant: "tonal",
			color: "primary",
			size: "small",
			"prepend-icon": "mdi-refresh",
			"data-part": "chip"
		}, {
			default: a(() => [d("time", {
				datetime: x.value,
				"data-part": "time"
			}, o(s(f)("smartview.refreshedAt", { time: m.value || b })), 9, y)]),
			_: 1
		})]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-block}"]]]));
//#endregion
