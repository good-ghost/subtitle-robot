import { Bn as e, En as t, Kn as n, Tn as r, Xn as i, bn as a, dr as o, on as s, pn as c, vn as l, yn as u } from "../chunks/vuetify-C39-WP9g.js";
import { a as d } from "../chunks/rounded-1DPtyqNn.js";
import { i as f } from "../chunks/VOverlay-DFwN_aF6.js";
import { t as p } from "../chunks/define-BovISfN4.js";
import { t as m } from "../chunks/hostValue-CjEvr2gM.js";
import { n as h } from "../chunks/formField-CJIGaqFV.js";
import { t as g } from "../chunks/VCombobox-CYkGQ6L3.js";
//#endregion
//#region src/entries/smartview-multi-picklist.ts
p("smartview-multi-picklist", /* @__PURE__ */ t({
	__name: "SmartviewMultiPicklist.ce",
	props: {
		value: {
			default: () => [],
			type: Array
		},
		icon: {
			default: "",
			type: String
		},
		separator: {
			default: ",",
			type: String
		},
		suggestions: {
			default: () => [],
			type: Array
		},
		overlayTarget: {
			default: "body",
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
	setup(t, { emit: p }) {
		let _ = t, v = p, { t: y } = s(), { overlayDefaults: b } = f(() => _.overlayTarget), x = n("root"), { current: S, commit: C, reset: w } = m("value", () => _.value, { normalize: T });
		function T(e) {
			let t = [];
			for (let n of e) {
				let e = typeof n == "string" ? n.trim() : "";
				e && !t.includes(e) && t.push(e);
			}
			return t;
		}
		let { formDisabled: E, touched: D } = h({
			value: () => S.value,
			isEmpty: () => S.value.length === 0,
			required: () => _.required,
			requiredMessage: () => y("smartview.required"),
			anchor: () => x.value?.querySelector("input:not([type=\"hidden\"])") ?? void 0,
			reset: w
		}), O = l(() => _.errorMessage ? [_.errorMessage] : D.value && _.required && S.value.length === 0 ? [y("smartview.required")] : []);
		function k(e) {
			let t = T(e ?? []), n = S.value.filter((e) => t.includes(e)), r = [...n, ...t.filter((e) => !n.includes(e))], i = r.length !== S.value.length || r.some((e, t) => e !== S.value[t]);
			C([...r]), i && (v("input", [...r]), v("change", [...r]));
		}
		return (n, s) => (e(), a(o(d), { defaults: o(b) }, {
			default: i(() => [u("div", {
				ref_key: "root",
				ref: x,
				class: "smartview-root",
				onInput: s[1] ||= c(() => {}, ["stop"])
			}, [r(o(g), {
				"model-value": o(S),
				items: t.suggestions,
				label: t.label || void 0,
				hint: t.hint,
				"persistent-hint": !!t.hint,
				"error-messages": O.value,
				"prepend-inner-icon": t.icon || void 0,
				delimiters: t.separator ? [t.separator] : void 0,
				disabled: t.disabled || o(E),
				"aria-required": t.required ? "true" : void 0,
				"hide-no-data": !0,
				"menu-icon": t.suggestions.length ? void 0 : "",
				multiple: "",
				chips: "",
				"closable-chips": "",
				variant: "outlined",
				density: "comfortable",
				rounded: "lg",
				"data-part": "field",
				"onUpdate:modelValue": k,
				onBlur: s[0] ||= (e) => D.value = !0
			}, null, 8, [
				"model-value",
				"items",
				"label",
				"hint",
				"persistent-hint",
				"error-messages",
				"prepend-inner-icon",
				"delimiters",
				"disabled",
				"aria-required",
				"menu-icon"
			])], 544)]),
			_: 1
		}, 8, ["defaults"]));
	}
}), { formAssociated: !0 });
//#endregion
