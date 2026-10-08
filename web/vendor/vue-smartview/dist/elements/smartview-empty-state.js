import { Bn as e, En as t, bn as n, dr as r, on as i, un as a } from "../chunks/vuetify-C39-WP9g.js";
import { t as o } from "../chunks/define-BovISfN4.js";
import { t as s } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as c } from "../chunks/EmptyStateView-CbY6x7it.js";
//#endregion
//#region src/entries/smartview-empty-state.ts
o("smartview-empty-state", /* @__PURE__ */ t({
	__name: "SmartviewEmptyState.ce",
	props: {
		icon: {
			default: "mdi-inbox-outline",
			type: String
		},
		heading: {
			default: "",
			type: String
		},
		hint: {
			default: "",
			type: String
		},
		actionText: {
			default: "",
			type: String
		},
		actionIcon: {
			default: "mdi-plus",
			type: String
		},
		actionHref: {
			default: "",
			type: String
		},
		size: {
			default: "default",
			type: String
		}
	},
	setup(t) {
		let o = t, { t: l } = i(), u = a();
		function d(e) {
			s(u, "action", o.actionHref, e);
		}
		return (i, a) => (e(), n(c, {
			heading: t.heading || r(l)("smartview.noData"),
			icon: t.icon,
			hint: t.hint,
			"action-text": t.actionText,
			"action-icon": t.actionIcon,
			"action-href": t.actionHref,
			size: t.size,
			onAction: d
		}, null, 8, [
			"heading",
			"icon",
			"hint",
			"action-text",
			"action-icon",
			"action-href",
			"size"
		]));
	}
}));
//#endregion
