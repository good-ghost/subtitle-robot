import { Pn as e, bn as t, fn as n, gn as r, yn as i } from "../chunks/vuetify-DJ4bsPds.js";
import { t as a } from "../chunks/define-BG7hCbXs.js";
import { t as o } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { r as s } from "../chunks/status-J4FIN71L.js";
import { t as c } from "../chunks/StatusChipView-D9jwXAKX.js";
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
		let a = t, o = n(() => s(a.status, a.statusMap, {
			color: a.color,
			icon: a.icon,
			label: a.label
		}));
		return (n, a) => (e(), r("span", l, [i(c, {
			status: o.value,
			size: t.size
		}, null, 8, ["status", "size"])]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-block}"]]]));
//#endregion
