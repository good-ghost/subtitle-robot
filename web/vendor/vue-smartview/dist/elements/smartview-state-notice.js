import { Pn as e, Wn as t, ar as n, bn as r, cr as i, dr as a, fn as o, gn as s, hn as c, in as l, mn as u, pn as d, vn as f, yn as p } from "../chunks/vuetify-DJ4bsPds.js";
import { t as m } from "../chunks/define-BG7hCbXs.js";
import { t as h } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as g } from "../chunks/VBtn-D2PPPp70.js";
import { t as _ } from "../chunks/VAlert-9bM3hcdc.js";
//#region src/elements/SmartviewStateNotice.ce.vue?vue&type=script&setup=true&lang.ts
var v = { class: "smartview-root" }, y = { class: "text-body-medium" }, b = {
	key: 0,
	class: "font-weight-bold ma-0 mb-1",
	"data-part": "heading"
};
//#endregion
//#region src/entries/smartview-state-notice.ts
m("smartview-state-notice", /* @__PURE__ */ r({
	__name: "SmartviewStateNotice.ce",
	props: {
		type: {
			default: "info",
			type: String
		},
		heading: {
			default: "",
			type: String
		},
		text: {
			default: "",
			type: String
		},
		icon: {
			default: "",
			type: String
		},
		actionText: {
			default: "",
			type: String
		},
		actionHref: {
			default: "",
			type: String
		},
		actionIcon: {
			default: "mdi-arrow-right",
			type: String
		}
	},
	emits: ["action"],
	setup(r) {
		let m = {
			info: "mdi-information-outline",
			warning: "mdi-puzzle-outline",
			error: "mdi-alert-circle-outline"
		}, x = r, S = l(), C = o(() => x.type === "warning" || x.type === "error" ? x.type : "info");
		function w(e) {
			h(S, "action", x.actionHref, e);
		}
		return (o, l) => (e(), s("div", v, [p(n(_), {
			type: C.value,
			variant: "tonal",
			rounded: "xl",
			icon: r.icon || m[C.value],
			"data-part": "notice"
		}, {
			default: t(() => [d("div", y, [
				r.heading ? (e(), s("p", b, a(r.heading), 1)) : c("", !0),
				r.text ? (e(), s("p", {
					key: 1,
					class: i(["ma-0", { "mb-2": r.actionText }]),
					"data-part": "text"
				}, a(r.text), 3)) : c("", !0),
				r.actionText ? (e(), u(n(g), {
					key: 2,
					href: r.actionHref || void 0,
					size: "small",
					variant: "tonal",
					color: C.value,
					rounded: "lg",
					class: "text-none",
					"prepend-icon": r.actionIcon,
					"data-part": "action",
					onClick: w
				}, {
					default: t(() => [f(a(r.actionText), 1)]),
					_: 1
				}, 8, [
					"href",
					"color",
					"prepend-icon"
				])) : c("", !0)
			])]),
			_: 1
		}, 8, ["type", "icon"])]));
	}
}));
//#endregion
