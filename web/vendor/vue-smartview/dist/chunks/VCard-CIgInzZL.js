import { A as e, D as t, En as n, G as r, Gn as i, Hn as a, Ht as o, It as s, T as c, c as l, cn as u, cr as d, dr as f, er as p, l as m, pn as h, ur as g, v as _, yn as v } from "./vuetify-DJ4bsPds.js";
import { a as y, i as b, n as x, r as S, t as C } from "./rounded-CXkAtXly.js";
import { c as w, l as T, n as E } from "./define-BG7hCbXs.js";
import { t as D } from "./createSimpleFunctional-CnJMTOVx.js";
import { t as O } from "./ripple-B14E6MmL.js";
import { a as k, i as A, n as j, r as M, t as N } from "./density-Dh8nVFPw.js";
import { n as P, t as F } from "./VAvatar-B5evLdR9.js";
import { a as ee, c as te, d as I, l as L, o as R, r as z, s as B, t as V, u as H } from "./router-BNmKTwUJ.js";
import { n as U, r as W, t as G } from "./loader-3S-Ajd36.js";
import { n as K, t as q } from "./position-B7q6NTBl.js";
//#region node_modules/vuetify/lib/components/VCard/VCardActions.js
var J = e({
	...T(),
	...E()
}, "VCardActions"), Y = c()({
	name: "VCardActions",
	props: J(),
	setup(e, { slots: n }) {
		return t({ VBtn: {
			slim: !0,
			variant: "text"
		} }), w(() => v(e.tag, {
			class: d(["v-card-actions", e.class]),
			style: g(e.style)
		}, n)), {};
	}
}), X = e({
	opacity: [Number, String],
	...T(),
	...E()
}, "VCardSubtitle"), Z = c()({
	name: "VCardSubtitle",
	props: X(),
	setup(e, { slots: t }) {
		return w(() => v(e.tag, {
			class: d(["v-card-subtitle", e.class]),
			style: g([{ "--v-card-subtitle-opacity": e.opacity }, e.style])
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
}, "VCardItem"), re = c()({
	name: "VCardItem",
	props: ne(),
	setup(e, { slots: t }) {
		return w(() => {
			let n = !!(e.prependAvatar || e.prependIcon), r = !!(n || t.prepend), i = !!(e.appendAvatar || e.appendIcon), a = !!(i || t.append), o = !!(e.title != null || t.title), s = !!(e.subtitle != null || t.subtitle);
			return v(e.tag, {
				class: d(["v-card-item", e.class]),
				style: g(e.style)
			}, { default: () => [
				r && h("div", {
					key: "prepend",
					class: "v-card-item__prepend"
				}, [t.prepend ? v(y, {
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
				}, t.prepend) : h(u, null, [e.prependAvatar && v(F, {
					key: "prepend-avatar",
					density: e.density,
					image: e.prependAvatar
				}, null), e.prependIcon && v(k, {
					key: "prepend-icon",
					density: e.density,
					icon: e.prependIcon
				}, null)])]),
				h("div", { class: "v-card-item__content" }, [
					o && v(Q, { key: "title" }, { default: () => [t.title?.() ?? f(e.title)] }),
					s && v(Z, { key: "subtitle" }, { default: () => [t.subtitle?.() ?? f(e.subtitle)] }),
					t.default?.()
				]),
				a && h("div", {
					key: "append",
					class: "v-card-item__append"
				}, [t.append ? v(y, {
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
				}, t.append) : h(u, null, [e.appendIcon && v(k, {
					key: "append-icon",
					density: e.density,
					icon: e.appendIcon
				}, null), e.appendAvatar && v(F, {
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
}, "VCardText"), $ = c()({
	name: "VCardText",
	props: ie(),
	setup(e, { slots: t }) {
		return w(() => v(e.tag, {
			class: d(["v-card-text", e.class]),
			style: g([{ "--v-card-text-opacity": e.opacity }, e.style])
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
	...l(),
	...te({ variant: "elevated" })
}, "VCard"), oe = c()({
	name: "VCard",
	directives: { vRipple: O },
	props: ae(),
	setup(e, { attrs: t, slots: c }) {
		let { themeClasses: l } = m(e), { borderClasses: u } = I(e), { colorClasses: d, colorStyles: f, variantClasses: g } = L(e), { densityClasses: _ } = j(e), { dimensionStyles: S } = A(e), { elevationClasses: C } = R(e), { loaderClasses: T } = W(e), { locationStyles: E } = b(e), { positionClasses: D } = K(e), { roundedClasses: k, roundedStyles: M } = x(e), N = z(e, t), F = p(void 0);
		return a(() => e.loading, (e, t) => {
			F.value = !e && o(t) ? t : s(e) ? void 0 : e;
		}, { immediate: !0 }), w(() => {
			let t = e.link !== !1 && N.isLink.value, a = !e.disabled && e.link !== !1 && (e.link || N.isClickable.value), o = t ? "a" : e.tag, s = !!(c.title || e.title != null), p = !!(c.subtitle || e.subtitle != null), m = s || p, b = !!(c.append || e.appendAvatar || e.appendIcon), x = !!(c.prepend || e.prependAvatar || e.prependIcon), w = !!(c.image || e.image), A = m || x || b, j = !!(c.text || e.text != null);
			return i(v(o, n(N.linkProps, {
				class: [
					"v-card",
					{
						"v-card--disabled": e.disabled,
						"v-card--flat": e.flat,
						"v-card--hover": e.hover && !(e.disabled || e.flat),
						"v-card--link": a
					},
					l.value,
					u.value,
					d.value,
					_.value,
					C.value,
					T.value,
					D.value,
					k.value,
					g.value,
					e.class
				],
				style: [
					f.value,
					S.value,
					E.value,
					{ "--v-card-height": r(e.height) },
					M.value,
					e.style
				],
				onClick: a && N.navigate.value,
				tabindex: e.disabled ? -1 : void 0
			}), { default: () => [
				w && h("div", {
					key: "image",
					class: "v-card__image"
				}, [c.image ? v(y, {
					key: "image-defaults",
					disabled: !e.image,
					defaults: { VImg: {
						cover: !0,
						src: e.image
					} }
				}, c.image) : v(P, {
					key: "image-img",
					cover: !0,
					src: e.image
				}, null)]),
				v(G, {
					name: "v-card",
					active: !!e.loading,
					color: F.value
				}, { default: c.loader }),
				A && v(re, {
					key: "item",
					prependAvatar: e.prependAvatar,
					prependIcon: e.prependIcon,
					title: e.title,
					subtitle: e.subtitle,
					appendAvatar: e.appendAvatar,
					appendIcon: e.appendIcon
				}, {
					default: c.item,
					prepend: c.prepend,
					title: c.title,
					subtitle: c.subtitle,
					append: c.append
				}),
				j && v($, { key: "text" }, { default: () => [c.text?.() ?? e.text] }),
				c.default?.(),
				c.actions && v(Y, null, { default: c.actions }),
				B(a, "v-card")
			] }), [[O, a && e.ripple]]);
		}), {};
	}
});
//#endregion
export { Y as i, $ as n, Q as r, oe as t };
