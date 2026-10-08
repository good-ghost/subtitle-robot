import { Bn as e, En as t, Tn as n, Un as r, Xn as i, _r as a, bn as o, dr as s, on as c, wn as l, xn as u, yn as d } from "../chunks/vuetify-C39-WP9g.js";
import { t as f } from "../chunks/define-BovISfN4.js";
import { t as p } from "../chunks/VDivider-CA-IOlps.js";
import { a as m } from "../chunks/density-9WZgplEH.js";
import { t as h } from "../chunks/VBtn-CV2MWNTN.js";
import { i as g, n as _, r as v, t as y } from "../chunks/VCard-Z58vOTy1.js";
import { t as b } from "../chunks/VSpacer-BKsHyVbj.js";
import { n as x, t as S } from "../chunks/dialog-DHL_I1HS.js";
//#region src/elements/SmartviewModal.ce.vue?vue&type=script&setup=true&lang.ts
var C = {
	class: "text-title-large ma-0",
	"data-part": "title"
};
//#endregion
//#region src/entries/smartview-modal.ts
f("smartview-modal", /* @__PURE__ */ t({
	__name: "SmartviewModal.ce",
	props: {
		open: {
			type: Boolean,
			default: !1
		},
		heading: {
			default: "",
			type: String
		},
		icon: {
			default: "",
			type: String
		},
		iconColor: {
			default: "primary",
			type: String
		},
		maxWidth: {
			default: 620,
			type: [Number, String]
		},
		dismissible: {
			type: Boolean,
			default: !1
		},
		loading: {
			type: Boolean,
			default: !1
		},
		confirmText: {
			default: "",
			type: String
		},
		cancelText: {
			default: "",
			type: String
		},
		confirmDisabled: {
			type: Boolean,
			default: !1
		},
		secondaryText: {
			default: "",
			type: String
		},
		secondaryIcon: {
			default: "",
			type: String
		},
		secondaryLoading: {
			type: Boolean,
			default: !1
		},
		secondaryDisabled: {
			type: Boolean,
			default: !1
		},
		overlayTarget: {
			default: "body",
			type: String
		}
	},
	emits: [
		"confirm",
		"cancel",
		"secondary"
	],
	setup(t, { emit: f }) {
		let w = t, T = f, { t: E } = c(), { attachTarget: D, contentSlotName: O, dialogId: k, onAfterLeave: A } = S({
			open: () => w.open,
			overlayTarget: () => w.overlayTarget
		});
		function j() {
			w.loading || w.confirmDisabled || T("confirm");
		}
		function M() {
			w.secondaryLoading || w.secondaryDisabled || T("secondary");
		}
		function N(e) {
			e || T("cancel");
		}
		return (c, f) => (e(), o(s(x), {
			"model-value": t.open,
			"max-width": t.maxWidth,
			persistent: !t.dismissible,
			scrollable: "",
			attach: s(D),
			"retain-focus": !1,
			"capture-focus": !1,
			"onUpdate:modelValue": N,
			onAfterLeave: s(A)
		}, {
			default: i(() => [n(s(y), {
				rounded: "xl",
				"data-part": "card",
				"data-dialog-id": s(k)
			}, {
				default: i(() => [
					n(s(v), {
						class: "d-flex align-center ga-2 pa-5 pb-4",
						"data-part": "title-row"
					}, {
						default: i(() => [t.icon ? (e(), o(s(m), {
							key: 0,
							icon: t.icon,
							color: t.iconColor,
							"data-part": "icon"
						}, null, 8, ["icon", "color"])) : u("", !0), d("h2", C, a(t.heading), 1)]),
						_: 1
					}),
					n(s(p), { "data-part": "header-divider" }),
					n(s(_), {
						class: "pa-5",
						"data-part": "body"
					}, {
						default: i(() => [r(c.$slots, s(O))]),
						_: 3
					}),
					n(s(p), { "data-part": "footer-divider" }),
					n(s(g), {
						class: "pa-4 ga-2",
						"data-part": "actions"
					}, {
						default: i(() => [
							t.secondaryText ? (e(), o(s(h), {
								key: 0,
								variant: "outlined",
								rounded: "lg",
								"prepend-icon": t.secondaryIcon || void 0,
								loading: t.secondaryLoading,
								disabled: t.secondaryDisabled,
								"data-part": "secondary",
								onClick: M
							}, {
								default: i(() => [l(a(t.secondaryText), 1)]),
								_: 1
							}, 8, [
								"prepend-icon",
								"loading",
								"disabled"
							])) : u("", !0),
							n(s(b)),
							n(s(h), {
								variant: "outlined",
								rounded: "lg",
								"data-part": "cancel",
								onClick: f[0] ||= (e) => T("cancel")
							}, {
								default: i(() => [l(a(t.cancelText || s(E)("smartview.cancel")), 1)]),
								_: 1
							}),
							n(s(h), {
								color: "primary",
								variant: "flat",
								rounded: "lg",
								class: "font-weight-bold",
								loading: t.loading,
								disabled: t.confirmDisabled,
								"data-part": "confirm",
								onClick: j
							}, {
								default: i(() => [l(a(t.confirmText || s(E)("smartview.save")), 1)]),
								_: 1
							}, 8, ["loading", "disabled"])
						]),
						_: 1
					})
				]),
				_: 3
			}, 8, ["data-dialog-id"])]),
			_: 3
		}, 8, [
			"model-value",
			"max-width",
			"persistent",
			"attach",
			"onAfterLeave"
		]));
	}
}));
//#endregion
