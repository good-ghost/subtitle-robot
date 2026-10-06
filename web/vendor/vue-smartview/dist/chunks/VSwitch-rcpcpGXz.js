import { A as e, En as t, Ht as n, Ot as r, Q as i, T as a, Zn as o, cn as s, cr as c, g as l, nr as u, pn as d, ur as f, vt as p, yn as m, zn as h } from "./vuetify-DJ4bsPds.js";
import { a as g } from "./rounded-CXkAtXly.js";
import { a as _, c as v, r as y } from "./define-BG7hCbXs.js";
import { n as b, o as x, r as S } from "./VLabel-slD1mVUb.js";
import { a as C } from "./density-Dh8nVFPw.js";
import { i as w } from "./transitions-CbTxUG_W.js";
import { t as T } from "./forwardRefs-BcUquh0G.js";
import { t as E } from "./VProgressCircular-ZunkyD4q.js";
import { r as D, t as O } from "./loader-3S-Ajd36.js";
import { n as k, t as A } from "./VSelectionControl-BEITyhr3.js";
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
	...p(S(), ["glow"]),
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
}, P = a()({
	name: "VSwitch",
	inheritAttrs: !1,
	props: j(),
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:indeterminate": (e) => !0
	},
	setup(e, { attrs: a, slots: p }) {
		let y = l(e, "indeterminate"), S = l(e, "modelValue"), { loaderClasses: k } = D(e), { isFocused: j, focus: P, blur: F } = x(e), { backgroundColorClasses: I, backgroundColorStyles: L } = _(() => e.thumbColor), R = o(), z = o(), B = r && window.matchMedia("(forced-colors: active)").matches, V = u(() => n(e.loading) && e.loading !== "" ? e.loading : e.color), H = h(), U = u(() => e.id || `switch-${H}`), W = u(() => M.includes(e.size)), G = u(() => W.value ? N[e.size] : Math.round(16 * Number(e.size) / 32));
		function K() {
			y.value &&= !1;
		}
		function q(e) {
			e.stopPropagation(), e.preventDefault(), R.value?.input?.click();
		}
		return v(() => {
			let [n, r] = i(a), o = b.filterProps(e), l = A.filterProps(e), u = ["material", "square"].includes(String(e.inset)), h = !B && !!e.thumbColor;
			return m(b, t({
				ref: z,
				class: [
					"v-switch",
					{ "v-switch--flat": e.flat },
					{ "v-switch--inset": !!e.inset },
					{ "v-switch--inset-material": u },
					{ "v-switch--inset-square": e.inset === "square" },
					{ "v-switch--indeterminate": y.value },
					W.value ? `v-switch--size-${e.size}` : void 0,
					k.value,
					e.class
				]
			}, n, o, {
				modelValue: S.value,
				"onUpdate:modelValue": (e) => S.value = e,
				id: U.value,
				focused: j.value,
				style: [{ "--v-switch-scale": W.value ? void 0 : Number(e.size) / 32 }, e.style]
			}), {
				...p,
				default: ({ id: n, messagesId: i, isDisabled: a, isReadonly: o, isValid: _ }) => {
					let v = {
						model: S,
						isValid: _
					};
					return m(A, t({ ref: R }, l, {
						modelValue: S.value,
						"onUpdate:modelValue": [(e) => S.value = e, K],
						id: n.value,
						"aria-describedby": i.value,
						type: "checkbox",
						"aria-checked": y.value ? "mixed" : void 0,
						disabled: a.value,
						readonly: o.value,
						onFocus: P,
						onBlur: F
					}, r), {
						...p,
						default: ({ backgroundColorClasses: e, backgroundColorStyles: t }) => d("div", {
							class: c(["v-switch__track", B ? void 0 : e.value]),
							style: f(t.value),
							onClick: q
						}, [p["track-true"] && d("div", {
							key: "prepend",
							class: "v-switch__track-true"
						}, [p["track-true"](v)]), p["track-false"] && d("div", {
							key: "append",
							class: "v-switch__track-false"
						}, [p["track-false"](v)])]),
						input: ({ inputNode: t, icon: n, model: r, backgroundColorClasses: i, backgroundColorStyles: a, textColorClasses: o, textColorStyles: l }) => d(s, null, [t, d("div", {
							class: c([
								"v-switch__thumb",
								{ "v-switch__thumb--filled": n || e.loading },
								B ? void 0 : h && r.value ? I.value : u ? i.value : e.inset ? void 0 : i.value
							]),
							style: f([h && r.value ? L.value : u ? i.value.length || a.value.backgroundColor ? { backgroundColor: "currentColor" } : void 0 : e.inset ? void 0 : a.value])
						}, [p.thumb ? m(g, { defaults: { VIcon: {
							icon: n,
							size: u ? G.value : "x-small"
						} } }, { default: () => [p.thumb({
							...v,
							icon: n
						})] }) : m(w, null, { default: () => [e.loading ? m(O, {
							name: "v-switch",
							active: !0,
							color: _.value === !1 ? void 0 : V.value
						}, { default: (e) => p.loader ? p.loader(e) : m(E, {
							active: e.isActive,
							color: e.color,
							indeterminate: !0,
							size: G.value,
							width: "2"
						}, null) }) : n && m(C, {
							key: String(n),
							class: c(u ? o.value : void 0),
							style: f(u ? l.value : void 0),
							icon: n,
							size: u ? G.value : "x-small"
						}, null)] })])])
					});
				}
			});
		}), T({}, z);
	}
});
//#endregion
export { P as t };
