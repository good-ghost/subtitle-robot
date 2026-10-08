import { Bn as e, En as t, Kn as n, Nn as r, Qt as i, Sn as a, Tn as o, Xn as s, dr as c, en as l, on as u, pn as d, rr as f, vn as p } from "../chunks/vuetify-C39-WP9g.js";
import { t as m } from "../chunks/define-BovISfN4.js";
import { t as h } from "../chunks/hostValue-CjEvr2gM.js";
import { a as g } from "../chunks/density-9WZgplEH.js";
import { t as _ } from "../chunks/VBtn-CV2MWNTN.js";
import { n as v } from "../chunks/formField-CJIGaqFV.js";
import { t as y } from "../chunks/VTextField-DrXa6-zE.js";
//#region src/messages/SmartviewPasswordField.ts
var b = i({
	en: { password: "Password" },
	ko: { password: "비밀번호" }
});
//#endregion
//#region src/entries/smartview-password-field.ts
m("smartview-password-field", /* @__PURE__ */ t({
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
	setup(t, { emit: i }) {
		let m = t, x = i, { t: S } = u();
		l(b);
		let C = n("root"), { current: w, commit: T, reset: E } = h("value", () => m.value), D = f(!1);
		function O() {
			return C.value?.querySelector("input") ?? void 0;
		}
		let { formDisabled: k, touched: A } = v({
			value: () => w.value,
			isEmpty: () => w.value === "",
			required: () => m.required,
			requiredMessage: () => S("smartview.required"),
			anchor: O,
			reset: E
		}), j = p(() => m.errorMessage ? [m.errorMessage] : A.value && m.required && w.value === "" ? [S("smartview.required")] : []);
		function M(e) {
			T(e ?? ""), x("input", w.value);
		}
		function N() {
			x("change", w.value);
		}
		async function P() {
			let e = O(), t = e?.getRootNode(), n = t instanceof ShadowRoot && t.activeElement === e, i = e?.selectionStart ?? null, a = e?.selectionEnd ?? null;
			D.value = !D.value, await r(), n && e && i !== null && a !== null && e.setSelectionRange(i, a);
		}
		return (n, r) => (e(), a("div", {
			ref_key: "root",
			ref: C,
			class: "smartview-root",
			onInput: r[2] ||= d(() => {}, ["stop"]),
			onChange: N
		}, [o(c(y), {
			"model-value": c(w),
			type: D.value ? "text" : "password",
			label: t.label || c(S)("smartview.password"),
			hint: t.hint,
			"persistent-hint": !!t.hint,
			"error-messages": j.value,
			autocomplete: t.autocomplete,
			placeholder: t.placeholder || void 0,
			disabled: t.disabled || c(k),
			"aria-required": t.required ? "true" : void 0,
			"prepend-inner-icon": "mdi-lock-outline",
			variant: "outlined",
			density: "comfortable",
			rounded: "lg",
			"data-part": "field",
			"onUpdate:modelValue": M,
			onBlur: r[1] ||= (e) => A.value = !0
		}, {
			"append-inner": s(() => [o(c(_), {
				icon: "",
				variant: "text",
				size: "small",
				density: "comfortable",
				disabled: t.disabled || c(k),
				"aria-label": D.value ? c(S)("smartview.hidePassword") : c(S)("smartview.showPassword"),
				"aria-pressed": D.value ? "true" : "false",
				"data-part": "toggle",
				onMousedown: r[0] ||= d(() => {}, ["prevent"]),
				onClick: P
			}, {
				default: s(() => [o(c(g), { icon: D.value ? "mdi-eye-off" : "mdi-eye" }, null, 8, ["icon"])]),
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
