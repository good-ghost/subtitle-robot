import { A as e, Bt as t, Dn as n, En as r, Gn as i, Hn as a, Ht as o, Lt as s, Q as c, T as l, V as u, Zn as d, cn as f, cr as p, dn as m, fn as h, g, pn as _, rt as v, vt as y, yn as b } from "./vuetify-DJ4bsPds.js";
import { c as x } from "./define-BG7hCbXs.js";
import { n as S, o as C, r as w } from "./VLabel-slD1mVUb.js";
import { t as T } from "./intersect-B2u7q2lh.js";
import { t as E } from "./forwardRefs-BcUquh0G.js";
import { a as D, i as O, n as k, o as A, r as j, t as M } from "./autofocus-Cd4twDZF.js";
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
}, "VTextField"), F = l()({
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
	setup(e, { attrs: l, emit: w, slots: D }) {
		let k = g(e, "modelValue", void 0, (e) => Object.is(e, -0) ? "-0" : e), { isFocused: P, focus: F, blur: I } = C(e), { onIntersect: L } = M(e), R = h(() => s(e.counterValue) ? e.counterValue(k.value) : t(e.counterValue) ? e.counterValue : (k.value ?? "").toString().length), z = h(() => {
			if (l.maxlength) return l.maxlength;
			if (e.counter && (t(e.counter) || o(e.counter))) return e.counter;
		}), B = h(() => ["plain", "underlined"].includes(e.variant)), V = d(), H = d(), U = d();
		a(() => e.type, () => void U.value?.offsetHeight, { flush: "post" });
		let W = j(e), G = h(() => N.includes(e.type) || e.persistentPlaceholder || P.value || e.active);
		function K() {
			W.isSuppressing.value && W.update(), P.value || F(), n(() => {
				U.value !== v() && U.value?.focus();
			});
		}
		function q(e) {
			w("mousedown:control", e), e.target !== U.value && (K(), e.preventDefault());
		}
		function J(e) {
			w("click:control", e);
		}
		function Y(t, r) {
			t.stopPropagation(), K(), n(() => {
				r(), u(e["onClick:clear"], t);
			});
		}
		function X(t) {
			let r = t.target;
			if (!(e.modelModifiers?.trim && [
				"text",
				"search",
				"password",
				"tel",
				"url"
			].includes(e.type))) {
				k.value = r.value;
				return;
			}
			let i = r.value, a = r.selectionStart, o = r.selectionEnd;
			k.value = i, n(() => {
				let e = 0;
				i.trimStart().length === r.value.length && (e = i.length - r.value.length), a != null && (r.selectionStart = a - e), o != null && (r.selectionEnd = o - e);
			});
		}
		return x(() => {
			let t = !!(D.counter || e.counter !== void 0), n = e.counter !== !1 && e.counter !== null && (e.persistentCounter || P.value), a = e.hideDetails !== !0 && !!(D.details || t), o = !!(D.details || t && n), [s, u] = c(l), { modelValue: d, ...h } = S.filterProps(e), g = O.filterProps(e);
			return b(S, r({
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
			}, s, h, {
				centerAffix: !B.value,
				focused: P.value,
				detailsActive: o,
				indentDetails: e.indentDetails ?? !B.value
			}), {
				...D,
				default: ({ id: t, isDisabled: n, isDirty: a, isReadonly: o, isValid: s, hasDetails: c, reset: l }) => b(O, r({
					ref: H,
					onMousedown: q,
					onClick: J,
					"onClick:clear": (e) => Y(e, l),
					role: e.role
				}, y(g, ["onClick:clear"]), {
					id: t.value,
					labelId: `${t.value}-label`,
					active: G.value || a.value,
					dirty: a.value || e.dirty,
					disabled: n.value,
					focused: P.value,
					details: c.value,
					error: s.value === !1
				}), {
					...D,
					default: ({ props: { class: a, ...s }, controlRef: c }) => {
						let l = _("input", r({
							ref: (e) => U.value = c.value = e,
							value: k.value,
							onInput: X,
							autofocus: e.autofocus,
							readonly: o.value,
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
						}, s, u), null);
						return _(f, null, [
							e.prefix && _("span", { class: "v-text-field__prefix" }, [_("span", { class: "v-text-field__prefix__text" }, [e.prefix])]),
							i(D.default ? _("div", {
								class: p(a),
								"data-no-activator": ""
							}, [D.default({ id: t }), l]) : m(l, { class: a }), [[
								T,
								L,
								null,
								{ once: !0 }
							]]),
							e.suffix && _("span", { class: "v-text-field__suffix" }, [_("span", { class: "v-text-field__suffix__text" }, [e.suffix])])
						]);
					}
				}),
				details: a ? (r) => _(f, null, [D.details?.(r), t && _(f, null, [_("span", null, null), b(A, {
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
