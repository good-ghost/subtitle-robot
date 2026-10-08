import { A as e, D as t, G as n, Ht as r, It as i, Jn as a, Mn as o, T as s, Tn as c, Zn as l, _r as u, c as d, gr as f, l as p, mn as m, mr as h, or as g, v as _, yn as v } from "./vuetify-C39-WP9g.js";
import { a as y, i as b, n as x, r as S, t as C } from "./rounded-1DPtyqNn.js";
import { c as w, l as T, n as E } from "./define-BovISfN4.js";
import { t as D } from "./createSimpleFunctional-ue-6VwwS.js";
import { t as O } from "./ripple-BBz9XQtx.js";
import { a as k, i as A, n as j, r as M, t as N } from "./density-9WZgplEH.js";
import { n as P, t as F } from "./VAvatar-DdB1q11O.js";
import { a as ee, c as te, d as I, l as L, o as R, r as z, s as B, t as V, u as H } from "./router-C0qlu-KG.js";
import { n as U, r as W, t as G } from "./loader-DtB2K0GR.js";
import { n as K, t as q } from "./position-UZ3CZfcL.js";
//#region node_modules/vuetify/lib/components/VCard/VCardActions.js
var J = e({
	...T(),
	...E()
}, "VCardActions"), Y = s()({
	name: "VCardActions",
	props: J(),
	setup(e, { slots: n }) {
		return t({ VBtn: {
			slim: !0,
			variant: "text"
		} }), w(() => c(e.tag, {
			class: h(["v-card-actions", e.class]),
			style: f(e.style)
		}, n)), {};
	}
}), X = e({
	opacity: [Number, String],
	...T(),
	...E()
}, "VCardSubtitle"), Z = s()({
	name: "VCardSubtitle",
	props: X(),
	setup(e, { slots: t }) {
		return w(() => c(e.tag, {
			class: h(["v-card-subtitle", e.class]),
			style: f([{ "--v-card-subtitle-opacity": e.opacity }, e.style])
		}, t)), {};
	}
}), Q = D("v-card-title"), ne = e({
	appendAvatar: String,
	appendIcon: _,
	prependAvatar: String,
	prependIcon: _,
	subtitle: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	title: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	...T(),
	...N(),
	...E()
}, "VCardItem"), re = s()({
	name: "VCardItem",
	props: ne(),
	setup(e, { slots: t }) {
		return w(() => {
			let n = !!(e.prependAvatar || e.prependIcon), r = !!(n || t.prepend), i = !!(e.appendAvatar || e.appendIcon), a = !!(i || t.append), o = !!(e.title != null || t.title), s = !!(e.subtitle != null || t.subtitle);
			return c(e.tag, {
				class: h(["v-card-item", e.class]),
				style: f(e.style)
			}, { default: () => [
				r && v("div", {
					key: "prepend",
					class: "v-card-item__prepend"
				}, [t.prepend ? c(y, {
					key: "prepend-defaults",
					disabled: !n,
					defaults: {
						VAvatar: {
							density: e.density,
							image: e.prependAvatar
						},
						VIcon: {
							density: e.density,
							icon: e.prependIcon
						}
					}
				}, t.prepend) : v(m, null, [e.prependAvatar && c(F, {
					key: "prepend-avatar",
					density: e.density,
					image: e.prependAvatar
				}, null), e.prependIcon && c(k, {
					key: "prepend-icon",
					density: e.density,
					icon: e.prependIcon
				}, null)])]),
				v("div", { class: "v-card-item__content" }, [
					o && c(Q, { key: "title" }, { default: () => [t.title?.() ?? u(e.title)] }),
					s && c(Z, { key: "subtitle" }, { default: () => [t.subtitle?.() ?? u(e.subtitle)] }),
					t.default?.()
				]),
				a && v("div", {
					key: "append",
					class: "v-card-item__append"
				}, [t.append ? c(y, {
					key: "append-defaults",
					disabled: !i,
					defaults: {
						VAvatar: {
							density: e.density,
							image: e.appendAvatar
						},
						VIcon: {
							density: e.density,
							icon: e.appendIcon
						}
					}
				}, t.append) : v(m, null, [e.appendIcon && c(k, {
					key: "append-icon",
					density: e.density,
					icon: e.appendIcon
				}, null), e.appendAvatar && c(F, {
					key: "append-avatar",
					density: e.density,
					image: e.appendAvatar
				}, null)])])
			] });
		}), {};
	}
}), ie = e({
	opacity: [Number, String],
	...T(),
	...E()
}, "VCardText"), $ = s()({
	name: "VCardText",
	props: ie(),
	setup(e, { slots: t }) {
		return w(() => c(e.tag, {
			class: h(["v-card-text", e.class]),
			style: f([{ "--v-card-text-opacity": e.opacity }, e.style])
		}, t)), {};
	}
}), ae = e({
	appendAvatar: String,
	appendIcon: _,
	disabled: Boolean,
	flat: Boolean,
	hover: Boolean,
	image: String,
	link: {
		type: Boolean,
		default: void 0
	},
	prependAvatar: String,
	prependIcon: _,
	ripple: {
		type: [Boolean, Object],
		default: !0
	},
	subtitle: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	text: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	title: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	...H(),
	...T(),
	...N(),
	...M(),
	...ee(),
	...U(),
	...S(),
	...q(),
	...C(),
	...V(),
	...E(),
	...d(),
	...te({ variant: "elevated" })
}, "VCard"), oe = s()({
	name: "VCard",
	directives: { vRipple: O },
	props: ae(),
	setup(e, { attrs: t, slots: s }) {
		let { themeClasses: u } = p(e), { borderClasses: d } = I(e), { colorClasses: f, colorStyles: m, variantClasses: h } = L(e), { densityClasses: _ } = j(e), { dimensionStyles: S } = A(e), { elevationClasses: C } = R(e), { loaderClasses: T } = W(e), { locationStyles: E } = b(e), { positionClasses: D } = K(e), { roundedClasses: k, roundedStyles: M } = x(e), N = z(e, t), F = g(void 0);
		return a(() => e.loading, (e, t) => {
			F.value = !e && r(t) ? t : i(e) ? void 0 : e;
		}, { immediate: !0 }), w(() => {
			let t = e.link !== !1 && N.isLink.value, r = !e.disabled && e.link !== !1 && (e.link || N.isClickable.value), i = t ? "a" : e.tag, a = !!(s.title || e.title != null), p = !!(s.subtitle || e.subtitle != null), g = a || p, b = !!(s.append || e.appendAvatar || e.appendIcon), x = !!(s.prepend || e.prependAvatar || e.prependIcon), w = !!(s.image || e.image), A = g || x || b, j = !!(s.text || e.text != null);
			return l(c(i, o(N.linkProps, {
				class: [
					"v-card",
					{
						"v-card--disabled": e.disabled,
						"v-card--flat": e.flat,
						"v-card--hover": e.hover && !(e.disabled || e.flat),
						"v-card--link": r
					},
					u.value,
					d.value,
					f.value,
					_.value,
					C.value,
					T.value,
					D.value,
					k.value,
					h.value,
					e.class
				],
				style: [
					m.value,
					S.value,
					E.value,
					{ "--v-card-height": n(e.height) },
					M.value,
					e.style
				],
				onClick: r && N.navigate.value,
				tabindex: e.disabled ? -1 : void 0
			}), { default: () => [
				w && v("div", {
					key: "image",
					class: "v-card__image"
				}, [s.image ? c(y, {
					key: "image-defaults",
					disabled: !e.image,
					defaults: { VImg: {
						cover: !0,
						src: e.image
					} }
				}, s.image) : c(P, {
					key: "image-img",
					cover: !0,
					src: e.image
				}, null)]),
				c(G, {
					name: "v-card",
					active: !!e.loading,
					color: F.value
				}, { default: s.loader }),
				A && c(re, {
					key: "item",
					prependAvatar: e.prependAvatar,
					prependIcon: e.prependIcon,
					title: e.title,
					subtitle: e.subtitle,
					appendAvatar: e.appendAvatar,
					appendIcon: e.appendIcon
				}, {
					default: s.item,
					prepend: s.prepend,
					title: s.title,
					subtitle: s.subtitle,
					append: s.append
				}),
				j && c($, { key: "text" }, { default: () => [s.text?.() ?? e.text] }),
				s.default?.(),
				s.actions && c(Y, null, { default: s.actions }),
				B(r, "v-card")
			] }), [[O, r && e.ripple]]);
		}), {};
	}
});
//#endregion
export { Y as i, $ as n, Q as r, oe as t };
