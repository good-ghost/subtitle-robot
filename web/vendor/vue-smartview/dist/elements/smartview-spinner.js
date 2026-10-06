import { Pn as e, ar as t, bn as n, dr as r, en as i, fn as a, gn as o, pn as s, yn as c } from "../chunks/vuetify-DJ4bsPds.js";
import { t as l } from "../chunks/define-BG7hCbXs.js";
import { t as u } from "../chunks/VProgressCircular-ZunkyD4q.js";
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
l("smartview-spinner", /* @__PURE__ */ d(/* @__PURE__ */ n({
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
	setup(n) {
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
		}, m = n, { t: h } = i(), g = a(() => Object.hasOwn(l, m.size) ? l[m.size] : l.medium), _ = a(() => Object.hasOwn(d, m.variant) ? d[m.variant] : d.brand);
		return (i, a) => (e(), o("div", f, [c(t(u), {
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
		]), s("span", p, r(n.alternativeText || t(h)("smartview.spinnerLoading")), 1)]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-flex}:host([overlay]){z-index:1;background:rgba(var(--v-theme-surface), .75);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.smartview-spinner{display:inline-flex}.smartview-spinner__text{clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}"]]]));
//#endregion
