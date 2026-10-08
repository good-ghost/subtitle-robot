import { Bn as e, En as t, Sn as n, Tn as r, vn as i } from "../chunks/vuetify-C39-WP9g.js";
import { t as a } from "../chunks/define-BovISfN4.js";
import { t as o } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { r as s } from "../chunks/status-J4FIN71L.js";
import { t as c } from "../chunks/StatusChipView-CFTFffvZ.js";
//#region src/elements/SmartviewBadge.ce.vue?vue&type=script&setup=true&lang.ts
var l = { class: "smartview-root" };
//#endregion
//#region src/entries/smartview-badge.ts
a("smartview-badge", /* @__PURE__ */ o(/* @__PURE__ */ t({
	__name: "SmartviewBadge.ce",
	props: {
		status: {
			default: "",
			type: String
		},
		statusMap: {
			default: () => ({}),
			type: Object
		},
		color: {
			default: "",
			type: String
		},
		icon: {
			default: "",
			type: String
		},
		label: {
			default: "",
			type: String
		},
		size: {
			default: "small",
			type: String
		}
	},
	setup(t) {
		let a = t, o = i(() => s(a.status, a.statusMap, {
			color: a.color,
			icon: a.icon,
			label: a.label
		}));
		return (i, a) => (e(), n("span", l, [r(c, {
			status: o.value,
			size: t.size
		}, null, 8, ["status", "size"])]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-block}"]]]));
//#endregion
