import { Bn as e, Dn as t, Hn as n, Pn as r, Zn as i, ar as a, bn as o, en as s, fn as c, gn as l, mn as u, sn as d, yn as f } from "../chunks/vuetify-DJ4bsPds.js";
import { t as p } from "../chunks/define-BG7hCbXs.js";
import { t as m } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as h } from "../chunks/formField-B1NnTyqU.js";
import { t as g } from "../chunks/VTextField-uapT17Ep.js";
//#region src/runtime/inputValidity.ts
function _(e, t) {
	if (e.badInput) return { key: "inputNumber" };
	if (e.typeMismatch) {
		if (t.type === "email") return { key: "inputEmail" };
		if (t.type === "url") return { key: "inputUrl" };
	}
	return e.rangeUnderflow && t.min !== void 0 ? {
		key: "inputMin",
		params: { min: t.min }
	} : e.rangeOverflow && t.max !== void 0 ? {
		key: "inputMax",
		params: { max: t.max }
	} : e.stepMismatch ? {
		key: "inputStep",
		params: { step: t.step ?? 1 }
	} : e.patternMismatch ? { key: "inputPattern" } : null;
}
//#endregion
//#region src/elements/parts/InputView.vue
var v = /* @__PURE__ */ o({
	__name: "InputView",
	props: {
		value: {},
		type: { default: "text" },
		label: { default: "" },
		hint: { default: "" },
		errorMessages: { default: () => [] },
		placeholder: { default: "" },
		disabled: {
			type: Boolean,
			default: !1
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		required: {
			type: Boolean,
			default: !1
		},
		autocomplete: { default: "" },
		icon: { default: "" },
		clearable: {
			type: Boolean,
			default: !1
		},
		suffix: { default: "" },
		min: { default: void 0 },
		max: { default: void 0 },
		step: { default: void 0 },
		maxlength: { default: void 0 },
		pattern: { default: "" },
		density: { default: "comfortable" }
	},
	emits: [
		"input",
		"blur",
		"clear"
	],
	setup(e, { emit: t }) {
		let n = t;
		return (t, i) => (r(), u(a(g), {
			"model-value": e.value,
			type: e.type,
			label: e.label || void 0,
			hint: e.hint || void 0,
			"persistent-hint": !!e.hint,
			"hide-details": "auto",
			"error-messages": e.errorMessages,
			placeholder: e.placeholder || void 0,
			disabled: e.disabled,
			readonly: e.readonly,
			autocomplete: e.autocomplete || void 0,
			"prepend-inner-icon": e.icon || void 0,
			clearable: e.clearable && !e.readonly,
			suffix: e.suffix || void 0,
			min: e.min,
			max: e.max,
			step: e.step,
			maxlength: e.maxlength,
			pattern: e.pattern || void 0,
			density: e.density,
			"aria-required": e.required ? "true" : void 0,
			rounded: "lg",
			"onUpdate:modelValue": i[0] ||= (e) => n("input", e ?? ""),
			onBlur: i[1] ||= (e) => n("blur"),
			"onClick:clear": i[2] ||= (e) => n("clear")
		}, null, 8, [
			"model-value",
			"type",
			"label",
			"hint",
			"persistent-hint",
			"error-messages",
			"placeholder",
			"disabled",
			"readonly",
			"autocomplete",
			"prepend-inner-icon",
			"clearable",
			"suffix",
			"min",
			"max",
			"step",
			"maxlength",
			"pattern",
			"density",
			"aria-required"
		]));
	}
});
//#endregion
//#region src/entries/smartview-input.ts
p("smartview-input", /* @__PURE__ */ o({
	__name: "SmartviewInput.ce",
	props: {
		value: {
			default: "",
			type: String
		},
		type: {
			default: "text",
			type: String
		},
		placeholder: {
			default: "",
			type: String
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		autocomplete: {
			default: "",
			type: String
		},
		icon: {
			default: "",
			type: String
		},
		clearable: {
			type: Boolean,
			default: !1
		},
		suffix: {
			default: "",
			type: String
		},
		min: { type: Number },
		max: { type: Number },
		step: { type: Number },
		maxlength: { type: Number },
		pattern: {
			default: "",
			type: String
		},
		density: {
			default: "comfortable",
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
	setup(o, { emit: u }) {
		let p = o, g = u, { t: y } = s(), b = e("root"), { current: x, commit: S, reset: C } = m("value", () => p.value);
		function w() {
			return b.value?.querySelector("input") ?? void 0;
		}
		let T = i(null);
		function E() {
			let e = w();
			T.value = e ? _(e.validity, {
				type: p.type,
				min: p.min,
				max: p.max,
				step: p.step
			}) : null;
		}
		n(() => [
			x.value,
			p.type,
			p.min,
			p.max,
			p.step,
			p.pattern,
			p.maxlength
		], () => void t(E), {
			flush: "post",
			immediate: !0
		});
		let D = c(() => T.value ? y(`smartview.${T.value.key}`, T.value.params ?? {}) : ""), O = () => x.value === "" && !T.value, { formDisabled: k, touched: A } = h({
			value: () => x.value,
			isEmpty: O,
			required: () => p.required,
			requiredMessage: () => y("smartview.required"),
			validationError: () => D.value,
			anchor: w,
			reset: C
		}), j = c(() => p.errorMessage ? [p.errorMessage] : A.value ? p.required && O() ? [y("smartview.required")] : D.value ? [D.value] : [] : []);
		function M(e) {
			S(e), g("input", x.value);
		}
		function N() {
			g("change", x.value);
		}
		function P() {
			g("change", x.value);
		}
		return (e, t) => (r(), l("div", {
			ref_key: "root",
			ref: b,
			class: "smartview-root",
			onInput: d(E, ["stop"]),
			onChange: d(N, ["stop"])
		}, [f(v, {
			value: a(x),
			type: o.type,
			label: o.label,
			hint: o.hint,
			"error-messages": j.value,
			placeholder: o.placeholder,
			disabled: o.disabled || a(k),
			readonly: o.readonly,
			required: o.required,
			autocomplete: o.autocomplete,
			icon: o.icon,
			clearable: o.clearable,
			suffix: o.suffix,
			min: o.min,
			max: o.max,
			step: o.step,
			maxlength: o.maxlength,
			pattern: o.pattern,
			density: o.density,
			"data-part": "field",
			onInput: M,
			onBlur: t[0] ||= (e) => A.value = !0,
			onClear: P
		}, null, 8, [
			"value",
			"type",
			"label",
			"hint",
			"error-messages",
			"placeholder",
			"disabled",
			"readonly",
			"required",
			"autocomplete",
			"icon",
			"clearable",
			"suffix",
			"min",
			"max",
			"step",
			"maxlength",
			"pattern",
			"density"
		])], 544));
	}
}), {
	formAssociated: !0,
	unreflectedProps: ["value"]
});
//#endregion
