import { A as e, Bn as t, D as n, En as r, Hn as i, Ht as a, Mn as o, Qt as s, Sn as c, T as l, Tn as u, Un as d, Xn as f, _r as p, bn as m, bt as h, cr as g, dr as _, en as v, gr as y, in as b, mn as x, mr as S, on as C, rn as ee, tn as w, u as te, un as ne, v as T, vn as E, wn as D, xn as O, yn as k } from "../chunks/vuetify-C39-WP9g.js";
import { a as A, n as re, t as j } from "../chunks/rounded-1DPtyqNn.js";
import { i as M } from "../chunks/VOverlay-DFwN_aF6.js";
import { a as N, c as P, l as F, n as I, s as ie, t as ae } from "../chunks/define-BovISfN4.js";
import { o as L, t as R } from "../chunks/VList-BQKDUGEW.js";
import { t as z } from "../chunks/SmartviewToast.ce-BmO1LB3N.js";
import { i as B, r as V } from "../chunks/settings-D7A6aKel.js";
import { n as H, t as U } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as W } from "../chunks/hostValue-CjEvr2gM.js";
import { t as G } from "../chunks/VDivider-CA-IOlps.js";
import { a as K, i as q, n as J, r as oe, t as se } from "../chunks/density-9WZgplEH.js";
import { r as ce, t as le } from "../chunks/router-C0qlu-KG.js";
import { t as Y } from "../chunks/VTooltip-CGIxG6WB.js";
import { t as X } from "../chunks/VBtn-CV2MWNTN.js";
import { t as ue } from "../chunks/VChip-C-IhEdKW.js";
import { t as de } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
//#region src/runtime/statusDot.ts
var fe = {
	ok: "smartview.dotOk",
	error: "smartview.dotError",
	unknown: "smartview.dotUnknown"
};
function Z(e) {
	return e === "ok" || e === "error" ? e : "unknown";
}
function Q(e) {
	return fe[e];
}
//#endregion
//#region src/messages/NavDrawerView.ts
var pe = s({
	en: {
		navigation: "Navigation",
		navVersion: "Admin console v{v}",
		navLightMode: "Light mode",
		navDarkMode: "Dark mode",
		navCollapse: "Collapse menu",
		navExpand: "Expand menu",
		navLocaleSwitch: "{from} → {to}"
	},
	ko: {
		navigation: "탐색",
		navVersion: "관리 콘솔 v{v}",
		navLightMode: "라이트 모드",
		navDarkMode: "다크 모드",
		navCollapse: "메뉴 접기",
		navExpand: "메뉴 펼치기",
		navLocaleSwitch: "{from} → {to}"
	}
}), me = ["aria-label"], he = {
	class: "d-flex align-center pa-4",
	"data-part": "brand"
}, ge = {
	key: 0,
	class: "smartview-nav__brand-text"
}, _e = {
	class: "text-title-medium font-weight-bold smartview-nav__brand-name",
	"data-part": "brand-name"
}, ve = {
	key: 0,
	class: "text-body-small text-medium-emphasis",
	"data-part": "version"
}, ye = /* @__PURE__ */ r({
	__name: "NavDrawerView",
	props: {
		items: {},
		footerItems: {},
		brandName: {},
		brandIcon: {},
		version: {},
		current: {},
		rail: { type: Boolean }
	},
	emits: [
		"navigate",
		"footer",
		"toggle-rail"
	],
	setup(e, { emit: n }) {
		let r = e, a = n, { t: o, locale: s } = C();
		v(pe);
		let l = te(), d = E(() => {
			let e = ee(s.value) ? s.value : "en", t = b(e), n = l.global.current.value.dark;
			return [
				{
					key: "locale",
					label: o("smartview.navLocaleSwitch", {
						from: w[e],
						to: w[t]
					}),
					icon: "mdi-translate",
					run: () => V(t)
				},
				{
					key: "theme",
					label: o(n ? "smartview.navLightMode" : "smartview.navDarkMode"),
					icon: n ? "mdi-weather-sunny" : "mdi-weather-night",
					run: () => B(n ? "light" : "dark")
				},
				{
					key: "rail",
					label: r.rail ? o("smartview.navExpand") : o("smartview.navCollapse"),
					icon: r.rail ? "mdi-chevron-right" : "mdi-chevron-left",
					run: () => a("toggle-rail")
				},
				...r.footerItems.map((e) => ({
					key: e.key,
					label: e.label,
					icon: e.icon || "mdi-circle-small",
					color: e.color,
					run: () => a("footer", e.key)
				}))
			];
		});
		return (n, r) => (t(), c("nav", {
			class: S(["smartview-nav", { "smartview-nav--rail": e.rail }]),
			"aria-label": e.brandName || _(o)("smartview.navigation"),
			"data-part": "drawer"
		}, [
			k("div", he, [u(_(K), {
				size: e.rail ? 24 : 28,
				color: "primary",
				class: S(e.rail ? "" : "mr-3"),
				icon: e.brandIcon || "mdi-view-dashboard-outline"
			}, null, 8, [
				"size",
				"class",
				"icon"
			]), e.rail ? O("", !0) : (t(), c("div", ge, [k("div", _e, p(e.brandName), 1), e.version ? (t(), c("div", ve, p(_(o)("smartview.navVersion", { v: e.version })), 1)) : O("", !0)]))]),
			u(_(G)),
			u(_(R), {
				density: "comfortable",
				nav: "",
				class: "smartview-nav__items",
				"data-part": "items"
			}, {
				default: f(() => [(t(!0), c(x, null, i(e.items, (n) => (t(), m(_(L), {
					key: n.key,
					href: n.href || void 0,
					"prepend-icon": n.icon || "mdi-circle-small",
					title: n.label,
					active: n.key === e.current,
					"aria-current": n.key === e.current ? "page" : void 0,
					"aria-label": e.rail ? n.label : void 0,
					color: "primary",
					rounded: "lg",
					class: "my-1",
					"data-part": "item",
					"data-key": n.key,
					onClick: (e) => a("navigate", n, e)
				}, {
					default: f(() => [e.rail ? (t(), m(_(Y), {
						key: 0,
						activator: "parent",
						location: "end"
					}, {
						default: f(() => [D(p(n.label), 1)]),
						_: 2
					}, 1024)) : O("", !0)]),
					_: 2
				}, 1032, [
					"href",
					"prepend-icon",
					"title",
					"active",
					"aria-current",
					"aria-label",
					"data-key",
					"onClick"
				]))), 128))]),
				_: 1
			}),
			u(_(G)),
			u(_(R), {
				density: "compact",
				nav: "",
				"data-part": "footer"
			}, {
				default: f(() => [(t(!0), c(x, null, i(d.value, (n) => (t(), m(_(L), {
					key: n.key,
					"prepend-icon": n.icon,
					title: n.label,
					"base-color": n.color || void 0,
					"aria-label": e.rail ? n.label : void 0,
					rounded: "lg",
					"data-part": "footer-item",
					"data-key": n.key,
					onClick: n.run
				}, {
					default: f(() => [e.rail ? (t(), m(_(Y), {
						key: 0,
						activator: "parent",
						location: "end"
					}, {
						default: f(() => [D(p(n.label), 1)]),
						_: 2
					}, 1024)) : O("", !0)]),
					_: 2
				}, 1032, [
					"prepend-icon",
					"title",
					"base-color",
					"aria-label",
					"data-key",
					"onClick"
				]))), 128))]),
				_: 1
			})
		], 10, me));
	}
}), be = s({
	en: {
		topBarMenu: "Toggle menu",
		topBarHelp: "Help"
	},
	ko: {
		topBarMenu: "메뉴 펼치기·접기",
		topBarHelp: "도움말"
	}
}), xe = s({
	en: {
		dotOk: "Connected",
		dotError: "Disconnected",
		dotUnknown: "Unknown"
	},
	ko: {
		dotOk: "연결됨",
		dotError: "연결 끊김",
		dotUnknown: "알 수 없음"
	}
}), Se = e({
	divider: [Number, String],
	...F()
}, "VBreadcrumbsDivider"), Ce = l()({
	name: "VBreadcrumbsDivider",
	props: Se(),
	setup(e, { slots: t }) {
		return P(() => k("li", {
			"aria-hidden": "true",
			class: S(["v-breadcrumbs-divider", e.class]),
			style: y(e.style)
		}, [t?.default?.() ?? e.divider])), {};
	}
}), we = e({
	active: Boolean,
	activeClass: String,
	activeColor: String,
	color: String,
	disabled: Boolean,
	title: String,
	...F(),
	...h(oe(), ["width", "maxWidth"]),
	...le(),
	...I({ tag: "li" })
}, "VBreadcrumbsItem"), $ = l()({
	name: "VBreadcrumbsItem",
	props: we(),
	setup(e, { slots: t, attrs: n }) {
		let r = ce(e, n), i = E(() => e.active || r.isActive?.value), { dimensionStyles: a } = q(e), { textColorClasses: s, textColorStyles: c } = ie(() => i.value ? e.activeColor : e.color);
		return P(() => u(e.tag, {
			class: S([
				"v-breadcrumbs-item",
				{
					"v-breadcrumbs-item--active": i.value,
					"v-breadcrumbs-item--disabled": e.disabled,
					[`${e.activeClass}`]: i.value && e.activeClass
				},
				s.value,
				e.class
			]),
			style: y([
				c.value,
				a.value,
				e.style
			]),
			"aria-current": i.value ? "page" : void 0
		}, { default: () => [r.isLink.value ? k("a", o({
			class: "v-breadcrumbs-item--link",
			onClick: r.navigate.value
		}, r.linkProps), [t.default?.() ?? e.title]) : t.default?.() ?? e.title] })), {};
	}
}), Te = e({
	activeClass: String,
	activeColor: String,
	bgColor: String,
	color: String,
	disabled: Boolean,
	divider: {
		type: String,
		default: "/"
	},
	icon: T,
	items: {
		type: Array,
		default: () => []
	},
	...F(),
	...se(),
	...j(),
	...I({ tag: "ul" })
}, "VBreadcrumbs"), Ee = l()({
	name: "VBreadcrumbs",
	props: Te(),
	setup(e, { slots: t }) {
		let { backgroundColorClasses: r, backgroundColorStyles: i } = N(() => e.bgColor), { densityClasses: s } = J(e), { roundedClasses: c, roundedStyles: l } = re(e);
		n({
			VBreadcrumbsDivider: { divider: g(() => e.divider) },
			VBreadcrumbsItem: {
				activeClass: g(() => e.activeClass),
				activeColor: g(() => e.activeColor),
				color: g(() => e.color),
				disabled: g(() => e.disabled)
			}
		});
		let d = E(() => e.items.map((e) => a(e) ? {
			item: { title: e },
			raw: e
		} : {
			item: e,
			raw: e
		}));
		return P(() => {
			let n = !!(t.prepend || e.icon);
			return u(e.tag, {
				class: S([
					"v-breadcrumbs",
					r.value,
					s.value,
					c.value,
					e.class
				]),
				style: y([
					i.value,
					l.value,
					e.style
				])
			}, { default: () => [
				n && k("li", {
					key: "prepend",
					class: "v-breadcrumbs__prepend"
				}, [t.prepend ? u(A, {
					key: "prepend-defaults",
					disabled: !e.icon,
					defaults: { VIcon: {
						icon: e.icon,
						start: !0
					} }
				}, t.prepend) : u(K, {
					key: "prepend-icon",
					start: !0,
					icon: e.icon
				}, null)]),
				d.value.map(({ item: e, raw: n }, r, i) => k(x, null, [t.item?.({
					item: e,
					index: r
				}) ?? u($, o({
					key: r,
					disabled: r >= i.length - 1
				}, a(e) ? { title: e } : e), { default: t.title ? () => t.title?.({
					item: e,
					index: r
				}) : void 0 }), r < i.length - 1 && u(Ce, null, { default: t.divider ? () => t.divider?.({
					item: n,
					index: r
				}) : void 0 })])),
				t.default?.()
			] });
		}), {};
	}
}), De = s({
	en: { breadcrumb: "Breadcrumb" },
	ko: { breadcrumb: "현재 위치" }
}), Oe = ["title"], ke = /* @__PURE__ */ r({
	__name: "BreadcrumbsView",
	props: { breadcrumbs: {} },
	emits: ["navigate"],
	setup(e, { emit: n }) {
		let r = e, i = n, { t: a } = C();
		v(De);
		let o = E(() => r.breadcrumbs.map((e) => ({
			title: e.label,
			href: e.href ?? ""
		})));
		function s(e, t) {
			let n = r.breadcrumbs[e];
			n?.href && e !== r.breadcrumbs.length - 1 && i("navigate", n, e, t);
		}
		return (e, n) => (t(), m(_(Ee), {
			items: o.value,
			density: "compact",
			class: "smartview-breadcrumbs",
			"aria-label": _(a)("smartview.breadcrumb"),
			"data-part": "breadcrumbs"
		}, {
			divider: f(() => [u(_(K), { icon: "mdi-chevron-right" })]),
			item: f(({ item: e, index: t }) => [u(_($), {
				href: t < o.value.length - 1 && e.href ? e.href : void 0,
				disabled: !1,
				active: t === o.value.length - 1,
				"aria-current": t === o.value.length - 1 ? "page" : void 0,
				"data-part": "crumb",
				onClick: (e) => s(t, e)
			}, {
				default: f(() => [k("span", {
					class: "smartview-breadcrumbs__text",
					title: e.title,
					"data-part": "crumb-text"
				}, p(e.title), 9, Oe)]),
				_: 2
			}, 1032, [
				"href",
				"active",
				"aria-current",
				"onClick"
			])]),
			_: 1
		}, 8, ["items", "aria-label"]));
	}
}), Ae = { "data-part": "label" }, je = "grey-darken-1", Me = /* @__PURE__ */ r({
	__name: "StatusDotView",
	props: {
		state: {},
		label: {},
		hint: { default: "" },
		flat: {
			type: Boolean,
			default: !1
		},
		pill: {
			type: Boolean,
			default: !1
		}
	},
	setup(e) {
		let n = e, r = {
			ok: "success",
			error: "error",
			unknown: "grey"
		}, i = E(() => n.state === "unknown" ? n.flat ? je : void 0 : r[n.state]), a = E(() => n.state === "unknown" && !n.flat ? r.unknown : void 0);
		return (n, r) => (t(), m(_(ue), {
			color: i.value,
			variant: e.flat ? "flat" : "tonal",
			label: !e.pill,
			tabindex: e.hint ? 0 : void 0,
			size: "small",
			"data-state": e.state,
			"data-part": "chip"
		}, {
			default: f(() => [
				u(_(K), {
					start: "",
					size: "12",
					icon: "mdi-circle",
					color: a.value
				}, null, 8, ["color"]),
				k("span", Ae, p(e.label), 1),
				e.hint ? (t(), m(_(Y), {
					key: 0,
					activator: "parent",
					location: "top",
					"max-width": "320",
					"content-props": { "data-part": "status-dot-tooltip" }
				}, {
					default: f(() => [D(p(e.hint), 1)]),
					_: 1
				})) : O("", !0)
			]),
			_: 1
		}, 8, [
			"color",
			"variant",
			"label",
			"tabindex",
			"data-state"
		]));
	}
}), Ne = {
	class: "smartview-global-header",
	"data-part": "top-bar"
}, Pe = { class: "smartview-global-header__end" }, Fe = {
	key: 0,
	role: "status",
	"data-part": "status"
}, Ie = /* @__PURE__ */ r({
	__name: "TopBarView",
	props: {
		breadcrumbs: {},
		status: {},
		statusLabel: {},
		showHelp: { type: Boolean },
		menuExpanded: { type: Boolean }
	},
	emits: [
		"menu-toggle",
		"help",
		"navigate"
	],
	setup(e, { emit: n }) {
		let r = n, { t: i } = C();
		return v(xe, be), (n, a) => (t(), c("header", Ne, [
			u(_(X), {
				icon: "mdi-menu",
				variant: "text",
				density: "comfortable",
				"aria-label": _(i)("smartview.topBarMenu"),
				"aria-expanded": e.menuExpanded === void 0 ? void 0 : String(e.menuExpanded),
				"data-part": "menu",
				onClick: a[0] ||= (e) => r("menu-toggle")
			}, null, 8, ["aria-label", "aria-expanded"]),
			u(ke, {
				breadcrumbs: e.breadcrumbs,
				onNavigate: a[1] ||= (e, t, n) => r("navigate", e, t, n)
			}, null, 8, ["breadcrumbs"]),
			k("div", Pe, [
				d(n.$slots, "actions"),
				e.status ? (t(), c("span", Fe, [u(Me, {
					state: _(Z)(e.status),
					label: e.statusLabel || _(i)(_(Q)(_(Z)(e.status))),
					pill: ""
				}, null, 8, ["state", "label"])])) : O("", !0),
				e.showHelp ? (t(), m(_(X), {
					key: 1,
					icon: "",
					variant: "text",
					size: "small",
					"aria-label": _(i)("smartview.topBarHelp"),
					"data-part": "help",
					onClick: a[2] ||= (e) => r("help")
				}, {
					default: f(() => [u(_(K), { icon: "mdi-help-circle-outline" }), u(_(Y), {
						activator: "parent",
						location: "bottom"
					}, {
						default: f(() => [D(p(_(i)("smartview.topBarHelp")), 1)]),
						_: 1
					})]),
					_: 1
				}, 8, ["aria-label"])) : O("", !0)
			])
		]));
	}
}), Le = {
	class: "smartview-root smartview-shell",
	"data-part": "shell"
}, Re = { class: "smartview-shell__content" }, ze = {
	class: "smartview-shell__main",
	"data-part": "main"
};
//#endregion
//#region src/entries/smartview-app-shell.ts
ae("smartview-app-shell", /* @__PURE__ */ de(/* @__PURE__ */ r({
	__name: "SmartviewAppShell.ce",
	props: {
		items: {
			default: () => [],
			type: Array
		},
		footerItems: {
			default: () => [],
			type: Array
		},
		brandName: {
			default: "",
			type: String
		},
		brandIcon: {
			default: "",
			type: String
		},
		version: {
			default: "",
			type: String
		},
		current: {
			default: "",
			type: String
		},
		rail: {
			type: Boolean,
			default: !1
		},
		breadcrumbs: {
			default: () => [],
			type: Array
		},
		status: {
			default: "",
			type: String
		},
		statusLabel: {
			default: "",
			type: String
		},
		showHelp: {
			type: Boolean,
			default: !1
		},
		snackbarLocation: {
			default: "top right",
			type: String
		},
		overlayTarget: {
			default: "body",
			type: String
		}
	},
	emits: [
		"navigate",
		"rail-change",
		"footer-action",
		"help"
	],
	setup(e, { emit: n }) {
		let r = e, i = n, a = ne(), { overlayDefaults: o } = M(() => r.overlayTarget), { current: s, commit: c } = W("rail", () => r.rail), l = (e) => typeof e == "object" && !!e && typeof Reflect.get(e, "key") == "string" && typeof Reflect.get(e, "label") == "string", p = E(() => Array.isArray(r.items) ? r.items.filter(l) : []), h = E(() => Array.isArray(r.footerItems) ? r.footerItems.filter(l) : []), g = E(() => (Array.isArray(r.breadcrumbs) ? r.breadcrumbs : []).filter((e) => typeof e?.label == "string")), v = E(() => r.status ? Z(r.status) : "");
		function y(e, t) {
			U(a, "navigate", e.href ?? "", t, {
				source: "drawer",
				key: e.key
			});
		}
		function b(e, t, n) {
			e.href && H(a, "navigate", e.href, n, {
				source: "breadcrumb",
				label: e.label,
				index: t
			});
		}
		function x() {
			let e = !s.value;
			c(e), i("rail-change", e);
		}
		return (n, r) => (t(), m(_(A), { defaults: _(o) }, {
			default: f(() => [k("div", Le, [
				u(ye, {
					items: p.value,
					"footer-items": h.value,
					"brand-name": e.brandName,
					"brand-icon": e.brandIcon,
					version: e.version,
					current: e.current,
					rail: _(s),
					onNavigate: y,
					onFooter: r[0] ||= (e) => i("footer-action", { key: e }),
					onToggleRail: x
				}, null, 8, [
					"items",
					"footer-items",
					"brand-name",
					"brand-icon",
					"version",
					"current",
					"rail"
				]),
				k("div", Re, [u(Ie, {
					breadcrumbs: g.value,
					status: v.value,
					"status-label": e.statusLabel,
					"show-help": e.showHelp,
					"menu-expanded": !_(s),
					onMenuToggle: x,
					onHelp: r[1] ||= (e) => i("help"),
					onNavigate: b
				}, {
					actions: f(() => [d(n.$slots, "actions")]),
					_: 3
				}, 8, [
					"breadcrumbs",
					"status",
					"status-label",
					"show-help",
					"menu-expanded"
				]), k("main", ze, [d(n.$slots, "default")])]),
				u(z, {
					location: e.snackbarLocation,
					"overlay-target": e.overlayTarget
				}, null, 8, ["location", "overlay-target"])
			])]),
			_: 3
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-nav{box-sizing:border-box;background:rgb(var(--v-theme-surface));width:256px;height:100%;color:rgb(var(--v-theme-on-surface));flex-direction:column;transition:width .2s cubic-bezier(.4,0,.2,1);display:flex;overflow:hidden}.smartview-nav--rail{width:56px}@media (prefers-reduced-motion:reduce){.smartview-nav{transition:none}}.smartview-nav>*{flex:none}.smartview-nav__items{flex:auto;min-height:0;overflow:hidden auto}.smartview-nav__brand-name{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.smartview-nav--rail .v-list-item__content{display:none}.smartview-nav__brand-text{min-width:0}.smartview-global-header{box-sizing:border-box;background:rgb(var(--v-theme-surface));height:48px;color:rgb(var(--v-theme-on-surface));border-bottom:1px solid rgba(var(--v-border-color), var(--v-border-opacity));align-items:center;gap:4px;padding:0 8px 0 4px;display:flex;container-type:inline-size}@container (width<=480px){.smartview-global-header .smartview-breadcrumbs .v-breadcrumbs-item:not(:last-child),.smartview-global-header .smartview-breadcrumbs .v-breadcrumbs-divider{display:none}}.smartview-global-header__end{flex:none;align-items:center;gap:8px;display:flex}.smartview-breadcrumbs{flex-wrap:nowrap;flex:auto;min-width:0;overflow:hidden}.smartview-breadcrumbs .v-breadcrumbs-item,.smartview-breadcrumbs .v-breadcrumbs-item--link{min-width:0}.smartview-breadcrumbs__text{white-space:nowrap;text-overflow:ellipsis;min-width:0;display:block;overflow:hidden}.smartview-breadcrumbs .v-breadcrumbs-divider{flex:none}", ":host{height:100%;display:block}.smartview-shell{background:rgb(var(--v-theme-background));height:100%;color:rgb(var(--v-theme-on-background));display:flex}.smartview-shell>.smartview-nav{flex:none}.smartview-shell__content{flex-direction:column;flex:auto;min-width:0;display:flex}.smartview-shell__main{flex:auto;min-height:0;overflow:auto}"]]]));
//#endregion
