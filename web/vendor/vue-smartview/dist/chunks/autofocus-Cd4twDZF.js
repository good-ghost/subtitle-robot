import { A as e, B as t, En as n, Et as r, F as i, G as a, Gn as o, Hn as s, Ht as c, S as l, T as u, Zn as d, c as f, cn as p, cr as m, er as h, fn as g, h as _, l as v, nr as y, on as b, pn as x, rt as ee, ur as S, v as C, yn as w, zn as T } from "./vuetify-DJ4bsPds.js";
import { a as te, n as ne, t as E } from "./rounded-CXkAtXly.js";
import { n as re, t as D } from "./animation-BZ-bP6So.js";
import { a as ie, c as O, l as k, s as ae } from "./define-BG7hCbXs.js";
import { a as A, o as oe, s as se, t as j } from "./VLabel-slD1mVUb.js";
import { a as M, n as N } from "./transitions-CbTxUG_W.js";
import { n as P, t as F } from "./transition-Dl3j6lCH.js";
import { n as I, r as ce, t as le } from "./loader-3S-Ajd36.js";
//#region node_modules/vuetify/lib/components/VCounter/VCounter.js
var L = e({
	active: Boolean,
	disabled: Boolean,
	max: [Number, String],
	value: {
		type: [Number, String],
		default: 0
	},
	...k(),
	...P({ transition: { component: M } })
}, "VCounter"), R = u()({
	name: "VCounter",
	functional: !0,
	props: L(),
	setup(e, { slots: t }) {
		let n = h(e.max);
		s(() => e.max, (e) => e != null && (n.value = e));
		let r = y(() => e.active ? e.max : n.value), i = y(() => r.value ? `${e.value} / ${r.value}` : String(e.value));
		return O(() => w(F, {
			transition: e.transition,
			appear: !0
		}, { default: () => [o(x("div", {
			class: m([
				"v-counter",
				{ "text-error": r.value && !e.disabled && parseFloat(e.value) > parseFloat(r.value) },
				e.class
			]),
			style: S(e.style)
		}, [t.default ? t.default({
			counter: i.value,
			max: r.value,
			value: e.value
		}) : i.value]), [[b, e.active]])] })), {};
	}
}), z = e({
	floating: Boolean,
	...k()
}, "VFieldLabel"), B = u()({
	name: "VFieldLabel",
	props: z(),
	setup(e, { slots: t }) {
		return O(() => w(j, {
			class: m([
				"v-field-label",
				{ "v-field-label--floating": e.floating },
				e.class
			]),
			style: S(e.style)
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
	appendInnerIcon: C,
	bgColor: String,
	clearable: Boolean,
	clearIcon: {
		type: C,
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
	prependInnerIcon: C,
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
	...k(),
	...I(),
	...E(),
	...f()
}, "VField"), U = u()({
	name: "VField",
	inheritAttrs: !1,
	props: {
		id: String,
		details: Boolean,
		labelId: String,
		...A(),
		...H()
	},
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0
	},
	setup(e, { attrs: t, emit: u, slots: f }) {
		let { themeClasses: h } = v(e), { loaderClasses: C } = ce(e), { focusClasses: E, isFocused: k, focus: A, blur: j } = oe(e), { InputIcon: M } = se(e), { roundedClasses: P, roundedStyles: F } = ne(e), { rtlClasses: I } = _(), L = y(() => e.dirty || e.active), R = y(() => !!(e.label || f.label)), z = y(() => !e.singleLine && R.value), V = T(), H = g(() => e.id || `input-${V}`), U = y(() => e.details ? `${H.value}-messages` : void 0), W = d(), G = d(), K = d(), q = g(() => ["plain", "underlined"].includes(e.variant)), J = g(() => e.error || e.disabled ? void 0 : L.value && k.value ? e.color : e.baseColor), Y = g(() => {
			if (e.iconColor === !0 || !e.iconColor && e.glow && k.value) return J.value;
			if (!(!e.iconColor || e.glow && !k.value)) return e.iconColor;
		}), { backgroundColorClasses: ue, backgroundColorStyles: de } = ie(() => e.bgColor), { textColorClasses: X, textColorStyles: Z } = ae(J);
		s(L, (e) => {
			if (z.value && !r()) {
				let t = W.value.$el, n = G.value.$el;
				requestAnimationFrame(() => {
					let r = re(t), o = new i(n), s = o.x - r.x, c = o.y - r.y - (r.height / 2 - o.height / 2), u = o.width / .75, d = Math.abs(u - r.width) > 1 ? { maxWidth: a(u) } : void 0, f = getComputedStyle(t), p = getComputedStyle(n), m = parseFloat(f.transitionDuration) * 1e3 || 150, h = parseFloat(p.getPropertyValue("--v-field-label-scale")), g = p.getPropertyValue("color");
					t.style.visibility = "visible", n.style.visibility = "hidden", D(t, {
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
		let Q = g(() => ({
			isActive: L,
			isFocused: k,
			controlRef: K,
			iconColor: Y,
			blur: j,
			focus: A
		})), $ = y(() => {
			let e = !L.value;
			return {
				"aria-hidden": e,
				for: e ? void 0 : H.value
			};
		}), fe = y(() => {
			let e = z.value && L.value;
			return {
				"aria-hidden": e,
				for: e ? void 0 : H.value
			};
		});
		function pe(e) {
			e.target !== ee() && e.preventDefault();
		}
		return O(() => {
			let r = e.variant === "outlined", i = !!(f["prepend-inner"] || e.prependInnerIcon), a = !!(e.clearable || f.clear) && !e.disabled, s = !!(f["append-inner"] || e.appendInnerIcon || a), l = () => f.label ? f.label({
				...Q.value,
				label: e.label,
				props: { for: H.value }
			}) : e.label;
			return x("div", n({
				class: [
					"v-field",
					{
						"v-field--active": L.value,
						"v-field--appended": s,
						"v-field--center-affix": e.centerAffix ?? !q.value,
						"v-field--disabled": e.disabled,
						"v-field--dirty": e.dirty,
						"v-field--error": e.error,
						"v-field--glow": e.glow,
						"v-field--flat": e.flat,
						"v-field--has-background": !!e.bgColor,
						"v-field--persistent-clear": e.persistentClear,
						"v-field--prepended": i,
						"v-field--reverse": e.reverse,
						"v-field--single-line": e.singleLine,
						"v-field--no-label": !l(),
						[`v-field--variant-${e.variant}`]: !0
					},
					h.value,
					ue.value,
					E.value,
					C.value,
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
				x("div", { class: "v-field__overlay" }, null),
				w(le, {
					name: "v-field",
					active: !!e.loading,
					color: e.error ? "error" : c(e.loading) ? e.loading : e.color
				}, { default: f.loader }),
				i && x("div", {
					key: "prepend",
					class: "v-field__prepend-inner"
				}, [f["prepend-inner"] ? f["prepend-inner"](Q.value) : e.prependInnerIcon && w(M, {
					key: "prepend-icon",
					name: "prependInner",
					color: Y.value
				}, null)]),
				x("div", {
					class: "v-field__field",
					"data-no-activator": ""
				}, [
					[
						"filled",
						"solo",
						"solo-inverted",
						"solo-filled"
					].includes(e.variant) && z.value && w(B, n({
						key: "floating-label",
						ref: G,
						class: [X.value],
						floating: !0
					}, $.value, { style: Z.value }), { default: () => [l()] }),
					R.value && w(B, n({
						key: "label",
						ref: W,
						id: e.labelId
					}, fe.value), { default: () => [l()] }),
					f.default?.({
						...Q.value,
						props: {
							id: H.value,
							class: "v-field__input",
							"aria-describedby": U.value
						},
						focus: A,
						blur: j
					}) ?? x("div", {
						id: H.value,
						class: "v-field__input",
						"aria-describedby": U.value
					}, null)
				]),
				a && w(N, { key: "clear" }, { default: () => [o(x("div", {
					class: "v-field__clearable",
					onMousedown: (e) => {
						e.preventDefault(), e.stopPropagation();
					}
				}, [w(te, { defaults: { VIcon: { icon: e.clearIcon } } }, { default: () => [f.clear ? f.clear({
					...Q.value,
					props: {
						onFocus: A,
						onBlur: j,
						onClick: e["onClick:clear"],
						tabindex: -1
					}
				}) : w(M, {
					name: "clear",
					onFocus: A,
					onBlur: j,
					tabindex: -1
				}, null)] })]), [[b, e.dirty]])] }),
				s && x("div", {
					key: "append",
					class: "v-field__append-inner"
				}, [f["append-inner"] ? f["append-inner"](Q.value) : e.appendInnerIcon && w(M, {
					key: "append-icon",
					name: "appendInner",
					color: Y.value
				}, null)]),
				x("div", {
					class: m(["v-field__outline", X.value]),
					style: S(Z.value)
				}, [r && x(p, null, [
					x("div", { class: "v-field__outline__start" }, null),
					z.value && x("div", { class: "v-field__outline__notch" }, [w(B, n({
						ref: G,
						floating: !0
					}, $.value), { default: () => [l()] })]),
					x("div", { class: "v-field__outline__end" }, null)
				]), q.value && z.value && w(B, n({
					ref: G,
					floating: !0
				}, $.value), { default: () => [l()] })])
			]);
		}), {
			controlRef: K,
			fieldIconColor: Y
		};
	}
}), W = e({ autocomplete: String }, "autocomplete");
function G(e) {
	let t = T(), n = h(0), r = y(() => e.autocomplete === "suppress"), i = y(() => {
		if (e.name) return r.value ? `${e.name}-${t}-${n.value}` : e.name;
	});
	return {
		isSuppressing: r,
		fieldAutocomplete: y(() => r.value ? "off" : e.autocomplete),
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
