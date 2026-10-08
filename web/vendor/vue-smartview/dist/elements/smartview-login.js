import { Bn as e, En as t, Kn as n, Qt as r, Sn as i, Tn as a, Xn as o, _r as s, bn as c, dr as l, en as u, on as d, pn as f, rr as p, tr as m, vn as h, wn as g, xn as _, yn as v } from "../chunks/vuetify-C39-WP9g.js";
import { t as y } from "../chunks/define-BovISfN4.js";
import { t as b } from "../chunks/hostValue-CjEvr2gM.js";
import { a as x } from "../chunks/density-9WZgplEH.js";
import { r as S } from "../chunks/transitions-DYv6opPi.js";
import { t as C } from "../chunks/VAvatar-DdB1q11O.js";
import { t as w } from "../chunks/VBtn-CV2MWNTN.js";
import { t as T } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { t as E } from "../chunks/VCard-Z58vOTy1.js";
import { t as D } from "../chunks/VTextField-DrXa6-zE.js";
import { t as O } from "../chunks/VAlert-rN_W5d_m.js";
//#region src/messages/SmartviewLogin.ts
var k = r({
	en: {
		loginSubtitle: "Sign in to the admin console",
		loginUsername: "Username",
		loginPassword: "Password",
		loginSubmit: "Sign in"
	},
	ko: {
		loginSubtitle: "관리 콘솔에 로그인하세요",
		loginUsername: "사용자 이름",
		loginPassword: "비밀번호",
		loginSubmit: "로그인"
	}
}), A = {
	class: "smartview-root smartview-login",
	"data-part": "background"
}, j = { class: "text-center mb-6" }, M = {
	class: "text-headline-small font-weight-bold ma-0",
	"data-part": "product-name"
}, N = {
	class: "text-body-medium text-medium-emphasis mt-1 mb-0",
	"data-part": "subtitle"
}, P = {
	key: 0,
	class: "text-body-small text-medium-emphasis text-center mt-6 mb-0",
	"data-part": "secured"
};
//#endregion
//#region src/entries/smartview-login.ts
y("smartview-login", /* @__PURE__ */ T(/* @__PURE__ */ t({
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
	setup(t, { emit: r }) {
		let y = t, T = r, { t: F } = d();
		u(k);
		let I = p(""), L = p(""), R = p(!1), z = m({
			username: !1,
			password: !1
		}), B = n("usernameField"), V = n("passwordField"), { current: H, commit: U } = b("errorMessage", () => y.errorMessage), W = h(() => z.username && !I.value.trim() ? [F("smartview.required")] : []), G = h(() => z.password && !L.value ? [F("smartview.required")] : []);
		function K(e) {
			e || U("");
		}
		function q() {
			if (!y.loading) {
				if (z.username = !0, z.password = !0, !I.value.trim()) {
					B.value?.focus();
					return;
				}
				if (!L.value) {
					V.value?.focus();
					return;
				}
				T("submit", {
					username: I.value.trim(),
					password: L.value
				});
			}
		}
		return (n, r) => (e(), i("div", A, [a(l(E), {
			class: "smartview-login__card pa-8",
			"max-width": "420",
			width: "100%",
			rounded: "xl",
			elevation: "24",
			"data-part": "card"
		}, {
			default: o(() => [
				v("div", j, [
					a(l(C), {
						size: "72",
						class: "smartview-login__logo mb-4",
						"data-part": "logo"
					}, {
						default: o(() => [a(l(x), {
							size: "40",
							color: "white",
							icon: t.productIcon || "mdi-shield-account"
						}, null, 8, ["icon"])]),
						_: 1
					}),
					v("h1", M, s(t.productName), 1),
					v("p", N, s(t.subtitle || l(F)("smartview.loginSubtitle")), 1)
				]),
				v("form", {
					novalidate: "",
					"data-part": "form",
					onSubmit: f(q, ["prevent"])
				}, [
					a(l(D), {
						ref_key: "usernameField",
						ref: B,
						modelValue: I.value,
						"onUpdate:modelValue": r[0] ||= (e) => I.value = e,
						label: l(F)("smartview.loginUsername"),
						"error-messages": W.value,
						disabled: t.loading,
						"prepend-inner-icon": "mdi-account-outline",
						variant: "outlined",
						density: "comfortable",
						rounded: "lg",
						class: "mb-1",
						autocomplete: "username",
						name: "username",
						"aria-required": "true",
						"data-part": "username",
						onBlur: r[1] ||= (e) => z.username = !0
					}, null, 8, [
						"modelValue",
						"label",
						"error-messages",
						"disabled"
					]),
					a(l(D), {
						ref_key: "passwordField",
						ref: V,
						modelValue: L.value,
						"onUpdate:modelValue": r[4] ||= (e) => L.value = e,
						type: R.value ? "text" : "password",
						label: l(F)("smartview.loginPassword"),
						"error-messages": G.value,
						disabled: t.loading,
						"prepend-inner-icon": "mdi-lock-outline",
						variant: "outlined",
						density: "comfortable",
						rounded: "lg",
						class: "mb-2",
						autocomplete: "current-password",
						name: "password",
						"aria-required": "true",
						"data-part": "password",
						onBlur: r[5] ||= (e) => z.password = !0
					}, {
						"append-inner": o(() => [a(l(w), {
							icon: "",
							variant: "text",
							size: "small",
							density: "comfortable",
							disabled: t.loading,
							"aria-label": R.value ? l(F)("smartview.hidePassword") : l(F)("smartview.showPassword"),
							"aria-pressed": R.value ? "true" : "false",
							"data-part": "toggle",
							onMousedown: r[2] ||= f(() => {}, ["prevent"]),
							onClick: r[3] ||= (e) => R.value = !R.value
						}, {
							default: o(() => [a(l(x), { icon: R.value ? "mdi-eye-off" : "mdi-eye" }, null, 8, ["icon"])]),
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
					a(l(S), null, {
						default: o(() => [l(H) ? (e(), c(l(O), {
							key: 0,
							"model-value": !0,
							type: "error",
							variant: "tonal",
							density: "compact",
							rounded: "lg",
							class: "mb-4",
							closable: "",
							"data-part": "error",
							"onUpdate:modelValue": K
						}, {
							default: o(() => [g(s(l(H)), 1)]),
							_: 1
						})) : _("", !0)]),
						_: 1
					}),
					a(l(w), {
						type: "submit",
						size: "large",
						block: "",
						rounded: "lg",
						loading: t.loading,
						class: "smartview-login__submit text-none font-weight-bold",
						elevation: "2",
						"data-part": "submit"
					}, {
						default: o(() => [a(l(x), {
							start: "",
							icon: "mdi-login"
						}), g(" " + s(l(F)("smartview.loginSubmit")), 1)]),
						_: 1
					}, 8, ["loading"])
				], 32),
				t.securedText ? (e(), i("p", P, [a(l(x), {
					size: "14",
					icon: "mdi-shield-check",
					class: "mr-1"
				}), g(" " + s(t.securedText), 1)])) : _("", !0)
			]),
			_: 1
		})]));
	}
}), [["styles", [":host{min-height:100vh;display:block}.smartview-login{box-sizing:border-box;min-height:inherit;background:linear-gradient(135deg,#0d1b2a 0%,#1b2838 40%,#1a237e 100%);justify-content:center;align-items:center;height:100%;padding:24px 16px;display:flex;position:relative;overflow:hidden}.smartview-login:before{content:\"\";background:radial-gradient(at 30% 20%,#42a5f514 0%,#0000 50%),radial-gradient(at 70% 80%,#5e35b114 0%,#0000 50%);width:200%;height:200%;animation:20s ease-in-out infinite alternate smartview-login-drift;position:absolute;top:-50%;left:-50%}@keyframes smartview-login-drift{0%{transform:translate(0)rotate(0)}to{transform:translate(-2%,-2%)rotate(3deg)}}.smartview-login__card.v-card{z-index:1;background:rgba(var(--v-theme-surface), .92);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border:1px solid rgba(var(--v-border-color), var(--v-border-opacity));position:relative}.smartview-login__logo{background:linear-gradient(135deg,#42a5f5,#5e35b1);animation:3s ease-in-out infinite smartview-login-glow;box-shadow:0 4px 20px #42a5f54d}@keyframes smartview-login-glow{0%,to{box-shadow:0 4px 20px #42a5f54d}50%{box-shadow:0 4px 30px #42a5f580}}.smartview-login__submit.v-btn{letter-spacing:.5px;color:#fff;background:linear-gradient(135deg,#1565c0,#5e35b1);transition:transform .15s,box-shadow .15s}.smartview-login__submit.v-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px #42a5f559}@media (prefers-reduced-motion:reduce){.smartview-login:before,.smartview-login__logo{animation:none}.smartview-login__submit.v-btn,.smartview-login__submit.v-btn:hover{transition:none;transform:none}}"]]]));
//#endregion
