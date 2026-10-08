import { A as e, B as t, Et as n, F as r, G as i, Gn as a, Ht as o, Jn as s, Mn as c, S as l, T as u, Tn as d, Zn as f, c as p, cr as m, fn as h, gr as g, h as ee, l as _, mn as te, mr as v, or as y, rr as b, rt as ne, v as x, vn as S, yn as C } from "./vuetify-C39-WP9g.js";
import { a as re, n as w, t as T } from "./rounded-1DPtyqNn.js";
import { n as ie, t as ae } from "./animation-B_ZSS1p4.js";
import { a as oe, c as E, l as D, s as se } from "./define-BovISfN4.js";
import { a as O, o as k, s as A, t as j } from "./VLabel-B80IAw5H.js";
import { a as M, n as N } from "./transitions-DYv6opPi.js";
import { n as P, t as F } from "./transition-Cv515_M1.js";
import { n as I, r as ce, t as le } from "./loader-DtB2K0GR.js";
//#region node_modules/vuetify/lib/components/VCounter/VCounter.js
var L = e({
	active: Boolean,
	disabled: Boolean,
	max: [Number, String],
	value: {
		type: [Number, String],
		default: 0
	},
	...D(),
	...P({ transition: { component: M } })
}, "VCounter"), R = u()({
	name: "VCounter",
	functional: !0,
	props: L(),
	setup(e, { slots: t }) {
		let n = y(e.max);
		s(() => e.max, (e) => e != null && (n.value = e));
		let r = m(() => e.active ? e.max : n.value), i = m(() => r.value ? `${e.value} / ${r.value}` : String(e.value));
		return E(() => d(F, {
			transition: e.transition,
			appear: !0
		}, { default: () => [f(C("div", {
			class: v([
				"v-counter",
				{ "text-error": r.value && !e.disabled && parseFloat(e.value) > parseFloat(r.value) },
				e.class
			]),
			style: g(e.style)
		}, [t.default ? t.default({
			counter: i.value,
			max: r.value,
			value: e.value
		}) : i.value]), [[h, e.active]])] })), {};
	}
}), z = e({
	floating: Boolean,
	...D()
}, "VFieldLabel"), B = u()({
	name: "VFieldLabel",
	props: z(),
	setup(e, { slots: t }) {
		return E(() => d(j, {
			class: v([
				"v-field-label",
				{ "v-field-label--floating": e.floating },
				e.class
			]),
			style: g(e.style)
		}, t)), {};
	}
}), V = [
	"underlined",
	"outlined",
	"filled",
	"solo",
	"solo-inverted",
	"solo-filled",
	"plain"
], H = e({
	appendInnerIcon: x,
	bgColor: String,
	clearable: Boolean,
	clearIcon: {
		type: x,
		default: "$clear"
	},
	active: Boolean,
	centerAffix: {
		type: Boolean,
		default: void 0
	},
	color: String,
	baseColor: String,
	dirty: Boolean,
	disabled: {
		type: Boolean,
		default: null
	},
	glow: Boolean,
	error: Boolean,
	flat: Boolean,
	iconColor: [Boolean, String],
	label: String,
	persistentClear: Boolean,
	prependInnerIcon: x,
	reverse: Boolean,
	singleLine: Boolean,
	variant: {
		type: String,
		default: "filled",
		validator: (e) => V.includes(e)
	},
	"onClick:clear": t(),
	"onClick:appendInner": t(),
	"onClick:prependInner": t(),
	...D(),
	...I(),
	...T(),
	...p()
}, "VField"), U = u()({
	name: "VField",
	inheritAttrs: !1,
	props: {
		id: String,
		details: Boolean,
		labelId: String,
		...O(),
		...H()
	},
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0
	},
	setup(e, { attrs: t, emit: u, slots: p }) {
		let { themeClasses: y } = _(e), { loaderClasses: x } = ce(e), { focusClasses: T, isFocused: D, focus: O, blur: j } = k(e), { InputIcon: M } = A(e), { roundedClasses: P, roundedStyles: F } = w(e), { rtlClasses: I } = ee(), L = m(() => e.dirty || e.active), R = m(() => !!(e.label || p.label)), z = m(() => !e.singleLine && R.value), V = a(), H = S(() => e.id || `input-${V}`), U = m(() => e.details ? `${H.value}-messages` : void 0), W = b(), G = b(), K = b(), q = S(() => ["plain", "underlined"].includes(e.variant)), J = S(() => e.error || e.disabled ? void 0 : L.value && D.value ? e.color : e.baseColor), Y = S(() => {
			if (e.iconColor === !0 || !e.iconColor && e.glow && D.value) return J.value;
			if (!(!e.iconColor || e.glow && !D.value)) return e.iconColor;
		}), { backgroundColorClasses: ue, backgroundColorStyles: de } = oe(() => e.bgColor), { textColorClasses: X, textColorStyles: Z } = se(J);
		s(L, (e) => {
			if (z.value && !n()) {
				let t = W.value.$el, n = G.value.$el;
				requestAnimationFrame(() => {
					let a = ie(t), o = new r(n), s = o.x - a.x, c = o.y - a.y - (a.height / 2 - o.height / 2), u = o.width / .75, d = Math.abs(u - a.width) > 1 ? { maxWidth: i(u) } : void 0, f = getComputedStyle(t), p = getComputedStyle(n), m = parseFloat(f.transitionDuration) * 1e3 || 150, h = parseFloat(p.getPropertyValue("--v-field-label-scale")), g = p.getPropertyValue("color");
					t.style.visibility = "visible", n.style.visibility = "hidden", ae(t, {
						transform: `translate(${s}px, ${c}px) scale(${h})`,
						color: g,
						...d
					}, {
						duration: m,
						easing: l,
						direction: e ? "normal" : "reverse"
					}).finished.then(() => {
						t.style.removeProperty("visibility"), n.style.removeProperty("visibility");
					});
				});
			}
		}, { flush: "post" });
		let Q = S(() => ({
			isActive: L,
			isFocused: D,
			controlRef: K,
			iconColor: Y,
			blur: j,
			focus: O
		})), $ = m(() => {
			let e = !L.value;
			return {
				"aria-hidden": e,
				for: e ? void 0 : H.value
			};
		}), fe = m(() => {
			let e = z.value && L.value;
			return {
				"aria-hidden": e,
				for: e ? void 0 : H.value
			};
		});
		function pe(e) {
			e.target !== ne() && e.preventDefault();
		}
		return E(() => {
			let n = e.variant === "outlined", r = !!(p["prepend-inner"] || e.prependInnerIcon), i = !!(e.clearable || p.clear) && !e.disabled, a = !!(p["append-inner"] || e.appendInnerIcon || i), s = () => p.label ? p.label({
				...Q.value,
				label: e.label,
				props: { for: H.value }
			}) : e.label;
			return C("div", c({
				class: [
					"v-field",
					{
						"v-field--active": L.value,
						"v-field--appended": a,
						"v-field--center-affix": e.centerAffix ?? !q.value,
						"v-field--disabled": e.disabled,
						"v-field--dirty": e.dirty,
						"v-field--error": e.error,
						"v-field--glow": e.glow,
						"v-field--flat": e.flat,
						"v-field--has-background": !!e.bgColor,
						"v-field--persistent-clear": e.persistentClear,
						"v-field--prepended": r,
						"v-field--reverse": e.reverse,
						"v-field--single-line": e.singleLine,
						"v-field--no-label": !s(),
						[`v-field--variant-${e.variant}`]: !0
					},
					y.value,
					ue.value,
					T.value,
					x.value,
					P.value,
					I.value,
					e.class
				],
				style: [
					de.value,
					F.value,
					e.style
				],
				onClick: pe
			}, t), [
				C("div", { class: "v-field__overlay" }, null),
				d(le, {
					name: "v-field",
					active: !!e.loading,
					color: e.error ? "error" : o(e.loading) ? e.loading : e.color
				}, { default: p.loader }),
				r && C("div", {
					key: "prepend",
					class: "v-field__prepend-inner"
				}, [p["prepend-inner"] ? p["prepend-inner"](Q.value) : e.prependInnerIcon && d(M, {
					key: "prepend-icon",
					name: "prependInner",
					color: Y.value
				}, null)]),
				C("div", {
					class: "v-field__field",
					"data-no-activator": ""
				}, [
					[
						"filled",
						"solo",
						"solo-inverted",
						"solo-filled"
					].includes(e.variant) && z.value && d(B, c({
						key: "floating-label",
						ref: G,
						class: [X.value],
						floating: !0
					}, $.value, { style: Z.value }), { default: () => [s()] }),
					R.value && d(B, c({
						key: "label",
						ref: W,
						id: e.labelId
					}, fe.value), { default: () => [s()] }),
					p.default?.({
						...Q.value,
						props: {
							id: H.value,
							class: "v-field__input",
							"aria-describedby": U.value
						},
						focus: O,
						blur: j
					}) ?? C("div", {
						id: H.value,
						class: "v-field__input",
						"aria-describedby": U.value
					}, null)
				]),
				i && d(N, { key: "clear" }, { default: () => [f(C("div", {
					class: "v-field__clearable",
					onMousedown: (e) => {
						e.preventDefault(), e.stopPropagation();
					}
				}, [d(re, { defaults: { VIcon: { icon: e.clearIcon } } }, { default: () => [p.clear ? p.clear({
					...Q.value,
					props: {
						onFocus: O,
						onBlur: j,
						onClick: e["onClick:clear"],
						tabindex: -1
					}
				}) : d(M, {
					name: "clear",
					onFocus: O,
					onBlur: j,
					tabindex: -1
				}, null)] })]), [[h, e.dirty]])] }),
				a && C("div", {
					key: "append",
					class: "v-field__append-inner"
				}, [p["append-inner"] ? p["append-inner"](Q.value) : e.appendInnerIcon && d(M, {
					key: "append-icon",
					name: "appendInner",
					color: Y.value
				}, null)]),
				C("div", {
					class: v(["v-field__outline", X.value]),
					style: g(Z.value)
				}, [n && C(te, null, [
					C("div", { class: "v-field__outline__start" }, null),
					z.value && C("div", { class: "v-field__outline__notch" }, [d(B, c({
						ref: G,
						floating: !0
					}, $.value), { default: () => [s()] })]),
					C("div", { class: "v-field__outline__end" }, null)
				]), q.value && z.value && d(B, c({
					ref: G,
					floating: !0
				}, $.value), { default: () => [s()] })])
			]);
		}), {
			controlRef: K,
			fieldIconColor: Y
		};
	}
}), W = e({ autocomplete: String }, "autocomplete");
function G(e) {
	let t = a(), n = y(0), r = m(() => e.autocomplete === "suppress"), i = m(() => {
		if (e.name) return r.value ? `${e.name}-${t}-${n.value}` : e.name;
	});
	return {
		isSuppressing: r,
		fieldAutocomplete: m(() => r.value ? "off" : e.autocomplete),
		fieldName: i,
		update: () => n.value = (/* @__PURE__ */ new Date()).getTime()
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/autofocus.js
function K(e) {
	function t(t, n) {
		if (!e.autofocus || !t) return;
		let r = n[0].target, i = r.matches("input,textarea") ? r : r.querySelector("input,textarea");
		setTimeout(() => i?.focus(), 50);
	}
	return { onIntersect: t };
}
//#endregion
export { H as a, U as i, W as n, R as o, G as r, K as t };
