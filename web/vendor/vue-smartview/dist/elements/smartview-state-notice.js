import { Bn as e, En as t, Sn as n, Tn as r, Xn as i, _r as a, bn as o, dr as s, mr as c, un as l, vn as u, wn as d, xn as f, yn as p } from "../chunks/vuetify-C39-WP9g.js";
import { t as m } from "../chunks/define-BovISfN4.js";
import { t as h } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as g } from "../chunks/VBtn-CV2MWNTN.js";
import { t as _ } from "../chunks/VAlert-rN_W5d_m.js";
//#region src/elements/SmartviewStateNotice.ce.vue?vue&type=script&setup=true&lang.ts
var v = { class: "smartview-root" }, y = { class: "text-body-medium" }, b = {
	key: 0,
	class: "font-weight-bold ma-0 mb-1",
	"data-part": "heading"
};
//#endregion
//#region src/entries/smartview-state-notice.ts
m("smartview-state-notice", /* @__PURE__ */ t({
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
	setup(t) {
		let m = {
			info: "mdi-information-outline",
			warning: "mdi-puzzle-outline",
			error: "mdi-alert-circle-outline"
		}, x = t, S = l(), C = u(() => x.type === "warning" || x.type === "error" ? x.type : "info");
		function w(e) {
			h(S, "action", x.actionHref, e);
		}
		return (l, u) => (e(), n("div", v, [r(s(_), {
			type: C.value,
			variant: "tonal",
			rounded: "xl",
			icon: t.icon || m[C.value],
			"data-part": "notice"
		}, {
			default: i(() => [p("div", y, [
				t.heading ? (e(), n("p", b, a(t.heading), 1)) : f("", !0),
				t.text ? (e(), n("p", {
					key: 1,
					class: c(["ma-0", { "mb-2": t.actionText }]),
					"data-part": "text"
				}, a(t.text), 3)) : f("", !0),
				t.actionText ? (e(), o(s(g), {
					key: 2,
					href: t.actionHref || void 0,
					size: "small",
					variant: "tonal",
					color: C.value,
					rounded: "lg",
					class: "text-none",
					"prepend-icon": t.actionIcon,
					"data-part": "action",
					onClick: w
				}, {
					default: i(() => [d(a(t.actionText), 1)]),
					_: 1
				}, 8, [
					"href",
					"color",
					"prepend-icon"
				])) : f("", !0)
			])]),
			_: 1
		}, 8, ["type", "icon"])]));
	}
}));
//#endregion
