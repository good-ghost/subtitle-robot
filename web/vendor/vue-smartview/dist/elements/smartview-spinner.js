import { Bn as e, En as t, Sn as n, Tn as r, _r as i, dr as a, on as o, vn as s, yn as c } from "../chunks/vuetify-C39-WP9g.js";
import { t as l } from "../chunks/define-BovISfN4.js";
import { t as u } from "../chunks/VProgressCircular-CetUt3jx.js";
import { t as d } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
//#region src/elements/SmartviewSpinner.ce.vue?vue&type=script&setup=true&lang.ts
var f = {
	class: "smartview-root smartview-spinner",
	role: "status",
	"data-part": "root"
}, p = {
	class: "smartview-spinner__text",
	"data-part": "text"
};
//#endregion
//#region src/entries/smartview-spinner.ts
l("smartview-spinner", /* @__PURE__ */ d(/* @__PURE__ */ t({
	__name: "SmartviewSpinner.ce",
	props: {
		size: {
			default: "medium",
			type: String
		},
		variant: {
			default: "brand",
			type: String
		},
		overlay: {
			type: Boolean,
			default: !1
		},
		alternativeText: {
			default: "",
			type: String
		}
	},
	setup(t) {
		let l = {
			"xx-small": {
				size: 16,
				width: 2
			},
			"x-small": {
				size: 20,
				width: 2
			},
			small: {
				size: 24,
				width: 3
			},
			medium: {
				size: 32,
				width: 4
			},
			large: {
				size: 64,
				width: 6
			}
		}, d = {
			brand: "primary",
			base: void 0,
			inverse: "white"
		}, m = t, { t: h } = o(), g = s(() => Object.hasOwn(l, m.size) ? l[m.size] : l.medium), _ = s(() => Object.hasOwn(d, m.variant) ? d[m.variant] : d.brand);
		return (o, s) => (e(), n("div", f, [r(a(u), {
			indeterminate: "",
			size: g.value.size,
			width: g.value.width,
			color: _.value,
			"aria-hidden": "true",
			"data-part": "spinner"
		}, null, 8, [
			"size",
			"width",
			"color"
		]), c("span", p, i(t.alternativeText || a(h)("smartview.spinnerLoading")), 1)]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-flex}:host([overlay]){z-index:1;background:rgba(var(--v-theme-surface), .75);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.smartview-spinner{display:inline-flex}.smartview-spinner__text{clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}"]]]));
//#endregion
