import { Ln as e, Pn as t, Wn as n, ar as r, bn as i, dr as a, fn as o, gn as s, in as c, kn as l, vn as u, yn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { t as p } from "../chunks/VBtn-D2PPPp70.js";
import { t as m } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as h, t as g } from "../chunks/formField-B1NnTyqU.js";
//#region src/elements/SmartviewButton.ce.vue?vue&type=script&setup=true&lang.ts
var _ = {
	class: "smartview-root smartview-button",
	"data-part": "root"
};
//#endregion
//#region src/entries/smartview-button.ts
f("smartview-button", /* @__PURE__ */ m(/* @__PURE__ */ i({
	__name: "SmartviewButton.ce",
	props: {
		label: {
			default: "",
			type: String
		},
		variant: {
			default: "neutral",
			type: String
		},
		iconName: {
			default: "",
			type: String
		},
		iconPosition: {
			default: "left",
			type: String
		},
		disabled: {
			type: Boolean,
			default: !1
		},
		loading: {
			type: Boolean,
			default: !1
		},
		type: {
			default: "button",
			type: String
		},
		stretch: {
			type: Boolean,
			default: !1
		}
	},
	setup(i) {
		let f = {
			neutral: { variant: "outlined" },
			brand: {
				variant: "flat",
				color: "primary"
			},
			"outline-brand": {
				variant: "outlined",
				color: "primary"
			},
			destructive: {
				variant: "flat",
				color: "error"
			},
			"destructive-text": {
				variant: "text",
				color: "error"
			},
			success: {
				variant: "flat",
				color: "success"
			},
			base: {
				variant: "text",
				color: "primary"
			}
		}, m = i, v = c(), y = o(() => Object.hasOwn(f, m.variant) ? f[m.variant] : f.neutral), { formDisabled: b } = h({
			value: () => null,
			isEmpty: () => !1,
			required: () => !1,
			requiredMessage: () => "",
			anchor: () => v?.shadowRoot?.querySelector("[data-part=\"button\"]") ?? void 0,
			reset: () => void 0
		}), x = o(() => m.disabled || m.loading || b.value);
		function S(e) {
			x.value && (e.preventDefault(), e.stopImmediatePropagation());
		}
		v?.addEventListener("click", S, !0), l(() => v?.removeEventListener("click", S, !0));
		function C() {
			if (x.value || !g(v)) return;
			let e = v.internals.form;
			m.type === "submit" ? e?.requestSubmit() : m.type === "reset" && e?.reset();
		}
		return (o, c) => (t(), s("div", _, [d(r(p), {
			variant: y.value.variant,
			color: y.value.color,
			"prepend-icon": i.iconName && i.iconPosition !== "right" ? i.iconName : void 0,
			"append-icon": i.iconName && i.iconPosition === "right" ? i.iconName : void 0,
			disabled: i.disabled || r(b),
			loading: i.loading,
			block: i.stretch,
			rounded: "lg",
			class: "text-none",
			"data-part": "button",
			onClick: C
		}, {
			default: n(() => [e(o.$slots, "default", {}, () => [u(a(i.label), 1)])]),
			_: 3
		}, 8, [
			"variant",
			"color",
			"prepend-icon",
			"append-icon",
			"disabled",
			"loading",
			"block"
		])]));
	}
}), [["styles", [":host{vertical-align:middle;display:inline-flex}:host([stretch]){display:flex}.smartview-button{display:inline-flex}:host([stretch]) .smartview-button{width:100%;display:flex}"]]]), { formAssociated: !0 });
//#endregion
