import { Bn as e, Cn as t, En as n, Jn as r, Kn as i, Sn as a, Tn as o, Xn as s, _r as c, dr as l, pn as u, rr as d, wn as f, xn as p, yn as m } from "../chunks/vuetify-C39-WP9g.js";
import { t as h } from "../chunks/define-BovISfN4.js";
import { t as g } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as _ } from "../chunks/checkedField-iNQyZ5dI.js";
import { t as v } from "../chunks/VCheckbox-CGWQ8eog.js";
//#region src/elements/SmartviewCheckbox.ce.vue?vue&type=script&setup=true&lang.ts
var y = {
	key: 0,
	class: "text-body-small text-error mt-0 mb-0 smartview-checkbox__message",
	role: "alert",
	"data-part": "error"
}, b = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-0 mb-0 smartview-checkbox__message",
	"data-part": "hint"
}, x = "primary";
//#endregion
//#region src/entries/smartview-checkbox.ts
h("smartview-checkbox", /* @__PURE__ */ g(/* @__PURE__ */ n({
	__name: "SmartviewCheckbox.ce",
	props: {
		checked: {
			type: Boolean,
			default: !1
		},
		value: {
			default: "",
			type: String
		},
		indeterminate: {
			type: Boolean,
			default: !1
		},
		readonly: {
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
	setup(n, { emit: h }) {
		let g = n, S = h, C = i("root"), { current: w, formDisabled: T, shownError: E, change: D } = _(g, () => C.value?.querySelector("input[type=\"checkbox\"]") ?? void 0, (e, t) => S(e === "input" ? "input" : "change", t)), O = d(g.indeterminate);
		r(() => g.indeterminate, (e) => O.value = e);
		function k(e) {
			O.value = !1, D(e === !0);
		}
		return (r, i) => (e(), a("div", {
			ref_key: "root",
			ref: C,
			class: "smartview-root",
			"data-part": "root",
			onInput: i[0] ||= u(() => {}, ["stop"]),
			onChange: i[1] ||= u(() => {}, ["stop"])
		}, [o(l(v), {
			"model-value": l(w),
			indeterminate: O.value,
			label: n.label || void 0,
			disabled: n.disabled || l(T),
			readonly: n.readonly,
			color: n.color || x,
			"aria-required": n.required ? "true" : void 0,
			density: "compact",
			"hide-details": "",
			"data-part": "checkbox",
			"onUpdate:modelValue": k
		}, t({ _: 2 }, [n.label && n.required ? {
			name: "label",
			fn: s(() => [f(c(n.label), 1), i[2] ||= m("span", {
				class: "text-error",
				"aria-hidden": "true"
			}, "\xA0*", -1)]),
			key: "0"
		} : void 0]), 1032, [
			"model-value",
			"indeterminate",
			"label",
			"disabled",
			"readonly",
			"color",
			"aria-required"
		]), l(E) ? (e(), a("p", y, c(l(E)), 1)) : n.hint ? (e(), a("p", b, c(n.hint), 1)) : p("", !0)], 544));
	}
}), [["styles", [".smartview-checkbox__message{padding-inline-start:28px}"]]]), { formAssociated: !0 });
//#endregion
