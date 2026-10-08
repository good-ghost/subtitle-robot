import { Bn as e, En as t, Hn as n, Jn as r, Kn as i, Nn as a, Qt as o, Sn as s, Tn as c, Xn as l, _r as u, bn as d, dr as f, en as ee, gr as te, mn as p, mr as ne, on as m, pn as re, rr as ie, tr as ae, vn as h, wn as g, xn as _, yn as v } from "../chunks/vuetify-C39-WP9g.js";
import { t as oe } from "../chunks/VSelect-DuDSSQDf.js";
import { a as se } from "../chunks/rounded-1DPtyqNn.js";
import { i as ce } from "../chunks/VOverlay-DFwN_aF6.js";
import { t as y } from "../chunks/define-BovISfN4.js";
import { t as le } from "../chunks/hostValue-CjEvr2gM.js";
import { a as b } from "../chunks/density-9WZgplEH.js";
import { t as ue } from "../chunks/VTooltip-CGIxG6WB.js";
import { t as x } from "../chunks/VBtn-CV2MWNTN.js";
import { t as S } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as de } from "../chunks/formField-CJIGaqFV.js";
import { t as fe } from "../chunks/VSwitch-I8aX_dOy.js";
import { t as C } from "../chunks/VCheckbox-CGWQ8eog.js";
import { t as w } from "../chunks/VTextField-DrXa6-zE.js";
import { t as T } from "../chunks/VCombobox-CYkGQ6L3.js";
//#region src/messages/SmartviewRepeatableRows.ts
var pe = o({
	en: {
		addRow: "Add row",
		removeRow: "Remove row"
	},
	ko: {
		addRow: "행 추가",
		removeRow: "행 삭제"
	}
});
//#endregion
//#region src/runtime/repeatableRows.ts
function E(e) {
	if (e.defaultValue !== void 0) return D(e.defaultValue);
	switch (e.type ?? "text") {
		case "number": return null;
		case "tags": return [];
		case "switch":
		case "checkbox": return !1;
		case "text":
		case "select": return "";
	}
}
function D(e) {
	return Array.isArray(e) ? e.map((e) => e) : e;
}
function O(e, t) {
	switch (e.type ?? "text") {
		case "number": return typeof t == "number" && Number.isFinite(t) ? t : null;
		case "tags": return Array.isArray(t) ? [...new Set(t.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => e.trim()))] : [];
		case "switch":
		case "checkbox": return t === !0;
		case "text":
		case "select": return typeof t == "string" ? t : typeof t == "number" ? String(t) : "";
	}
}
function k(e) {
	return Object.fromEntries(e.map((e) => [e.key, E(e)]));
}
function A(e, t, n = 0) {
	let r = t.map((t) => {
		let n = typeof t == "object" && t ? t : {};
		return Object.fromEntries(e.map((e) => [e.key, O(e, n[e.key])]));
	});
	for (; r.length < n;) r.push(k(e));
	return r;
}
function j(e) {
	return e == null ? !0 : typeof e == "string" ? e.trim() === "" : Array.isArray(e) ? e.length === 0 : !1;
}
function M(e, t) {
	for (let [n, r] of t.entries()) for (let t of e) if (t.required && j(r[t.key])) return {
		row: n,
		key: t.key
	};
	return null;
}
//#endregion
//#region src/elements/SmartviewRepeatableRows.ce.vue?vue&type=script&setup=true&lang.ts
var N = {
	key: 0,
	class: "text-title-small font-weight-bold mt-0 mb-1",
	"data-part": "heading"
}, P = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-0 mb-2",
	"data-part": "hint"
}, F = {
	key: 2,
	class: "text-body-medium text-medium-emphasis mt-0 mb-3",
	"data-part": "empty"
}, I = ["data-row"], L = { class: "smartview-row-cells" }, R = ["data-key"], z = {
	key: 3,
	class: "text-body-small text-error mt-2 mb-0",
	role: "alert",
	"data-part": "error"
}, B = 12;
//#endregion
//#region src/entries/smartview-repeatable-rows.ts
y("smartview-repeatable-rows", /* @__PURE__ */ S(/* @__PURE__ */ t({
	__name: "SmartviewRepeatableRows.ce",
	props: {
		columns: {
			default: () => [],
			type: Array
		},
		value: {
			default: () => [],
			type: Array
		},
		addText: {
			default: "",
			type: String
		},
		minRows: {
			default: 0,
			type: Number
		},
		emptyText: {
			default: "",
			type: String
		},
		layout: {
			default: "inline",
			type: String
		},
		removeIcon: {
			default: "mdi-close",
			type: String
		},
		overlayTarget: {
			default: "body",
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
	setup(t, { emit: o }) {
		let y = t, S = o, { t: E } = m();
		ee(pe);
		let { overlayDefaults: D } = ce(() => y.overlayTarget), V = i("root"), H = h(() => Number.isInteger(y.minRows) && y.minRows > 0 ? y.minRows : 0), U = 0, W = ie([]);
		function G(e) {
			W.value = e.map(() => U++);
		}
		let { current: K, commit: q, reset: me } = le("value", () => y.value, {
			normalize: (e) => A(y.columns, e, H.value),
			onHostValue: G
		});
		G(K.value), r([() => y.columns, H], ([e, t]) => {
			K.value = A(e, K.value, t), G(K.value);
		});
		let he = h(() => {
			let e = y.columns.reduce((e, t) => e + (t.span ?? 0), 0), t = y.columns.filter((e) => !e.span).length, n = t ? Math.max(1, Math.floor((B - e) / t)) : 0;
			return Object.fromEntries(y.columns.map((e) => [e.key, e.span ?? n]));
		}), J = ae(/* @__PURE__ */ new Set());
		function Y(e, t) {
			J.add(`${W.value[e]}:${t.key}`);
		}
		let { formDisabled: ge, touched: _e } = de({
			value: () => JSON.stringify(K.value),
			isEmpty: () => y.required && K.value.length === 0 || M(y.columns, K.value) !== null,
			required: () => y.required || y.columns.some((e) => e.required),
			requiredMessage: () => E("smartview.required"),
			anchor: () => {
				let e = M(y.columns, K.value);
				if (e) return V.value?.querySelector(`[data-row="${e.row}"] [data-key="${CSS.escape(e.key)}"] input:not([type="hidden"])`) ?? void 0;
			},
			reset: () => {
				J.clear(), me(), G(K.value);
			}
		}), X = h(() => y.disabled || ge.value);
		function Z(e, t) {
			return t.required && (_e.value || J.has(`${W.value[e]}:${t.key}`)) && j(K.value[e][t.key]) ? [E("smartview.required")] : [];
		}
		function ve(e) {
			return typeof e == "string" || typeof e == "number" ? String(e) : "";
		}
		function ye(e) {
			return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
		}
		function Q() {
			return K.value.map((e) => ({ ...e }));
		}
		function $(e, t, n, r) {
			let i = t.type === "number" ? n === "" || n === null ? null : Number(n) : n, a = [...K.value];
			a[e] = {
				...a[e],
				[t.key]: O(t, i)
			}, q(a), S("input", Q()), r && S("change", Q());
		}
		function be() {
			S("change", Q());
		}
		async function xe() {
			W.value = [...W.value, U++], q([...K.value, k(y.columns)]), S("input", Q()), S("change", Q()), await a(), V.value?.querySelector(`[data-row="${K.value.length - 1}"] input:not([type="hidden"])`)?.focus();
		}
		async function Se(e) {
			K.value.length <= H.value || (W.value = W.value.filter((t, n) => n !== e), q(K.value.filter((t, n) => n !== e)), S("input", Q()), S("change", Q()), await a(), (V.value?.querySelector(`[data-row="${Math.min(e, K.value.length - 1)}"] [data-part="remove"]:not([disabled])`) ?? V.value?.querySelector("[data-part=\"add\"]"))?.focus());
		}
		return (r, i) => (e(), d(f(se), { defaults: f(D) }, {
			default: l(() => [v("div", {
				ref_key: "root",
				ref: V,
				class: "smartview-root",
				onInput: i[0] ||= re(() => {}, ["stop"]),
				onChange: be
			}, [
				t.label ? (e(), s("p", N, u(t.label), 1)) : _("", !0),
				t.hint ? (e(), s("p", P, u(t.hint), 1)) : _("", !0),
				!f(K).length && t.emptyText ? (e(), s("p", F, u(t.emptyText), 1)) : _("", !0),
				(e(!0), s(p, null, n(f(K), (r, i) => (e(), s("div", {
					key: W.value[i],
					class: ne(["smartview-row", { "smartview-row--card pa-3 rounded-lg": t.layout === "card" }]),
					"data-row": i,
					"data-part": "row"
				}, [v("div", L, [(e(!0), s(p, null, n(t.columns, (t) => (e(), s("div", {
					key: t.key,
					class: "smartview-row-cell",
					style: te({ "--smartview-span": he.value[t.key] }),
					"data-key": t.key,
					"data-part": "cell"
				}, [t.type === "select" ? (e(), d(f(oe), {
					key: 0,
					"model-value": r[t.key],
					items: t.items ?? [],
					label: t.label || void 0,
					placeholder: t.placeholder || void 0,
					"prepend-inner-icon": t.icon || void 0,
					"error-messages": Z(i, t),
					disabled: X.value,
					"hide-details": "auto",
					density: "compact",
					rounded: "lg",
					"onUpdate:modelValue": (e) => $(i, t, e, !0),
					onBlur: (e) => Y(i, t)
				}, null, 8, [
					"model-value",
					"items",
					"label",
					"placeholder",
					"prepend-inner-icon",
					"error-messages",
					"disabled",
					"onUpdate:modelValue",
					"onBlur"
				])) : t.type === "tags" ? (e(), d(f(T), {
					key: 1,
					"model-value": ye(r[t.key]),
					label: t.label || void 0,
					placeholder: t.placeholder || void 0,
					"prepend-inner-icon": t.icon || void 0,
					"error-messages": Z(i, t),
					disabled: X.value,
					delimiters: [","],
					"menu-icon": "",
					"hide-no-data": "",
					multiple: "",
					chips: "",
					"closable-chips": "",
					"hide-details": "auto",
					variant: "outlined",
					density: "compact",
					rounded: "lg",
					"onUpdate:modelValue": (e) => $(i, t, e, !0),
					onBlur: (e) => Y(i, t)
				}, null, 8, [
					"model-value",
					"label",
					"placeholder",
					"prepend-inner-icon",
					"error-messages",
					"disabled",
					"onUpdate:modelValue",
					"onBlur"
				])) : t.type === "switch" ? (e(), d(f(fe), {
					key: 2,
					"model-value": r[t.key] === !0,
					label: t.label || void 0,
					disabled: X.value,
					color: "primary",
					density: "compact",
					"hide-details": "",
					"onUpdate:modelValue": (e) => $(i, t, e, !0)
				}, null, 8, [
					"model-value",
					"label",
					"disabled",
					"onUpdate:modelValue"
				])) : t.type === "checkbox" ? (e(), d(f(C), {
					key: 3,
					"model-value": r[t.key] === !0,
					label: t.label || void 0,
					disabled: X.value,
					color: "primary",
					density: "compact",
					"hide-details": "",
					"onUpdate:modelValue": (e) => $(i, t, e, !0)
				}, null, 8, [
					"model-value",
					"label",
					"disabled",
					"onUpdate:modelValue"
				])) : (e(), d(f(w), {
					key: 4,
					"model-value": ve(r[t.key]),
					type: t.type === "number" ? "number" : "text",
					label: t.label || void 0,
					placeholder: t.placeholder || void 0,
					"prepend-inner-icon": t.icon || void 0,
					"error-messages": Z(i, t),
					"aria-label": t.label ? void 0 : t.placeholder || t.key,
					"aria-required": t.required ? "true" : void 0,
					disabled: X.value,
					"hide-details": "auto",
					density: "compact",
					rounded: "lg",
					"onUpdate:modelValue": (e) => $(i, t, e, !1),
					onBlur: (e) => Y(i, t)
				}, null, 8, [
					"model-value",
					"type",
					"label",
					"placeholder",
					"prepend-inner-icon",
					"error-messages",
					"aria-label",
					"aria-required",
					"disabled",
					"onUpdate:modelValue",
					"onBlur"
				]))], 12, R))), 128))]), c(f(x), {
					icon: "",
					variant: "text",
					size: "small",
					color: "error",
					disabled: X.value || f(K).length <= H.value,
					"aria-label": f(E)("smartview.removeRow"),
					"data-part": "remove",
					onClick: (e) => Se(i)
				}, {
					default: l(() => [c(f(b), {
						size: "18",
						icon: t.removeIcon
					}, null, 8, ["icon"]), c(f(ue), {
						activator: "parent",
						location: "top"
					}, {
						default: l(() => [g(u(f(E)("smartview.removeRow")), 1)]),
						_: 1
					})]),
					_: 1
				}, 8, [
					"disabled",
					"aria-label",
					"onClick"
				])], 10, I))), 128)),
				c(f(x), {
					variant: "tonal",
					size: "small",
					rounded: "lg",
					"prepend-icon": "mdi-plus",
					disabled: X.value,
					"data-part": "add",
					onClick: xe
				}, {
					default: l(() => [g(u(t.addText || f(E)("smartview.addRow")), 1)]),
					_: 1
				}, 8, ["disabled"]),
				t.errorMessage ? (e(), s("p", z, u(t.errorMessage), 1)) : _("", !0)
			], 544)]),
			_: 1
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-row{align-items:center;gap:8px;margin-bottom:8px;display:flex}.smartview-row--card{border:1px solid rgba(var(--v-border-color), var(--v-border-opacity));margin-bottom:12px}.smartview-row-cells{flex:auto;grid-template-columns:repeat(12,minmax(0,1fr));align-items:center;gap:8px;min-width:0;display:grid;container-type:inline-size}.smartview-row-cell{grid-column:span var(--smartview-span)}@container (width<=480px){.smartview-row-cell{grid-column:span 12}}"]]]), { formAssociated: !0 });
//#endregion
