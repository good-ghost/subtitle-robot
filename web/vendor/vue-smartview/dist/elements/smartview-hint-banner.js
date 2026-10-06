import { In as e, Pn as t, Wn as n, ar as r, bn as i, cn as a, dr as o, fn as s, gn as c, hn as l, mn as u, pn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { t as p } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as m } from "../chunks/VAlert-9bM3hcdc.js";
//#region src/elements/SmartviewHintBanner.ce.vue?vue&type=script&setup=true&lang.ts
var h = { class: "smartview-root" }, g = {
	class: "smartview-hint-banner__text text-body-medium",
	"data-part": "text"
};
//#endregion
//#region src/entries/smartview-hint-banner.ts
f("smartview-hint-banner", /* @__PURE__ */ p(/* @__PURE__ */ i({
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
	setup(i) {
		let f = i, p = s(() => f.text.split(/\r?\n/).map((e) => e.trim()).filter((e) => e !== ""));
		return (s, f) => (t(), c("div", h, [p.value.length ? (t(), u(r(m), {
			key: 0,
			type: i.type,
			icon: i.icon || void 0,
			variant: "tonal",
			rounded: "xl",
			"data-part": "root"
		}, {
			default: n(() => [d("div", g, [(t(!0), c(a, null, e(p.value, (e, n) => (t(), c("p", {
				key: `${n}-${e}`,
				class: "ma-0",
				"data-part": "paragraph"
			}, o(e), 1))), 128))])]),
			_: 1
		}, 8, ["type", "icon"])) : l("", !0)]));
	}
}), [["styles", [".smartview-hint-banner__text{flex-direction:column;gap:4px;display:flex}"]]]));
//#endregion
