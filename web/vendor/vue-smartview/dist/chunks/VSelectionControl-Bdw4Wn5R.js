import { A as e, D as t, Gn as n, Mn as r, Nn as i, Q as a, T as o, Tn as s, Vn as c, Zn as l, c as u, cr as d, er as f, g as p, gr as m, gt as h, jn as g, mn as _, mr as v, or as y, rr as b, v as x, vn as S, wt as C, yn as w } from "./vuetify-C39-WP9g.js";
import { a as T, c as E, l as D, s as O } from "./define-BovISfN4.js";
import { n as k, t as A } from "./ripple-BBz9XQtx.js";
import { t as j } from "./VLabel-B80IAw5H.js";
import { a as M, n as N, t as P } from "./density-9WZgplEH.js";
//#region node_modules/vuetify/lib/components/VSelectionControlGroup/VSelectionControlGroup.js
var F = Symbol.for("vuetify:selection-control-group"), I = e({
	color: String,
	disabled: {
		type: Boolean,
		default: null
	},
	defaultsTarget: String,
	error: Boolean,
	id: String,
	inline: Boolean,
	falseIcon: x,
	trueIcon: x,
	indeterminateIcon: x,
	ripple: {
		type: [Boolean, Object],
		default: !0
	},
	multiple: {
		type: Boolean,
		default: null
	},
	name: String,
	readonly: {
		type: Boolean,
		default: null
	},
	modelValue: null,
	type: String,
	valueComparator: {
		type: Function,
		default: k
	},
	...D(),
	...P(),
	...u()
}, "SelectionControlGroup"), L = e({ ...I({ defaultsTarget: "VSelectionControl" }) }, "VSelectionControlGroup");
o()({
	name: "VSelectionControlGroup",
	props: L(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: r }) {
		let i = p(e, "modelValue"), a = n(), o = d(() => e.id || `v-selection-control-group-${a}`), s = d(() => e.name || o.value), l = /* @__PURE__ */ new Set();
		return c(F, {
			modelValue: i,
			forceUpdate: () => {
				l.forEach((e) => e());
			},
			onForceUpdate: (e) => {
				l.add(e), f(() => {
					l.delete(e);
				});
			}
		}), t({ [e.defaultsTarget]: {
			color: d(() => e.color),
			disabled: d(() => e.disabled),
			density: d(() => e.density),
			error: d(() => e.error),
			inline: d(() => e.inline),
			modelValue: i,
			multiple: d(() => !!e.multiple || e.multiple == null && Array.isArray(i.value)),
			name: s,
			falseIcon: d(() => e.falseIcon),
			trueIcon: d(() => e.trueIcon),
			readonly: d(() => e.readonly),
			ripple: d(() => e.ripple),
			type: d(() => e.type),
			valueComparator: d(() => e.valueComparator)
		} }), E(() => w("div", {
			class: v([
				"v-selection-control-group",
				{ "v-selection-control-group--inline": e.inline },
				e.class
			]),
			style: m(e.style),
			role: e.type === "radio" ? "radiogroup" : void 0
		}, [r.default?.()])), {};
	}
});
//#endregion
//#region node_modules/vuetify/lib/components/VSelectionControl/VSelectionControl.js
var R = e({
	indeterminate: Boolean,
	label: String,
	baseColor: String,
	trueValue: null,
	falseValue: null,
	value: null,
	...D(),
	...I()
}, "VSelectionControl");
function z(e) {
	let t = g(F, void 0), { densityClasses: n } = N(e), r = p(e, "modelValue"), i = S(() => e.trueValue === void 0 ? e.value === void 0 || e.value : e.trueValue), a = S(() => e.falseValue !== void 0 && e.falseValue), o = S(() => !!e.multiple || e.multiple == null && Array.isArray(r.value)), s = S({
		get() {
			let n = t ? t.modelValue.value : r.value;
			return o.value ? C(n).some((t) => e.valueComparator(t, i.value)) : e.valueComparator(n, i.value);
		},
		set(n) {
			if (e.readonly) return;
			let s = n ? i.value : a.value, c = s;
			o.value && (c = n ? [...C(r.value), s] : C(r.value).filter((t) => !e.valueComparator(t, i.value))), t ? t.modelValue.value = c : r.value = c;
		}
	}), c = S(() => s.value || e.indeterminate), { textColorClasses: l, textColorStyles: u } = O(() => {
		if (!(e.error || e.disabled)) return c.value ? e.color : e.baseColor;
	}), { backgroundColorClasses: d, backgroundColorStyles: f } = T(() => c.value && !e.error && !e.disabled ? e.color : e.baseColor);
	return {
		group: t,
		densityClasses: n,
		trueValue: i,
		falseValue: a,
		model: s,
		textColorClasses: l,
		textColorStyles: u,
		backgroundColorClasses: d,
		backgroundColorStyles: f,
		icon: S(() => e.indeterminate ? e.indeterminateIcon : s.value ? e.trueIcon : e.falseIcon)
	};
}
var B = o()({
	name: "VSelectionControl",
	directives: { vRipple: A },
	inheritAttrs: !1,
	props: R(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { attrs: t, slots: o }) {
		let { group: c, densityClasses: u, icon: f, model: p, textColorClasses: g, textColorStyles: x, backgroundColorClasses: S, backgroundColorStyles: C, trueValue: T } = z(e), D = n(), O = y(!1), k = y(!1), N = b(), P = d(() => e.id || `input-${D}`), F = d(() => !e.disabled && !e.readonly);
		c?.onForceUpdate(() => {
			N.value && (N.value.checked = p.value);
		});
		function I(t) {
			e.disabled || (O.value = !0, h(t.target, ":focus-visible") !== !1 && (k.value = !0));
		}
		function L() {
			O.value = !1, k.value = !1;
		}
		function R(e) {
			e.stopPropagation();
		}
		function B(t) {
			if (!F.value) {
				N.value && (N.value.checked = p.value);
				return;
			}
			e.readonly && c && i(() => c.forceUpdate()), p.value = t.target.checked;
		}
		return E(() => {
			let n = o.label ? o.label({
				label: e.label,
				props: { for: P.value }
			}) : e.label, [i, c] = a(t), d = w("input", r({
				ref: N,
				checked: p.value,
				disabled: !!e.disabled,
				id: P.value,
				onBlur: L,
				onFocus: I,
				onInput: B,
				"aria-disabled": !!e.disabled,
				"aria-label": e.label,
				type: e.type,
				value: T.value,
				name: e.name,
				"aria-checked": e.type === "checkbox" ? p.value : void 0
			}, c), null);
			return w("div", r({ class: [
				"v-selection-control",
				{
					"v-selection-control--dirty": p.value,
					"v-selection-control--indeterminate": e.indeterminate,
					"v-selection-control--disabled": e.disabled,
					"v-selection-control--error": e.error,
					"v-selection-control--focused": O.value,
					"v-selection-control--focus-visible": k.value,
					"v-selection-control--inline": e.inline
				},
				u.value,
				e.class
			] }, i, { style: e.style }), [w("div", {
				class: v(["v-selection-control__wrapper", g.value]),
				style: m(x.value)
			}, [o.default?.({
				backgroundColorClasses: S,
				backgroundColorStyles: C
			}), l(w("div", { class: v(["v-selection-control__input"]) }, [o.input?.({
				model: p,
				textColorClasses: g,
				textColorStyles: x,
				backgroundColorClasses: S,
				backgroundColorStyles: C,
				inputNode: d,
				icon: f.value,
				props: {
					onFocus: I,
					onBlur: L,
					id: P.value
				}
			}) ?? w(_, null, [f.value && s(M, {
				key: "icon",
				icon: f.value
			}, null), d])]), [[
				A,
				!e.disabled && !e.readonly && e.ripple,
				null,
				{
					center: !0,
					circle: !0
				}
			]])]), n && s(j, {
				for: P.value,
				onClick: R
			}, { default: () => [n] })]);
		}), {
			isFocused: O,
			input: N
		};
	}
});
//#endregion
export { R as n, B as t };
