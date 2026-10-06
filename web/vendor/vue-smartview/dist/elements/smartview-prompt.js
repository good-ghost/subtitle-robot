import { Ln as e, Pn as t, Wn as n, ar as r, bn as i, dr as a, en as o, gn as s, hn as c, mn as l, pn as u, vn as d, yn as f } from "../chunks/vuetify-DJ4bsPds.js";
import { t as p } from "../chunks/define-BG7hCbXs.js";
import { a as m } from "../chunks/density-Dh8nVFPw.js";
import { t as h } from "../chunks/VAvatar-B5evLdR9.js";
import { t as g } from "../chunks/VBtn-D2PPPp70.js";
import { t as _ } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as v, n as y, r as b, t as x } from "../chunks/VCard-CIgInzZL.js";
import { t as S } from "../chunks/VSpacer-BDzqg2jm.js";
import { n as C, t as w } from "../chunks/dialog-DkQO-UQe.js";
//#region src/elements/SmartviewPrompt.ce.vue?vue&type=script&setup=true&lang.ts
var T = {
	class: "text-title-large",
	"data-part": "title"
}, E = { "data-part": "message" }, D = { key: 0 }, O = {
	key: 1,
	class: "text-medium-emphasis text-body-medium",
	"data-part": "warning"
}, k = { class: "smartview-confirm-extra" };
//#endregion
//#region src/entries/smartview-prompt.ts
p("smartview-prompt", /* @__PURE__ */ _(/* @__PURE__ */ i({
	__name: "SmartviewPrompt.ce",
	props: {
		open: {
			type: Boolean,
			default: !1
		},
		heading: {
			default: "",
			type: String
		},
		message: {
			default: "",
			type: String
		},
		warning: {
			default: "",
			type: String
		},
		confirmText: {
			default: "",
			type: String
		},
		cancelText: {
			default: "",
			type: String
		},
		icon: {
			default: "mdi-delete-alert",
			type: String
		},
		color: {
			default: "error",
			type: String
		},
		loading: {
			type: Boolean,
			default: !1
		},
		dismissible: {
			type: Boolean,
			default: !1
		},
		overlayTarget: {
			default: "body",
			type: String
		}
	},
	emits: ["confirm", "cancel"],
	setup(i, { emit: p }) {
		let _ = i, A = p, { t: j } = o(), { attachTarget: M, contentSlotName: N, dialogId: P, onAfterLeave: F } = w({
			open: () => _.open,
			overlayTarget: () => _.overlayTarget
		});
		function I() {
			_.loading || A("confirm");
		}
		function L(e) {
			e || A("cancel");
		}
		return (o, p) => (t(), l(r(C), {
			"model-value": i.open,
			"max-width": "440",
			persistent: !i.dismissible,
			attach: r(M),
			"retain-focus": !1,
			"capture-focus": !1,
			"onUpdate:modelValue": L,
			onAfterLeave: r(F)
		}, {
			default: n(() => [f(r(x), {
				rounded: "xl",
				class: "pa-2",
				"data-part": "card",
				"data-dialog-id": r(P)
			}, {
				default: n(() => [
					f(r(b), { class: "d-flex align-center ga-2 pt-4" }, {
						default: n(() => [f(r(h), {
							color: i.color,
							variant: "tonal",
							size: "40",
							"data-part": "icon"
						}, {
							default: n(() => [f(r(m), { icon: i.icon }, null, 8, ["icon"])]),
							_: 1
						}, 8, ["color"]), u("span", T, a(i.heading), 1)]),
						_: 1
					}),
					f(r(y), { class: "text-body-large" }, {
						default: n(() => [
							u("span", E, a(i.message), 1),
							i.warning ? (t(), s("br", D)) : c("", !0),
							i.warning ? (t(), s("span", O, a(i.warning), 1)) : c("", !0),
							u("div", k, [e(o.$slots, r(N))])
						]),
						_: 3
					}),
					f(r(v), { class: "pa-4 pt-0" }, {
						default: n(() => [
							f(r(S)),
							f(r(g), {
								variant: "text",
								rounded: "lg",
								"data-part": "cancel",
								onClick: p[0] ||= (e) => A("cancel")
							}, {
								default: n(() => [d(a(i.cancelText || r(j)("smartview.cancel")), 1)]),
								_: 1
							}),
							f(r(g), {
								color: i.color,
								variant: "flat",
								rounded: "lg",
								class: "font-weight-bold",
								loading: i.loading,
								"data-part": "confirm",
								onClick: I
							}, {
								default: n(() => [d(a(i.confirmText || r(j)("smartview.delete")), 1)]),
								_: 1
							}, 8, ["color", "loading"])
						]),
						_: 1
					})
				]),
				_: 3
			}, 8, ["data-dialog-id"])]),
			_: 3
		}, 8, [
			"model-value",
			"persistent",
			"attach",
			"onAfterLeave"
		]));
	}
}), [["styles", [".smartview-confirm-extra ::slotted(*){margin-top:12px}"]]]));
//#endregion
