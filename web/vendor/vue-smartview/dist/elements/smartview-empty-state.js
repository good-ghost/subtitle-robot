import { Pn as e, ar as t, bn as n, en as r, in as i, mn as a } from "../chunks/vuetify-DJ4bsPds.js";
import { t as o } from "../chunks/define-BG7hCbXs.js";
import { t as s } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as c } from "../chunks/EmptyStateView-OOc_A5tE.js";
//#endregion
//#region src/entries/smartview-empty-state.ts
o("smartview-empty-state", /* @__PURE__ */ n({
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
	setup(n) {
		let o = n, { t: l } = r(), u = i();
		function d(e) {
			s(u, "action", o.actionHref, e);
		}
		return (r, i) => (e(), a(c, {
			heading: n.heading || t(l)("smartview.noData"),
			icon: n.icon,
			hint: n.hint,
			"action-text": n.actionText,
			"action-icon": n.actionIcon,
			"action-href": n.actionHref,
			size: n.size,
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
