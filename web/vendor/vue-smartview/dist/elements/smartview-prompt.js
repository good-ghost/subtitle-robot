import { Bn as e, En as t, Qt as n, Sn as r, Tn as i, Un as a, Xn as o, _r as s, bn as c, dr as l, en as u, on as d, wn as f, xn as p, yn as m } from "../chunks/vuetify-C39-WP9g.js";
import { t as h } from "../chunks/define-BovISfN4.js";
import { t as g } from "../chunks/VDivider-CA-IOlps.js";
import { a as _ } from "../chunks/density-9WZgplEH.js";
import { t as v } from "../chunks/VAvatar-DdB1q11O.js";
import { t as y } from "../chunks/VBtn-CV2MWNTN.js";
import { t as b } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as x, n as S, r as C, t as w } from "../chunks/VCard-Z58vOTy1.js";
import { t as T } from "../chunks/VSpacer-BKsHyVbj.js";
import { n as E, t as D } from "../chunks/dialog-DHL_I1HS.js";
//#region src/messages/SmartviewPrompt.ts
var O = n({
	en: { delete: "Delete" },
	ko: { delete: "삭제" }
}), k = {
	class: "text-title-large",
	"data-part": "title"
}, A = { "data-part": "message" }, j = { key: 0 }, M = {
	key: 1,
	class: "text-medium-emphasis text-body-medium",
	"data-part": "warning"
}, N = { class: "smartview-confirm-extra" };
//#endregion
//#region src/entries/smartview-prompt.ts
h("smartview-prompt", /* @__PURE__ */ b(/* @__PURE__ */ t({
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
	setup(t, { emit: n }) {
		let h = t, b = n, { t: P } = d();
		u(O);
		let { attachTarget: F, contentSlotName: I, dialogId: L, onAfterLeave: R } = D({
			open: () => h.open,
			overlayTarget: () => h.overlayTarget
		});
		function z() {
			h.loading || b("confirm");
		}
		function B(e) {
			e || b("cancel");
		}
		return (n, u) => (e(), c(l(E), {
			"model-value": t.open,
			"max-width": "440",
			persistent: !t.dismissible,
			attach: l(F),
			"retain-focus": !1,
			"capture-focus": !1,
			"onUpdate:modelValue": B,
			onAfterLeave: l(R)
		}, {
			default: o(() => [i(l(w), {
				rounded: "xl",
				"data-part": "card",
				"data-dialog-id": l(L)
			}, {
				default: o(() => [
					i(l(C), { class: "d-flex align-center ga-2 pa-5 pb-4" }, {
						default: o(() => [i(l(v), {
							color: t.color,
							variant: "tonal",
							size: "40",
							"data-part": "icon"
						}, {
							default: o(() => [i(l(_), { icon: t.icon }, null, 8, ["icon"])]),
							_: 1
						}, 8, ["color"]), m("span", k, s(t.heading), 1)]),
						_: 1
					}),
					i(l(g), { "data-part": "header-divider" }),
					i(l(S), { class: "pa-5 text-body-large" }, {
						default: o(() => [
							m("span", A, s(t.message), 1),
							t.warning ? (e(), r("br", j)) : p("", !0),
							t.warning ? (e(), r("span", M, s(t.warning), 1)) : p("", !0),
							m("div", N, [a(n.$slots, l(I))])
						]),
						_: 3
					}),
					i(l(g), { "data-part": "footer-divider" }),
					i(l(x), { class: "pa-4" }, {
						default: o(() => [
							i(l(T)),
							i(l(y), {
								variant: "outlined",
								rounded: "lg",
								"data-part": "cancel",
								onClick: u[0] ||= (e) => b("cancel")
							}, {
								default: o(() => [f(s(t.cancelText || l(P)("smartview.cancel")), 1)]),
								_: 1
							}),
							i(l(y), {
								color: t.color,
								variant: "flat",
								rounded: "lg",
								class: "font-weight-bold",
								loading: t.loading,
								"data-part": "confirm",
								onClick: z
							}, {
								default: o(() => [f(s(t.confirmText || l(P)("smartview.delete")), 1)]),
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
