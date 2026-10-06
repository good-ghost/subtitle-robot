import { A as e, En as t, T as n, g as r, vt as i, yn as a } from "./vuetify-DJ4bsPds.js";
import { c as o } from "./define-BG7hCbXs.js";
import { n as s, t as c } from "./VSelectionControl-BEITyhr3.js";
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
		let s = r(e, "indeterminate"), l = r(e, "modelValue");
		function u(e) {
			s.value &&= !1;
		}
		return o(() => {
			let r = i(c.filterProps(e), ["modelValue"]);
			return a(c, t(r, {
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
