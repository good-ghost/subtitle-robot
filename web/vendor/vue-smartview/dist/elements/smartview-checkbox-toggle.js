import { Bn as e, Pn as t, ar as n, bn as r, dr as i, en as a, gn as o, hn as s, mn as c, pn as l, sn as u, vn as d, yn as f, zn as p } from "../chunks/vuetify-DJ4bsPds.js";
import { t as m } from "../chunks/define-BG7hCbXs.js";
import { t as h } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as g } from "../chunks/checkedField-uvcxFMl5.js";
import { t as _ } from "../chunks/VSwitch-rcpcpGXz.js";
//#endregion
//#region src/elements/parts/CheckboxToggleView.vue
var v = /* @__PURE__ */ r({
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
	setup(e, { emit: r }) {
		let i = r;
		return (r, a) => (t(), c(n(_), {
			id: e.inputId || void 0,
			"model-value": e.checked,
			label: e.hideStatusText ? void 0 : e.statusText,
			"aria-label": e.hideStatusText && !e.labelled ? e.statusText : void 0,
			disabled: e.disabled,
			readonly: e.readonly,
			color: e.color,
			density: "compact",
			"hide-details": "",
			role: "switch",
			"onUpdate:modelValue": a[0] ||= (e) => i("change", e === !0)
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
m("smartview-checkbox-toggle", /* @__PURE__ */ h(/* @__PURE__ */ r({
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
	setup(r, { emit: c }) {
		let m = r, h = c, { t: _ } = a(), w = `smartview-toggle-${p()}`, T = e("root"), { current: E, formDisabled: D, shownError: O, change: k } = g(m, () => T.value?.querySelector(`#${CSS.escape(w)}`) ?? void 0, (e, t) => h(e === "input" ? "input" : "change", t));
		return (e, a) => (t(), o("div", {
			ref_key: "root",
			ref: T,
			class: "smartview-root",
			"data-part": "root",
			onInput: a[0] ||= u(() => {}, ["stop"]),
			onChange: a[1] ||= u(() => {}, ["stop"])
		}, [l("div", y, [r.label ? (t(), o("label", {
			key: 0,
			for: w,
			class: "text-body-large smartview-checkbox-toggle__label",
			"data-part": "label"
		}, [d(i(r.label), 1), r.required ? (t(), o("span", b, " *")) : s("", !0)])) : s("", !0), f(v, {
			checked: n(E),
			"status-text": n(E) ? r.messageToggleActive || n(_)("smartview.enabled") : r.messageToggleInactive || n(_)("smartview.disabled"),
			"hide-status-text": r.hideStatusText,
			labelled: !!r.label,
			"input-id": w,
			disabled: r.disabled || n(D),
			readonly: r.readonly,
			color: r.color || C,
			"aria-required": r.required ? "true" : void 0,
			class: "flex-grow-0",
			"data-part": "toggle",
			onChange: n(k)
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
		])]), n(O) ? (t(), o("p", x, i(n(O)), 1)) : r.hint ? (t(), o("p", S, i(r.hint), 1)) : s("", !0)], 544));
	}
}), [["styles", [".smartview-checkbox-toggle{flex-wrap:wrap;align-items:center;gap:12px;display:flex}.smartview-checkbox-toggle__label{cursor:pointer}.smartview-checkbox-toggle>.v-input:first-child{margin-inline-start:4px}"]]]), { formAssociated: !0 });
//#endregion
