import { A as e, Mn as t, T as n, Tn as r, g as i, vt as a } from "./vuetify-C39-WP9g.js";
import { c as o } from "./define-BovISfN4.js";
import { n as s, t as c } from "./VSelectionControl-Bdw4Wn5R.js";
//#region node_modules/vuetify/lib/components/VCheckbox/VCheckboxBtn.js
var l = e({ ...s({
	falseIcon: "$checkboxOff",
	trueIcon: "$checkboxOn",
	indeterminateIcon: "$checkboxIndeterminate"
}) }, "VCheckboxBtn"), u = n()({
	name: "VCheckboxBtn",
	props: l(),
	emits: {
		"update:modelValue": (e) => !0,
		"update:indeterminate": (e) => !0
	},
	setup(e, { slots: n }) {
		let s = i(e, "indeterminate"), l = i(e, "modelValue");
		function u(e) {
			s.value &&= !1;
		}
		return o(() => {
			let i = a(c.filterProps(e), ["modelValue"]);
			return r(c, t(i, {
				modelValue: l.value,
				"onUpdate:modelValue": [(e) => l.value = e, u],
				class: ["v-checkbox-btn", e.class],
				style: e.style,
				type: "checkbox",
				"aria-checked": s.value ? "mixed" : void 0
			}), n);
		}), {};
	}
});
//#endregion
export { l as n, u as t };
