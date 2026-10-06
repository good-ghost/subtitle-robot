import { Bn as e, Pn as t, Wn as n, ar as r, bn as i, en as a, fn as o, mn as s, pn as c, sn as l, yn as u } from "../chunks/vuetify-DJ4bsPds.js";
import { a as d } from "../chunks/rounded-CXkAtXly.js";
import { i as f } from "../chunks/VOverlay-BI1rs3Fd.js";
import { t as p } from "../chunks/define-BG7hCbXs.js";
import { t as m } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as h } from "../chunks/formField-B1NnTyqU.js";
import { t as g } from "../chunks/VCombobox-BLskads3.js";
//#endregion
//#region src/entries/smartview-multi-picklist.ts
p("smartview-multi-picklist", /* @__PURE__ */ i({
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
	setup(i, { emit: p }) {
		let _ = i, v = p, { t: y } = a(), { overlayDefaults: b } = f(() => _.overlayTarget), x = e("root"), { current: S, commit: C, reset: w } = m("value", () => _.value, { normalize: T });
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
		}), O = o(() => _.errorMessage ? [_.errorMessage] : D.value && _.required && S.value.length === 0 ? [y("smartview.required")] : []);
		function k(e) {
			let t = T(e ?? []), n = S.value.filter((e) => t.includes(e)), r = [...n, ...t.filter((e) => !n.includes(e))], i = r.length !== S.value.length || r.some((e, t) => e !== S.value[t]);
			C([...r]), i && (v("input", [...r]), v("change", [...r]));
		}
		return (e, a) => (t(), s(r(d), { defaults: r(b) }, {
			default: n(() => [c("div", {
				ref_key: "root",
				ref: x,
				class: "smartview-root",
				onInput: a[1] ||= l(() => {}, ["stop"])
			}, [u(r(g), {
				"model-value": r(S),
				items: i.suggestions,
				label: i.label || void 0,
				hint: i.hint,
				"persistent-hint": !!i.hint,
				"error-messages": O.value,
				"prepend-inner-icon": i.icon || void 0,
				delimiters: i.separator ? [i.separator] : void 0,
				disabled: i.disabled || r(E),
				"aria-required": i.required ? "true" : void 0,
				"hide-no-data": !0,
				"menu-icon": i.suggestions.length ? void 0 : "",
				multiple: "",
				chips: "",
				"closable-chips": "",
				variant: "outlined",
				density: "comfortable",
				rounded: "lg",
				"data-part": "field",
				"onUpdate:modelValue": k,
				onBlur: a[0] ||= (e) => D.value = !0
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
