import { Bn as e, En as t, Jn as n, Kn as r, Nn as i, Qt as a, Sn as o, Tn as s, bn as c, dr as l, en as u, on as d, pn as f, rr as p, vn as m } from "../chunks/vuetify-C39-WP9g.js";
import { t as h } from "../chunks/define-BovISfN4.js";
import { t as g } from "../chunks/hostValue-CjEvr2gM.js";
import { n as _ } from "../chunks/formField-CJIGaqFV.js";
import { t as v } from "../chunks/VTextField-DrXa6-zE.js";
//#region src/messages/SmartviewInput.ts
var y = a({
	en: {
		inputEmail: "Enter a valid email address",
		inputUrl: "Enter a valid URL (e.g. https://example.com)",
		inputNumber: "Enter a number",
		inputMin: "Must be {min} or more",
		inputMax: "Must be {max} or less",
		inputStep: "Must be in steps of {step}",
		inputPattern: "Does not match the required format"
	},
	ko: {
		inputEmail: "올바른 이메일 주소를 입력하세요",
		inputUrl: "올바른 URL 을 입력하세요 (예: https://example.com)",
		inputNumber: "숫자를 입력하세요",
		inputMin: "{min} 이상이어야 합니다",
		inputMax: "{max} 이하여야 합니다",
		inputStep: "{step} 단위로 입력하세요",
		inputPattern: "형식이 맞지 않습니다"
	}
});
//#endregion
//#region src/runtime/inputValidity.ts
function b(e, t) {
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
var x = /* @__PURE__ */ t({
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
	setup(t, { emit: n }) {
		let r = n;
		return (n, i) => (e(), c(l(v), {
			"model-value": t.value,
			type: t.type,
			label: t.label || void 0,
			hint: t.hint || void 0,
			"persistent-hint": !!t.hint,
			"hide-details": "auto",
			"error-messages": t.errorMessages,
			placeholder: t.placeholder || void 0,
			disabled: t.disabled,
			readonly: t.readonly,
			autocomplete: t.autocomplete || void 0,
			"prepend-inner-icon": t.icon || void 0,
			clearable: t.clearable && !t.readonly,
			suffix: t.suffix || void 0,
			min: t.min,
			max: t.max,
			step: t.step,
			maxlength: t.maxlength,
			pattern: t.pattern || void 0,
			density: t.density,
			"aria-required": t.required ? "true" : void 0,
			rounded: "lg",
			"onUpdate:modelValue": i[0] ||= (e) => r("input", e ?? ""),
			onBlur: i[1] ||= (e) => r("blur"),
			"onClick:clear": i[2] ||= (e) => r("clear")
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
h("smartview-input", /* @__PURE__ */ t({
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
	setup(t, { emit: a }) {
		let c = t, h = a, { t: v } = d();
		u(y);
		let S = r("root"), { current: C, commit: w, reset: T } = g("value", () => c.value);
		function E() {
			return S.value?.querySelector("input") ?? void 0;
		}
		let D = p(null);
		function O() {
			let e = E();
			D.value = e ? b(e.validity, {
				type: c.type,
				min: c.min,
				max: c.max,
				step: c.step
			}) : null;
		}
		n(() => [
			C.value,
			c.type,
			c.min,
			c.max,
			c.step,
			c.pattern,
			c.maxlength
		], () => void i(O), {
			flush: "post",
			immediate: !0
		});
		let k = m(() => D.value ? v(`smartview.${D.value.key}`, D.value.params ?? {}) : ""), A = () => C.value === "" && !D.value, { formDisabled: j, touched: M } = _({
			value: () => C.value,
			isEmpty: A,
			required: () => c.required,
			requiredMessage: () => v("smartview.required"),
			validationError: () => k.value,
			anchor: E,
			reset: T
		}), N = m(() => c.errorMessage ? [c.errorMessage] : M.value ? c.required && A() ? [v("smartview.required")] : k.value ? [k.value] : [] : []);
		function P(e) {
			w(e), h("input", C.value);
		}
		function F() {
			h("change", C.value);
		}
		function I() {
			h("change", C.value);
		}
		return (n, r) => (e(), o("div", {
			ref_key: "root",
			ref: S,
			class: "smartview-root",
			onInput: f(O, ["stop"]),
			onChange: f(F, ["stop"])
		}, [s(x, {
			value: l(C),
			type: t.type,
			label: t.label,
			hint: t.hint,
			"error-messages": N.value,
			placeholder: t.placeholder,
			disabled: t.disabled || l(j),
			readonly: t.readonly,
			required: t.required,
			autocomplete: t.autocomplete,
			icon: t.icon,
			clearable: t.clearable,
			suffix: t.suffix,
			min: t.min,
			max: t.max,
			step: t.step,
			maxlength: t.maxlength,
			pattern: t.pattern,
			density: t.density,
			"data-part": "field",
			onInput: P,
			onBlur: r[0] ||= (e) => M.value = !0,
			onClear: I
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
