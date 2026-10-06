import { A as e, D as t, Dn as n, En as r, Fn as i, Gn as a, Jn as o, Q as s, T as c, Tn as l, Zn as u, c as d, cn as f, cr as p, er as m, fn as h, g, gt as _, nr as v, pn as y, ur as b, v as x, wt as S, yn as C, zn as w } from "./vuetify-DJ4bsPds.js";
import { a as T, c as E, l as D, s as O } from "./define-BG7hCbXs.js";
import { n as k, t as A } from "./ripple-B14E6MmL.js";
import { t as j } from "./VLabel-slD1mVUb.js";
import { a as M, n as N, t as P } from "./density-Dh8nVFPw.js";
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
	...d()
}, "SelectionControlGroup"), L = e({ ...I({ defaultsTarget: "VSelectionControl" }) }, "VSelectionControlGroup");
c()({
	name: "VSelectionControlGroup",
	props: L(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: n }) {
		let r = g(e, "modelValue"), a = w(), s = v(() => e.id || `v-selection-control-group-${a}`), c = v(() => e.name || s.value), l = /* @__PURE__ */ new Set();
		return i(F, {
			modelValue: r,
			forceUpdate: () => {
				l.forEach((e) => e());
			},
			onForceUpdate: (e) => {
				l.add(e), o(() => {
					l.delete(e);
				});
			}
		}), t({ [e.defaultsTarget]: {
			color: v(() => e.color),
			disabled: v(() => e.disabled),
			density: v(() => e.density),
			error: v(() => e.error),
			inline: v(() => e.inline),
			modelValue: r,
			multiple: v(() => !!e.multiple || e.multiple == null && Array.isArray(r.value)),
			name: c,
			falseIcon: v(() => e.falseIcon),
			trueIcon: v(() => e.trueIcon),
			readonly: v(() => e.readonly),
			ripple: v(() => e.ripple),
			type: v(() => e.type),
			valueComparator: v(() => e.valueComparator)
		} }), E(() => y("div", {
			class: p([
				"v-selection-control-group",
				{ "v-selection-control-group--inline": e.inline },
				e.class
			]),
			style: b(e.style),
			role: e.type === "radio" ? "radiogroup" : void 0
		}, [n.default?.()])), {};
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
	let t = l(F, void 0), { densityClasses: n } = N(e), r = g(e, "modelValue"), i = h(() => e.trueValue === void 0 ? e.value === void 0 || e.value : e.trueValue), a = h(() => e.falseValue !== void 0 && e.falseValue), o = h(() => !!e.multiple || e.multiple == null && Array.isArray(r.value)), s = h({
		get() {
			let n = t ? t.modelValue.value : r.value;
			return o.value ? S(n).some((t) => e.valueComparator(t, i.value)) : e.valueComparator(n, i.value);
		},
		set(n) {
			if (e.readonly) return;
			let s = n ? i.value : a.value, c = s;
			o.value && (c = n ? [...S(r.value), s] : S(r.value).filter((t) => !e.valueComparator(t, i.value))), t ? t.modelValue.value = c : r.value = c;
		}
	}), c = h(() => s.value || e.indeterminate), { textColorClasses: u, textColorStyles: d } = O(() => {
		if (!(e.error || e.disabled)) return c.value ? e.color : e.baseColor;
	}), { backgroundColorClasses: f, backgroundColorStyles: p } = T(() => c.value && !e.error && !e.disabled ? e.color : e.baseColor);
	return {
		group: t,
		densityClasses: n,
		trueValue: i,
		falseValue: a,
		model: s,
		textColorClasses: u,
		textColorStyles: d,
		backgroundColorClasses: f,
		backgroundColorStyles: p,
		icon: h(() => e.indeterminate ? e.indeterminateIcon : s.value ? e.trueIcon : e.falseIcon)
	};
}
var B = c()({
	name: "VSelectionControl",
	directives: { vRipple: A },
	inheritAttrs: !1,
	props: R(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { attrs: t, slots: i }) {
		let { group: o, densityClasses: c, icon: l, model: d, textColorClasses: h, textColorStyles: g, backgroundColorClasses: x, backgroundColorStyles: S, trueValue: T } = z(e), D = w(), O = m(!1), k = m(!1), N = u(), P = v(() => e.id || `input-${D}`), F = v(() => !e.disabled && !e.readonly);
		o?.onForceUpdate(() => {
			N.value && (N.value.checked = d.value);
		});
		function I(t) {
			e.disabled || (O.value = !0, _(t.target, ":focus-visible") !== !1 && (k.value = !0));
		}
		function L() {
			O.value = !1, k.value = !1;
		}
		function R(e) {
			e.stopPropagation();
		}
		function B(t) {
			if (!F.value) {
				N.value && (N.value.checked = d.value);
				return;
			}
			e.readonly && o && n(() => o.forceUpdate()), d.value = t.target.checked;
		}
		return E(() => {
			let n = i.label ? i.label({
				label: e.label,
				props: { for: P.value }
			}) : e.label, [o, u] = s(t), m = y("input", r({
				ref: N,
				checked: d.value,
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
				"aria-checked": e.type === "checkbox" ? d.value : void 0
			}, u), null);
			return y("div", r({ class: [
				"v-selection-control",
				{
					"v-selection-control--dirty": d.value,
					"v-selection-control--indeterminate": e.indeterminate,
					"v-selection-control--disabled": e.disabled,
					"v-selection-control--error": e.error,
					"v-selection-control--focused": O.value,
					"v-selection-control--focus-visible": k.value,
					"v-selection-control--inline": e.inline
				},
				c.value,
				e.class
			] }, o, { style: e.style }), [y("div", {
				class: p(["v-selection-control__wrapper", h.value]),
				style: b(g.value)
			}, [i.default?.({
				backgroundColorClasses: x,
				backgroundColorStyles: S
			}), a(y("div", { class: p(["v-selection-control__input"]) }, [i.input?.({
				model: d,
				textColorClasses: h,
				textColorStyles: g,
				backgroundColorClasses: x,
				backgroundColorStyles: S,
				inputNode: m,
				icon: l.value,
				props: {
					onFocus: I,
					onBlur: L,
					id: P.value
				}
			}) ?? y(f, null, [l.value && C(M, {
				key: "icon",
				icon: l.value
			}, null), m])]), [[
				A,
				!e.disabled && !e.readonly && e.ripple,
				null,
				{
					center: !0,
					circle: !0
				}
			]])]), n && C(j, {
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
