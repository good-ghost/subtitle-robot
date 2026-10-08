import { Bn as e, En as t, Hn as n, Kn as r, Qt as i, Sn as a, Tn as o, Xn as s, _r as c, bn as l, dr as u, en as d, mn as f, on as p, vn as m, wn as h, xn as g } from "../chunks/vuetify-C39-WP9g.js";
import { t as _ } from "../chunks/define-BovISfN4.js";
import { t as v } from "../chunks/hostValue-CjEvr2gM.js";
import { n as y, t as b } from "../chunks/VChip-C-IhEdKW.js";
import { n as x } from "../chunks/status-J4FIN71L.js";
import { n as S } from "../chunks/formField-CJIGaqFV.js";
//#region src/messages/SmartviewCheckboxButtonGroup.ts
var C = i({
	en: { selectAtLeastOne: "Select at least one" },
	ko: { selectAtLeastOne: "하나 이상 고르세요" }
}), w = {
	key: 0,
	class: "text-title-small font-weight-bold mt-0 mb-2",
	"data-part": "heading"
}, T = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-1 mb-0",
	"data-part": "hint"
}, E = {
	key: 2,
	class: "text-body-small text-error mt-1 mb-0",
	role: "alert",
	"data-part": "error"
};
//#endregion
//#region src/entries/smartview-checkbox-button-group.ts
_("smartview-checkbox-button-group", /* @__PURE__ */ t({
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
	setup(t, { emit: i }) {
		let _ = [
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
		], D = t, O = i, { t: k } = p();
		d(C);
		let A = r("root"), j = m(() => D.options.length || D.preset !== "http-methods" ? D.options : _);
		function M(e) {
			return j.value.map((e) => e.value).filter((t) => e.includes(t));
		}
		let { current: N, commit: P, reset: F } = v("value", () => D.value, { normalize: M }), { formDisabled: I, touched: L } = S({
			value: () => N.value,
			isEmpty: () => N.value.length === 0,
			required: () => D.required,
			requiredMessage: () => k("smartview.selectAtLeastOne"),
			anchor: () => A.value?.querySelector("[data-part=\"chip\"]") ?? void 0,
			reset: F
		}), R = m(() => D.disabled || I.value), z = m(() => D.errorMessage ? D.errorMessage : L.value && D.required && N.value.length === 0 ? k("smartview.selectAtLeastOne") : "");
		function B(e) {
			let t = M(Array.isArray(e) ? e : []);
			P(t), L.value = !0, O("input", [...t]), O("change", [...t]);
		}
		return (r, i) => (e(), a("div", {
			ref_key: "root",
			ref: A,
			class: "smartview-root"
		}, [
			t.label ? (e(), a("p", w, c(t.label), 1)) : g("", !0),
			o(u(y), {
				"model-value": u(N),
				multiple: "",
				column: "",
				disabled: R.value,
				"aria-label": t.label || void 0,
				"data-part": "chips",
				"onUpdate:modelValue": B
			}, {
				default: s(() => [(e(!0), a(f, null, n(j.value, (t) => (e(), l(u(b), {
					key: t.value,
					value: t.value,
					color: t.color ? u(x)(t.color) : "primary",
					disabled: R.value,
					variant: "outlined",
					filter: "",
					label: "",
					class: "font-weight-bold",
					"data-value": t.value,
					"data-part": "chip"
				}, {
					default: s(() => [h(c(t.label || t.value), 1)]),
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
			t.hint && !z.value ? (e(), a("p", T, c(t.hint), 1)) : g("", !0),
			z.value ? (e(), a("p", E, c(z.value), 1)) : g("", !0)
		], 512));
	}
}), { formAssociated: !0 });
//#endregion
