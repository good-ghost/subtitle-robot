import { A as e, Bt as t, E as n, H as r, Jn as i, Lt as a, Mn as o, Nn as s, T as c, Tn as l, Tt as ee, U as u, X as te, Y as ne, _t as re, cr as d, g as ie, gr as ae, m as oe, mn as f, mr as se, or as p, rr as m, rt as ce, ut as le, vn as h, vt as g, wn as ue, wt as de, yn as _ } from "./vuetify-C39-WP9g.js";
import { a as fe, c as pe, d as me, f as he, i as ge, l as _e, m as ve, n as v, o as ye, p as be, r as xe, s as Se } from "./VSelect-DuDSSQDf.js";
import { a as Ce } from "./rounded-1DPtyqNn.js";
import { c as we, s as Te } from "./define-BovISfN4.js";
import { n as y } from "./ripple-BBz9XQtx.js";
import { a as Ee, i as De, o as b, r as x, t as Oe } from "./VList-BQKDUGEW.js";
import { i as ke, s as Ae } from "./VLabel-B80IAw5H.js";
import { t as je } from "./VDivider-CA-IOlps.js";
import { a as S } from "./density-9WZgplEH.js";
import { t as Me } from "./VAvatar-DdB1q11O.js";
import { o as Ne } from "./router-C0qlu-KG.js";
import { t as Pe } from "./forwardRefs-mn8VYMvs.js";
import { t as Fe } from "./VChip-C-IhEdKW.js";
import { t as Ie } from "./VCheckboxBtn-Z27PqfdZ.js";
import { n as C, t as w } from "./VTextField-DrXa6-zE.js";
//#region node_modules/vuetify/lib/components/VCombobox/VCombobox.js
var T = e({
	alwaysFilter: Boolean,
	autoSelectFirst: { type: [Boolean, String] },
	clearOnSelect: {
		type: Boolean,
		default: !0
	},
	delimiters: Array,
	closeOnInputClick: Boolean,
	trimValues: Boolean,
	...ge({ filterKeys: ["title"] }),
	...v({
		hideNoData: !0,
		returnObject: !0
	}),
	...g(C({
		modelValue: null,
		role: "combobox"
	}), ["validationValue", "dirty"])
}, "VCombobox"), E = c()({
	name: "VCombobox",
	props: T(),
	emits: {
		"update:focused": (e) => !0,
		"update:modelValue": (e) => !0,
		"update:search": (e) => !0,
		"update:menu": (e) => !0,
		"item:added": (e) => !0,
		"item:removed": (e) => !0,
		"item:created": (e) => !0
	},
	setup(e, { emit: c, slots: g }) {
		let { t: ge } = oe(), { elevationClasses: v } = Ne(d(() => e.menuElevation)), C = m(), T = m(), E = m(), D = m(), O = m(), k = m(), A = p(!1), j = p(!0), M = p(!1), N = p(-1), P = !1, { items: F, transformIn: Le, transformOut: Re } = De(e), { textColorClasses: ze, textColorStyles: Be } = Te(() => C.value?.color), { InputIcon: Ve } = Ae(e), I = ie(e, "modelValue", [], (e) => Le(de(e)), (t) => {
			let n = Re(t);
			return e.multiple ? n : n[0] ?? null;
		}), L = ke(e), R = d(() => e.closableChips && !L.isReadonly.value && !L.isDisabled.value), He = n("VChip"), z = h(() => !!(e.chips || g.chip)), B = h(() => z.value || !!g.selection), V = p(!e.multiple && !B.value ? I.value[0]?.title ?? "" : ""), H = p(null), U = h({
			get: () => V.value,
			set: async (t) => {
				if (V.value = t ?? "", t === null || t === "" && !e.multiple && !B.value) {
					for (let e of I.value) c("item:removed", e);
					I.value = [];
				} else !e.multiple && !B.value && (I.value = [x(e, t)], s(() => k.value?.scrollToIndex(0)));
				if (t && e.multiple && e.delimiters?.length) {
					let e = ft(t);
					e.length > 1 && (pt(e), V.value = "");
				}
				t || (N.value = -1), j.value = !t;
			}
		}), Ue = h(() => a(e.counterValue) ? e.counterValue(I.value) : t(e.counterValue) ? e.counterValue : e.multiple ? I.value.length : U.value.length), { filteredItems: W, getMatches: We } = fe(e, F, () => H.value ?? (e.alwaysFilter || !j.value ? U.value : "")), G = h(() => e.hideSelected && H.value === null ? W.value.filter((e) => !I.value.some((t) => t.value === e.value)) : W.value), K = h(() => e.hideNoData && !G.value.length || L.isReadonly.value || L.isDisabled.value), { menu: q, closeOnSelect: Ge } = Se(e, {
			vMenuRef: T,
			menuDisabled: K,
			isFocused: A
		}), { menuId: Ke, ariaExpanded: qe, ariaControls: Je } = xe(e, q), { listEvents: Ye, onActivatorKeydown: Xe, setPendingFocus: Ze, flushPendingFocus: Qe } = pe(E, C, k, G, {
			selectedIndex: () => j.value ? Z() : -1,
			headerEl: () => D.value,
			menuContentEl: () => T.value?.contentEl,
			noAutoScroll: () => e.noAutoScroll
		});
		i(V, (e) => {
			P ? s(() => P = !1) : A.value && !q.value && (q.value = !0), q.value && A.value && s(() => {
				k.value?.scrollToIndex(0), E.value?.$el?.contains(ce()) && C.value?.focus();
			}), c("update:search", e);
		}), i(I, (t) => {
			!e.multiple && !B.value && (V.value = t[0]?.title ?? "");
		});
		let J = h(() => I.value.map((e) => e.value)), Y = h(() => G.value.find((e) => e.type === "item" && !e.props.disabled)), X = h(() => (e.autoSelectFirst === !0 || e.autoSelectFirst === "exact" && U.value === Y.value?.title) && G.value.length > 0 && !j.value && !M.value), $e = _e(q, () => T.value?.contentEl, () => C.value?.controlRef), { onTabKeydown: et } = ye({
			groups: [
				{
					type: "element",
					contentRef: D
				},
				{
					type: "list",
					contentRef: E,
					displayItemsCount: () => G.value.length
				},
				{
					type: "element",
					contentRef: O
				}
			],
			onLeave: () => {
				q.value = !1, C.value?.focus();
			}
		});
		function tt(t) {
			P = !0, s(() => P = !1), e.openOnClear && (q.value = !0);
		}
		function nt() {
			K.value || (q.value = !e.closeOnInputClick || !q.value);
		}
		function rt(e) {
			K.value || A.value && (e.preventDefault(), e.stopPropagation(), q.value = !q.value);
		}
		function it(e) {
			e.key === "Tab" && et(e), E.value?.$el.contains(e.target) && (u(e) || e.key === "Backspace") && C.value?.focus();
		}
		function at(e) {
			if (!(le(e) || L.isReadonly.value)) switch (e.key) {
				case "Escape":
					q.value = !1;
					break;
				case "ArrowDown":
				case "ArrowUp":
					if (e.preventDefault(), Xe(e, q)) break;
					e.key === "ArrowDown" && X.value && E.value?.focus("next");
					break;
				case "Enter":
					e.preventDefault(), q.value = !0, ot(), U.value && st();
					break;
				case "Tab":
					ot(), q.value = !1;
					break;
				default: ct(e);
			}
		}
		function ot() {
			let e = Y.value;
			X.value && e && (I.value.some(({ value: t }) => t === e.value) || $(e));
		}
		function st() {
			let t = e.trimValues ? U.value.trim() : U.value;
			if (!t) {
				U.value = "";
				return;
			}
			$(x(e, t), !0, !0), B.value && (V.value = "");
		}
		function ct(t) {
			let n = I.value.length;
			if (["Backspace", "Delete"].includes(t.key)) {
				if (!e.multiple && B.value && n > 0 && !U.value) return $(I.value[0], !1);
				if (~N.value) {
					t.preventDefault();
					let e = N.value;
					$(I.value[N.value], !1), N.value = e >= n - 1 ? n - 2 : e;
				} else t.key === "Backspace" && !U.value && (N.value = n - 1);
				return;
			}
			if (e.multiple) {
				if (t.key === "ArrowLeft") {
					if (N.value < 0 && (C.value?.selectionStart ?? 0) > 0) return;
					let e = N.value > -1 ? N.value - 1 : n - 1;
					I.value[e] ? N.value = e : (N.value = -1, C.value?.setSelectionRange(U.value.length, U.value.length));
				} else if (t.key === "ArrowRight") {
					if (N.value < 0) return;
					let e = N.value + 1;
					I.value[e] ? N.value = e : (N.value = -1, C.value?.setSelectionRange(0, 0));
				} else ~N.value && u(t) && (N.value = -1);
			}
		}
		function lt(t) {
			let n = ft(t?.clipboardData?.getData("Text") ?? "");
			n.length > 1 && e.multiple && (t.preventDefault(), pt(n));
		}
		function Z() {
			return G.value.findIndex((t) => I.value.some((n) => (e.valueComparator || y)(n.value, t.value)));
		}
		function ut() {
			e.eager && k.value?.calculateVisibleItems(), Qe();
		}
		function dt() {
			A.value && (T.value?.contentEl?._clickOutside?.lastMousedownWasOutside ? A.value = !1 : C.value?.focus()), j.value = !0, H.value = null;
		}
		function Q(t) {
			let n = e.valueComparator || y;
			return F.value.some((e) => n(e.value, t.value));
		}
		function $(t, n = !0, r = !1) {
			if (!t || t.props.disabled) return;
			let i = e.valueComparator || y;
			if (e.multiple) {
				let r = I.value.findIndex((e) => i(e.value, t.value)), a = n ?? !~r;
				if (~r) {
					let e = a ? [...I.value, t] : [...I.value], [n] = e.splice(r, 1);
					a || c("item:removed", n), I.value = e;
				} else a && (c("item:added", t), Q(t) || c("item:created", t), I.value = [...I.value, t]);
				e.clearOnSelect && (U.value = "");
			} else {
				let a = n !== !1, o = I.value[0];
				a ? (o && !i(o.value, t.value) ? (c("item:removed", o), c("item:added", t), Q(t) || c("item:created", t)) : o || (c("item:added", t), Q(t) || c("item:created", t)), I.value = [t]) : (o && c("item:removed", o), I.value = []), (!j.value || e.alwaysFilter) && V.value && (H.value = V.value), V.value = a && !B.value ? t.title : "", s(() => {
					r || Ge(), j.value = !0;
				});
			}
		}
		function ft(t) {
			let n = ["\n", ...e.delimiters ?? []].map(te).join("|");
			return t.split(RegExp(`(?:${n})+`));
		}
		async function pt(t) {
			for (let n of t) n = n.trim(), n && ($(x(e, n)), await s());
		}
		function mt(e) {
			A.value = !0, setTimeout(() => {
				M.value = !0;
			});
		}
		function ht(e) {
			if (M.value = !1, !C.value?.$el.contains(e.relatedTarget)) {
				if ($e(e)) return;
				A.value = !1;
			}
		}
		let gt = 0;
		function _t() {
			gt = performance.now();
		}
		function vt(e) {
			let t = e.relatedTarget;
			((T.value?.contentEl)?.contains(t) || !t && performance.now() - gt < 10) && (A.value = !0);
		}
		return i(A, (t, n) => {
			if (!(t || t === n) && (N.value = -1, q.value = !1, U.value)) {
				let t = e.trimValues ? U.value.trim() : U.value;
				if (!t) {
					U.value = "";
					return;
				}
				if (e.multiple) {
					$(x(e, t));
					return;
				}
				if (!B.value) {
					t !== U.value && $(x(e, t));
					return;
				}
				I.value.some(({ title: e }) => e === t) ? V.value = "" : $(x(e, t));
			}
		}), i(q, (t) => {
			if (t || Ze(null), !e.hideSelected && t && I.value.length && j.value) {
				let t = Z();
				ee && !e.noAutoScroll && window.requestAnimationFrame(() => {
					t >= 0 && k.value?.scrollToIndex(t, "center");
				});
			}
			t && (H.value = null);
		}), i(F, (e, t) => {
			q.value || A.value && !t.length && e.length && (q.value = !0);
		}), we(() => {
			let t = !!(!e.hideNoData || G.value.length || g["prepend-item"] || g["append-item"] || g["no-data"]), n = I.value.length > 0, i = w.filterProps(e), a = {
				search: U,
				filteredItems: W.value
			};
			return l(w, o({ ref: C }, i, {
				form: e.autocomplete === "suppress" ? "" : void 0,
				name: e.autocomplete === "suppress" ? e.name : void 0,
				modelValue: U.value,
				"onUpdate:modelValue": (e) => U.value = e,
				focused: A.value,
				"onUpdate:focused": (e) => A.value = e,
				validationValue: I.externalValue,
				counterValue: Ue.value,
				dirty: n,
				class: [
					"v-combobox",
					{
						"v-combobox--active-menu": q.value,
						"v-combobox--chips": !!e.chips,
						"v-combobox--selection-slot": !!B.value,
						"v-combobox--selecting-index": N.value > -1,
						[`v-combobox--${e.multiple ? "multiple" : "single"}`]: !0
					},
					e.class
				],
				style: e.style,
				readonly: L.isReadonly.value,
				placeholder: n ? void 0 : e.placeholder,
				"onClick:clear": tt,
				"onMousedown:control": nt,
				onKeydown: at,
				onPaste: lt,
				onBlur: vt,
				"aria-expanded": qe.value,
				"aria-controls": Je.value
			}), {
				...g,
				default: ({ id: n }) => _(f, null, [
					J.value.map((t, n) => _("input", {
						key: n,
						type: "hidden",
						name: e.name,
						value: t,
						form: e.form
					}, null)),
					l(ve, o({
						id: Ke.value,
						ref: T,
						modelValue: q.value,
						"onUpdate:modelValue": (e) => q.value = e,
						activator: "parent",
						captureFocus: !1,
						openOnArrow: !1,
						disabled: K.value,
						_disableKeys: !0,
						eager: e.eager,
						maxHeight: 310,
						openOnClick: !1,
						closeOnContentClick: !1,
						onAfterEnter: ut,
						onAfterLeave: dt
					}, e.menuProps, { contentClass: [
						"v-combobox__content",
						v.value,
						e.menuProps?.contentClass
					] }), { default: () => [l(be, {
						onFocusin: mt,
						onKeydown: it,
						onMousedown: _t
					}, { default: () => [
						g["menu-header"] && _("header", { ref: D }, [g["menu-header"](a)]),
						t && l(Oe, o({
							key: "combobox-list",
							ref: E,
							class: "v-list--navigable",
							filterable: !0,
							selected: J.value,
							selectStrategy: e.multiple ? "independent" : "single-independent",
							onMousedown: (e) => e.preventDefault(),
							selectable: !!G.value.length,
							onFocusout: ht,
							tabindex: "-1",
							"aria-live": "polite",
							"aria-labelledby": `${n.value}-label`,
							"aria-multiselectable": e.multiple,
							color: e.itemColor ?? e.color
						}, Ye, e.listProps), { default: () => [
							g["prepend-item"]?.(),
							!G.value.length && !e.hideNoData && (g["no-data"]?.() ?? l(b, {
								key: "no-data",
								title: ge(e.noDataText)
							}, null)),
							l(he, {
								ref: k,
								renderless: !0,
								items: G.value,
								itemKey: "value"
							}, { default: ({ item: t, index: n, itemRef: i }) => {
								let a = r(t.props), s = o(t.props, {
									ref: i,
									key: t.value,
									active: X.value && t === Y.value ? !0 : void 0,
									onClick: () => $(t, null),
									"aria-posinset": n + 1,
									"aria-setsize": G.value.length
								});
								return t.type === "divider" ? g.divider?.({
									props: t.raw,
									index: n
								}) ?? l(je, o(t.props, {
									ref: i,
									key: `divider-${n}`
								}), null) : t.type === "subheader" ? g.subheader?.({
									props: t.raw,
									index: n
								}) ?? l(Ee, o(t.props, {
									ref: i,
									key: `subheader-${n}`
								}), null) : g.item?.({
									item: t.raw,
									internalItem: t,
									index: n,
									props: s
								}) ?? l(b, o(s, { role: "option" }), {
									prepend: ({ isSelected: n }) => _(f, null, [
										e.multiple && !e.hideSelected ? l(Ie, {
											key: t.value,
											modelValue: n,
											ripple: !1,
											tabindex: "-1",
											"aria-hidden": !0,
											onClick: (e) => e.preventDefault()
										}, null) : void 0,
										a.prependAvatar && l(Me, { image: a.prependAvatar }, null),
										a.prependIcon && l(S, { icon: a.prependIcon }, null)
									]),
									title: () => j.value ? t.title : l(me, {
										text: t.title,
										matches: We(t)?.title,
										markClass: "v-combobox__mask",
										matchAll: !0,
										ignoreCase: !0
									}, null)
								});
							} }),
							g["append-item"]?.()
						] }),
						g["menu-footer"] && _("footer", { ref: O }, [g["menu-footer"](a)])
					] })] }),
					I.value.map((t, n) => {
						function r(e) {
							e.stopPropagation(), e.preventDefault(), $(t, !1);
						}
						let i = o(Fe.filterProps(t.props), {
							"onClick:close": r,
							onKeydown(e) {
								(e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), r(e));
							},
							onMousedown(e) {
								e.preventDefault(), e.stopPropagation();
							},
							modelValue: !0,
							"onUpdate:modelValue": void 0
						}), a = z.value ? !!g.chip : !!g.selection, s = a ? ne(z.value ? g.chip({
							item: t.raw,
							internalItem: t,
							index: n,
							props: i
						}) : g.selection({
							item: t.raw,
							internalItem: t,
							index: n
						})) : void 0;
						if (!a || s) return _("div", {
							key: t.value,
							class: se(["v-combobox__selection", n === N.value && ["v-combobox__selection--selected", ze.value]]),
							style: ae(n === N.value ? Be.value : {})
						}, [z.value ? g.chip ? l(Ce, {
							key: "chip-defaults",
							defaults: { VChip: {
								closable: R.value,
								size: He.value?.size ?? "small",
								text: t.title
							} }
						}, { default: () => [s] }) : l(Fe, o({
							key: "chip",
							closable: R.value,
							size: He.value?.size ?? "small",
							text: t.title,
							disabled: t.props.disabled
						}, i), null) : s ?? _("span", { class: "v-combobox__selection-text" }, [t.title, e.multiple && n < I.value.length - 1 && _("span", { class: "v-combobox__selection-comma" }, [ue(",")])])]);
					})
				]),
				"append-inner": (...t) => _(f, null, [
					g["append-inner"]?.(...t),
					(!e.hideNoData || e.items.length) && e.menuIcon ? l(S, {
						class: "v-combobox__menu-icon",
						color: C.value?.fieldIconColor,
						icon: e.menuIcon,
						onMousedown: rt,
						onClick: re,
						"aria-hidden": !0,
						tabindex: "-1"
					}, null) : void 0,
					e.appendInnerIcon && l(Ve, {
						key: "append-icon",
						name: "appendInner",
						color: t[0].iconColor.value
					}, null)
				])
			});
		}), Pe({
			isFocused: A,
			isPristine: j,
			menu: q,
			search: U,
			selectionIndex: N,
			filteredItems: W,
			select: $
		}, C);
	}
});
//#endregion
export { E as t };
