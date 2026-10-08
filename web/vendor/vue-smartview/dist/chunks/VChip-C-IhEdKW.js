import { A as e, B as t, D as n, Jn as r, Mn as i, T as a, Tn as o, Zn as s, _r as c, c as l, cr as u, fn as d, g as f, l as p, m, mn as h, v as g, vn as _, yn as v } from "./vuetify-C39-WP9g.js";
import { a as y, n as b, t as x } from "./rounded-1DPtyqNn.js";
import { c as S, i as C, l as w, n as T, r as E } from "./define-BovISfN4.js";
import { n as D, t as O } from "./ripple-BBz9XQtx.js";
import { a as k, n as A, t as j } from "./density-9WZgplEH.js";
import { n as M } from "./transitions-DYv6opPi.js";
import { t as N } from "./VAvatar-DdB1q11O.js";
import { a as P, c as F, d as I, l as L, o as R, r as z, s as B, t as V, u as H } from "./router-C0qlu-KG.js";
import { i as U, n as W, r as G, t as K } from "./group-BD9eNBcR.js";
import { n as q, r as J, t as Y } from "./VSlideGroup-Cw8ThMHD.js";
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
	...l(),
	...F({ variant: "tonal" })
}, "VChipGroup"), Q = a()({
	name: "VChipGroup",
	props: Z(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let { themeClasses: r } = p(e), { isSelected: a, select: s, next: c, prev: l, selected: d } = G(e, X);
		return n({ VChip: {
			baseColor: u(() => e.baseColor),
			color: u(() => e.color),
			disabled: u(() => e.disabled),
			filter: u(() => e.filter),
			variant: u(() => e.variant)
		} }), S(() => {
			let n = Y.filterProps(e);
			return o(Y, i(n, {
				class: [
					"v-chip-group",
					{ "v-chip-group--column": e.column },
					r.value,
					e.class
				],
				style: e.style
			}), { default: () => [t.default?.({
				isSelected: a,
				select: s,
				next: c,
				prev: l,
				selected: d.value
			})] });
		}), {};
	}
}), $ = e({
	activeClass: String,
	appendAvatar: String,
	appendIcon: g,
	baseColor: String,
	closable: Boolean,
	closeIcon: {
		type: g,
		default: "$delete"
	},
	closeLabel: {
		type: String,
		default: "$vuetify.close"
	},
	draggable: Boolean,
	filter: Boolean,
	filterIcon: {
		type: g,
		default: "$complete"
	},
	label: Boolean,
	link: {
		type: Boolean,
		default: void 0
	},
	pill: Boolean,
	prependAvatar: String,
	prependIcon: g,
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
	...l(),
	...F({ variant: "tonal" })
}, "VChip"), ee = a()({
	name: "VChip",
	directives: { vRipple: O },
	props: $(),
	emits: {
		"click:close": (e) => !0,
		"update:modelValue": (e) => !0,
		"group:selected": (e) => !0,
		click: (e) => !0
	},
	setup(e, { attrs: t, emit: n, slots: a }) {
		let { t: l } = m(), { borderClasses: g } = I(e), { densityClasses: x } = A(e), { elevationClasses: S } = R(e), { roundedClasses: w, roundedStyles: T } = b(e), { sizeClasses: E } = C(e), { themeClasses: D } = p(e), j = f(e, "modelValue"), P = U(e, X, !1), F = U(e, q, !1), V = z(e, t), H = u(() => e.link !== !1 && V.isLink.value), W = _(() => !e.disabled && e.link !== !1 && (!!P || e.link || V.isClickable.value)), G = u(() => ({
			"aria-label": l(e.closeLabel),
			disabled: e.disabled,
			onClick(e) {
				e.preventDefault(), e.stopPropagation(), j.value = !1, n("click:close", e);
			}
		}));
		r(j, (e) => {
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
			let t = V.isLink.value ? "a" : e.tag, n = !!(e.appendIcon || e.appendAvatar), r = !!(n || a.append), l = !!(a.close || e.closable), u = !!(a.filter || e.filter) && P, f = !!(e.prependIcon || e.prependAvatar), p = !!(f || a.prepend);
			return j.value && s(o(t, i(V.linkProps, {
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
					g.value,
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
				u && o(M, { key: "filter" }, { default: () => [s(v("div", { class: "v-chip__filter" }, [a.filter ? o(y, {
					key: "filter-defaults",
					disabled: !e.filterIcon,
					defaults: { VIcon: { icon: e.filterIcon } }
				}, a.filter) : o(k, {
					key: "filter-icon",
					icon: e.filterIcon
				}, null)]), [[d, P.isSelected.value]])] }),
				p && v("div", {
					key: "prepend",
					class: "v-chip__prepend"
				}, [a.prepend ? o(y, {
					key: "prepend-defaults",
					disabled: !f,
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
				}, a.prepend) : v(h, null, [e.prependIcon && o(k, {
					key: "prepend-icon",
					icon: e.prependIcon,
					start: !0
				}, null), e.prependAvatar && o(N, {
					key: "prepend-avatar",
					image: e.prependAvatar,
					start: !0
				}, null)])]),
				v("div", {
					class: "v-chip__content",
					"data-no-activator": ""
				}, [a.default?.({
					isSelected: P?.isSelected.value,
					selectedClass: P?.selectedClass.value,
					select: P?.select,
					toggle: P?.toggle,
					value: P?.value.value,
					disabled: e.disabled
				}) ?? c(e.text)]),
				r && v("div", {
					key: "append",
					class: "v-chip__append"
				}, [a.append ? o(y, {
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
				}, a.append) : v(h, null, [e.appendIcon && o(k, {
					key: "append-icon",
					end: !0,
					icon: e.appendIcon
				}, null), e.appendAvatar && o(N, {
					key: "append-avatar",
					end: !0,
					image: e.appendAvatar
				}, null)])]),
				l && v("button", i({
					key: "close",
					class: "v-chip__close",
					type: "button",
					"data-testid": "close-chip"
				}, G.value), [a.close ? o(y, {
					key: "close-defaults",
					defaults: { VIcon: {
						icon: e.closeIcon,
						size: "x-small"
					} }
				}, a.close) : o(k, {
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
