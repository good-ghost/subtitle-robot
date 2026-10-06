import { A as e, Bn as t, Bt as n, Dn as r, En as i, G as a, Gn as o, Hn as s, Ht as c, Lt as l, Mn as u, Pn as d, Q as f, T as p, Un as m, V as h, W as g, Zn as _, an as ee, ar as v, bn as y, cn as b, cr as x, en as S, er as C, fn as w, g as te, gn as T, kn as ne, p as E, pn as D, rt as O, sn as k, vt as A, yn as j } from "../chunks/vuetify-DJ4bsPds.js";
import { c as re, t as M } from "../chunks/define-BG7hCbXs.js";
import { n as N, o as P, r as F } from "../chunks/VLabel-slD1mVUb.js";
import { t as I } from "../chunks/hostValue-Q4jXLLiG.js";
import { t as L } from "../chunks/intersect-B2u7q2lh.js";
import { t as ie } from "../chunks/forwardRefs-BcUquh0G.js";
import { n as R } from "../chunks/formField-B1NnTyqU.js";
import { a as z, i as B, n as V, o as H, r as U, t as W } from "../chunks/autofocus-Cd4twDZF.js";
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
	...V(),
	...A(F(), ["direction"]),
	...z()
}, "VTextarea"), K = p()({
	name: "VTextarea",
	directives: { vIntersect: L },
	inheritAttrs: !1,
	props: G(),
	emits: {
		"click:control": (e) => !0,
		"mousedown:control": (e) => !0,
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:rows": (e) => !0
	},
	setup(e, { attrs: t, emit: d, slots: p }) {
		let v = te(e, "modelValue"), { isFocused: y, focus: S, blur: T } = P(e), { onIntersect: k } = W(e), A = w(() => l(e.counterValue) ? e.counterValue(v.value) : (v.value || "").toString().length), M = w(() => {
			if (t.maxlength) return t.maxlength;
			if (e.counter && (n(e.counter) || c(e.counter))) return e.counter;
		}), F = _(), I = _(), R = C(""), z = _(), V = _(0), { platform: G } = E(), K = U(e), q = w(() => e.persistentPlaceholder || y.value || e.active);
		function J() {
			K.isSuppressing.value && K.update(), z.value !== O() && z.value?.focus(), y.value || S();
		}
		function ae(e) {
			J(), d("click:control", e);
		}
		function oe(e) {
			d("mousedown:control", e);
		}
		function se(t) {
			t.stopPropagation(), J(), r(() => {
				v.value = "", h(e["onClick:clear"], t);
			});
		}
		function ce(t) {
			let n = t.target;
			if (!e.modelModifiers?.trim) {
				v.value = n.value;
				return;
			}
			let i = n.value, a = n.selectionStart, o = n.selectionEnd;
			v.value = i, r(() => {
				let e = 0;
				i.trimStart().length === n.value.length && (e = i.length - n.value.length), a != null && (n.selectionStart = a - e), o != null && (n.selectionEnd = o - e);
			});
		}
		let Y = _(), X = _(Number(e.rows)), Z = w(() => ["plain", "underlined"].includes(e.variant));
		m(() => {
			e.autoGrow || (X.value = Number(e.rows));
		});
		function Q() {
			r(() => {
				if (!z.value) return;
				if (G.value.firefox) {
					V.value = 12;
					return;
				}
				let { offsetWidth: e, clientWidth: t } = z.value;
				V.value = Math.max(0, e - t);
			}), e.autoGrow && r(() => {
				if (!Y.value || !I.value) return;
				let t = getComputedStyle(Y.value), n = getComputedStyle(I.value.$el), r = parseFloat(t.getPropertyValue("--v-field-padding-top")) + parseFloat(t.getPropertyValue("--v-input-padding-top")) + parseFloat(t.getPropertyValue("--v-field-padding-bottom")), i = Y.value.scrollHeight, o = parseFloat(t.lineHeight), s = Math.max(parseFloat(e.rows) * o + r, parseFloat(n.getPropertyValue("--v-input-control-height"))), c = e.maxHeight ? parseFloat(e.maxHeight) : parseFloat(e.maxRows) * o + r || Infinity, l = g(i ?? 0, s, c);
				X.value = Math.floor((l - r) / o), R.value = a(l);
			});
		}
		u(Q), s(v, Q), s(() => e.rows, Q), s(() => e.maxHeight, Q), s(() => e.maxRows, Q), s(() => e.density, Q), s(X, (e) => {
			d("update:rows", e);
		});
		let $;
		return s(Y, (e) => {
			e ? ($ = new ResizeObserver(Q), $.observe(Y.value)) : $?.disconnect();
		}), ne(() => {
			$?.disconnect();
		}), re(() => {
			let n = !!(p.counter || e.counter !== void 0 || e.counterValue != null), r = e.counter !== !1 && e.counter !== null && (e.persistentCounter || y.value), s = e.hideDetails !== !0 && !!(p.details || n), c = !!(p.details || n && r), [l, u] = f(t), { modelValue: d, ...m } = N.filterProps(e), h = {
				...B.filterProps(e),
				"onClick:clear": se
			};
			return j(N, i({
				ref: F,
				modelValue: v.value,
				"onUpdate:modelValue": (e) => v.value = e,
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
			}, l, m, {
				centerAffix: X.value === 1 && !Z.value,
				focused: y.value,
				detailsActive: c,
				indentDetails: e.indentDetails ?? !Z.value
			}), {
				...p,
				default: ({ id: t, isDisabled: n, isDirty: r, isReadonly: a, isValid: s, hasDetails: c }) => j(B, i({
					ref: I,
					style: { "--v-textarea-control-height": R.value },
					onClick: ae,
					onMousedown: oe,
					"onClick:prependInner": e["onClick:prependInner"],
					"onClick:appendInner": e["onClick:appendInner"]
				}, h, {
					id: t.value,
					active: q.value || r.value,
					labelId: `${t.value}-label`,
					centerAffix: X.value === 1 && !Z.value,
					dirty: r.value || e.dirty,
					disabled: n.value,
					focused: y.value,
					details: c.value,
					error: s.value === !1
				}), {
					...p,
					default: ({ props: { class: r, ...s }, controlRef: c }) => D(b, null, [
						e.prefix && D("span", { class: "v-text-field__prefix" }, [e.prefix]),
						o(D("textarea", i({
							ref: (e) => z.value = c.value = e,
							class: r,
							value: v.value,
							onInput: ce,
							autofocus: e.autofocus,
							readonly: a.value,
							disabled: n.value,
							placeholder: e.placeholder,
							rows: e.rows,
							name: K.fieldName.value,
							autocomplete: K.fieldAutocomplete.value,
							onFocus: J,
							onBlur: T,
							"aria-labelledby": `${t.value}-label`
						}, s, u), null), [[
							L,
							{ handler: k },
							null,
							{ once: !0 }
						]]),
						e.autoGrow && o(D("textarea", {
							class: x([r, "v-textarea__sizer"]),
							id: `${s.id}-sizer`,
							"onUpdate:modelValue": (e) => v.value = e,
							ref: Y,
							readonly: !0,
							"aria-hidden": "true"
						}, null), [[ee, v.value]]),
						e.suffix && D("span", { class: "v-text-field__suffix" }, [e.suffix])
					])
				}),
				details: s ? (t) => D(b, null, [p.details?.(t), n && D(b, null, [D("span", null, null), j(H, {
					active: r,
					value: A.value,
					max: M.value,
					disabled: e.disabled
				}, p.counter)])]) : void 0
			});
		}), ie({}, F, I, z);
	}
}), q = 3;
//#endregion
//#region src/entries/smartview-textarea.ts
M("smartview-textarea", /* @__PURE__ */ y({
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
			default: q,
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
		let r = e, i = n, { t: a } = S(), o = t("root"), { current: s, commit: c, reset: l } = I("value", () => r.value), u = w(() => Number.isInteger(r.rows) && r.rows > 0 ? r.rows : q), f = w(() => r.minlength !== void 0 && s.value !== "" && s.value.length < r.minlength), p = w(() => f.value ? a("smartview.inputMinLength", { min: r.minlength ?? 0 }) : ""), { formDisabled: m, touched: h } = R({
			value: () => s.value,
			isEmpty: () => s.value === "",
			required: () => r.required,
			requiredMessage: () => a("smartview.required"),
			validationError: () => p.value,
			anchor: () => o.value?.querySelector("textarea") ?? void 0,
			reset: l
		}), g = w(() => r.errorMessage ? [r.errorMessage] : h.value ? r.required && s.value === "" ? [a("smartview.required")] : p.value ? [p.value] : [] : []);
		function _(e) {
			c(e ?? ""), i("input", s.value);
		}
		return (t, n) => (d(), T("div", {
			ref_key: "root",
			ref: o,
			class: "smartview-root",
			onInput: n[1] ||= k(() => {}, ["stop"]),
			onChange: n[2] ||= k((e) => i("change", v(s)), ["stop"])
		}, [j(v(K), {
			"model-value": v(s),
			label: e.label || void 0,
			hint: e.hint || void 0,
			"persistent-hint": !!e.hint,
			"hide-details": "auto",
			"error-messages": g.value,
			placeholder: e.placeholder || void 0,
			disabled: e.disabled || v(m),
			readonly: e.readonly,
			rows: u.value,
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
			"onUpdate:modelValue": _,
			onBlur: n[0] ||= (e) => h.value = !0
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
