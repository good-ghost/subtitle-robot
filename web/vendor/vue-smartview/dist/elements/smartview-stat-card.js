import { Bn as e, En as t, Sn as n, Tn as r, Wn as i, Xn as a, _r as o, bn as s, dr as c, gr as l, mr as u, un as d, vn as f, xn as p, yn as m } from "../chunks/vuetify-C39-WP9g.js";
import { t as h } from "../chunks/define-BovISfN4.js";
import { n as g } from "../chunks/cancelableLink-DUAoXNUy.js";
import { a as _ } from "../chunks/density-9WZgplEH.js";
import { t as v } from "../chunks/VAvatar-DdB1q11O.js";
import { t as y } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as b } from "../chunks/VCard-Z58vOTy1.js";
//#region src/elements/SmartviewStatCard.ce.vue?vue&type=script&setup=true&lang.ts
var x = { class: "d-flex align-center justify-space-between position-relative" }, S = {
	class: "text-body-medium text-medium-emphasis font-weight-medium mt-0 mb-1",
	"data-part": "label"
}, C = {
	class: "text-headline-large font-weight-bold ma-0",
	"data-part": "value"
}, w = {
	key: 0,
	class: "text-body-small text-medium-emphasis ma-0",
	"data-part": "caption"
};
//#endregion
//#region src/entries/smartview-stat-card.ts
h("smartview-stat-card", /* @__PURE__ */ y(/* @__PURE__ */ t({
	__name: "SmartviewStatCard.ce",
	props: {
		label: {
			default: "",
			type: String
		},
		value: {
			default: "",
			type: [String, Number]
		},
		caption: {
			default: "",
			type: String
		},
		icon: {
			default: "mdi-chart-box-outline",
			type: String
		},
		color: {
			default: "primary",
			type: String
		},
		accent: {
			default: "blue",
			type: String
		},
		index: {
			default: 0,
			type: Number
		},
		href: {
			default: "",
			type: String
		},
		variant: {
			default: "decorated",
			type: String
		}
	},
	setup(t) {
		let h = {
			decorated: {
				avatarSize: 52,
				entranceStepMs: 80
			},
			plain: {
				avatarSize: 48,
				entranceStepMs: 70
			}
		}, y = t, T = d(), E = f(() => h[y.variant].avatarSize), D = f(() => h[y.variant].entranceStepMs);
		function O(e) {
			y.href && g(T, "navigate", y.href, e);
		}
		return (d, f) => (e(), s(i(t.href ? "a" : "div"), {
			href: t.href || void 0,
			class: "smartview-stat-card-link",
			"data-part": "root",
			onClick: O
		}, {
			default: a(() => [r(c(b), {
				class: u(["stat-card pa-5", `stat-card--${t.variant}`]),
				rounded: "xl",
				elevation: "0",
				style: l({ animationDelay: `${t.index * D.value}ms` })
			}, {
				default: a(() => [t.variant === "decorated" ? (e(), n("div", {
					key: 0,
					class: u(["stat-gradient", `stat-gradient--${t.accent}`]),
					"data-part": "decoration"
				}, null, 2)) : p("", !0), m("div", x, [m("div", null, [
					m("p", S, o(t.label), 1),
					m("p", C, o(t.value), 1),
					t.caption ? (e(), n("p", w, o(t.caption), 1)) : p("", !0)
				]), r(c(v), {
					color: t.color,
					size: E.value,
					class: "stat-icon-avatar",
					variant: "tonal",
					"data-part": "icon"
				}, {
					default: a(() => [r(c(_), {
						icon: t.icon,
						size: E.value / 2
					}, null, 8, ["icon", "size"])]),
					_: 1
				}, 8, ["color", "size"])])]),
				_: 1
			}, 8, ["class", "style"])]),
			_: 1
		}, 8, ["href"]));
	}
}), [["styles", [".smartview-stat-card-link{color:inherit;text-decoration:none;display:block}.smartview-stat-card-link:focus-visible{outline:none}.smartview-stat-card-link:focus-visible .stat-card{outline:2px solid rgb(var(--v-theme-primary));outline-offset:2px}.stat-card{border:1px solid rgba(var(--v-border-color), var(--v-border-opacity));transition:transform .2s,box-shadow .2s;animation:.4s ease-out backwards smartview-slide-up;position:relative;overflow:hidden}.stat-card--decorated:hover{transform:translateY(-4px);box-shadow:0 8px 30px #00000040}.stat-card--plain{animation-name:smartview-slide-up-plain}.stat-card--plain:hover{transform:translateY(-3px)}@keyframes smartview-slide-up{0%{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes smartview-slide-up-plain{0%{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}.stat-gradient{opacity:.07;border-radius:50% 0 0 50%;width:120px;height:100%;position:absolute;top:0;right:0}.stat-gradient--blue{background:radial-gradient(circle at 70%,#42a5f5,#0000 70%)}.stat-gradient--cyan{background:radial-gradient(circle at 70%,#26c6da,#0000 70%)}.stat-gradient--green{background:radial-gradient(circle at 70%,#66bb6a,#0000 70%)}.stat-gradient--red{background:radial-gradient(circle at 70%,#ef5350,#0000 70%)}.stat-gradient--orange{background:radial-gradient(circle at 70%,#ffb74d,#0000 70%)}.stat-icon-avatar{transition:transform .2s}.stat-card--decorated:hover .stat-icon-avatar{transform:scale(1.1)}@media (prefers-reduced-motion:reduce){.stat-card,.stat-icon-avatar{transition:none;animation:none}.stat-card--decorated:hover,.stat-card--plain:hover,.stat-card--decorated:hover .stat-icon-avatar{transform:none}}"]]]));
//#endregion
