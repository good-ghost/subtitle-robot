import { Pn as e, Rn as t, Wn as n, ar as r, bn as i, cr as a, dr as o, fn as s, gn as c, hn as l, in as u, mn as d, pn as f, ur as p, yn as m } from "../chunks/vuetify-DJ4bsPds.js";
import { t as h } from "../chunks/define-BG7hCbXs.js";
import { n as g } from "../chunks/cancelableLink-DUAoXNUy.js";
import { a as _ } from "../chunks/density-Dh8nVFPw.js";
import { t as v } from "../chunks/VAvatar-B5evLdR9.js";
import { t as y } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as b } from "../chunks/VCard-CIgInzZL.js";
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
h("smartview-stat-card", /* @__PURE__ */ y(/* @__PURE__ */ i({
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
	setup(i) {
		let h = {
			decorated: {
				avatarSize: 52,
				entranceStepMs: 80
			},
			plain: {
				avatarSize: 48,
				entranceStepMs: 70
			}
		}, y = i, T = u(), E = s(() => h[y.variant].avatarSize), D = s(() => h[y.variant].entranceStepMs);
		function O(e) {
			y.href && g(T, "navigate", y.href, e);
		}
		return (s, u) => (e(), d(t(i.href ? "a" : "div"), {
			href: i.href || void 0,
			class: "smartview-stat-card-link",
			"data-part": "root",
			onClick: O
		}, {
			default: n(() => [m(r(b), {
				class: a(["stat-card pa-5", `stat-card--${i.variant}`]),
				rounded: "xl",
				elevation: "0",
				style: p({ animationDelay: `${i.index * D.value}ms` })
			}, {
				default: n(() => [i.variant === "decorated" ? (e(), c("div", {
					key: 0,
					class: a(["stat-gradient", `stat-gradient--${i.accent}`]),
					"data-part": "decoration"
				}, null, 2)) : l("", !0), f("div", x, [f("div", null, [
					f("p", S, o(i.label), 1),
					f("p", C, o(i.value), 1),
					i.caption ? (e(), c("p", w, o(i.caption), 1)) : l("", !0)
				]), m(r(v), {
					color: i.color,
					size: E.value,
					class: "stat-icon-avatar",
					variant: "tonal",
					"data-part": "icon"
				}, {
					default: n(() => [m(r(_), {
						icon: i.icon,
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
