import { A as e, Bt as t, Dn as n, E as r, En as i, H as a, Hn as o, Lt as s, T as c, Tt as ee, U as l, X as te, Y as ne, Zn as u, _t as re, cn as d, cr as ie, er as f, fn as p, g as ae, m as oe, nr as m, pn as h, rt as se, ur as ce, ut as le, vn as ue, vt as g, wt as de, yn as _ } from "./vuetify-DJ4bsPds.js";
import { a as fe, c as pe, d as me, f as he, i as v, l as ge, m as _e, n as ve, o as ye, p as be, r as xe, s as Se } from "./VSelect-tmFN_T5n.js";
import { a as Ce } from "./rounded-CXkAtXly.js";
import { c as we, s as Te } from "./define-BG7hCbXs.js";
import { n as y } from "./ripple-B14E6MmL.js";
import { a as Ee, i as De, o as b, r as x, t as Oe } from "./VList-BOnRbwg2.js";
import { i as ke, s as Ae } from "./VLabel-slD1mVUb.js";
import { n as je } from "./ssrBoot-BMVtmVZ_.js";
import { a as S } from "./density-Dh8nVFPw.js";
import { t as Me } from "./VAvatar-B5evLdR9.js";
import { o as Ne } from "./router-BNmKTwUJ.js";
import { t as Pe } from "./forwardRefs-BcUquh0G.js";
import { t as C } from "./VChip-Dqfk0_yh.js";
import { t as Fe } from "./VCheckboxBtn-BD1XFHaj.js";
import { n as w, t as T } from "./VTextField-uapT17Ep.js";
//#region node_modules/vuetify/lib/components/VCombobox/VCombobox.js
var E = e({
	alwaysFilter: Boolean,
	autoSelectFirst: { type: [Boolean, String] },
	clearOnSelect: {
		type: Boolean,
		default: !0
	},
	delimiters: Array,
	closeOnInputClick: Boolean,
	trimValues: Boolean,
	...v({ filterKeys: ["title"] }),
	...ve({
		hideNoData: !0,
		returnObject: !0
	}),
	...g(w({
		modelValue: null,
		role: "combobox"
	}), ["validationValue", "dirty"])
}, "VCombobox"), D = c()({
	name: "VCombobox",
	props: E(),
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
		let { t: v } = oe(), { elevationClasses: ve } = Ne(m(() => e.menuElevation)), w = u(), E = u(), D = u(), O = u(), k = u(), A = u(), j = f(!1), M = f(!0), N = f(!1), P = f(-1), F = !1, { items: I, transformIn: Ie, transformOut: Le } = De(e), { textColorClasses: Re, textColorStyles: ze } = Te(() => w.value?.color), { InputIcon: Be } = Ae(e), L = ae(e, "modelValue", [], (e) => Ie(de(e)), (t) => {
			let n = Le(t);
			return e.multiple ? n : n[0] ?? null;
		}), R = ke(e), z = m(() => e.closableChips && !R.isReadonly.value && !R.isDisabled.value), B = r("VChip"), V = p(() => !!(e.chips || g.chip)), H = p(() => V.value || !!g.selection), U = f(!e.multiple && !H.value ? L.value[0]?.title ?? "" : ""), W = f(null), G = p({
			get: () => U.value,
			set: async (t) => {
				if (U.value = t ?? "", t === null || t === "" && !e.multiple && !H.value) {
					for (let e of L.value) c("item:removed", e);
					L.value = [];
				} else !e.multiple && !H.value && (L.value = [x(e, t)], n(() => A.value?.scrollToIndex(0)));
				if (t && e.multiple && e.delimiters?.length) {
					let e = ft(t);
					e.length > 1 && (pt(e), U.value = "");
				}
				t || (P.value = -1), M.value = !t;
			}
		}), Ve = p(() => s(e.counterValue) ? e.counterValue(L.value) : t(e.counterValue) ? e.counterValue : e.multiple ? L.value.length : G.value.length), { filteredItems: K, getMatches: He } = fe(e, I, () => W.value ?? (e.alwaysFilter || !M.value ? G.value : "")), q = p(() => e.hideSelected && W.value === null ? K.value.filter((e) => !L.value.some((t) => t.value === e.value)) : K.value), J = p(() => e.hideNoData && !q.value.length || R.isReadonly.value || R.isDisabled.value), { menu: Y, closeOnSelect: Ue } = Se(e, {
			vMenuRef: E,
			menuDisabled: J,
			isFocused: j
		}), { menuId: We, ariaExpanded: Ge, ariaControls: Ke } = xe(e, Y), { listEvents: qe, onActivatorKeydown: Je, setPendingFocus: Ye, flushPendingFocus: Xe } = pe(D, w, A, q, {
			selectedIndex: () => M.value ? lt() : -1,
			headerEl: () => O.value,
			menuContentEl: () => E.value?.contentEl,
			noAutoScroll: () => e.noAutoScroll
		});
		o(U, (e) => {
			F ? n(() => F = !1) : j.value && !Y.value && (Y.value = !0), Y.value && j.value && n(() => {
				A.value?.scrollToIndex(0), D.value?.$el?.contains(se()) && w.value?.focus();
			}), c("update:search", e);
		}), o(L, (t) => {
			!e.multiple && !H.value && (U.value = t[0]?.title ?? "");
		});
		let Ze = p(() => L.value.map((e) => e.value)), X = p(() => q.value.find((e) => e.type === "item" && !e.props.disabled)), Z = p(() => (e.autoSelectFirst === !0 || e.autoSelectFirst === "exact" && G.value === X.value?.title) && q.value.length > 0 && !M.value && !N.value), Qe = ge(Y, () => E.value?.contentEl, () => w.value?.controlRef), { onTabKeydown: $e } = ye({
			groups: [
				{
					type: "element",
					contentRef: O
				},
				{
					type: "list",
					contentRef: D,
					displayItemsCount: () => q.value.length
				},
				{
					type: "element",
					contentRef: k
				}
			],
			onLeave: () => {
				Y.value = !1, w.value?.focus();
			}
		});
		function et(t) {
			F = !0, n(() => F = !1), e.openOnClear && (Y.value = !0);
		}
		function tt() {
			J.value || (Y.value = !e.closeOnInputClick || !Y.value);
		}
		function nt(e) {
			J.value || j.value && (e.preventDefault(), e.stopPropagation(), Y.value = !Y.value);
		}
		function rt(e) {
			e.key === "Tab" && $e(e), D.value?.$el.contains(e.target) && (l(e) || e.key === "Backspace") && w.value?.focus();
		}
		function it(e) {
			if (!(le(e) || R.isReadonly.value)) switch (e.key) {
				case "Escape":
					Y.value = !1;
					break;
				case "ArrowDown":
				case "ArrowUp":
					if (e.preventDefault(), Je(e, Y)) break;
					e.key === "ArrowDown" && Z.value && D.value?.focus("next");
					break;
				case "Enter":
					e.preventDefault(), Y.value = !0, at(), G.value && ot();
					break;
				case "Tab":
					at(), Y.value = !1;
					break;
				default: st(e);
			}
		}
		function at() {
			let e = X.value;
			Z.value && e && (L.value.some(({ value: t }) => t === e.value) || $(e));
		}
		function ot() {
			let t = e.trimValues ? G.value.trim() : G.value;
			if (!t) {
				G.value = "";
				return;
			}
			$(x(e, t), !0, !0), H.value && (U.value = "");
		}
		function st(t) {
			let n = L.value.length;
			if (["Backspace", "Delete"].includes(t.key)) {
				if (!e.multiple && H.value && n > 0 && !G.value) return $(L.value[0], !1);
				if (~P.value) {
					t.preventDefault();
					let e = P.value;
					$(L.value[P.value], !1), P.value = e >= n - 1 ? n - 2 : e;
				} else t.key === "Backspace" && !G.value && (P.value = n - 1);
				return;
			}
			if (e.multiple) {
				if (t.key === "ArrowLeft") {
					if (P.value < 0 && (w.value?.selectionStart ?? 0) > 0) return;
					let e = P.value > -1 ? P.value - 1 : n - 1;
					L.value[e] ? P.value = e : (P.value = -1, w.value?.setSelectionRange(G.value.length, G.value.length));
				} else if (t.key === "ArrowRight") {
					if (P.value < 0) return;
					let e = P.value + 1;
					L.value[e] ? P.value = e : (P.value = -1, w.value?.setSelectionRange(0, 0));
				} else ~P.value && l(t) && (P.value = -1);
			}
		}
		function ct(t) {
			let n = ft(t?.clipboardData?.getData("Text") ?? "");
			n.length > 1 && e.multiple && (t.preventDefault(), pt(n));
		}
		function lt() {
			return q.value.findIndex((t) => L.value.some((n) => (e.valueComparator || y)(n.value, t.value)));
		}
		function ut() {
			e.eager && A.value?.calculateVisibleItems(), Xe();
		}
		function dt() {
			j.value && (E.value?.contentEl?._clickOutside?.lastMousedownWasOutside ? j.value = !1 : w.value?.focus()), M.value = !0, W.value = null;
		}
		function Q(t) {
			let n = e.valueComparator || y;
			return I.value.some((e) => n(e.value, t.value));
		}
		function $(t, r = !0, i = !1) {
			if (!t || t.props.disabled) return;
			let a = e.valueComparator || y;
			if (e.multiple) {
				let n = L.value.findIndex((e) => a(e.value, t.value)), i = r ?? !~n;
				if (~n) {
					let e = i ? [...L.value, t] : [...L.value], [r] = e.splice(n, 1);
					i || c("item:removed", r), L.value = e;
				} else i && (c("item:added", t), Q(t) || c("item:created", t), L.value = [...L.value, t]);
				e.clearOnSelect && (G.value = "");
			} else {
				let o = r !== !1, s = L.value[0];
				o ? (s && !a(s.value, t.value) ? (c("item:removed", s), c("item:added", t), Q(t) || c("item:created", t)) : s || (c("item:added", t), Q(t) || c("item:created", t)), L.value = [t]) : (s && c("item:removed", s), L.value = []), (!M.value || e.alwaysFilter) && U.value && (W.value = U.value), U.value = o && !H.value ? t.title : "", n(() => {
					i || Ue(), M.value = !0;
				});
			}
		}
		function ft(t) {
			let n = ["\n", ...e.delimiters ?? []].map(te).join("|");
			return t.split(RegExp(`(?:${n})+`));
		}
		async function pt(t) {
			for (let r of t) r = r.trim(), r && ($(x(e, r)), await n());
		}
		function mt(e) {
			j.value = !0, setTimeout(() => {
				N.value = !0;
			});
		}
		function ht(e) {
			if (N.value = !1, !w.value?.$el.contains(e.relatedTarget)) {
				if (Qe(e)) return;
				j.value = !1;
			}
		}
		let gt = 0;
		function _t() {
			gt = performance.now();
		}
		function vt(e) {
			let t = e.relatedTarget;
			((E.value?.contentEl)?.contains(t) || !t && performance.now() - gt < 10) && (j.value = !0);
		}
		return o(j, (t, n) => {
			if (!(t || t === n) && (P.value = -1, Y.value = !1, G.value)) {
				let t = e.trimValues ? G.value.trim() : G.value;
				if (!t) {
					G.value = "";
					return;
				}
				if (e.multiple) {
					$(x(e, t));
					return;
				}
				if (!H.value) {
					t !== G.value && $(x(e, t));
					return;
				}
				L.value.some(({ title: e }) => e === t) ? U.value = "" : $(x(e, t));
			}
		}), o(Y, (t) => {
			if (t || Ye(null), !e.hideSelected && t && L.value.length && M.value) {
				let t = lt();
				ee && !e.noAutoScroll && window.requestAnimationFrame(() => {
					t >= 0 && A.value?.scrollToIndex(t, "center");
				});
			}
			t && (W.value = null);
		}), o(I, (e, t) => {
			Y.value || j.value && !t.length && e.length && (Y.value = !0);
		}), we(() => {
			let t = !!(!e.hideNoData || q.value.length || g["prepend-item"] || g["append-item"] || g["no-data"]), n = L.value.length > 0, r = T.filterProps(e), o = {
				search: G,
				filteredItems: K.value
			};
			return _(T, i({ ref: w }, r, {
				form: e.autocomplete === "suppress" ? "" : void 0,
				name: e.autocomplete === "suppress" ? e.name : void 0,
				modelValue: G.value,
				"onUpdate:modelValue": (e) => G.value = e,
				focused: j.value,
				"onUpdate:focused": (e) => j.value = e,
				validationValue: L.externalValue,
				counterValue: Ve.value,
				dirty: n,
				class: [
					"v-combobox",
					{
						"v-combobox--active-menu": Y.value,
						"v-combobox--chips": !!e.chips,
						"v-combobox--selection-slot": !!H.value,
						"v-combobox--selecting-index": P.value > -1,
						[`v-combobox--${e.multiple ? "multiple" : "single"}`]: !0
					},
					e.class
				],
				style: e.style,
				readonly: R.isReadonly.value,
				placeholder: n ? void 0 : e.placeholder,
				"onClick:clear": et,
				"onMousedown:control": tt,
				onKeydown: it,
				onPaste: ct,
				onBlur: vt,
				"aria-expanded": Ge.value,
				"aria-controls": Ke.value
			}), {
				...g,
				default: ({ id: n }) => h(d, null, [
					Ze.value.map((t, n) => h("input", {
						key: n,
						type: "hidden",
						name: e.name,
						value: t,
						form: e.form
					}, null)),
					_(_e, i({
						id: We.value,
						ref: E,
						modelValue: Y.value,
						"onUpdate:modelValue": (e) => Y.value = e,
						activator: "parent",
						captureFocus: !1,
						openOnArrow: !1,
						disabled: J.value,
						_disableKeys: !0,
						eager: e.eager,
						maxHeight: 310,
						openOnClick: !1,
						closeOnContentClick: !1,
						onAfterEnter: ut,
						onAfterLeave: dt
					}, e.menuProps, { contentClass: [
						"v-combobox__content",
						ve.value,
						e.menuProps?.contentClass
					] }), { default: () => [_(be, {
						onFocusin: mt,
						onKeydown: rt,
						onMousedown: _t
					}, { default: () => [
						g["menu-header"] && h("header", { ref: O }, [g["menu-header"](o)]),
						t && _(Oe, i({
							key: "combobox-list",
							ref: D,
							class: "v-list--navigable",
							filterable: !0,
							selected: Ze.value,
							selectStrategy: e.multiple ? "independent" : "single-independent",
							onMousedown: (e) => e.preventDefault(),
							selectable: !!q.value.length,
							onFocusout: ht,
							tabindex: "-1",
							"aria-live": "polite",
							"aria-labelledby": `${n.value}-label`,
							"aria-multiselectable": e.multiple,
							color: e.itemColor ?? e.color
						}, qe, e.listProps), { default: () => [
							g["prepend-item"]?.(),
							!q.value.length && !e.hideNoData && (g["no-data"]?.() ?? _(b, {
								key: "no-data",
								title: v(e.noDataText)
							}, null)),
							_(he, {
								ref: A,
								renderless: !0,
								items: q.value,
								itemKey: "value"
							}, { default: ({ item: t, index: n, itemRef: r }) => {
								let o = a(t.props), s = i(t.props, {
									ref: r,
									key: t.value,
									active: Z.value && t === X.value ? !0 : void 0,
									onClick: () => $(t, null),
									"aria-posinset": n + 1,
									"aria-setsize": q.value.length
								});
								return t.type === "divider" ? g.divider?.({
									props: t.raw,
									index: n
								}) ?? _(je, i(t.props, {
									ref: r,
									key: `divider-${n}`
								}), null) : t.type === "subheader" ? g.subheader?.({
									props: t.raw,
									index: n
								}) ?? _(Ee, i(t.props, {
									ref: r,
									key: `subheader-${n}`
								}), null) : g.item?.({
									item: t.raw,
									internalItem: t,
									index: n,
									props: s
								}) ?? _(b, i(s, { role: "option" }), {
									prepend: ({ isSelected: n }) => h(d, null, [
										e.multiple && !e.hideSelected ? _(Fe, {
											key: t.value,
											modelValue: n,
											ripple: !1,
											tabindex: "-1",
											"aria-hidden": !0,
											onClick: (e) => e.preventDefault()
										}, null) : void 0,
										o.prependAvatar && _(Me, { image: o.prependAvatar }, null),
										o.prependIcon && _(S, { icon: o.prependIcon }, null)
									]),
									title: () => M.value ? t.title : _(me, {
										text: t.title,
										matches: He(t)?.title,
										markClass: "v-combobox__mask",
										matchAll: !0,
										ignoreCase: !0
									}, null)
								});
							} }),
							g["append-item"]?.()
						] }),
						g["menu-footer"] && h("footer", { ref: k }, [g["menu-footer"](o)])
					] })] }),
					L.value.map((t, n) => {
						function r(e) {
							e.stopPropagation(), e.preventDefault(), $(t, !1);
						}
						let a = i(C.filterProps(t.props), {
							"onClick:close": r,
							onKeydown(e) {
								(e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), r(e));
							},
							onMousedown(e) {
								e.preventDefault(), e.stopPropagation();
							},
							modelValue: !0,
							"onUpdate:modelValue": void 0
						}), o = V.value ? !!g.chip : !!g.selection, s = o ? ne(V.value ? g.chip({
							item: t.raw,
							internalItem: t,
							index: n,
							props: a
						}) : g.selection({
							item: t.raw,
							internalItem: t,
							index: n
						})) : void 0;
						if (!o || s) return h("div", {
							key: t.value,
							class: ie(["v-combobox__selection", n === P.value && ["v-combobox__selection--selected", Re.value]]),
							style: ce(n === P.value ? ze.value : {})
						}, [V.value ? g.chip ? _(Ce, {
							key: "chip-defaults",
							defaults: { VChip: {
								closable: z.value,
								size: B.value?.size ?? "small",
								text: t.title
							} }
						}, { default: () => [s] }) : _(C, i({
							key: "chip",
							closable: z.value,
							size: B.value?.size ?? "small",
							text: t.title,
							disabled: t.props.disabled
						}, a), null) : s ?? h("span", { class: "v-combobox__selection-text" }, [t.title, e.multiple && n < L.value.length - 1 && h("span", { class: "v-combobox__selection-comma" }, [ue(",")])])]);
					})
				]),
				"append-inner": (...t) => h(d, null, [
					g["append-inner"]?.(...t),
					(!e.hideNoData || e.items.length) && e.menuIcon ? _(S, {
						class: "v-combobox__menu-icon",
						color: w.value?.fieldIconColor,
						icon: e.menuIcon,
						onMousedown: nt,
						onClick: re,
						"aria-hidden": !0,
						tabindex: "-1"
					}, null) : void 0,
					e.appendInnerIcon && _(Be, {
						key: "append-icon",
						name: "appendInner",
						color: t[0].iconColor.value
					}, null)
				])
			});
		}), Pe({
			isFocused: j,
			isPristine: M,
			menu: Y,
			search: G,
			selectionIndex: P,
			filteredItems: K,
			select: $
		}, w);
	}
});
//#endregion
export { D as t };
