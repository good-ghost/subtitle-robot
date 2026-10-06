import { A as e, D as t, En as n, Ht as r, In as i, Ln as a, Pn as o, T as s, Wn as c, ar as l, bn as u, bt as d, cn as f, cr as p, dr as m, en as h, fn as g, gn as _, hn as v, in as ee, mn as y, nr as b, pn as x, u as S, ur as C, v as w, vn as T, yn as E } from "../chunks/vuetify-DJ4bsPds.js";
import { a as D, c as te, i as ne, r as O, s as k } from "../chunks/settings--jlXedH0.js";
import { a as A, n as j, t as re } from "../chunks/rounded-CXkAtXly.js";
import { i as ie } from "../chunks/VOverlay-BI1rs3Fd.js";
import { a as ae, c as M, l as N, n as P, s as F, t as I } from "../chunks/define-BG7hCbXs.js";
import { o as L, t as R } from "../chunks/VList-BOnRbwg2.js";
import { t as z } from "../chunks/SmartviewToast.ce-CeTvVUDs.js";
import { n as B, t as V } from "../chunks/cancelableLink-DUAoXNUy.js";
import { t as H } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as U } from "../chunks/ssrBoot-BMVtmVZ_.js";
import { a as W, i as G, n as K, r as q, t as J } from "../chunks/density-Dh8nVFPw.js";
import { r as oe, t as se } from "../chunks/router-BNmKTwUJ.js";
import { t as Y } from "../chunks/VTooltip-2jm4OuLA.js";
import { t as X } from "../chunks/VBtn-D2PPPp70.js";
import { t as ce } from "../chunks/VChip-Dqfk0_yh.js";
import { t as le } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
//#region src/runtime/statusDot.ts
var ue = {
	ok: "smartview.dotOk",
	error: "smartview.dotError",
	unknown: "smartview.dotUnknown"
};
function Z(e) {
	return e === "ok" || e === "error" ? e : "unknown";
}
function de(e) {
	return ue[e];
}
//#endregion
//#region src/elements/parts/NavDrawerView.vue?vue&type=script&setup=true&lang.ts
var fe = ["aria-label"], pe = {
	class: "d-flex align-center pa-4",
	"data-part": "brand"
}, me = {
	key: 0,
	class: "smartview-nav__brand-text"
}, he = {
	class: "text-title-medium font-weight-bold smartview-nav__brand-name",
	"data-part": "brand-name"
}, ge = {
	key: 0,
	class: "text-body-small text-medium-emphasis",
	"data-part": "version"
}, _e = /* @__PURE__ */ u({
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
	setup(e, { emit: t }) {
		let n = e, r = t, { t: a, locale: s } = h(), u = S(), d = g(() => {
			let e = k(s.value) ? s.value : "en", t = te(e), i = u.global.current.value.dark;
			return [
				{
					key: "locale",
					label: a("smartview.navLocaleSwitch", {
						from: D[e],
						to: D[t]
					}),
					icon: "mdi-translate",
					run: () => O(t)
				},
				{
					key: "theme",
					label: a(i ? "smartview.navLightMode" : "smartview.navDarkMode"),
					icon: i ? "mdi-weather-sunny" : "mdi-weather-night",
					run: () => ne(i ? "light" : "dark")
				},
				{
					key: "rail",
					label: n.rail ? a("smartview.navExpand") : a("smartview.navCollapse"),
					icon: n.rail ? "mdi-chevron-right" : "mdi-chevron-left",
					run: () => r("toggle-rail")
				},
				...n.footerItems.map((e) => ({
					key: e.key,
					label: e.label,
					icon: e.icon || "mdi-circle-small",
					color: e.color,
					run: () => r("footer", e.key)
				}))
			];
		});
		return (t, n) => (o(), _("nav", {
			class: p(["smartview-nav", { "smartview-nav--rail": e.rail }]),
			"aria-label": e.brandName || l(a)("smartview.navigation"),
			"data-part": "drawer"
		}, [
			x("div", pe, [E(l(W), {
				size: e.rail ? 24 : 28,
				color: "primary",
				class: p(e.rail ? "" : "mr-3"),
				icon: e.brandIcon || "mdi-view-dashboard-outline"
			}, null, 8, [
				"size",
				"class",
				"icon"
			]), e.rail ? v("", !0) : (o(), _("div", me, [x("div", he, m(e.brandName), 1), e.version ? (o(), _("div", ge, m(l(a)("smartview.navVersion", { v: e.version })), 1)) : v("", !0)]))]),
			E(l(U)),
			E(l(R), {
				density: "comfortable",
				nav: "",
				class: "smartview-nav__items",
				"data-part": "items"
			}, {
				default: c(() => [(o(!0), _(f, null, i(e.items, (t) => (o(), y(l(L), {
					key: t.key,
					href: t.href || void 0,
					"prepend-icon": t.icon || "mdi-circle-small",
					title: t.label,
					active: t.key === e.current,
					"aria-current": t.key === e.current ? "page" : void 0,
					"aria-label": e.rail ? t.label : void 0,
					color: "primary",
					rounded: "lg",
					class: "my-1",
					"data-part": "item",
					"data-key": t.key,
					onClick: (e) => r("navigate", t, e)
				}, {
					default: c(() => [e.rail ? (o(), y(l(Y), {
						key: 0,
						activator: "parent",
						location: "end"
					}, {
						default: c(() => [T(m(t.label), 1)]),
						_: 2
					}, 1024)) : v("", !0)]),
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
			E(l(U)),
			E(l(R), {
				density: "compact",
				nav: "",
				"data-part": "footer"
			}, {
				default: c(() => [(o(!0), _(f, null, i(d.value, (t) => (o(), y(l(L), {
					key: t.key,
					"prepend-icon": t.icon,
					title: t.label,
					"base-color": t.color || void 0,
					"aria-label": e.rail ? t.label : void 0,
					rounded: "lg",
					"data-part": "footer-item",
					"data-key": t.key,
					onClick: t.run
				}, {
					default: c(() => [e.rail ? (o(), y(l(Y), {
						key: 0,
						activator: "parent",
						location: "end"
					}, {
						default: c(() => [T(m(t.label), 1)]),
						_: 2
					}, 1024)) : v("", !0)]),
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
		], 10, fe));
	}
}), ve = e({
	divider: [Number, String],
	...N()
}, "VBreadcrumbsDivider"), ye = s()({
	name: "VBreadcrumbsDivider",
	props: ve(),
	setup(e, { slots: t }) {
		return M(() => x("li", {
			"aria-hidden": "true",
			class: p(["v-breadcrumbs-divider", e.class]),
			style: C(e.style)
		}, [t?.default?.() ?? e.divider])), {};
	}
}), be = e({
	active: Boolean,
	activeClass: String,
	activeColor: String,
	color: String,
	disabled: Boolean,
	title: String,
	...N(),
	...d(q(), ["width", "maxWidth"]),
	...se(),
	...P({ tag: "li" })
}, "VBreadcrumbsItem"), Q = s()({
	name: "VBreadcrumbsItem",
	props: be(),
	setup(e, { slots: t, attrs: r }) {
		let i = oe(e, r), a = g(() => e.active || i.isActive?.value), { dimensionStyles: o } = G(e), { textColorClasses: s, textColorStyles: c } = F(() => a.value ? e.activeColor : e.color);
		return M(() => E(e.tag, {
			class: p([
				"v-breadcrumbs-item",
				{
					"v-breadcrumbs-item--active": a.value,
					"v-breadcrumbs-item--disabled": e.disabled,
					[`${e.activeClass}`]: a.value && e.activeClass
				},
				s.value,
				e.class
			]),
			style: C([
				c.value,
				o.value,
				e.style
			]),
			"aria-current": a.value ? "page" : void 0
		}, { default: () => [i.isLink.value ? x("a", n({
			class: "v-breadcrumbs-item--link",
			onClick: i.navigate.value
		}, i.linkProps), [t.default?.() ?? e.title]) : t.default?.() ?? e.title] })), {};
	}
}), xe = e({
	activeClass: String,
	activeColor: String,
	bgColor: String,
	color: String,
	disabled: Boolean,
	divider: {
		type: String,
		default: "/"
	},
	icon: w,
	items: {
		type: Array,
		default: () => []
	},
	...N(),
	...J(),
	...re(),
	...P({ tag: "ul" })
}, "VBreadcrumbs"), Se = s()({
	name: "VBreadcrumbs",
	props: xe(),
	setup(e, { slots: i }) {
		let { backgroundColorClasses: a, backgroundColorStyles: o } = ae(() => e.bgColor), { densityClasses: s } = K(e), { roundedClasses: c, roundedStyles: l } = j(e);
		t({
			VBreadcrumbsDivider: { divider: b(() => e.divider) },
			VBreadcrumbsItem: {
				activeClass: b(() => e.activeClass),
				activeColor: b(() => e.activeColor),
				color: b(() => e.color),
				disabled: b(() => e.disabled)
			}
		});
		let u = g(() => e.items.map((e) => r(e) ? {
			item: { title: e },
			raw: e
		} : {
			item: e,
			raw: e
		}));
		return M(() => {
			let t = !!(i.prepend || e.icon);
			return E(e.tag, {
				class: p([
					"v-breadcrumbs",
					a.value,
					s.value,
					c.value,
					e.class
				]),
				style: C([
					o.value,
					l.value,
					e.style
				])
			}, { default: () => [
				t && x("li", {
					key: "prepend",
					class: "v-breadcrumbs__prepend"
				}, [i.prepend ? E(A, {
					key: "prepend-defaults",
					disabled: !e.icon,
					defaults: { VIcon: {
						icon: e.icon,
						start: !0
					} }
				}, i.prepend) : E(W, {
					key: "prepend-icon",
					start: !0,
					icon: e.icon
				}, null)]),
				u.value.map(({ item: e, raw: t }, a, o) => x(f, null, [i.item?.({
					item: e,
					index: a
				}) ?? E(Q, n({
					key: a,
					disabled: a >= o.length - 1
				}, r(e) ? { title: e } : e), { default: i.title ? () => i.title?.({
					item: e,
					index: a
				}) : void 0 }), a < o.length - 1 && E(ye, null, { default: i.divider ? () => i.divider?.({
					item: t,
					index: a
				}) : void 0 })])),
				i.default?.()
			] });
		}), {};
	}
}), Ce = ["title"], we = /* @__PURE__ */ u({
	__name: "BreadcrumbsView",
	props: { breadcrumbs: {} },
	emits: ["navigate"],
	setup(e, { emit: t }) {
		let n = e, r = t, { t: i } = h(), a = g(() => n.breadcrumbs.map((e) => ({
			title: e.label,
			href: e.href ?? ""
		})));
		function s(e, t) {
			let i = n.breadcrumbs[e];
			i?.href && e !== n.breadcrumbs.length - 1 && r("navigate", i, e, t);
		}
		return (e, t) => (o(), y(l(Se), {
			items: a.value,
			density: "compact",
			class: "smartview-breadcrumbs",
			"aria-label": l(i)("smartview.breadcrumb"),
			"data-part": "breadcrumbs"
		}, {
			divider: c(() => [E(l(W), { icon: "mdi-chevron-right" })]),
			item: c(({ item: e, index: t }) => [E(l(Q), {
				href: t < a.value.length - 1 && e.href ? e.href : void 0,
				disabled: !1,
				active: t === a.value.length - 1,
				"aria-current": t === a.value.length - 1 ? "page" : void 0,
				"data-part": "crumb",
				onClick: (e) => s(t, e)
			}, {
				default: c(() => [x("span", {
					class: "smartview-breadcrumbs__text",
					title: e.title,
					"data-part": "crumb-text"
				}, m(e.title), 9, Ce)]),
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
}), Te = { "data-part": "label" }, Ee = "grey-darken-1", De = /* @__PURE__ */ u({
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
		let t = e, n = {
			ok: "success",
			error: "error",
			unknown: "grey"
		}, r = g(() => t.state === "unknown" ? t.flat ? Ee : void 0 : n[t.state]), i = g(() => t.state === "unknown" && !t.flat ? n.unknown : void 0);
		return (t, n) => (o(), y(l(ce), {
			color: r.value,
			variant: e.flat ? "flat" : "tonal",
			label: !e.pill,
			tabindex: e.hint ? 0 : void 0,
			size: "small",
			"data-state": e.state,
			"data-part": "chip"
		}, {
			default: c(() => [
				E(l(W), {
					start: "",
					size: "12",
					icon: "mdi-circle",
					color: i.value
				}, null, 8, ["color"]),
				x("span", Te, m(e.label), 1),
				e.hint ? (o(), y(l(Y), {
					key: 0,
					activator: "parent",
					location: "top",
					"max-width": "320",
					"content-props": { "data-part": "status-dot-tooltip" }
				}, {
					default: c(() => [T(m(e.hint), 1)]),
					_: 1
				})) : v("", !0)
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
}), $ = {
	class: "smartview-global-header",
	"data-part": "top-bar"
}, Oe = { class: "smartview-global-header__end" }, ke = {
	key: 0,
	role: "status",
	"data-part": "status"
}, Ae = /* @__PURE__ */ u({
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
	setup(e, { emit: t }) {
		let n = t, { t: r } = h();
		return (t, i) => (o(), _("header", $, [
			E(l(X), {
				icon: "mdi-menu",
				variant: "text",
				density: "comfortable",
				"aria-label": l(r)("smartview.topBarMenu"),
				"aria-expanded": e.menuExpanded === void 0 ? void 0 : String(e.menuExpanded),
				"data-part": "menu",
				onClick: i[0] ||= (e) => n("menu-toggle")
			}, null, 8, ["aria-label", "aria-expanded"]),
			E(we, {
				breadcrumbs: e.breadcrumbs,
				onNavigate: i[1] ||= (e, t, r) => n("navigate", e, t, r)
			}, null, 8, ["breadcrumbs"]),
			x("div", Oe, [
				a(t.$slots, "actions"),
				e.status ? (o(), _("span", ke, [E(De, {
					state: l(Z)(e.status),
					label: e.statusLabel || l(r)(l(de)(l(Z)(e.status))),
					pill: ""
				}, null, 8, ["state", "label"])])) : v("", !0),
				e.showHelp ? (o(), y(l(X), {
					key: 1,
					icon: "",
					variant: "text",
					size: "small",
					"aria-label": l(r)("smartview.topBarHelp"),
					"data-part": "help",
					onClick: i[2] ||= (e) => n("help")
				}, {
					default: c(() => [E(l(W), { icon: "mdi-help-circle-outline" }), E(l(Y), {
						activator: "parent",
						location: "bottom"
					}, {
						default: c(() => [T(m(l(r)("smartview.topBarHelp")), 1)]),
						_: 1
					})]),
					_: 1
				}, 8, ["aria-label"])) : v("", !0)
			])
		]));
	}
}), je = {
	class: "smartview-root smartview-shell",
	"data-part": "shell"
}, Me = { class: "smartview-shell__content" }, Ne = {
	class: "smartview-shell__main",
	"data-part": "main"
};
//#endregion
//#region src/entries/smartview-app-shell.ts
I("smartview-app-shell", /* @__PURE__ */ le(/* @__PURE__ */ u({
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
	setup(e, { emit: t }) {
		let n = e, r = t, i = ee(), { overlayDefaults: s } = ie(() => n.overlayTarget), { current: u, commit: d } = H("rail", () => n.rail), f = (e) => typeof e == "object" && !!e && typeof Reflect.get(e, "key") == "string" && typeof Reflect.get(e, "label") == "string", p = g(() => Array.isArray(n.items) ? n.items.filter(f) : []), m = g(() => Array.isArray(n.footerItems) ? n.footerItems.filter(f) : []), h = g(() => (Array.isArray(n.breadcrumbs) ? n.breadcrumbs : []).filter((e) => typeof e?.label == "string")), _ = g(() => n.status ? Z(n.status) : "");
		function v(e, t) {
			V(i, "navigate", e.href ?? "", t, {
				source: "drawer",
				key: e.key
			});
		}
		function b(e, t, n) {
			e.href && B(i, "navigate", e.href, n, {
				source: "breadcrumb",
				label: e.label,
				index: t
			});
		}
		function S() {
			let e = !u.value;
			d(e), r("rail-change", e);
		}
		return (t, n) => (o(), y(l(A), { defaults: l(s) }, {
			default: c(() => [x("div", je, [
				E(_e, {
					items: p.value,
					"footer-items": m.value,
					"brand-name": e.brandName,
					"brand-icon": e.brandIcon,
					version: e.version,
					current: e.current,
					rail: l(u),
					onNavigate: v,
					onFooter: n[0] ||= (e) => r("footer-action", { key: e }),
					onToggleRail: S
				}, null, 8, [
					"items",
					"footer-items",
					"brand-name",
					"brand-icon",
					"version",
					"current",
					"rail"
				]),
				x("div", Me, [E(Ae, {
					breadcrumbs: h.value,
					status: _.value,
					"status-label": e.statusLabel,
					"show-help": e.showHelp,
					"menu-expanded": !l(u),
					onMenuToggle: S,
					onHelp: n[1] ||= (e) => r("help"),
					onNavigate: b
				}, {
					actions: c(() => [a(t.$slots, "actions")]),
					_: 3
				}, 8, [
					"breadcrumbs",
					"status",
					"status-label",
					"show-help",
					"menu-expanded"
				]), x("main", Ne, [a(t.$slots, "default")])]),
				E(z, {
					location: e.snackbarLocation,
					"overlay-target": e.overlayTarget
				}, null, 8, ["location", "overlay-target"])
			])]),
			_: 3
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-nav{box-sizing:border-box;background:rgb(var(--v-theme-surface));width:256px;height:100%;color:rgb(var(--v-theme-on-surface));flex-direction:column;transition:width .2s cubic-bezier(.4,0,.2,1);display:flex;overflow:hidden}.smartview-nav--rail{width:56px}@media (prefers-reduced-motion:reduce){.smartview-nav{transition:none}}.smartview-nav>*{flex:none}.smartview-nav__items{flex:auto;min-height:0;overflow:hidden auto}.smartview-nav__brand-name{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.smartview-nav--rail .v-list-item__content{display:none}.smartview-nav__brand-text{min-width:0}.smartview-global-header{box-sizing:border-box;background:rgb(var(--v-theme-surface));height:48px;color:rgb(var(--v-theme-on-surface));border-bottom:1px solid rgba(var(--v-border-color), var(--v-border-opacity));align-items:center;gap:4px;padding:0 8px 0 4px;display:flex;container-type:inline-size}@container (width<=480px){.smartview-global-header .smartview-breadcrumbs .v-breadcrumbs-item:not(:last-child),.smartview-global-header .smartview-breadcrumbs .v-breadcrumbs-divider{display:none}}.smartview-global-header__end{flex:none;align-items:center;gap:8px;display:flex}.smartview-breadcrumbs{flex-wrap:nowrap;flex:auto;min-width:0;overflow:hidden}.smartview-breadcrumbs .v-breadcrumbs-item,.smartview-breadcrumbs .v-breadcrumbs-item--link{min-width:0}.smartview-breadcrumbs__text{white-space:nowrap;text-overflow:ellipsis;min-width:0;display:block;overflow:hidden}.smartview-breadcrumbs .v-breadcrumbs-divider{flex:none}", ":host{height:100%;display:block}.smartview-shell{background:rgb(var(--v-theme-background));height:100%;color:rgb(var(--v-theme-on-background));display:flex}.smartview-shell>.smartview-nav{flex:none}.smartview-shell__content{flex-direction:column;flex:auto;min-width:0;display:flex}.smartview-shell__main{flex:auto;min-height:0;overflow:auto}"]]]));
//#endregion
