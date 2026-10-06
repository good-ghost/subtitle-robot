import { Ln as e, Pn as t, Wn as n, ar as r, bn as i, dr as a, en as o, hn as s, mn as c, pn as l, vn as u, yn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { a as p } from "../chunks/density-Dh8nVFPw.js";
import { t as m } from "../chunks/VBtn-D2PPPp70.js";
import { i as h, n as g, r as _, t as v } from "../chunks/VCard-CIgInzZL.js";
import { t as y } from "../chunks/VSpacer-BDzqg2jm.js";
import { n as b, t as x } from "../chunks/dialog-DkQO-UQe.js";
//#region src/elements/SmartviewModal.ce.vue?vue&type=script&setup=true&lang.ts
var S = {
	class: "text-title-large ma-0",
	"data-part": "title"
};
//#endregion
//#region src/entries/smartview-modal.ts
f("smartview-modal", /* @__PURE__ */ i({
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
	setup(i, { emit: f }) {
		let C = i, w = f, { t: T } = o(), { attachTarget: E, contentSlotName: D, dialogId: O, onAfterLeave: k } = x({
			open: () => C.open,
			overlayTarget: () => C.overlayTarget
		});
		function A() {
			C.loading || C.confirmDisabled || w("confirm");
		}
		function j() {
			C.secondaryLoading || C.secondaryDisabled || w("secondary");
		}
		function M(e) {
			e || w("cancel");
		}
		return (o, f) => (t(), c(r(b), {
			"model-value": i.open,
			"max-width": i.maxWidth,
			persistent: !i.dismissible,
			scrollable: "",
			attach: r(E),
			"retain-focus": !1,
			"capture-focus": !1,
			"onUpdate:modelValue": M,
			onAfterLeave: r(k)
		}, {
			default: n(() => [d(r(v), {
				rounded: "xl",
				"data-part": "card",
				"data-dialog-id": r(O)
			}, {
				default: n(() => [
					d(r(_), {
						class: "d-flex align-center ga-2 pa-5 pb-2",
						"data-part": "title-row"
					}, {
						default: n(() => [i.icon ? (t(), c(r(p), {
							key: 0,
							icon: i.icon,
							color: i.iconColor,
							"data-part": "icon"
						}, null, 8, ["icon", "color"])) : s("", !0), l("h2", S, a(i.heading), 1)]),
						_: 1
					}),
					d(r(g), {
						class: "pa-5 pt-2",
						"data-part": "body"
					}, {
						default: n(() => [e(o.$slots, r(D))]),
						_: 3
					}),
					d(r(h), {
						class: "pa-4 pt-0 ga-2",
						"data-part": "actions"
					}, {
						default: n(() => [
							i.secondaryText ? (t(), c(r(m), {
								key: 0,
								variant: "tonal",
								rounded: "lg",
								"prepend-icon": i.secondaryIcon || void 0,
								loading: i.secondaryLoading,
								disabled: i.secondaryDisabled,
								"data-part": "secondary",
								onClick: j
							}, {
								default: n(() => [u(a(i.secondaryText), 1)]),
								_: 1
							}, 8, [
								"prepend-icon",
								"loading",
								"disabled"
							])) : s("", !0),
							d(r(y)),
							d(r(m), {
								variant: "text",
								rounded: "lg",
								"data-part": "cancel",
								onClick: f[0] ||= (e) => w("cancel")
							}, {
								default: n(() => [u(a(i.cancelText || r(T)("smartview.cancel")), 1)]),
								_: 1
							}),
							d(r(m), {
								color: "primary",
								variant: "flat",
								rounded: "lg",
								class: "font-weight-bold",
								loading: i.loading,
								disabled: i.confirmDisabled,
								"data-part": "confirm",
								onClick: A
							}, {
								default: n(() => [u(a(i.confirmText || r(T)("smartview.save")), 1)]),
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
