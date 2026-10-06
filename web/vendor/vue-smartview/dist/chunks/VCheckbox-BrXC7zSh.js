import { A as e, En as t, Q as n, T as r, Zn as i, g as a, vt as o, yn as s, zn as c } from "./vuetify-DJ4bsPds.js";
import { c as l } from "./define-BG7hCbXs.js";
import { n as u, o as d, r as f } from "./VLabel-slD1mVUb.js";
import { t as p } from "./forwardRefs-BcUquh0G.js";
import { n as m, t as h } from "./VCheckboxBtn-BD1XFHaj.js";
//#region node_modules/vuetify/lib/components/VCheckbox/VCheckbox.js
var g = e({
	...o(f(), ["direction", "glow"]),
	...o(m(), ["inline"])
}, "VCheckbox"), _ = r()({
	name: "VCheckbox",
	inheritAttrs: !1,
	props: g(),
	emits: {
		"update:modelValue": (e) => !0,
		"update:focused": (e) => !0
	},
	setup(e, { attrs: r, slots: o }) {
		let f = a(e, "modelValue"), { isFocused: m, focus: g, blur: _ } = d(e), v = i(), y = c();
		return l(() => {
			let [i, a] = n(r), c = u.filterProps(e), l = h.filterProps(e);
			return s(u, t({
				ref: v,
				class: ["v-checkbox", e.class]
			}, i, c, {
				modelValue: f.value,
				"onUpdate:modelValue": (e) => f.value = e,
				id: e.id || `checkbox-${y}`,
				focused: m.value,
				style: e.style
			}), {
				...o,
				default: ({ id: e, messagesId: n, isDisabled: r, isReadonly: i, isValid: c }) => s(h, t(l, {
					id: e.value,
					"aria-describedby": n.value,
					disabled: r.value,
					readonly: i.value
				}, a, {
					error: c.value === !1,
					modelValue: f.value,
					"onUpdate:modelValue": (e) => f.value = e,
					onFocus: g,
					onBlur: _
				}), o)
			});
		}), p({}, v);
	}
});
//#endregion
export { _ as t };
