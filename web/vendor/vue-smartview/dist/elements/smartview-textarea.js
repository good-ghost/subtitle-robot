import { A as e, Bn as t, Bt as n, En as r, Fn as i, G as a, Ht as o, Jn as s, Kn as c, Lt as l, Mn as u, Nn as d, Q as f, Qt as p, Rn as m, Sn as h, T as g, Tn as _, V as v, W as y, Yn as ee, Zn as b, dn as te, dr as x, en as S, g as C, mn as w, mr as T, on as E, or as D, p as ne, pn as O, rr as k, rt as re, vn as A, vt as j, yn as M } from "../chunks/vuetify-C39-WP9g.js";
import { c as N, t as P } from "../chunks/define-BovISfN4.js";
import { n as F, o as I, r as L } from "../chunks/VLabel-B80IAw5H.js";
import { t as R } from "../chunks/hostValue-CjEvr2gM.js";
import { t as z } from "../chunks/intersect-BDACueiR.js";
import { t as B } from "../chunks/forwardRefs-mn8VYMvs.js";
import { n as V } from "../chunks/formField-CJIGaqFV.js";
import { a as H, i as U, n as W, o as ie, r as ae, t as oe } from "../chunks/autofocus-2dJozNqM.js";
//#region node_modules/vuetify/lib/components/VTextarea/VTextarea.js
var G = e({
	autoGrow: Boolean,
	autofocus: Boolean,
	counter: {
		type: [
			Boolean,
			Number,
			String
		],
		default: void 0
	},
	counterValue: Function,
	prefix: String,
	placeholder: String,
	persistentPlaceholder: Boolean,
	persistentCounter: Boolean,
	noResize: Boolean,
	rows: {
		type: [Number, String],
		default: 5,
		validator: (e) => !isNaN(parseFloat(e))
	},
	maxHeight: {
		type: [Number, String],
		validator: (e) => !isNaN(parseFloat(e))
	},
	maxRows: {
		type: [Number, String],
		validator: (e) => !isNaN(parseFloat(e))
	},
	suffix: String,
	modelModifiers: Object,
	...W(),
	...j(L(), ["direction"]),
	...H()
}, "VTextarea"), K = g()({
	name: "VTextarea",
	directives: { vIntersect: z },
	inheritAttrs: !1,
	props: G(),
	emits: {
		"click:control": (e) => !0,
		"mousedown:control": (e) => !0,
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:rows": (e) => !0
	},
	setup(e, { attrs: t, emit: r, slots: c }) {
		let p = C(e, "modelValue"), { isFocused: h, focus: g, blur: x } = I(e), { onIntersect: S } = oe(e), E = A(() => l(e.counterValue) ? e.counterValue(p.value) : (p.value || "").toString().length), O = A(() => {
			if (t.maxlength) return t.maxlength;
			if (e.counter && (n(e.counter) || o(e.counter))) return e.counter;
		}), j = k(), P = k(), L = D(""), R = k(), V = k(0), { platform: H } = ne(), W = ae(e), G = A(() => e.persistentPlaceholder || h.value || e.active);
		function K() {
			W.isSuppressing.value && W.update(), R.value !== re() && R.value?.focus(), h.value || g();
		}
		function q(e) {
			K(), r("click:control", e);
		}
		function J(e) {
			r("mousedown:control", e);
		}
		function se(t) {
			t.stopPropagation(), K(), d(() => {
				p.value = "", v(e["onClick:clear"], t);
			});
		}
		function ce(t) {
			let n = t.target;
			if (!e.modelModifiers?.trim) {
				p.value = n.value;
				return;
			}
			let r = n.value, i = n.selectionStart, a = n.selectionEnd;
			p.value = r, d(() => {
				let e = 0;
				r.trimStart().length === n.value.length && (e = r.length - n.value.length), i != null && (n.selectionStart = i - e), a != null && (n.selectionEnd = a - e);
			});
		}
		let Y = k(), X = k(Number(e.rows)), Z = A(() => ["plain", "underlined"].includes(e.variant));
		ee(() => {
			e.autoGrow || (X.value = Number(e.rows));
		});
		function Q() {
			d(() => {
				if (!R.value) return;
				if (H.value.firefox) {
					V.value = 12;
					return;
				}
				let { offsetWidth: e, clientWidth: t } = R.value;
				V.value = Math.max(0, e - t);
			}), e.autoGrow && d(() => {
				if (!Y.value || !P.value) return;
				let t = getComputedStyle(Y.value), n = getComputedStyle(P.value.$el), r = parseFloat(t.getPropertyValue("--v-field-padding-top")) + parseFloat(t.getPropertyValue("--v-input-padding-top")) + parseFloat(t.getPropertyValue("--v-field-padding-bottom")), i = Y.value.scrollHeight, o = parseFloat(t.lineHeight), s = Math.max(parseFloat(e.rows) * o + r, parseFloat(n.getPropertyValue("--v-input-control-height"))), c = e.maxHeight ? parseFloat(e.maxHeight) : parseFloat(e.maxRows) * o + r || Infinity, l = y(i ?? 0, s, c);
				X.value = Math.floor((l - r) / o), L.value = a(l);
			});
		}
		m(Q), s(p, Q), s(() => e.rows, Q), s(() => e.maxHeight, Q), s(() => e.maxRows, Q), s(() => e.density, Q), s(X, (e) => {
			r("update:rows", e);
		});
		let $;
		return s(Y, (e) => {
			e ? ($ = new ResizeObserver(Q), $.observe(Y.value)) : $?.disconnect();
		}), i(() => {
			$?.disconnect();
		}), N(() => {
			let n = !!(c.counter || e.counter !== void 0 || e.counterValue != null), r = e.counter !== !1 && e.counter !== null && (e.persistentCounter || h.value), i = e.hideDetails !== !0 && !!(c.details || n), o = !!(c.details || n && r), [s, l] = f(t), { modelValue: d, ...m } = F.filterProps(e), g = {
				...U.filterProps(e),
				"onClick:clear": se
			};
			return _(F, u({
				ref: j,
				modelValue: p.value,
				"onUpdate:modelValue": (e) => p.value = e,
				class: [
					"v-textarea v-text-field",
					{
						"v-textarea--prefixed": e.prefix,
						"v-textarea--suffixed": e.suffix,
						"v-text-field--prefixed": e.prefix,
						"v-text-field--suffixed": e.suffix,
						"v-textarea--auto-grow": e.autoGrow,
						"v-textarea--no-resize": e.noResize || e.autoGrow,
						"v-input--plain-underlined": Z.value
					},
					e.class
				],
				style: [{
					"--v-textarea-max-height": e.maxHeight ? a(e.maxHeight) : void 0,
					"--v-textarea-scroll-bar-width": a(V.value)
				}, e.style]
			}, s, m, {
				centerAffix: X.value === 1 && !Z.value,
				focused: h.value,
				detailsActive: o,
				indentDetails: e.indentDetails ?? !Z.value
			}), {
				...c,
				default: ({ id: t, isDisabled: n, isDirty: r, isReadonly: i, isValid: a, hasDetails: o }) => _(U, u({
					ref: P,
					style: { "--v-textarea-control-height": L.value },
					onClick: q,
					onMousedown: J,
					"onClick:prependInner": e["onClick:prependInner"],
					"onClick:appendInner": e["onClick:appendInner"]
				}, g, {
					id: t.value,
					active: G.value || r.value,
					labelId: `${t.value}-label`,
					centerAffix: X.value === 1 && !Z.value,
					dirty: r.value || e.dirty,
					disabled: n.value,
					focused: h.value,
					details: o.value,
					error: a.value === !1
				}), {
					...c,
					default: ({ props: { class: r, ...a }, controlRef: o }) => M(w, null, [
						e.prefix && M("span", { class: "v-text-field__prefix" }, [e.prefix]),
						b(M("textarea", u({
							ref: (e) => R.value = o.value = e,
							class: r,
							value: p.value,
							onInput: ce,
							autofocus: e.autofocus,
							readonly: i.value,
							disabled: n.value,
							placeholder: e.placeholder,
							rows: e.rows,
							name: W.fieldName.value,
							autocomplete: W.fieldAutocomplete.value,
							onFocus: K,
							onBlur: x,
							"aria-labelledby": `${t.value}-label`
						}, a, l), null), [[
							z,
							{ handler: S },
							null,
							{ once: !0 }
						]]),
						e.autoGrow && b(M("textarea", {
							class: T([r, "v-textarea__sizer"]),
							id: `${a.id}-sizer`,
							"onUpdate:modelValue": (e) => p.value = e,
							ref: Y,
							readonly: !0,
							"aria-hidden": "true"
						}, null), [[te, p.value]]),
						e.suffix && M("span", { class: "v-text-field__suffix" }, [e.suffix])
					])
				}),
				details: i ? (t) => M(w, null, [c.details?.(t), n && M(w, null, [M("span", null, null), _(ie, {
					active: r,
					value: E.value,
					max: O.value,
					disabled: e.disabled
				}, c.counter)])]) : void 0
			});
		}), B({}, j, P, R);
	}
}), q = p({
	en: { inputMinLength: "Enter at least {min} characters" },
	ko: { inputMinLength: "{min}자 이상 입력하세요" }
}), J = 3;
//#endregion
//#region src/entries/smartview-textarea.ts
P("smartview-textarea", /* @__PURE__ */ r({
	__name: "SmartviewTextarea.ce",
	props: {
		value: {
			default: "",
			type: String
		},
		placeholder: {
			default: "",
			type: String
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		rows: {
			default: J,
			type: Number
		},
		autoGrow: {
			type: Boolean,
			default: !1
		},
		maxlength: { type: Number },
		minlength: { type: Number },
		icon: {
			default: "",
			type: String
		},
		density: {
			default: "comfortable",
			type: String
		},
		label: {
			default: "",
			type: String
		},
		hint: {
			default: "",
			type: String
		},
		errorMessage: {
			default: "",
			type: String
		},
		required: {
			type: Boolean,
			default: !1
		},
		disabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["input", "change"],
	setup(e, { emit: n }) {
		let r = e, i = n, { t: a } = E();
		S(q);
		let o = c("root"), { current: s, commit: l, reset: u } = R("value", () => r.value), d = A(() => Number.isInteger(r.rows) && r.rows > 0 ? r.rows : J), f = A(() => r.minlength !== void 0 && s.value !== "" && s.value.length < r.minlength), p = A(() => f.value ? a("smartview.inputMinLength", { min: r.minlength ?? 0 }) : ""), { formDisabled: m, touched: g } = V({
			value: () => s.value,
			isEmpty: () => s.value === "",
			required: () => r.required,
			requiredMessage: () => a("smartview.required"),
			validationError: () => p.value,
			anchor: () => o.value?.querySelector("textarea") ?? void 0,
			reset: u
		}), v = A(() => r.errorMessage ? [r.errorMessage] : g.value ? r.required && s.value === "" ? [a("smartview.required")] : p.value ? [p.value] : [] : []);
		function y(e) {
			l(e ?? ""), i("input", s.value);
		}
		return (n, r) => (t(), h("div", {
			ref_key: "root",
			ref: o,
			class: "smartview-root",
			onInput: r[1] ||= O(() => {}, ["stop"]),
			onChange: r[2] ||= O((e) => i("change", x(s)), ["stop"])
		}, [_(x(K), {
			"model-value": x(s),
			label: e.label || void 0,
			hint: e.hint || void 0,
			"persistent-hint": !!e.hint,
			"hide-details": "auto",
			"error-messages": v.value,
			placeholder: e.placeholder || void 0,
			disabled: e.disabled || x(m),
			readonly: e.readonly,
			rows: d.value,
			"auto-grow": e.autoGrow,
			maxlength: e.maxlength,
			counter: e.maxlength,
			"persistent-counter": !!e.maxlength,
			"prepend-inner-icon": e.icon || void 0,
			density: e.density,
			"aria-required": e.required ? "true" : void 0,
			variant: "outlined",
			rounded: "lg",
			"data-part": "field",
			"onUpdate:modelValue": y,
			onBlur: r[0] ||= (e) => g.value = !0
		}, null, 8, [
			"model-value",
			"label",
			"hint",
			"persistent-hint",
			"error-messages",
			"placeholder",
			"disabled",
			"readonly",
			"rows",
			"auto-grow",
			"maxlength",
			"counter",
			"persistent-counter",
			"prepend-inner-icon",
			"density",
			"aria-required"
		])], 544));
	}
}), { formAssociated: !0 });
//#endregion
