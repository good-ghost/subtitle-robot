import { A as e, Bn as t, Bt as n, Dn as r, E as i, En as a, H as o, Hn as s, Lt as c, Pn as l, Rn as u, T as d, Tt as f, U as p, Wn as m, Y as ee, Zn as h, _t as te, ar as g, bn as _, cn as v, cr as ne, en as y, er as b, fn as x, g as S, lt as re, m as ie, mn as C, nr as ae, pn as w, rt as oe, sn as T, ur as se, ut as ce, vn as le, vt as E, wt as ue, yn as D } from "../chunks/vuetify-DJ4bsPds.js";
import { a as de, c as fe, d as pe, f as me, i as O, l as he, m as ge, n as k, o as _e, p as ve, r as ye, s as be, t as A, u as xe } from "../chunks/VSelect-tmFN_T5n.js";
import { a as j } from "../chunks/rounded-CXkAtXly.js";
import { i as M } from "../chunks/VOverlay-BI1rs3Fd.js";
import { c as Se, s as Ce, t as N } from "../chunks/define-BG7hCbXs.js";
import { n as P } from "../chunks/ripple-B14E6MmL.js";
import { a as we, i as Te, o as F, t as Ee } from "../chunks/VList-BOnRbwg2.js";
import { i as De, s as Oe } from "../chunks/VLabel-slD1mVUb.js";
import { t as ke } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as Ae } from "../chunks/ssrBoot-BMVtmVZ_.js";
import { a as je } from "../chunks/density-Dh8nVFPw.js";
import { t as Me } from "../chunks/VAvatar-B5evLdR9.js";
import { o as Ne } from "../chunks/router-BNmKTwUJ.js";
import { t as Pe } from "../chunks/forwardRefs-BcUquh0G.js";
import { t as Fe } from "../chunks/VChip-Dqfk0_yh.js";
import { n as Ie } from "../chunks/formField-B1NnTyqU.js";
import { t as Le } from "../chunks/VCheckboxBtn-BD1XFHaj.js";
import { n as Re, t as I } from "../chunks/VTextField-uapT17Ep.js";
//#region node_modules/vuetify/lib/components/VAutocomplete/VAutocomplete.js
var L = e({
	autoSelectFirst: { type: [Boolean, String] },
	clearOnSelect: Boolean,
	search: String,
	closeOnInputClick: Boolean,
	...O({ filterKeys: ["title"] }),
	...k(),
	...E(Re({
		modelValue: null,
		role: "combobox"
	}), ["validationValue", "dirty"])
}, "VAutocomplete"), R = d()({
	name: "VAutocomplete",
	props: L(),
	emits: {
		"update:focused": (e) => !0,
		"update:search": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:menu": (e) => !0,
		"item:added": (e) => !0,
		"item:removed": (e) => !0
	},
	setup(e, { emit: t, slots: l }) {
		let { t: u } = ie(), { elevationClasses: d } = Ne(ae(() => e.menuElevation)), m = h(), g = h(), _ = h(), y = h(), C = h(), T = h(), E = b(!1), O = b(!0), k = b(!1), A = b(-1), M = b(null), { items: N, transformIn: ke, transformOut: Ie } = Te(e), { autofill: Re, resetAutofill: L } = xe(N, (e) => $(e)), { textColorClasses: R, textColorStyles: z } = Ce(() => m.value?.color), { InputIcon: B } = Oe(e), V = S(e, "search", ""), H = S(e, "modelValue", [], (e) => ke(e === null ? [null] : ue(e)), (t) => {
			let n = Ie(t);
			return e.multiple ? n : n[0] ?? null;
		}), ze = x(() => c(e.counterValue) ? e.counterValue(H.value) : n(e.counterValue) ? e.counterValue : H.value.length), U = De(e), { filteredItems: W, getMatches: Be } = de(e, N, () => M.value ?? (O.value ? "" : V.value)), G = x(() => e.hideSelected && M.value === null ? W.value.filter((e) => !H.value.some((t) => t.value === e.value)) : W.value), K = ae(() => e.closableChips && !U.isReadonly.value && !U.isDisabled.value), Ve = i("VChip"), q = x(() => !!(e.chips || l.chip)), J = x(() => q.value || !!l.selection), He = x(() => e.multiple || J.value ? "" : String(H.value.at(-1)?.props.title ?? "")), Ue = x(() => H.value.map((e) => e.props.value)), Y = x(() => G.value.find((e) => e.type === "item" && !e.props.disabled)), X = x(() => (e.autoSelectFirst === !0 || e.autoSelectFirst === "exact" && V.value === Y.value?.title) && G.value.length > 0 && !O.value && !k.value), Z = x(() => e.hideNoData && !G.value.length || U.isReadonly.value || U.isDisabled.value), { menu: Q, closeOnSelect: We } = be(e, {
			vMenuRef: g,
			menuDisabled: Z,
			isFocused: E
		}), { menuId: Ge, ariaExpanded: Ke, ariaControls: qe } = ye(e, Q), { listEvents: Je, onActivatorKeydown: Ye, setPendingFocus: Xe, flushPendingFocus: Ze } = fe(_, m, T, G, {
			selectedIndex: () => O.value ? ct() : -1,
			headerEl: () => y.value,
			menuContentEl: () => g.value?.contentEl,
			noAutoScroll: () => e.noAutoScroll
		}), Qe = he(Q, () => g.value?.contentEl, () => m.value?.controlRef), { onTabKeydown: $e } = _e({
			groups: [
				{
					type: "element",
					contentRef: y
				},
				{
					type: "list",
					contentRef: _,
					displayItemsCount: () => G.value.length
				},
				{
					type: "element",
					contentRef: C
				}
			],
			onLeave: () => {
				Q.value = !1, m.value?.focus();
			}
		});
		function et(t) {
			e.openOnClear && (Q.value = !0), V.value = "";
		}
		function tt() {
			Z.value || (Q.value = !e.closeOnInputClick || !Q.value);
		}
		function nt(e) {
			Z.value || E.value && (e.preventDefault(), e.stopPropagation(), Q.value = !Q.value);
		}
		function rt(e) {
			e.key === "Tab" && $e(e), _.value?.$el.contains(e.target) && (p(e) || e.key === "Backspace") && m.value?.focus();
		}
		function it(e) {
			if (!(ce(e) || U.isReadonly.value)) switch (e.key) {
				case "Escape":
					Q.value = !1;
					break;
				case "ArrowDown":
				case "ArrowUp":
					if (e.preventDefault(), Ye(e, Q)) break;
					e.key === "ArrowDown" && X.value && _.value?.focus("next");
					break;
				case "Enter":
					e.preventDefault(), Q.value = !0, at();
					break;
				case "Tab":
					at(), Q.value = !1;
					break;
				default: ot(e);
			}
		}
		function at() {
			let e = Y.value;
			X.value && e && (H.value.some(({ value: t }) => t === e.value) || $(e));
		}
		function ot(t) {
			let n = H.value.length;
			if (["Backspace", "Delete"].includes(t.key)) {
				if (!e.multiple && J.value && n > 0 && !V.value) {
					$(H.value[0], !1);
					return;
				}
				if (~A.value) {
					t.preventDefault();
					let e = A.value;
					$(H.value[A.value], !1), A.value = e >= n - 1 ? n - 2 : e;
				} else t.key === "Backspace" && !V.value && (A.value = n - 1);
				return;
			}
			if (e.multiple) {
				if (t.key === "ArrowLeft") {
					if (A.value < 0 && (m.value?.selectionStart ?? 0) > 0) return;
					let e = A.value > -1 ? A.value - 1 : n - 1;
					if (H.value[e]) A.value = e;
					else {
						let e = V.value?.length ?? null;
						A.value = -1, m.value?.setSelectionRange(e, e);
					}
				} else if (t.key === "ArrowRight") {
					if (A.value < 0) return;
					let e = A.value + 1;
					H.value[e] ? A.value = e : (A.value = -1, m.value?.setSelectionRange(0, 0));
				} else ~A.value && p(t) && (A.value = -1);
			}
		}
		function st(e) {
			re(e) && Re(e.target.value);
		}
		function ct() {
			return G.value.findIndex((t) => H.value.some((n) => (e.valueComparator || P)(n.value, t.value)));
		}
		function lt() {
			e.eager && T.value?.calculateVisibleItems(), Ze();
		}
		function ut() {
			E.value && (g.value?.contentEl?._clickOutside?.lastMousedownWasOutside ? E.value = !1 : (O.value = !0, m.value?.focus())), M.value = null;
		}
		function dt(e) {
			E.value = !0, setTimeout(() => {
				k.value = !0;
			});
		}
		function ft(e) {
			if (k.value = !1, !m.value?.$el.contains(e.relatedTarget)) {
				if (Qe(e)) return;
				E.value = !1;
			}
		}
		function pt(n) {
			if (n == null || n === "" && !e.multiple && !J.value) {
				for (let e of H.value) t("item:removed", e);
				H.value = [];
			}
		}
		let mt = 0;
		function ht() {
			mt = performance.now();
		}
		function gt(e) {
			let t = e.relatedTarget;
			((g.value?.contentEl)?.contains(t) || !t && performance.now() - mt < 10) && (E.value = !0);
		}
		function $(n, i = !0) {
			if (!n || n.props.disabled) return;
			let a = e.valueComparator || P;
			if (e.multiple) {
				let r = H.value.findIndex((e) => a(e.value, n.value)), o = i ?? !~r;
				if (~r) {
					let e = o ? [...H.value, n] : [...H.value], [i] = e.splice(r, 1);
					o || t("item:removed", i), H.value = e;
				} else o && (t("item:added", n), H.value = [...H.value, n]);
				e.clearOnSelect && (V.value = "");
			} else {
				let e = i !== !1, o = H.value[0];
				e ? (o && !a(o.value, n.value) ? (t("item:removed", o), t("item:added", n)) : o || t("item:added", n), H.value = [n]) : (o && t("item:removed", o), H.value = []), M.value = O.value ? "" : V.value ?? "", V.value = e && !J.value ? n.title : "", r(() => {
					We(), O.value = !0;
				});
			}
		}
		return s(E, (n, r) => {
			if (n !== r) {
				if (n) L(), O.value = !0;
				else {
					if (!e.multiple && V.value == null) {
						for (let e of H.value) t("item:removed", e);
						H.value = [];
					}
					Q.value = !1, !O.value && V.value && (M.value = V.value), V.value = He.value, O.value = !0, A.value = -1;
				}
			}
		}), s(He, (e) => {
			E.value || (V.value = e);
		}, { immediate: !0 }), s(V, (e) => {
			E.value && (e && (Q.value = !0), O.value = !e, Q.value && r(() => {
				T.value?.scrollToIndex(0), _.value?.$el?.contains(oe()) && m.value?.focus();
			}));
		}), s(Q, (t) => {
			if (t || Xe(null), !e.hideSelected && t && H.value.length && O.value) {
				let t = ct();
				f && !e.noAutoScroll && window.requestAnimationFrame(() => {
					t >= 0 && T.value?.scrollToIndex(t, "center");
				});
			}
			t && (M.value = null);
		}), s(N, (e, t) => {
			Q.value || E.value && !t.length && e.length && (Q.value = !0);
		}), Se(() => {
			let t = !!(!e.hideNoData || G.value.length || l["prepend-item"] || l["append-item"] || l["no-data"]), n = H.value.length > 0, r = I.filterProps(e), i = {
				search: V,
				filteredItems: W.value
			};
			return D(I, a({ ref: m }, r, {
				form: e.autocomplete === "suppress" ? "" : void 0,
				name: e.autocomplete === "suppress" ? e.name : void 0,
				modelValue: V.value,
				"onUpdate:modelValue": [(e) => V.value = e, pt],
				focused: E.value,
				"onUpdate:focused": (e) => E.value = e,
				validationValue: H.externalValue,
				counterValue: ze.value,
				dirty: n,
				onChange: st,
				class: [
					"v-autocomplete",
					`v-autocomplete--${e.multiple ? "multiple" : "single"}`,
					{
						"v-autocomplete--active-menu": Q.value,
						"v-autocomplete--chips": !!e.chips,
						"v-autocomplete--selection-slot": !!J.value,
						"v-autocomplete--selecting-index": A.value > -1
					},
					e.class
				],
				style: e.style,
				readonly: U.isReadonly.value,
				placeholder: n ? void 0 : e.placeholder,
				"onClick:clear": et,
				"onMousedown:control": tt,
				onKeydown: it,
				onBlur: gt,
				"aria-expanded": Ke.value,
				"aria-controls": qe.value
			}), {
				...l,
				default: ({ id: n }) => w(v, null, [
					Ue.value.map((t, n) => w("input", {
						key: n,
						type: "hidden",
						name: e.name,
						value: t,
						form: e.form
					}, null)),
					D(ge, a({
						id: Ge.value,
						ref: g,
						modelValue: Q.value,
						"onUpdate:modelValue": (e) => Q.value = e,
						activator: "parent",
						captureFocus: !1,
						openOnArrow: !1,
						disabled: Z.value,
						_disableKeys: !0,
						eager: e.eager,
						maxHeight: 310,
						openOnClick: !1,
						closeOnContentClick: !1,
						onAfterEnter: lt,
						onAfterLeave: ut
					}, e.menuProps, { contentClass: [
						"v-autocomplete__content",
						d.value,
						e.menuProps?.contentClass
					] }), { default: () => [D(ve, {
						onFocusin: dt,
						onKeydown: rt,
						onMousedown: ht
					}, { default: () => [
						l["menu-header"] && w("header", { ref: y }, [l["menu-header"](i)]),
						t && D(Ee, a({
							key: "autocomplete-list",
							ref: _,
							class: "v-list--navigable",
							filterable: !0,
							selected: Ue.value,
							selectStrategy: e.multiple ? "independent" : "single-independent",
							onMousedown: (e) => e.preventDefault(),
							onFocusout: ft,
							tabindex: "-1",
							selectable: !!G.value.length,
							"aria-live": "polite",
							"aria-labelledby": `${n.value}-label`,
							"aria-multiselectable": e.multiple,
							color: e.itemColor ?? e.color
						}, Je, e.listProps), { default: () => [
							l["prepend-item"]?.(),
							!G.value.length && !e.hideNoData && (l["no-data"]?.() ?? D(F, {
								key: "no-data",
								title: u(e.noDataText)
							}, null)),
							D(me, {
								ref: T,
								renderless: !0,
								items: G.value,
								itemKey: "value"
							}, { default: ({ item: t, index: n, itemRef: r }) => {
								let i = o(t.props), s = a(t.props, {
									ref: r,
									key: t.value,
									active: X.value && t === Y.value ? !0 : void 0,
									onClick: () => $(t, null),
									"aria-posinset": n + 1,
									"aria-setsize": G.value.length
								});
								return t.type === "divider" ? l.divider?.({
									props: t.raw,
									index: n
								}) ?? D(Ae, a(t.props, {
									ref: r,
									key: `divider-${n}`
								}), null) : t.type === "subheader" ? l.subheader?.({
									props: t.raw,
									index: n
								}) ?? D(we, a(t.props, {
									ref: r,
									key: `subheader-${n}`
								}), null) : l.item?.({
									item: t.raw,
									internalItem: t,
									index: n,
									props: s
								}) ?? D(F, a(s, { role: "option" }), {
									prepend: ({ isSelected: n }) => w(v, null, [
										e.multiple && !e.hideSelected ? D(Le, {
											key: t.value,
											modelValue: n,
											ripple: !1,
											tabindex: "-1",
											"aria-hidden": !0,
											onClick: (e) => e.preventDefault()
										}, null) : void 0,
										i.prependAvatar && D(Me, { image: i.prependAvatar }, null),
										i.prependIcon && D(je, { icon: i.prependIcon }, null)
									]),
									title: () => O.value ? t.title : D(pe, {
										text: t.title,
										matches: Be(t)?.title,
										markClass: "v-autocomplete__mask",
										matchAll: !0,
										ignoreCase: !0
									}, null)
								});
							} }),
							l["append-item"]?.()
						] }),
						l["menu-footer"] && w("footer", { ref: C }, [l["menu-footer"](i)])
					] })] }),
					H.value.map((t, n) => {
						function r(e) {
							e.stopPropagation(), e.preventDefault(), $(t, !1);
						}
						let i = a(Fe.filterProps(t.props), {
							"onClick:close": r,
							onKeydown(e) {
								(e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), r(e));
							},
							onMousedown(e) {
								e.preventDefault(), e.stopPropagation();
							},
							modelValue: !0,
							"onUpdate:modelValue": void 0
						}), o = q.value ? !!l.chip : !!l.selection, s = o ? ee(q.value ? l.chip({
							item: t.raw,
							internalItem: t,
							index: n,
							props: i
						}) : l.selection({
							item: t.raw,
							internalItem: t,
							index: n
						})) : void 0;
						if (!o || s) return w("div", {
							key: t.value,
							class: ne(["v-autocomplete__selection", n === A.value && ["v-autocomplete__selection--selected", R.value]]),
							style: se(n === A.value ? z.value : {})
						}, [q.value ? l.chip ? D(j, {
							key: "chip-defaults",
							defaults: { VChip: {
								closable: K.value,
								size: Ve.value?.size ?? "small",
								text: t.title
							} }
						}, { default: () => [s] }) : D(Fe, a({
							key: "chip",
							closable: K.value,
							size: Ve.value?.size ?? "small",
							text: t.title,
							disabled: t.props.disabled
						}, i), null) : s ?? w("span", { class: "v-autocomplete__selection-text" }, [t.title, e.multiple && n < H.value.length - 1 && w("span", { class: "v-autocomplete__selection-comma" }, [le(",")])])]);
					})
				]),
				"append-inner": (...t) => w(v, null, [
					l["append-inner"]?.(...t),
					e.menuIcon ? D(je, {
						class: "v-autocomplete__menu-icon",
						color: m.value?.fieldIconColor,
						icon: e.menuIcon,
						onMousedown: nt,
						onClick: te,
						"aria-hidden": !0,
						tabindex: "-1"
					}, null) : void 0,
					e.appendInnerIcon && D(B, {
						key: "append-icon",
						name: "appendInner",
						color: t[0].iconColor.value
					}, null)
				])
			});
		}), Pe({
			isFocused: E,
			isPristine: O,
			menu: Q,
			search: V,
			filteredItems: W,
			select: $
		}, m);
	}
}), z = (e) => typeof e == "object" && !!e && !Array.isArray(e);
function B(e) {
	if (!Array.isArray(e)) return [];
	let t = /* @__PURE__ */ new Set();
	return e.flatMap((e) => !z(e) || typeof e.label != "string" || typeof e.value != "string" || t.has(e.value) ? [] : (t.add(e.value), [{
		label: e.label,
		value: e.value,
		disabled: e.disabled === !0,
		group: typeof e.group == "string" ? e.group : "",
		icon: typeof e.icon == "string" ? e.icon : ""
	}]));
}
function V(e) {
	return {
		title: e.label,
		value: e.value,
		props: {
			disabled: e.disabled,
			...e.icon ? { prependIcon: e.icon } : {},
			"data-value": e.value
		}
	};
}
function H(e) {
	if (!e.some((e) => e.group)) return e.map(V);
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.set(n.group, [...t.get(n.group) ?? [], n]);
	let n = t.get("") ?? [];
	return t.delete(""), [...n.map(V), ...[...t].flatMap(([e, t]) => [{
		type: "subheader",
		title: e
	}, ...t.map(V)])];
}
//#endregion
//#region src/entries/smartview-combobox.ts
N("smartview-combobox", /* @__PURE__ */ _({
	__name: "SmartviewCombobox.ce",
	props: {
		value: {
			default: "",
			type: String
		},
		options: {
			default: () => [],
			type: Array
		},
		searchable: {
			type: Boolean,
			default: !1
		},
		placeholder: {
			default: "",
			type: String
		},
		readonly: {
			type: Boolean,
			default: !1
		},
		clearable: {
			type: Boolean,
			default: !1
		},
		icon: {
			default: "",
			type: String
		},
		density: {
			default: "comfortable",
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
	setup(e, { emit: n }) {
		let r = e, i = n, { t: a } = y(), { overlayDefaults: o } = M(() => r.overlayTarget), s = t("root"), { current: c, commit: d, reset: f } = ke("value", () => r.value), p = x(() => H(B(r.options))), { formDisabled: ee, touched: h } = Ie({
			value: () => c.value,
			isEmpty: () => c.value === "",
			required: () => r.required,
			requiredMessage: () => a("smartview.required"),
			anchor: () => s.value?.querySelector("input:not([type=\"hidden\"])") ?? void 0,
			reset: f
		}), te = x(() => r.errorMessage ? [r.errorMessage] : h.value && r.required && c.value === "" ? [a("smartview.required")] : []);
		function _(e) {
			let t = typeof e == "string" ? e : "";
			t !== c.value && (d(t), i("input", t), i("change", t));
		}
		return (t, n) => (l(), C(g(j), { defaults: g(o) }, {
			default: m(() => [w("div", {
				ref_key: "root",
				ref: s,
				class: "smartview-root",
				onInput: n[2] ||= T(() => {}, ["stop"]),
				onChange: n[3] ||= T(() => {}, ["stop"])
			}, [(l(), C(u(e.searchable ? g(R) : g(A)), {
				"model-value": g(c) || null,
				items: p.value,
				label: e.label || void 0,
				hint: e.hint || void 0,
				"persistent-hint": !!e.hint,
				"hide-details": "auto",
				"error-messages": te.value,
				placeholder: e.placeholder || void 0,
				disabled: e.disabled || g(ee),
				readonly: e.readonly,
				clearable: e.clearable && !e.readonly,
				"prepend-inner-icon": e.icon || void 0,
				density: e.density,
				"no-data-text": g(a)("smartview.comboboxNoMatch"),
				"aria-required": e.required ? "true" : void 0,
				variant: "outlined",
				rounded: "lg",
				"data-part": "field",
				"onUpdate:modelValue": _,
				onBlur: n[0] ||= (e) => h.value = !0,
				"onUpdate:menu": n[1] ||= (e) => !e && (h.value = !0)
			}, null, 40, [
				"model-value",
				"items",
				"label",
				"hint",
				"persistent-hint",
				"error-messages",
				"placeholder",
				"disabled",
				"readonly",
				"clearable",
				"prepend-inner-icon",
				"density",
				"no-data-text",
				"aria-required"
			]))], 544)]),
			_: 1
		}, 8, ["defaults"]));
	}
}), { formAssociated: !0 });
//#endregion
