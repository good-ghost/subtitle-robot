import { Bn as e, En as t, Hn as n, Sn as r, Xn as i, _r as a, bn as o, dr as s, mn as c, vn as l, xn as u, yn as d } from "../chunks/vuetify-C39-WP9g.js";
import { t as f } from "../chunks/define-BovISfN4.js";
import { t as p } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as m } from "../chunks/VAlert-rN_W5d_m.js";
//#region src/elements/SmartviewHintBanner.ce.vue?vue&type=script&setup=true&lang.ts
var h = { class: "smartview-root" }, g = {
	class: "smartview-hint-banner__text text-body-medium",
	"data-part": "text"
};
//#endregion
//#region src/entries/smartview-hint-banner.ts
f("smartview-hint-banner", /* @__PURE__ */ p(/* @__PURE__ */ t({
	__name: "SmartviewHintBanner.ce",
	props: {
		text: {
			default: "",
			type: String
		},
		type: {
			default: "info",
			type: String
		},
		icon: {
			default: "mdi-information-outline",
			type: String
		}
	},
	setup(t) {
		let f = t, p = l(() => f.text.split(/\r?\n/).map((e) => e.trim()).filter((e) => e !== ""));
		return (l, f) => (e(), r("div", h, [p.value.length ? (e(), o(s(m), {
			key: 0,
			type: t.type,
			icon: t.icon || void 0,
			variant: "tonal",
			rounded: "xl",
			"data-part": "root"
		}, {
			default: i(() => [d("div", g, [(e(!0), r(c, null, n(p.value, (t, n) => (e(), r("p", {
				key: `${n}-${t}`,
				class: "ma-0",
				"data-part": "paragraph"
			}, a(t), 1))), 128))])]),
			_: 1
		}, 8, ["type", "icon"])) : u("", !0)]));
	}
}), [["styles", [".smartview-hint-banner__text{flex-direction:column;gap:4px;display:flex}"]]]));
//#endregion
