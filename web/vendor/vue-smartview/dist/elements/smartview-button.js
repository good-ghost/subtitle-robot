import { Bn as e, En as t, Fn as n, Sn as r, Tn as i, Un as a, Xn as o, _r as s, dr as c, un as l, vn as u, wn as d } from "../chunks/vuetify-C39-WP9g.js";
import { t as f } from "../chunks/define-BovISfN4.js";
import { t as p } from "../chunks/VBtn-CV2MWNTN.js";
import { t as m } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as h, t as g } from "../chunks/formField-CJIGaqFV.js";
//#region src/elements/SmartviewButton.ce.vue?vue&type=script&setup=true&lang.ts
var _ = {
	class: "smartview-root smartview-button",
	"data-part": "root"
};
//#endregion
//#region src/entries/smartview-button.ts
f("smartview-button", /* @__PURE__ */ m(/* @__PURE__ */ t({
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
	setup(t) {
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
		}, m = t, v = l(), y = u(() => Object.hasOwn(f, m.variant) ? f[m.variant] : f.neutral), { formDisabled: b } = h({
			value: () => null,
			isEmpty: () => !1,
			required: () => !1,
			requiredMessage: () => "",
			anchor: () => v?.shadowRoot?.querySelector("[data-part=\"button\"]") ?? void 0,
			reset: () => void 0
		}), x = u(() => m.disabled || m.loading || b.value);
		function S(e) {
			x.value && (e.preventDefault(), e.stopImmediatePropagation());
		}
		v?.addEventListener("click", S, !0), n(() => v?.removeEventListener("click", S, !0));
		function C() {
			if (x.value || !g(v)) return;
			let e = v.internals.form;
			m.type === "submit" ? e?.requestSubmit() : m.type === "reset" && e?.reset();
		}
		return (n, l) => (e(), r("div", _, [i(c(p), {
			variant: y.value.variant,
			color: y.value.color,
			"prepend-icon": t.iconName && t.iconPosition !== "right" ? t.iconName : void 0,
			"append-icon": t.iconName && t.iconPosition === "right" ? t.iconName : void 0,
			disabled: t.disabled || c(b),
			loading: t.loading,
			block: t.stretch,
			rounded: "lg",
			class: "text-none",
			"data-part": "button",
			onClick: C
		}, {
			default: o(() => [a(n.$slots, "default", {}, () => [d(s(t.label), 1)])]),
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
