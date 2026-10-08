import { Bn as e, En as t, Gn as n, Kn as r, Sn as i, Tn as a, _r as o, bn as s, dr as c, on as l, pn as u, wn as d, xn as f, yn as p } from "../chunks/vuetify-C39-WP9g.js";
import { t as m } from "../chunks/define-BovISfN4.js";
import { t as h } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as g } from "../chunks/checkedField-iNQyZ5dI.js";
import { t as _ } from "../chunks/VSwitch-I8aX_dOy.js";
//#endregion
//#region src/elements/parts/CheckboxToggleView.vue
var v = /* @__PURE__ */ t({
	__name: "CheckboxToggleView",
	props: {
		checked: { type: Boolean },
		statusText: {},
		hideStatusText: {
			type: Boolean,
			default: !1
		},
		labelled: {
			type: Boolean,
			default: !1
		},
		inputId: { default: "" },
		disabled: {
			type: Boolean,
			default: !1
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		color: { default: "success" }
	},
	emits: ["change"],
	setup(t, { emit: n }) {
		let r = n;
		return (n, i) => (e(), s(c(_), {
			id: t.inputId || void 0,
			"model-value": t.checked,
			label: t.hideStatusText ? void 0 : t.statusText,
			"aria-label": t.hideStatusText && !t.labelled ? t.statusText : void 0,
			disabled: t.disabled,
			readonly: t.readonly,
			color: t.color,
			density: "compact",
			"hide-details": "",
			role: "switch",
			"onUpdate:modelValue": i[0] ||= (e) => r("change", e === !0)
		}, null, 8, [
			"id",
			"model-value",
			"label",
			"aria-label",
			"disabled",
			"readonly",
			"color"
		]));
	}
}), y = { class: "smartview-checkbox-toggle" }, b = {
	key: 0,
	class: "text-error",
	"aria-hidden": "true"
}, x = {
	key: 0,
	class: "text-body-small text-error mt-1 mb-0",
	role: "alert",
	"data-part": "error"
}, S = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-1 mb-0",
	"data-part": "hint"
}, C = "success";
//#endregion
//#region src/entries/smartview-checkbox-toggle.ts
m("smartview-checkbox-toggle", /* @__PURE__ */ h(/* @__PURE__ */ t({
	__name: "SmartviewCheckboxToggle.ce",
	props: {
		checked: {
			type: Boolean,
			default: !1
		},
		value: {
			default: "",
			type: String
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		messageToggleActive: {
			default: "",
			type: String
		},
		messageToggleInactive: {
			default: "",
			type: String
		},
		hideStatusText: {
			type: Boolean,
			default: !1
		},
		color: {
			default: "",
			type: String
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
	setup(t, { emit: s }) {
		let m = t, h = s, { t: _ } = l(), w = `smartview-toggle-${n()}`, T = r("root"), { current: E, formDisabled: D, shownError: O, change: k } = g(m, () => T.value?.querySelector(`#${CSS.escape(w)}`) ?? void 0, (e, t) => h(e === "input" ? "input" : "change", t));
		return (n, r) => (e(), i("div", {
			ref_key: "root",
			ref: T,
			class: "smartview-root",
			"data-part": "root",
			onInput: r[0] ||= u(() => {}, ["stop"]),
			onChange: r[1] ||= u(() => {}, ["stop"])
		}, [p("div", y, [t.label ? (e(), i("label", {
			key: 0,
			for: w,
			class: "text-body-large smartview-checkbox-toggle__label",
			"data-part": "label"
		}, [d(o(t.label), 1), t.required ? (e(), i("span", b, " *")) : f("", !0)])) : f("", !0), a(v, {
			checked: c(E),
			"status-text": c(E) ? t.messageToggleActive || c(_)("smartview.enabled") : t.messageToggleInactive || c(_)("smartview.disabled"),
			"hide-status-text": t.hideStatusText,
			labelled: !!t.label,
			"input-id": w,
			disabled: t.disabled || c(D),
			readonly: t.readonly,
			color: t.color || C,
			"aria-required": t.required ? "true" : void 0,
			class: "flex-grow-0",
			"data-part": "toggle",
			onChange: c(k)
		}, null, 8, [
			"checked",
			"status-text",
			"hide-status-text",
			"labelled",
			"disabled",
			"readonly",
			"color",
			"aria-required",
			"onChange"
		])]), c(O) ? (e(), i("p", x, o(c(O)), 1)) : t.hint ? (e(), i("p", S, o(t.hint), 1)) : f("", !0)], 544));
	}
}), [["styles", [".smartview-checkbox-toggle{flex-wrap:wrap;align-items:center;gap:12px;display:flex}.smartview-checkbox-toggle__label{cursor:pointer}.smartview-checkbox-toggle>.v-input:first-child{margin-inline-start:4px}"]]]), { formAssociated: !0 });
//#endregion
