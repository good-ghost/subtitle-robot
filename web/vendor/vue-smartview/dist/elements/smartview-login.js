import { Bn as e, Pn as t, Wn as n, Yn as r, Zn as i, ar as a, bn as o, dr as s, en as c, fn as l, gn as u, hn as d, mn as f, pn as p, sn as m, vn as h, yn as g } from "../chunks/vuetify-DJ4bsPds.js";
import { t as _ } from "../chunks/define-BG7hCbXs.js";
import { t as v } from "../chunks/hostValue-Q4jXLLiG.js";
import { a as y } from "../chunks/density-Dh8nVFPw.js";
import { r as b } from "../chunks/transitions-CbTxUG_W.js";
import { t as x } from "../chunks/VAvatar-B5evLdR9.js";
import { t as S } from "../chunks/VBtn-D2PPPp70.js";
import { t as C } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as w } from "../chunks/VCard-CIgInzZL.js";
import { t as T } from "../chunks/VTextField-uapT17Ep.js";
import { t as E } from "../chunks/VAlert-9bM3hcdc.js";
//#region src/elements/SmartviewLogin.ce.vue?vue&type=script&setup=true&lang.ts
var D = {
	class: "smartview-root smartview-login",
	"data-part": "background"
}, O = { class: "text-center mb-6" }, k = {
	class: "text-headline-small font-weight-bold ma-0",
	"data-part": "product-name"
}, A = {
	class: "text-body-medium text-medium-emphasis mt-1 mb-0",
	"data-part": "subtitle"
}, j = {
	key: 0,
	class: "text-body-small text-medium-emphasis text-center mt-6 mb-0",
	"data-part": "secured"
};
//#endregion
//#region src/entries/smartview-login.ts
_("smartview-login", /* @__PURE__ */ C(/* @__PURE__ */ o({
	__name: "SmartviewLogin.ce",
	props: {
		productName: {
			default: "",
			type: String
		},
		productIcon: {
			default: "",
			type: String
		},
		subtitle: {
			default: "",
			type: String
		},
		loading: {
			type: Boolean,
			default: !1
		},
		errorMessage: {
			default: "",
			type: String
		},
		securedText: {
			default: "",
			type: String
		}
	},
	emits: ["submit"],
	setup(o, { emit: _ }) {
		let C = o, M = _, { t: N } = c(), P = i(""), F = i(""), I = i(!1), L = r({
			username: !1,
			password: !1
		}), R = e("usernameField"), z = e("passwordField"), { current: B, commit: V } = v("errorMessage", () => C.errorMessage), H = l(() => L.username && !P.value.trim() ? [N("smartview.required")] : []), U = l(() => L.password && !F.value ? [N("smartview.required")] : []);
		function W(e) {
			e || V("");
		}
		function G() {
			if (!C.loading) {
				if (L.username = !0, L.password = !0, !P.value.trim()) {
					R.value?.focus();
					return;
				}
				if (!F.value) {
					z.value?.focus();
					return;
				}
				M("submit", {
					username: P.value.trim(),
					password: F.value
				});
			}
		}
		return (e, r) => (t(), u("div", D, [g(a(w), {
			class: "smartview-login__card pa-8",
			"max-width": "420",
			width: "100%",
			rounded: "xl",
			elevation: "24",
			"data-part": "card"
		}, {
			default: n(() => [
				p("div", O, [
					g(a(x), {
						size: "72",
						class: "smartview-login__logo mb-4",
						"data-part": "logo"
					}, {
						default: n(() => [g(a(y), {
							size: "40",
							color: "white",
							icon: o.productIcon || "mdi-shield-account"
						}, null, 8, ["icon"])]),
						_: 1
					}),
					p("h1", k, s(o.productName), 1),
					p("p", A, s(o.subtitle || a(N)("smartview.loginSubtitle")), 1)
				]),
				p("form", {
					novalidate: "",
					"data-part": "form",
					onSubmit: m(G, ["prevent"])
				}, [
					g(a(T), {
						ref_key: "usernameField",
						ref: R,
						modelValue: P.value,
						"onUpdate:modelValue": r[0] ||= (e) => P.value = e,
						label: a(N)("smartview.loginUsername"),
						"error-messages": H.value,
						disabled: o.loading,
						"prepend-inner-icon": "mdi-account-outline",
						variant: "outlined",
						density: "comfortable",
						rounded: "lg",
						class: "mb-1",
						autocomplete: "username",
						name: "username",
						"aria-required": "true",
						"data-part": "username",
						onBlur: r[1] ||= (e) => L.username = !0
					}, null, 8, [
						"modelValue",
						"label",
						"error-messages",
						"disabled"
					]),
					g(a(T), {
						ref_key: "passwordField",
						ref: z,
						modelValue: F.value,
						"onUpdate:modelValue": r[4] ||= (e) => F.value = e,
						type: I.value ? "text" : "password",
						label: a(N)("smartview.loginPassword"),
						"error-messages": U.value,
						disabled: o.loading,
						"prepend-inner-icon": "mdi-lock-outline",
						variant: "outlined",
						density: "comfortable",
						rounded: "lg",
						class: "mb-2",
						autocomplete: "current-password",
						name: "password",
						"aria-required": "true",
						"data-part": "password",
						onBlur: r[5] ||= (e) => L.password = !0
					}, {
						"append-inner": n(() => [g(a(S), {
							icon: "",
							variant: "text",
							size: "small",
							density: "comfortable",
							disabled: o.loading,
							"aria-label": I.value ? a(N)("smartview.hidePassword") : a(N)("smartview.showPassword"),
							"aria-pressed": I.value ? "true" : "false",
							"data-part": "toggle",
							onMousedown: r[2] ||= m(() => {}, ["prevent"]),
							onClick: r[3] ||= (e) => I.value = !I.value
						}, {
							default: n(() => [g(a(y), { icon: I.value ? "mdi-eye-off" : "mdi-eye" }, null, 8, ["icon"])]),
							_: 1
						}, 8, [
							"disabled",
							"aria-label",
							"aria-pressed"
						])]),
						_: 1
					}, 8, [
						"modelValue",
						"type",
						"label",
						"error-messages",
						"disabled"
					]),
					g(a(b), null, {
						default: n(() => [a(B) ? (t(), f(a(E), {
							key: 0,
							"model-value": !0,
							type: "error",
							variant: "tonal",
							density: "compact",
							rounded: "lg",
							class: "mb-4",
							closable: "",
							"data-part": "error",
							"onUpdate:modelValue": W
						}, {
							default: n(() => [h(s(a(B)), 1)]),
							_: 1
						})) : d("", !0)]),
						_: 1
					}),
					g(a(S), {
						type: "submit",
						size: "large",
						block: "",
						rounded: "lg",
						loading: o.loading,
						class: "smartview-login__submit text-none font-weight-bold",
						elevation: "2",
						"data-part": "submit"
					}, {
						default: n(() => [g(a(y), {
							start: "",
							icon: "mdi-login"
						}), h(" " + s(a(N)("smartview.loginSubmit")), 1)]),
						_: 1
					}, 8, ["loading"])
				], 32),
				o.securedText ? (t(), u("p", j, [g(a(y), {
					size: "14",
					icon: "mdi-shield-check",
					class: "mr-1"
				}), h(" " + s(o.securedText), 1)])) : d("", !0)
			]),
			_: 1
		})]));
	}
}), [["styles", [":host{min-height:100vh;display:block}.smartview-login{box-sizing:border-box;min-height:inherit;background:linear-gradient(135deg,#0d1b2a 0%,#1b2838 40%,#1a237e 100%);justify-content:center;align-items:center;height:100%;padding:24px 16px;display:flex;position:relative;overflow:hidden}.smartview-login:before{content:\"\";background:radial-gradient(at 30% 20%,#42a5f514 0%,#0000 50%),radial-gradient(at 70% 80%,#5e35b114 0%,#0000 50%);width:200%;height:200%;animation:20s ease-in-out infinite alternate smartview-login-drift;position:absolute;top:-50%;left:-50%}@keyframes smartview-login-drift{0%{transform:translate(0)rotate(0)}to{transform:translate(-2%,-2%)rotate(3deg)}}.smartview-login__card.v-card{z-index:1;background:rgba(var(--v-theme-surface), .92);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border:1px solid rgba(var(--v-border-color), var(--v-border-opacity));position:relative}.smartview-login__logo{background:linear-gradient(135deg,#42a5f5,#5e35b1);animation:3s ease-in-out infinite smartview-login-glow;box-shadow:0 4px 20px #42a5f54d}@keyframes smartview-login-glow{0%,to{box-shadow:0 4px 20px #42a5f54d}50%{box-shadow:0 4px 30px #42a5f580}}.smartview-login__submit.v-btn{letter-spacing:.5px;color:#fff;background:linear-gradient(135deg,#1565c0,#5e35b1);transition:transform .15s,box-shadow .15s}.smartview-login__submit.v-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px #42a5f559}@media (prefers-reduced-motion:reduce){.smartview-login:before,.smartview-login__logo{animation:none}.smartview-login__submit.v-btn,.smartview-login__submit.v-btn:hover{transition:none;transform:none}}"]]]));
//#endregion
