import { Bn as e, Hn as t, Pn as n, Wn as r, Zn as i, _n as a, ar as o, bn as s, dr as c, gn as l, hn as u, pn as d, sn as f, vn as p, yn as m } from "../chunks/vuetify-DJ4bsPds.js";
import { t as h } from "../chunks/define-BG7hCbXs.js";
import { t as g } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as _ } from "../chunks/checkedField-uvcxFMl5.js";
import { t as v } from "../chunks/VCheckbox-BrXC7zSh.js";
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
h("smartview-checkbox", /* @__PURE__ */ g(/* @__PURE__ */ s({
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
	setup(s, { emit: h }) {
		let g = s, S = h, C = e("root"), { current: w, formDisabled: T, shownError: E, change: D } = _(g, () => C.value?.querySelector("input[type=\"checkbox\"]") ?? void 0, (e, t) => S(e === "input" ? "input" : "change", t)), O = i(g.indeterminate);
		t(() => g.indeterminate, (e) => O.value = e);
		function k(e) {
			O.value = !1, D(e === !0);
		}
		return (e, t) => (n(), l("div", {
			ref_key: "root",
			ref: C,
			class: "smartview-root",
			"data-part": "root",
			onInput: t[0] ||= f(() => {}, ["stop"]),
			onChange: t[1] ||= f(() => {}, ["stop"])
		}, [m(o(v), {
			"model-value": o(w),
			indeterminate: O.value,
			label: s.label || void 0,
			disabled: s.disabled || o(T),
			readonly: s.readonly,
			color: s.color || x,
			"aria-required": s.required ? "true" : void 0,
			density: "compact",
			"hide-details": "",
			"data-part": "checkbox",
			"onUpdate:modelValue": k
		}, a({ _: 2 }, [s.label && s.required ? {
			name: "label",
			fn: r(() => [p(c(s.label), 1), t[2] ||= d("span", {
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
		]), o(E) ? (n(), l("p", y, c(o(E)), 1)) : s.hint ? (n(), l("p", b, c(s.hint), 1)) : u("", !0)], 544));
	}
}), [["styles", [".smartview-checkbox__message{padding-inline-start:28px}"]]]), { formAssociated: !0 });
//#endregion
