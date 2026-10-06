import { Bn as e, Dn as t, Hn as n, In as r, Pn as i, Wn as a, Yn as ee, Zn as te, ar as o, bn as s, cn as c, cr as l, dr as u, en as ne, fn as d, gn as f, hn as p, mn as m, pn as h, sn as re, ur as ie, vn as g, yn as _ } from "../chunks/vuetify-DJ4bsPds.js";
import { t as ae } from "../chunks/VSelect-tmFN_T5n.js";
import { a as oe } from "../chunks/rounded-CXkAtXly.js";
import { i as v } from "../chunks/VOverlay-BI1rs3Fd.js";
import { t as y } from "../chunks/define-BG7hCbXs.js";
import { t as se } from "../chunks/hostValue-Q4jXLLiG.js";
import { a as ce } from "../chunks/density-Dh8nVFPw.js";
import { t as le } from "../chunks/VTooltip-2jm4OuLA.js";
import { t as b } from "../chunks/VBtn-D2PPPp70.js";
import { t as x } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as S } from "../chunks/formField-B1NnTyqU.js";
import { t as C } from "../chunks/VSwitch-rcpcpGXz.js";
import { t as w } from "../chunks/VCheckbox-BrXC7zSh.js";
import { t as ue } from "../chunks/VTextField-uapT17Ep.js";
import { t as de } from "../chunks/VCombobox-BLskads3.js";
//#region src/runtime/repeatableRows.ts
function T(e) {
	if (e.defaultValue !== void 0) return E(e.defaultValue);
	switch (e.type ?? "text") {
		case "number": return null;
		case "tags": return [];
		case "switch":
		case "checkbox": return !1;
		case "text":
		case "select": return "";
	}
}
function E(e) {
	return Array.isArray(e) ? e.map((e) => e) : e;
}
function D(e, t) {
	switch (e.type ?? "text") {
		case "number": return typeof t == "number" && Number.isFinite(t) ? t : null;
		case "tags": return Array.isArray(t) ? [...new Set(t.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => e.trim()))] : [];
		case "switch":
		case "checkbox": return t === !0;
		case "text":
		case "select": return typeof t == "string" ? t : typeof t == "number" ? String(t) : "";
	}
}
function O(e) {
	return Object.fromEntries(e.map((e) => [e.key, T(e)]));
}
function k(e, t, n = 0) {
	let r = t.map((t) => {
		let n = typeof t == "object" && t ? t : {};
		return Object.fromEntries(e.map((e) => [e.key, D(e, n[e.key])]));
	});
	for (; r.length < n;) r.push(O(e));
	return r;
}
function A(e) {
	return e == null ? !0 : typeof e == "string" ? e.trim() === "" : Array.isArray(e) ? e.length === 0 : !1;
}
function j(e, t) {
	for (let [n, r] of t.entries()) for (let t of e) if (t.required && A(r[t.key])) return {
		row: n,
		key: t.key
	};
	return null;
}
//#endregion
//#region src/elements/SmartviewRepeatableRows.ce.vue?vue&type=script&setup=true&lang.ts
var M = {
	key: 0,
	class: "text-title-small font-weight-bold mt-0 mb-1",
	"data-part": "heading"
}, N = {
	key: 1,
	class: "text-body-small text-medium-emphasis mt-0 mb-2",
	"data-part": "hint"
}, P = {
	key: 2,
	class: "text-body-medium text-medium-emphasis mt-0 mb-3",
	"data-part": "empty"
}, F = ["data-row"], I = { class: "smartview-row-cells" }, L = ["data-key"], R = {
	key: 3,
	class: "text-body-small text-error mt-2 mb-0",
	role: "alert",
	"data-part": "error"
}, z = 12;
//#endregion
//#region src/entries/smartview-repeatable-rows.ts
y("smartview-repeatable-rows", /* @__PURE__ */ x(/* @__PURE__ */ s({
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
	setup(s, { emit: y }) {
		let x = s, T = y, { t: E } = ne(), { overlayDefaults: B } = v(() => x.overlayTarget), V = e("root"), H = d(() => Number.isInteger(x.minRows) && x.minRows > 0 ? x.minRows : 0), U = 0, W = te([]);
		function G(e) {
			W.value = e.map(() => U++);
		}
		let { current: K, commit: q, reset: fe } = se("value", () => x.value, {
			normalize: (e) => k(x.columns, e, H.value),
			onHostValue: G
		});
		G(K.value), n([() => x.columns, H], ([e, t]) => {
			K.value = k(e, K.value, t), G(K.value);
		});
		let pe = d(() => {
			let e = x.columns.reduce((e, t) => e + (t.span ?? 0), 0), t = x.columns.filter((e) => !e.span).length, n = t ? Math.max(1, Math.floor((z - e) / t)) : 0;
			return Object.fromEntries(x.columns.map((e) => [e.key, e.span ?? n]));
		}), J = ee(/* @__PURE__ */ new Set());
		function Y(e, t) {
			J.add(`${W.value[e]}:${t.key}`);
		}
		let { formDisabled: me, touched: he } = S({
			value: () => JSON.stringify(K.value),
			isEmpty: () => x.required && K.value.length === 0 || j(x.columns, K.value) !== null,
			required: () => x.required || x.columns.some((e) => e.required),
			requiredMessage: () => E("smartview.required"),
			anchor: () => {
				let e = j(x.columns, K.value);
				if (e) return V.value?.querySelector(`[data-row="${e.row}"] [data-key="${CSS.escape(e.key)}"] input:not([type="hidden"])`) ?? void 0;
			},
			reset: () => {
				J.clear(), fe(), G(K.value);
			}
		}), X = d(() => x.disabled || me.value);
		function Z(e, t) {
			return t.required && (he.value || J.has(`${W.value[e]}:${t.key}`)) && A(K.value[e][t.key]) ? [E("smartview.required")] : [];
		}
		function ge(e) {
			return typeof e == "string" || typeof e == "number" ? String(e) : "";
		}
		function _e(e) {
			return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
		}
		function Q() {
			return K.value.map((e) => ({ ...e }));
		}
		function $(e, t, n, r) {
			let i = t.type === "number" ? n === "" || n === null ? null : Number(n) : n, a = [...K.value];
			a[e] = {
				...a[e],
				[t.key]: D(t, i)
			}, q(a), T("input", Q()), r && T("change", Q());
		}
		function ve() {
			T("change", Q());
		}
		async function ye() {
			W.value = [...W.value, U++], q([...K.value, O(x.columns)]), T("input", Q()), T("change", Q()), await t(), V.value?.querySelector(`[data-row="${K.value.length - 1}"] input:not([type="hidden"])`)?.focus();
		}
		async function be(e) {
			K.value.length <= H.value || (W.value = W.value.filter((t, n) => n !== e), q(K.value.filter((t, n) => n !== e)), T("input", Q()), T("change", Q()), await t(), (V.value?.querySelector(`[data-row="${Math.min(e, K.value.length - 1)}"] [data-part="remove"]:not([disabled])`) ?? V.value?.querySelector("[data-part=\"add\"]"))?.focus());
		}
		return (e, t) => (i(), m(o(oe), { defaults: o(B) }, {
			default: a(() => [h("div", {
				ref_key: "root",
				ref: V,
				class: "smartview-root",
				onInput: t[0] ||= re(() => {}, ["stop"]),
				onChange: ve
			}, [
				s.label ? (i(), f("p", M, u(s.label), 1)) : p("", !0),
				s.hint ? (i(), f("p", N, u(s.hint), 1)) : p("", !0),
				!o(K).length && s.emptyText ? (i(), f("p", P, u(s.emptyText), 1)) : p("", !0),
				(i(!0), f(c, null, r(o(K), (e, t) => (i(), f("div", {
					key: W.value[t],
					class: l(["smartview-row", { "smartview-row--card pa-3 rounded-lg": s.layout === "card" }]),
					"data-row": t,
					"data-part": "row"
				}, [h("div", I, [(i(!0), f(c, null, r(s.columns, (n) => (i(), f("div", {
					key: n.key,
					class: "smartview-row-cell",
					style: ie({ "--smartview-span": pe.value[n.key] }),
					"data-key": n.key,
					"data-part": "cell"
				}, [n.type === "select" ? (i(), m(o(ae), {
					key: 0,
					"model-value": e[n.key],
					items: n.items ?? [],
					label: n.label || void 0,
					placeholder: n.placeholder || void 0,
					"prepend-inner-icon": n.icon || void 0,
					"error-messages": Z(t, n),
					disabled: X.value,
					"hide-details": "auto",
					density: "compact",
					rounded: "lg",
					"onUpdate:modelValue": (e) => $(t, n, e, !0),
					onBlur: (e) => Y(t, n)
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
				])) : n.type === "tags" ? (i(), m(o(de), {
					key: 1,
					"model-value": _e(e[n.key]),
					label: n.label || void 0,
					placeholder: n.placeholder || void 0,
					"prepend-inner-icon": n.icon || void 0,
					"error-messages": Z(t, n),
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
					"onUpdate:modelValue": (e) => $(t, n, e, !0),
					onBlur: (e) => Y(t, n)
				}, null, 8, [
					"model-value",
					"label",
					"placeholder",
					"prepend-inner-icon",
					"error-messages",
					"disabled",
					"onUpdate:modelValue",
					"onBlur"
				])) : n.type === "switch" ? (i(), m(o(C), {
					key: 2,
					"model-value": e[n.key] === !0,
					label: n.label || void 0,
					disabled: X.value,
					color: "primary",
					density: "compact",
					"hide-details": "",
					"onUpdate:modelValue": (e) => $(t, n, e, !0)
				}, null, 8, [
					"model-value",
					"label",
					"disabled",
					"onUpdate:modelValue"
				])) : n.type === "checkbox" ? (i(), m(o(w), {
					key: 3,
					"model-value": e[n.key] === !0,
					label: n.label || void 0,
					disabled: X.value,
					color: "primary",
					density: "compact",
					"hide-details": "",
					"onUpdate:modelValue": (e) => $(t, n, e, !0)
				}, null, 8, [
					"model-value",
					"label",
					"disabled",
					"onUpdate:modelValue"
				])) : (i(), m(o(ue), {
					key: 4,
					"model-value": ge(e[n.key]),
					type: n.type === "number" ? "number" : "text",
					label: n.label || void 0,
					placeholder: n.placeholder || void 0,
					"prepend-inner-icon": n.icon || void 0,
					"error-messages": Z(t, n),
					"aria-label": n.label ? void 0 : n.placeholder || n.key,
					"aria-required": n.required ? "true" : void 0,
					disabled: X.value,
					"hide-details": "auto",
					density: "compact",
					rounded: "lg",
					"onUpdate:modelValue": (e) => $(t, n, e, !1),
					onBlur: (e) => Y(t, n)
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
				]))], 12, L))), 128))]), _(o(b), {
					icon: "",
					variant: "text",
					size: "small",
					color: "error",
					disabled: X.value || o(K).length <= H.value,
					"aria-label": o(E)("smartview.removeRow"),
					"data-part": "remove",
					onClick: (e) => be(t)
				}, {
					default: a(() => [_(o(ce), {
						size: "18",
						icon: s.removeIcon
					}, null, 8, ["icon"]), _(o(le), {
						activator: "parent",
						location: "top"
					}, {
						default: a(() => [g(u(o(E)("smartview.removeRow")), 1)]),
						_: 1
					})]),
					_: 1
				}, 8, [
					"disabled",
					"aria-label",
					"onClick"
				])], 10, F))), 128)),
				_(o(b), {
					variant: "tonal",
					size: "small",
					rounded: "lg",
					"prepend-icon": "mdi-plus",
					disabled: X.value,
					"data-part": "add",
					onClick: ye
				}, {
					default: a(() => [g(u(s.addText || o(E)("smartview.addRow")), 1)]),
					_: 1
				}, 8, ["disabled"]),
				s.errorMessage ? (i(), f("p", R, u(s.errorMessage), 1)) : p("", !0)
			], 544)]),
			_: 1
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-row{align-items:center;gap:8px;margin-bottom:8px;display:flex}.smartview-row--card{border:1px solid rgba(var(--v-border-color), var(--v-border-opacity));margin-bottom:12px}.smartview-row-cells{flex:auto;grid-template-columns:repeat(12,minmax(0,1fr));align-items:center;gap:8px;min-width:0;display:grid;container-type:inline-size}.smartview-row-cell{grid-column:span var(--smartview-span)}@container (width<=480px){.smartview-row-cell{grid-column:span 12}}"]]]), { formAssociated: !0 });
//#endregion
