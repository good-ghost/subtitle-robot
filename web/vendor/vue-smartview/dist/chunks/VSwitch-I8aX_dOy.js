import { A as e, Gn as t, Ht as n, Mn as r, Ot as i, Q as a, T as o, Tn as s, cr as c, g as l, gr as u, mn as d, mr as f, rr as p, vt as m, yn as h } from "./vuetify-C39-WP9g.js";
import { a as g } from "./rounded-1DPtyqNn.js";
import { a as _, c as v, r as y } from "./define-BovISfN4.js";
import { n as b, o as x, r as S } from "./VLabel-B80IAw5H.js";
import { a as C } from "./density-9WZgplEH.js";
import { i as w } from "./transitions-DYv6opPi.js";
import { t as T } from "./forwardRefs-mn8VYMvs.js";
import { t as E } from "./VProgressCircular-CetUt3jx.js";
import { r as D, t as O } from "./loader-DtB2K0GR.js";
import { n as k, t as A } from "./VSelectionControl-Bdw4Wn5R.js";
//#region node_modules/vuetify/lib/components/VSwitch/VSwitch.js
var j = e({
	inset: {
		type: [Boolean, String],
		default: !1
	},
	flat: Boolean,
	thumbColor: String,
	loading: {
		type: [Boolean, String],
		default: !1
	},
	...m(S(), ["glow"]),
	...k(),
	...y()
}, "VSwitch"), M = [
	"x-small",
	"small",
	"default",
	"large",
	"x-large"
], N = {
	"x-small": 11,
	small: 14,
	default: 16,
	large: 18,
	"x-large": 22
}, P = o()({
	name: "VSwitch",
	inheritAttrs: !1,
	props: j(),
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:indeterminate": (e) => !0
	},
	setup(e, { attrs: o, slots: m }) {
		let y = l(e, "indeterminate"), S = l(e, "modelValue"), { loaderClasses: k } = D(e), { isFocused: j, focus: P, blur: F } = x(e), { backgroundColorClasses: I, backgroundColorStyles: L } = _(() => e.thumbColor), R = p(), z = p(), B = i && window.matchMedia("(forced-colors: active)").matches, V = c(() => n(e.loading) && e.loading !== "" ? e.loading : e.color), H = t(), U = c(() => e.id || `switch-${H}`), W = c(() => M.includes(e.size)), G = c(() => W.value ? N[e.size] : Math.round(16 * Number(e.size) / 32));
		function K() {
			y.value &&= !1;
		}
		function q(e) {
			e.stopPropagation(), e.preventDefault(), R.value?.input?.click();
		}
		return v(() => {
			let [t, n] = a(o), i = b.filterProps(e), c = A.filterProps(e), l = ["material", "square"].includes(String(e.inset)), p = !B && !!e.thumbColor;
			return s(b, r({
				ref: z,
				class: [
					"v-switch",
					{ "v-switch--flat": e.flat },
					{ "v-switch--inset": !!e.inset },
					{ "v-switch--inset-material": l },
					{ "v-switch--inset-square": e.inset === "square" },
					{ "v-switch--indeterminate": y.value },
					W.value ? `v-switch--size-${e.size}` : void 0,
					k.value,
					e.class
				]
			}, t, i, {
				modelValue: S.value,
				"onUpdate:modelValue": (e) => S.value = e,
				id: U.value,
				focused: j.value,
				style: [{ "--v-switch-scale": W.value ? void 0 : Number(e.size) / 32 }, e.style]
			}), {
				...m,
				default: ({ id: t, messagesId: i, isDisabled: a, isReadonly: o, isValid: _ }) => {
					let v = {
						model: S,
						isValid: _
					};
					return s(A, r({ ref: R }, c, {
						modelValue: S.value,
						"onUpdate:modelValue": [(e) => S.value = e, K],
						id: t.value,
						"aria-describedby": i.value,
						type: "checkbox",
						"aria-checked": y.value ? "mixed" : void 0,
						disabled: a.value,
						readonly: o.value,
						onFocus: P,
						onBlur: F
					}, n), {
						...m,
						default: ({ backgroundColorClasses: e, backgroundColorStyles: t }) => h("div", {
							class: f(["v-switch__track", B ? void 0 : e.value]),
							style: u(t.value),
							onClick: q
						}, [m["track-true"] && h("div", {
							key: "prepend",
							class: "v-switch__track-true"
						}, [m["track-true"](v)]), m["track-false"] && h("div", {
							key: "append",
							class: "v-switch__track-false"
						}, [m["track-false"](v)])]),
						input: ({ inputNode: t, icon: n, model: r, backgroundColorClasses: i, backgroundColorStyles: a, textColorClasses: o, textColorStyles: c }) => h(d, null, [t, h("div", {
							class: f([
								"v-switch__thumb",
								{ "v-switch__thumb--filled": n || e.loading },
								B ? void 0 : p && r.value ? I.value : l ? i.value : e.inset ? void 0 : i.value
							]),
							style: u([p && r.value ? L.value : l ? i.value.length || a.value.backgroundColor ? { backgroundColor: "currentColor" } : void 0 : e.inset ? void 0 : a.value])
						}, [m.thumb ? s(g, { defaults: { VIcon: {
							icon: n,
							size: l ? G.value : "x-small"
						} } }, { default: () => [m.thumb({
							...v,
							icon: n
						})] }) : s(w, null, { default: () => [e.loading ? s(O, {
							name: "v-switch",
							active: !0,
							color: _.value === !1 ? void 0 : V.value
						}, { default: (e) => m.loader ? m.loader(e) : s(E, {
							active: e.isActive,
							color: e.color,
							indeterminate: !0,
							size: G.value,
							width: "2"
						}, null) }) : n && s(C, {
							key: String(n),
							class: f(l ? o.value : void 0),
							style: u(l ? c.value : void 0),
							icon: n,
							size: l ? G.value : "x-small"
						}, null)] })])])
					});
				}
			});
		}), T({}, z);
	}
});
//#endregion
export { P as t };
