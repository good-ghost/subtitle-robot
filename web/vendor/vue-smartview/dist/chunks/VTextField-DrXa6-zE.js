import { A as e, Bt as t, Ht as n, Jn as r, Lt as i, Mn as a, Nn as o, Q as s, T as c, Tn as l, V as u, Zn as d, _n as f, g as p, mn as m, mr as h, rr as g, rt as _, vn as v, vt as y, yn as b } from "./vuetify-C39-WP9g.js";
import { c as x } from "./define-BovISfN4.js";
import { n as S, o as C, r as w } from "./VLabel-B80IAw5H.js";
import { t as T } from "./intersect-BDACueiR.js";
import { t as E } from "./forwardRefs-mn8VYMvs.js";
import { a as D, i as O, n as k, o as A, r as j, t as M } from "./autofocus-2dJozNqM.js";
//#region node_modules/vuetify/lib/components/VTextField/VTextField.js
var N = [
	"color",
	"file",
	"time",
	"date",
	"datetime-local",
	"week",
	"month"
], P = e({
	autofocus: Boolean,
	counter: {
		type: [
			Boolean,
			Number,
			String
		],
		default: void 0
	},
	counterValue: [Number, Function],
	prefix: String,
	placeholder: String,
	persistentPlaceholder: Boolean,
	persistentCounter: Boolean,
	suffix: String,
	role: String,
	type: {
		type: String,
		default: "text"
	},
	modelModifiers: Object,
	...k(),
	...y(w(), ["direction"]),
	...D()
}, "VTextField"), F = c()({
	name: "VTextField",
	directives: { vIntersect: T },
	inheritAttrs: !1,
	props: P(),
	emits: {
		"click:control": (e) => !0,
		"mousedown:control": (e) => !0,
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0
	},
	setup(e, { attrs: c, emit: w, slots: D }) {
		let k = p(e, "modelValue", void 0, (e) => Object.is(e, -0) ? "-0" : e), { isFocused: P, focus: F, blur: I } = C(e), { onIntersect: L } = M(e), R = v(() => i(e.counterValue) ? e.counterValue(k.value) : t(e.counterValue) ? e.counterValue : (k.value ?? "").toString().length), z = v(() => {
			if (c.maxlength) return c.maxlength;
			if (e.counter && (t(e.counter) || n(e.counter))) return e.counter;
		}), B = v(() => ["plain", "underlined"].includes(e.variant)), V = g(), H = g(), U = g();
		r(() => e.type, () => void U.value?.offsetHeight, { flush: "post" });
		let W = j(e), G = v(() => N.includes(e.type) || e.persistentPlaceholder || P.value || e.active);
		function K() {
			W.isSuppressing.value && W.update(), P.value || F(), o(() => {
				U.value !== _() && U.value?.focus();
			});
		}
		function q(e) {
			w("mousedown:control", e), e.target !== U.value && (K(), e.preventDefault());
		}
		function J(e) {
			w("click:control", e);
		}
		function Y(t, n) {
			t.stopPropagation(), K(), o(() => {
				n(), u(e["onClick:clear"], t);
			});
		}
		function X(t) {
			let n = t.target;
			if (!(e.modelModifiers?.trim && [
				"text",
				"search",
				"password",
				"tel",
				"url"
			].includes(e.type))) {
				k.value = n.value;
				return;
			}
			let r = n.value, i = n.selectionStart, a = n.selectionEnd;
			k.value = r, o(() => {
				let e = 0;
				r.trimStart().length === n.value.length && (e = r.length - n.value.length), i != null && (n.selectionStart = i - e), a != null && (n.selectionEnd = a - e);
			});
		}
		return x(() => {
			let t = !!(D.counter || e.counter !== void 0), n = e.counter !== !1 && e.counter !== null && (e.persistentCounter || P.value), r = e.hideDetails !== !0 && !!(D.details || t), i = !!(D.details || t && n), [o, u] = s(c), { modelValue: p, ...g } = S.filterProps(e), _ = O.filterProps(e);
			return l(S, a({
				ref: V,
				modelValue: k.value,
				"onUpdate:modelValue": (e) => k.value = e,
				class: [
					"v-text-field",
					{
						"v-text-field--prefixed": e.prefix,
						"v-text-field--suffixed": e.suffix,
						"v-input--plain-underlined": B.value
					},
					e.class
				],
				style: e.style
			}, o, g, {
				centerAffix: !B.value,
				focused: P.value,
				detailsActive: i,
				indentDetails: e.indentDetails ?? !B.value
			}), {
				...D,
				default: ({ id: t, isDisabled: n, isDirty: r, isReadonly: i, isValid: o, hasDetails: s, reset: c }) => l(O, a({
					ref: H,
					onMousedown: q,
					onClick: J,
					"onClick:clear": (e) => Y(e, c),
					role: e.role
				}, y(_, ["onClick:clear"]), {
					id: t.value,
					labelId: `${t.value}-label`,
					active: G.value || r.value,
					dirty: r.value || e.dirty,
					disabled: n.value,
					focused: P.value,
					details: s.value,
					error: o.value === !1
				}), {
					...D,
					default: ({ props: { class: r, ...o }, controlRef: s }) => {
						let c = b("input", a({
							ref: (e) => U.value = s.value = e,
							value: k.value,
							onInput: X,
							autofocus: e.autofocus,
							readonly: i.value,
							disabled: n.value,
							name: W.fieldName.value,
							autocomplete: W.fieldAutocomplete.value,
							placeholder: e.placeholder,
							size: 1,
							role: e.role,
							type: e.type,
							onFocus: F,
							onBlur: I,
							"aria-labelledby": `${t.value}-label`
						}, o, u), null);
						return b(m, null, [
							e.prefix && b("span", { class: "v-text-field__prefix" }, [b("span", { class: "v-text-field__prefix__text" }, [e.prefix])]),
							d(D.default ? b("div", {
								class: h(r),
								"data-no-activator": ""
							}, [D.default({ id: t }), c]) : f(c, { class: r }), [[
								T,
								L,
								null,
								{ once: !0 }
							]]),
							e.suffix && b("span", { class: "v-text-field__suffix" }, [b("span", { class: "v-text-field__suffix__text" }, [e.suffix])])
						]);
					}
				}),
				details: r ? (r) => b(m, null, [D.details?.(r), t && b(m, null, [b("span", null, null), l(A, {
					active: n,
					value: R.value,
					max: z.value,
					disabled: e.disabled
				}, D.counter)])]) : void 0
			});
		}), E({}, V, H, U);
	}
});
//#endregion
export { P as n, F as t };
