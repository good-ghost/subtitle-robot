import { A as e, Gn as t, Mn as n, Q as r, T as i, Tn as a, g as o, rr as s, vt as c } from "./vuetify-C39-WP9g.js";
import { c as l } from "./define-BovISfN4.js";
import { n as u, o as d, r as f } from "./VLabel-B80IAw5H.js";
import { t as p } from "./forwardRefs-mn8VYMvs.js";
import { n as m, t as h } from "./VCheckboxBtn-Z27PqfdZ.js";
//#region node_modules/vuetify/lib/components/VCheckbox/VCheckbox.js
var g = e({
	...c(f(), ["direction", "glow"]),
	...c(m(), ["inline"])
}, "VCheckbox"), _ = i()({
	name: "VCheckbox",
	inheritAttrs: !1,
	props: g(),
	emits: {
		"update:modelValue": (e) => !0,
		"update:focused": (e) => !0
	},
	setup(e, { attrs: i, slots: c }) {
		let f = o(e, "modelValue"), { isFocused: m, focus: g, blur: _ } = d(e), v = s(), y = t();
		return l(() => {
			let [t, o] = r(i), s = u.filterProps(e), l = h.filterProps(e);
			return a(u, n({
				ref: v,
				class: ["v-checkbox", e.class]
			}, t, s, {
				modelValue: f.value,
				"onUpdate:modelValue": (e) => f.value = e,
				id: e.id || `checkbox-${y}`,
				focused: m.value,
				style: e.style
			}), {
				...c,
				default: ({ id: e, messagesId: t, isDisabled: r, isReadonly: i, isValid: s }) => a(h, n(l, {
					id: e.value,
					"aria-describedby": t.value,
					disabled: r.value,
					readonly: i.value
				}, o, {
					error: s.value === !1,
					modelValue: f.value,
					"onUpdate:modelValue": (e) => f.value = e,
					onFocus: g,
					onBlur: _
				}), c)
			});
		}), p({}, v);
	}
});
//#endregion
export { _ as t };
