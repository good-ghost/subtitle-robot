import { Bn as e, In as t, Pn as n, Wn as r, ar as i, bn as a, cn as o, dr as s, en as c, fn as l, gn as u, hn as d, mn as f, vn as p, yn as m } from "../chunks/vuetify-DJ4bsPds.js";
import { t as h } from "../chunks/define-BG7hCbXs.js";
import { t as g } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as _, t as v } from "../chunks/VChip-Dqfk0_yh.js";
import { n as y } from "../chunks/status-J4FIN71L.js";
import { n as b } from "../chunks/formField-B1NnTyqU.js";
//#region src/elements/SmartviewCheckboxButtonGroup.ce.vue?vue&type=script&setup=true&lang.ts
var x = {
	key: 0,
	class: "text-title-small font-weight-bold mt-0 mb-2",
	"data-part": "heading"
}, S = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-1 mb-0",
	"data-part": "hint"
}, C = {
	key: 2,
	class: "text-body-small text-error mt-1 mb-0",
	role: "alert",
	"data-part": "error"
};
//#endregion
//#region src/entries/smartview-checkbox-button-group.ts
h("smartview-checkbox-button-group", /* @__PURE__ */ a({
	__name: "SmartviewCheckboxButtonGroup.ce",
	props: {
		options: {
			default: () => [],
			type: Array
		},
		preset: {
			default: "",
			type: String
		},
		value: {
			default: () => [],
			type: Array
		},
		label: {
			default: "",
			type: String
		},
		hint: {
			default: "",
			type: String
		},
		errorMessage: {
			default: "",
			type: String
		},
		required: {
			type: Boolean,
			default: !1
		},
		disabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["input", "change"],
	setup(a, { emit: h }) {
		let w = [
			{
				value: "GET",
				color: "info"
			},
			{
				value: "POST",
				color: "success"
			},
			{
				value: "PUT",
				color: "warning"
			},
			{
				value: "PATCH",
				color: "accent"
			},
			{
				value: "DELETE",
				color: "error"
			},
			{
				value: "HEAD",
				color: "secondary"
			},
			{
				value: "OPTIONS",
				color: "grey"
			}
		], T = a, E = h, { t: D } = c(), O = e("root"), k = l(() => T.options.length || T.preset !== "http-methods" ? T.options : w);
		function A(e) {
			return k.value.map((e) => e.value).filter((t) => e.includes(t));
		}
		let { current: j, commit: M, reset: N } = g("value", () => T.value, { normalize: A }), { formDisabled: P, touched: F } = b({
			value: () => j.value,
			isEmpty: () => j.value.length === 0,
			required: () => T.required,
			requiredMessage: () => D("smartview.selectAtLeastOne"),
			anchor: () => O.value?.querySelector("[data-part=\"chip\"]") ?? void 0,
			reset: N
		}), I = l(() => T.disabled || P.value), L = l(() => T.errorMessage ? T.errorMessage : F.value && T.required && j.value.length === 0 ? D("smartview.selectAtLeastOne") : "");
		function R(e) {
			let t = A(Array.isArray(e) ? e : []);
			M(t), F.value = !0, E("input", [...t]), E("change", [...t]);
		}
		return (e, c) => (n(), u("div", {
			ref_key: "root",
			ref: O,
			class: "smartview-root"
		}, [
			a.label ? (n(), u("p", x, s(a.label), 1)) : d("", !0),
			m(i(_), {
				"model-value": i(j),
				multiple: "",
				column: "",
				disabled: I.value,
				"aria-label": a.label || void 0,
				"data-part": "chips",
				"onUpdate:modelValue": R
			}, {
				default: r(() => [(n(!0), u(o, null, t(k.value, (e) => (n(), f(i(v), {
					key: e.value,
					value: e.value,
					color: e.color ? i(y)(e.color) : "primary",
					disabled: I.value,
					variant: "outlined",
					filter: "",
					label: "",
					class: "font-weight-bold",
					"data-value": e.value,
					"data-part": "chip"
				}, {
					default: r(() => [p(s(e.label || e.value), 1)]),
					_: 2
				}, 1032, [
					"value",
					"color",
					"disabled",
					"data-value"
				]))), 128))]),
				_: 1
			}, 8, [
				"model-value",
				"disabled",
				"aria-label"
			]),
			a.hint && !L.value ? (n(), u("p", S, s(a.hint), 1)) : d("", !0),
			L.value ? (n(), u("p", C, s(L.value), 1)) : d("", !0)
		], 512));
	}
}), { formAssociated: !0 });
//#endregion
