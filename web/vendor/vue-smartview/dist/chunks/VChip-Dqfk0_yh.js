import { A as e, B as t, D as n, En as r, Gn as i, Hn as a, T as o, c as s, cn as c, dr as l, fn as u, g as d, l as f, m as p, nr as m, on as h, pn as g, v as _, yn as v } from "./vuetify-DJ4bsPds.js";
import { a as y, n as b, t as x } from "./rounded-CXkAtXly.js";
import { c as S, i as C, l as w, n as T, r as E } from "./define-BG7hCbXs.js";
import { n as D, t as O } from "./ripple-B14E6MmL.js";
import { a as k, n as A, t as j } from "./density-Dh8nVFPw.js";
import { n as M } from "./transitions-CbTxUG_W.js";
import { t as N } from "./VAvatar-B5evLdR9.js";
import { a as P, c as F, d as I, l as L, o as R, r as z, s as B, t as V, u as H } from "./router-BNmKTwUJ.js";
import { i as U, n as W, r as G, t as K } from "./group-0QbvFWt3.js";
import { n as q, r as J, t as Y } from "./VSlideGroup-Ckz2iRR7.js";
//#region node_modules/vuetify/lib/components/VChipGroup/VChipGroup.js
var X = Symbol.for("vuetify:v-chip-group"), Z = e({
	baseColor: String,
	column: Boolean,
	filter: Boolean,
	valueComparator: {
		type: Function,
		default: D
	},
	...J({ scrollToActive: !1 }),
	...w(),
	...W({ selectedClass: "v-chip--selected" }),
	...T(),
	...s(),
	...F({ variant: "tonal" })
}, "VChipGroup"), Q = o()({
	name: "VChipGroup",
	props: Z(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let { themeClasses: i } = f(e), { isSelected: a, select: o, next: s, prev: c, selected: l } = G(e, X);
		return n({ VChip: {
			baseColor: m(() => e.baseColor),
			color: m(() => e.color),
			disabled: m(() => e.disabled),
			filter: m(() => e.filter),
			variant: m(() => e.variant)
		} }), S(() => {
			let n = Y.filterProps(e);
			return v(Y, r(n, {
				class: [
					"v-chip-group",
					{ "v-chip-group--column": e.column },
					i.value,
					e.class
				],
				style: e.style
			}), { default: () => [t.default?.({
				isSelected: a,
				select: o,
				next: s,
				prev: c,
				selected: l.value
			})] });
		}), {};
	}
}), $ = e({
	activeClass: String,
	appendAvatar: String,
	appendIcon: _,
	baseColor: String,
	closable: Boolean,
	closeIcon: {
		type: _,
		default: "$delete"
	},
	closeLabel: {
		type: String,
		default: "$vuetify.close"
	},
	draggable: Boolean,
	filter: Boolean,
	filterIcon: {
		type: _,
		default: "$complete"
	},
	label: Boolean,
	link: {
		type: Boolean,
		default: void 0
	},
	pill: Boolean,
	prependAvatar: String,
	prependIcon: _,
	ripple: {
		type: [Boolean, Object],
		default: !0
	},
	text: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	modelValue: {
		type: Boolean,
		default: !0
	},
	onClick: t(),
	onClickOnce: t(),
	...H(),
	...w(),
	...j(),
	...P(),
	...K(),
	...x(),
	...V(),
	...E(),
	...T({ tag: "span" }),
	...s(),
	...F({ variant: "tonal" })
}, "VChip"), ee = o()({
	name: "VChip",
	directives: { vRipple: O },
	props: $(),
	emits: {
		"click:close": (e) => !0,
		"update:modelValue": (e) => !0,
		"group:selected": (e) => !0,
		click: (e) => !0
	},
	setup(e, { attrs: t, emit: n, slots: o }) {
		let { t: s } = p(), { borderClasses: _ } = I(e), { densityClasses: x } = A(e), { elevationClasses: S } = R(e), { roundedClasses: w, roundedStyles: T } = b(e), { sizeClasses: E } = C(e), { themeClasses: D } = f(e), j = d(e, "modelValue"), P = U(e, X, !1), F = U(e, q, !1), V = z(e, t), H = m(() => e.link !== !1 && V.isLink.value), W = u(() => !e.disabled && e.link !== !1 && (!!P || e.link || V.isClickable.value)), G = m(() => ({
			"aria-label": s(e.closeLabel),
			disabled: e.disabled,
			onClick(e) {
				e.preventDefault(), e.stopPropagation(), j.value = !1, n("click:close", e);
			}
		}));
		a(j, (e) => {
			e ? (P?.register(), F?.register()) : (P?.unregister(), F?.unregister());
		});
		let { colorClasses: K, colorStyles: J, variantClasses: Y } = L(() => ({
			color: !P || P.isSelected.value ? e.color ?? e.baseColor : e.baseColor,
			variant: e.variant
		}));
		function Z(e) {
			n("click", e), W.value && (V.navigate.value?.(e), P?.toggle());
		}
		function Q(e) {
			(e.key === "Enter" || e.key === " ") && (e.preventDefault(), Z(e));
		}
		return () => {
			let t = V.isLink.value ? "a" : e.tag, n = !!(e.appendIcon || e.appendAvatar), a = !!(n || o.append), s = !!(o.close || e.closable), u = !!(o.filter || e.filter) && P, d = !!(e.prependIcon || e.prependAvatar), f = !!(d || o.prepend);
			return j.value && i(v(t, r(V.linkProps, {
				class: [
					"v-chip",
					{
						"v-chip--disabled": e.disabled,
						"v-chip--label": e.label,
						"v-chip--link": W.value,
						"v-chip--filter": u,
						"v-chip--pill": e.pill,
						[`${e.activeClass}`]: e.activeClass && V.isActive?.value
					},
					D.value,
					_.value,
					K.value,
					x.value,
					S.value,
					w.value,
					E.value,
					Y.value,
					P?.selectedClass.value,
					e.class
				],
				style: [
					J.value,
					T.value,
					e.style
				],
				disabled: e.disabled || void 0,
				draggable: e.draggable,
				tabindex: W.value ? 0 : void 0,
				onClick: (W.value || e.onClick || e.onClickOnce) && Z,
				onKeydown: W.value && !H.value && Q
			}), { default: () => [
				B(W.value, "v-chip"),
				u && v(M, { key: "filter" }, { default: () => [i(g("div", { class: "v-chip__filter" }, [o.filter ? v(y, {
					key: "filter-defaults",
					disabled: !e.filterIcon,
					defaults: { VIcon: { icon: e.filterIcon } }
				}, o.filter) : v(k, {
					key: "filter-icon",
					icon: e.filterIcon
				}, null)]), [[h, P.isSelected.value]])] }),
				f && g("div", {
					key: "prepend",
					class: "v-chip__prepend"
				}, [o.prepend ? v(y, {
					key: "prepend-defaults",
					disabled: !d,
					defaults: {
						VAvatar: {
							image: e.prependAvatar,
							start: !0
						},
						VIcon: {
							icon: e.prependIcon,
							start: !0
						}
					}
				}, o.prepend) : g(c, null, [e.prependIcon && v(k, {
					key: "prepend-icon",
					icon: e.prependIcon,
					start: !0
				}, null), e.prependAvatar && v(N, {
					key: "prepend-avatar",
					image: e.prependAvatar,
					start: !0
				}, null)])]),
				g("div", {
					class: "v-chip__content",
					"data-no-activator": ""
				}, [o.default?.({
					isSelected: P?.isSelected.value,
					selectedClass: P?.selectedClass.value,
					select: P?.select,
					toggle: P?.toggle,
					value: P?.value.value,
					disabled: e.disabled
				}) ?? l(e.text)]),
				a && g("div", {
					key: "append",
					class: "v-chip__append"
				}, [o.append ? v(y, {
					key: "append-defaults",
					disabled: !n,
					defaults: {
						VAvatar: {
							end: !0,
							image: e.appendAvatar
						},
						VIcon: {
							end: !0,
							icon: e.appendIcon
						}
					}
				}, o.append) : g(c, null, [e.appendIcon && v(k, {
					key: "append-icon",
					end: !0,
					icon: e.appendIcon
				}, null), e.appendAvatar && v(N, {
					key: "append-avatar",
					end: !0,
					image: e.appendAvatar
				}, null)])]),
				s && g("button", r({
					key: "close",
					class: "v-chip__close",
					type: "button",
					"data-testid": "close-chip"
				}, G.value), [o.close ? v(y, {
					key: "close-defaults",
					defaults: { VIcon: {
						icon: e.closeIcon,
						size: "x-small"
					} }
				}, o.close) : v(k, {
					key: "close-icon",
					icon: e.closeIcon,
					size: "x-small"
				}, null)])
			] }), [[
				O,
				W.value && e.ripple,
				null
			]]);
		};
	}
});
//#endregion
export { Q as n, ee as t };
