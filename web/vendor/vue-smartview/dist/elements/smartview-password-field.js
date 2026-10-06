import { Bn as e, Dn as t, Pn as n, Wn as r, Zn as i, ar as a, bn as o, en as s, fn as c, gn as l, sn as u, yn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { t as p } from "../chunks/hostValue-Q4jXLLiG.js";
import { a as m } from "../chunks/density-Dh8nVFPw.js";
import { t as h } from "../chunks/VBtn-D2PPPp70.js";
import { n as g } from "../chunks/formField-B1NnTyqU.js";
import { t as _ } from "../chunks/VTextField-uapT17Ep.js";
//#endregion
//#region src/entries/smartview-password-field.ts
f("smartview-password-field", /* @__PURE__ */ o({
	__name: "SmartviewPasswordField.ce",
	props: {
		value: {
			default: "",
			type: String
		},
		autocomplete: {
			default: "current-password",
			type: String
		},
		placeholder: {
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
	setup(o, { emit: f }) {
		let v = o, y = f, { t: b } = s(), x = e("root"), { current: S, commit: C, reset: w } = p("value", () => v.value), T = i(!1);
		function E() {
			return x.value?.querySelector("input") ?? void 0;
		}
		let { formDisabled: D, touched: O } = g({
			value: () => S.value,
			isEmpty: () => S.value === "",
			required: () => v.required,
			requiredMessage: () => b("smartview.required"),
			anchor: E,
			reset: w
		}), k = c(() => v.errorMessage ? [v.errorMessage] : O.value && v.required && S.value === "" ? [b("smartview.required")] : []);
		function A(e) {
			C(e ?? ""), y("input", S.value);
		}
		function j() {
			y("change", S.value);
		}
		async function M() {
			let e = E(), n = e?.getRootNode(), r = n instanceof ShadowRoot && n.activeElement === e, i = e?.selectionStart ?? null, a = e?.selectionEnd ?? null;
			T.value = !T.value, await t(), r && e && i !== null && a !== null && e.setSelectionRange(i, a);
		}
		return (e, t) => (n(), l("div", {
			ref_key: "root",
			ref: x,
			class: "smartview-root",
			onInput: t[2] ||= u(() => {}, ["stop"]),
			onChange: j
		}, [d(a(_), {
			"model-value": a(S),
			type: T.value ? "text" : "password",
			label: o.label || a(b)("smartview.password"),
			hint: o.hint,
			"persistent-hint": !!o.hint,
			"error-messages": k.value,
			autocomplete: o.autocomplete,
			placeholder: o.placeholder || void 0,
			disabled: o.disabled || a(D),
			"aria-required": o.required ? "true" : void 0,
			"prepend-inner-icon": "mdi-lock-outline",
			variant: "outlined",
			density: "comfortable",
			rounded: "lg",
			"data-part": "field",
			"onUpdate:modelValue": A,
			onBlur: t[1] ||= (e) => O.value = !0
		}, {
			"append-inner": r(() => [d(a(h), {
				icon: "",
				variant: "text",
				size: "small",
				density: "comfortable",
				disabled: o.disabled || a(D),
				"aria-label": T.value ? a(b)("smartview.hidePassword") : a(b)("smartview.showPassword"),
				"aria-pressed": T.value ? "true" : "false",
				"data-part": "toggle",
				onMousedown: t[0] ||= u(() => {}, ["prevent"]),
				onClick: M
			}, {
				default: r(() => [d(a(m), { icon: T.value ? "mdi-eye-off" : "mdi-eye" }, null, 8, ["icon"])]),
				_: 1
			}, 8, [
				"disabled",
				"aria-label",
				"aria-pressed"
			])]),
			_: 1
		}, 8, [
			"model-value",
			"type",
			"label",
			"hint",
			"persistent-hint",
			"error-messages",
			"autocomplete",
			"placeholder",
			"disabled",
			"aria-required"
		])], 544));
	}
}), {
	formAssociated: !0,
	unreflectedProps: ["value"]
});
//#endregion
