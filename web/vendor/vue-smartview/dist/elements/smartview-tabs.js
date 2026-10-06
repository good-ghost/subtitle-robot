import { A as e, D as t, Dn as n, En as r, Et as i, Fn as a, G as o, Gn as s, Hn as c, Ht as l, In as u, It as d, Ln as f, Pn as p, S as m, T as h, Tn as g, Tt as _, Vt as v, Wn as y, Zn as b, ar as x, bn as S, bt as C, c as w, cn as T, cr as E, dr as D, er as O, fn as k, g as A, gn as j, h as ee, ht as M, l as te, m as ne, mn as N, nr as P, on as re, pn as F, ur as I, vn as ie, vt as L, yn as R } from "../chunks/vuetify-DJ4bsPds.js";
import { t as ae } from "../chunks/animation-BZ-bP6So.js";
import { a as z, c as B, l as oe, n as V, s as se, t as ce } from "../chunks/define-BG7hCbXs.js";
import { i as le, n as ue, r as de, t as fe } from "../chunks/scopeId-BKRO7vOB.js";
import { t as pe } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as me, t as he } from "../chunks/ssrBoot-BMVtmVZ_.js";
import { n as ge, t as _e } from "../chunks/density-Dh8nVFPw.js";
import { t as ve } from "../chunks/transition-Dl3j6lCH.js";
import { t as ye } from "../chunks/forwardRefs-BcUquh0G.js";
import { n as be, t as H } from "../chunks/VBtn-D2PPPp70.js";
import { i as xe, r as Se, t as Ce } from "../chunks/group-0QbvFWt3.js";
import { r as we, t as U } from "../chunks/VSlideGroup-Ckz2iRR7.js";
//#region src/runtime/tabs.ts
function Te(e, t, n) {
	let { current: r, commit: i } = pe("tab", t), a = k(() => {
		let t = (Array.isArray(e()) ? e() : []).filter((e) => !e.disabled);
		return t.some((e) => e.value === r.value) ? r.value : t[0]?.value ?? "";
	});
	function o(e) {
		typeof e == "string" && e !== a.value && (i(e), n(e));
	}
	return {
		current: a,
		select: o
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VTabs/shared.js
var W = Symbol.for("vuetify:v-tabs"), G = e({
	fixed: Boolean,
	sliderColor: String,
	sliderTransition: String,
	sliderTransitionDuration: [String, Number],
	hideSlider: Boolean,
	inset: Boolean,
	direction: {
		type: String,
		default: "horizontal"
	},
	...L(be({
		selectedClass: "v-tab--selected",
		variant: "text"
	}), [
		"active",
		"block",
		"flat",
		"location",
		"position",
		"symbol"
	])
}, "VTab"), K = h()({
	name: "VTab",
	props: G(),
	setup(e, { slots: t, attrs: n }) {
		let { textColorClasses: i, textColorStyles: a } = se(() => e.sliderColor), { backgroundColorClasses: o, backgroundColorStyles: s } = z(() => e.sliderColor), c = b(), l = b(), u = k(() => e.direction === "horizontal"), d = k(() => c.value?.group?.isSelected.value ?? !1);
		function f(e, t) {
			return { opacity: [0, 1] };
		}
		function p(t, n) {
			return e.direction === "vertical" ? { transform: ["scaleY(0)", "scaleY(1)"] } : { transform: ["scaleX(0)", "scaleX(1)"] };
		}
		function h(e, t) {
			let n = t.getBoundingClientRect(), r = e.getBoundingClientRect(), i = u.value ? "x" : "y", a = u.value ? "X" : "Y", o = u.value ? "right" : "bottom", s = u.value ? "width" : "height", c = n[i] > r[i] ? n[o] - r[o] : n[i] - r[i], l = Math.sign(c) > 0 ? u.value ? "right" : "bottom" : Math.sign(c) < 0 ? u.value ? "left" : "top" : "center", d = (Math.abs(c) + (Math.sign(c) < 0 ? n[s] : r[s])) / Math.max(n[s], r[s]) || 0, f = n[s] / r[s] || 0, p = 1.5;
			return {
				transform: [
					`translate${a}(${c}px) scale${a}(${f})`,
					`translate${a}(${c / p}px) scale${a}(${(d - 1) / p + 1})`,
					"none"
				],
				transformOrigin: [
					,
					,
					,
				].fill(l)
			};
		}
		function g({ value: t }) {
			if (t) {
				let t = c.value?.$el.parentElement?.querySelector(".v-tab--selected .v-tab__slider"), n = l.value;
				if (!t || !n) return;
				let r = getComputedStyle(t).backgroundColor, i = {
					fade: f,
					grow: p,
					shift: h
				}[e.sliderTransition ?? "shift"] ?? h, a = Number(e.sliderTransitionDuration) || ({
					fade: 400,
					grow: 350,
					shift: 225
				}[e.sliderTransition ?? "shift"] ?? 225);
				ae(n, {
					backgroundColor: [r, r],
					...i(n, t)
				}, {
					duration: a,
					easing: m
				});
			}
		}
		return B(() => {
			let u = H.filterProps(e);
			return R(H, r({
				symbol: W,
				ref: c,
				class: [
					"v-tab",
					e.class,
					d.value && e.inset ? o.value : []
				],
				style: [
					e.style,
					d.value && e.inset ? s.value : [],
					{ backgroundColor: d.value && e.inset ? "transparent !important" : void 0 }
				],
				tabindex: d.value ? 0 : -1,
				role: "tab",
				"aria-selected": String(d.value),
				active: !1
			}, u, n, {
				block: e.fixed,
				maxWidth: e.fixed ? 300 : void 0,
				"onGroup:selected": g
			}), {
				...t,
				default: () => F(T, null, [t.default?.() ?? e.text, !e.hideSlider && F("div", {
					ref: l,
					class: E(["v-tab__slider", e.inset ? o.value : i.value]),
					style: I([a.value, e.inset ? s.value : i.value])
				}, null)])
			});
		}), ye({}, c);
	}
}), Ee = (e, t) => {
	let { touchstartX: n, touchendX: r, touchstartY: i, touchendY: a } = e, o = .5;
	e.offsetX = r - n, e.offsetY = a - i, !t.x && Math.abs(e.offsetY) < o * Math.abs(e.offsetX) && (e.left && r < n - 16 && e.left(e), e.right && r > n + 16 && e.right(e)), !t.y && Math.abs(e.offsetX) < o * Math.abs(e.offsetY) && (e.up && a < i - 16 && e.up(e), e.down && a > i + 16 && e.down(e));
};
function De(e) {
	let t = [];
	for (let n = e instanceof Element ? e : null; n; n = n.parentElement) t.push([
		n,
		n.scrollLeft,
		n.scrollTop
	]);
	return () => ({
		x: t.some(([e, t]) => e.scrollLeft !== t),
		y: t.some(([e, , t]) => e.scrollTop !== t)
	});
}
function Oe(e, t) {
	let n = e.changedTouches[0];
	t.touchstartX = n.clientX, t.touchstartY = n.clientY, t.start?.({
		originalEvent: e,
		...t
	});
}
function ke(e, t, n) {
	let r = e.changedTouches[0];
	t.touchendX = r.clientX, t.touchendY = r.clientY, t.end?.({
		originalEvent: e,
		...t
	}), Ee(t, n);
}
function Ae(e, t) {
	let n = e.changedTouches[0];
	t.touchmoveX = n.clientX, t.touchmoveY = n.clientY, t.move?.({
		originalEvent: e,
		...t
	});
}
function je(e = {}) {
	let t = {
		touchstartX: 0,
		touchstartY: 0,
		touchendX: 0,
		touchendY: 0,
		touchmoveX: 0,
		touchmoveY: 0,
		offsetX: 0,
		offsetY: 0,
		left: e.left,
		right: e.right,
		up: e.up,
		down: e.down,
		start: e.start,
		move: e.move,
		end: e.end
	}, n = () => ({
		x: !1,
		y: !1
	});
	return {
		touchstart: (e) => {
			n = De(e.target), Oe(e, t);
		},
		touchend: (e) => ke(e, t, n()),
		touchmove: (e) => Ae(e, t)
	};
}
function q(e, t) {
	let n = t.value, r = n?.parent ? e.parentElement : e, i = n?.options ?? { passive: !0 }, a = t.instance?.$.uid;
	if (!n || !r || a === void 0) return;
	let o = je(t.value);
	r._touchHandlers = r._touchHandlers ?? Object.create(null), r._touchHandlers[a] = o, M(o).forEach((e) => {
		r.addEventListener(e, o[e], i);
	});
}
function J(e, t) {
	let n = t.value?.parent ? e.parentElement : e, r = t.instance?.$.uid;
	if (!n?._touchHandlers || r === void 0) return;
	let i = n._touchHandlers[r];
	i && (M(i).forEach((e) => {
		n.removeEventListener(e, i[e]);
	}), delete n._touchHandlers[r], M(n._touchHandlers).length || delete n._touchHandlers);
}
function Me(e, t) {
	t.value !== t.oldValue && (J(e, {
		...t,
		value: t.oldValue
	}), q(e, t));
}
var Y = {
	mounted: q,
	unmounted: J,
	updated: Me
}, X = Symbol.for("vuetify:v-window"), Z = Symbol.for("vuetify:v-window-group"), Q = e({
	continuous: Boolean,
	nextIcon: {
		type: [
			Boolean,
			String,
			Function,
			Object
		],
		default: "$next"
	},
	prevIcon: {
		type: [
			Boolean,
			String,
			Function,
			Object
		],
		default: "$prev"
	},
	reverse: Boolean,
	showArrows: {
		type: [Boolean, String],
		validator: (e) => d(e) || e === "hover"
	},
	verticalArrows: [Boolean, String],
	touch: {
		type: [Object, Boolean],
		default: void 0
	},
	direction: {
		type: String,
		default: "horizontal"
	},
	modelValue: null,
	disabled: Boolean,
	selectedClass: {
		type: String,
		default: "v-window-item--active"
	},
	mandatory: {
		type: [Boolean, String],
		default: "force"
	},
	crossfade: Boolean,
	transitionDuration: Number,
	...oe(),
	...V(),
	...w()
}, "VWindow"), $ = h()({
	name: "VWindow",
	directives: { vTouch: Y },
	props: Q(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let { themeClasses: r } = te(e), { isRtl: l } = ee(), { t: u } = ne(), d = Se(e, Z), f = b(), p = k(() => l.value ? !e.reverse : e.reverse), m = O(!1), h = k(() => e.crossfade ? "v-window-crossfade-transition" : `v-window-${e.direction === "vertical" ? "y" : "x"}${(p.value ? !m.value : m.value) ? "-reverse" : ""}-transition`), g = O(0), v = b(void 0), y = k(() => d.items.value.findIndex((e) => d.selected.value.includes(e.id)));
		c(y, (e, t) => {
			let r, i = {
				left: 0,
				top: 0
			};
			_ && t >= 0 && (r = le(f.value), i.left = r?.scrollLeft, i.top = r?.scrollTop);
			let a = d.items.value.length, o = a - 1;
			a <= 2 ? m.value = e < t : e === o && t === 0 ? m.value = !1 : e === 0 && t === o ? m.value = !0 : m.value = e < t, n(() => {
				_ && r && (r.scrollTop !== i.top && r.scrollTo({
					...i,
					behavior: "instant"
				}), requestAnimationFrame(() => {
					r && r.scrollTop !== i.top && r.scrollTo({
						...i,
						behavior: "instant"
					});
				}));
			});
		}, { flush: "sync" }), a(X, {
			transition: h,
			isReversed: m,
			transitionCount: g,
			transitionHeight: v,
			rootRef: f
		});
		let x = P(() => e.continuous || y.value !== 0), S = P(() => e.continuous || y.value !== d.items.value.length - 1);
		function C() {
			x.value && d.prev();
		}
		function w() {
			S.value && d.next();
		}
		let T = k(() => {
			let n = [], r = {
				icon: l.value ? e.nextIcon : e.prevIcon,
				class: `v-window__${p.value ? "right" : "left"}`,
				onClick: d.prev,
				"aria-label": u("$vuetify.carousel.prev")
			};
			n.push(x.value ? t.prev ? t.prev({ props: r }) : R(H, r, null) : F("div", null, null));
			let i = {
				icon: l.value ? e.prevIcon : e.nextIcon,
				class: `v-window__${p.value ? "left" : "right"}`,
				onClick: d.next,
				"aria-label": u("$vuetify.carousel.next")
			};
			return n.push(S.value ? t.next ? t.next({ props: i }) : R(H, i, null) : F("div", null, null)), n;
		}), D = k(() => e.touch === !1 ? e.touch : {
			left: () => {
				p.value ? C() : w();
			},
			right: () => {
				p.value ? w() : C();
			},
			start: ({ originalEvent: e }) => {
				e.stopPropagation();
			},
			...e.touch === !0 ? {} : e.touch
		});
		function A(t) {
			(e.direction === "horizontal" && t.key === "ArrowLeft" || e.direction === "vertical" && t.key === "ArrowUp") && (t.preventDefault(), C(), n(() => {
				x.value ? j(0) : j(1);
			})), (e.direction === "horizontal" && t.key === "ArrowRight" || e.direction === "vertical" && t.key === "ArrowDown") && (t.preventDefault(), w(), n(() => {
				S.value ? j(1) : j(0);
			}));
		}
		function j(e) {
			let t = T.value[e];
			t && (Array.isArray(t) ? t[0] : t).el?.focus();
		}
		return B(() => s(R(e.tag, {
			ref: f,
			class: E([
				"v-window",
				{
					"v-window--show-arrows-on-hover": e.showArrows === "hover",
					"v-window--vertical-arrows": !!e.verticalArrows,
					"v-window--crossfade": !!e.crossfade
				},
				r.value,
				e.class
			]),
			style: I([e.style, { "--v-window-transition-duration": i() ? null : o(e.transitionDuration, "ms") }])
		}, { default: () => [F("div", {
			class: "v-window__container",
			style: { height: v.value }
		}, [t.default?.({ group: d }), e.showArrows !== !1 && F("div", {
			class: E([
				"v-window__controls",
				{ "v-window__controls--left": e.verticalArrows === "left" || e.verticalArrows === !0 },
				{ "v-window__controls--right": e.verticalArrows === "right" }
			]),
			onKeydown: A
		}, [T.value])]), t.additional?.({ group: d })] }), [[Y, D.value]])), { group: d };
	}
}), Ne = e({ ...L(Q(), [
	"continuous",
	"nextIcon",
	"prevIcon",
	"showArrows",
	"touch",
	"mandatory"
]) }, "VTabsWindow"), Pe = h()({
	name: "VTabsWindow",
	props: Ne(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let n = g(W, null), i = A(e, "modelValue"), a = k({
			get() {
				return i.value != null || !n ? i.value : n.items.value.find((e) => n.selected.value.includes(e.id))?.value;
			},
			set(e) {
				i.value = e;
			}
		});
		return B(() => {
			let n = $.filterProps(e);
			return R($, r({ _as: "VTabsWindow" }, n, {
				modelValue: a.value,
				"onUpdate:modelValue": (e) => a.value = e,
				class: ["v-tabs-window", e.class],
				style: e.style,
				mandatory: !1,
				touch: !1
			}), t);
		}), {};
	}
}), Fe = e({
	reverseTransition: {
		type: [Boolean, String],
		default: void 0
	},
	transition: {
		type: [Boolean, String],
		default: void 0
	},
	...oe(),
	...Ce(),
	...ue()
}, "VWindowItem"), Ie = h()({
	name: "VWindowItem",
	directives: { vTouch: Y },
	props: Fe(),
	emits: { "group:selected": (e) => !0 },
	setup(e, { slots: t }) {
		let r = g(X), i = xe(e, Z), { isBooted: a } = he();
		if (!r || !i) throw Error("[Vuetify] VWindowItem must be used inside VWindow");
		let c = O(!1), u = k(() => a.value && (r.isReversed.value ? e.reverseTransition !== !1 : e.transition !== !1));
		function d() {
			c.value && r && (c.value = !1, r.transitionCount.value > 0 && (--r.transitionCount.value, r.transitionCount.value === 0 && (r.transitionHeight.value = void 0)));
		}
		function f() {
			!c.value && r && (c.value = !0, r.transitionCount.value === 0 && (r.transitionHeight.value = o(r.rootRef.value?.clientHeight)), r.transitionCount.value += 1);
		}
		function p() {
			d();
		}
		function m(e) {
			c.value && n(() => {
				u.value && c.value && r && (r.transitionHeight.value = o(e.clientHeight));
			});
		}
		let h = k(() => {
			let t = r.isReversed.value ? e.reverseTransition : e.transition;
			return u.value ? {
				name: l(t) ? t : r.transition.value,
				onBeforeEnter: f,
				onAfterEnter: d,
				onEnterCancelled: p,
				onBeforeLeave: f,
				onAfterLeave: d,
				onLeaveCancelled: p,
				onEnter: m
			} : !1;
		}), { hasContent: _ } = de(e, i.isSelected);
		return B(() => R(ve, {
			transition: h.value,
			disabled: !a.value
		}, { default: () => [s(F("div", {
			class: E([
				"v-window-item",
				i.selectedClass.value,
				e.class
			]),
			style: I(e.style)
		}, [_.value && t.default?.()]), [[re, i.isSelected.value]])] })), { groupItem: i };
	}
}), Le = e({ ...Fe() }, "VTabsWindowItem"), Re = h()({
	name: "VTabsWindowItem",
	props: Le(),
	setup(e, { slots: t }) {
		return B(() => {
			let n = Ie.filterProps(e);
			return R(Ie, r({ _as: "VTabsWindowItem" }, n, {
				class: ["v-tabs-window-item", e.class],
				style: e.style
			}), t);
		}), {};
	}
});
//#endregion
//#region node_modules/vuetify/lib/components/VTabs/VTabs.js
function ze(e) {
	return e ? e.map((e) => v(e) ? e : {
		text: e,
		value: e
	}) : [];
}
var Be = e({
	alignTabs: {
		type: String,
		default: "start"
	},
	color: String,
	fixedTabs: Boolean,
	items: {
		type: Array,
		default: () => []
	},
	stacked: Boolean,
	bgColor: String,
	grow: Boolean,
	height: {
		type: [Number, String],
		default: void 0
	},
	hideSlider: Boolean,
	inset: Boolean,
	insetPadding: [String, Number],
	insetRadius: [String, Number],
	sliderColor: String,
	...C(G(), [
		"spaced",
		"sliderTransition",
		"sliderTransitionDuration"
	]),
	...we({
		mandatory: "force",
		selectedClass: "v-tab-item--selected"
	}),
	..._e(),
	...V()
}, "VTabs"), Ve = h()({
	name: "VTabs",
	props: Be(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { attrs: n, slots: i }) {
		let a = A(e, "modelValue"), s = k(() => ze(e.items)), { densityClasses: c } = ge(e), { backgroundColorClasses: l, backgroundColorStyles: u } = z(() => e.bgColor), { scopeId: d } = fe();
		return t({ VTab: {
			color: P(e, "color"),
			direction: P(e, "direction"),
			stacked: P(e, "stacked"),
			fixed: P(e, "fixedTabs"),
			inset: P(e, "inset"),
			sliderColor: P(e, "sliderColor"),
			sliderTransition: P(e, "sliderTransition"),
			sliderTransitionDuration: P(e, "sliderTransitionDuration"),
			hideSlider: P(e, "hideSlider")
		} }), B(() => {
			let t = U.filterProps(e), f = !!(i.window || e.items.length > 0);
			return F(T, null, [R(U, r(t, {
				modelValue: a.value,
				"onUpdate:modelValue": (e) => a.value = e,
				class: [
					"v-tabs",
					`v-tabs--${e.direction}`,
					`v-tabs--align-tabs-${e.alignTabs}`,
					{
						"v-tabs--fixed-tabs": e.fixedTabs,
						"v-tabs--grow": e.grow,
						"v-tabs--inset": e.inset,
						"v-tabs--stacked": e.stacked
					},
					c.value,
					l.value,
					e.class
				],
				style: [
					{
						"--v-tabs-height": o(e.height),
						"--v-tabs-inset-padding": e.inset ? o(e.insetPadding) : void 0,
						"--v-tabs-inset-radius": e.inset ? o(e.insetRadius) : void 0
					},
					u.value,
					e.style
				],
				role: "tablist",
				symbol: W
			}, d, n), {
				default: i.default ?? (() => s.value.map((t) => i.tab?.({ item: t }) ?? R(K, r(t, {
					key: t.text,
					value: t.value,
					spaced: e.spaced
				}), { default: i[`tab.${t.value}`] ? () => i[`tab.${t.value}`]?.({ item: t }) : void 0 }))),
				prev: i.prev,
				next: i.next
			}), f && R(Pe, r({
				modelValue: a.value,
				"onUpdate:modelValue": (e) => a.value = e,
				key: "tabs-window"
			}, d), { default: () => [s.value.map((e) => i.item?.({ item: e }) ?? R(Re, { value: e.value }, { default: () => i[`item.${e.value}`]?.({ item: e }) })), i.window?.()] })]);
		}), {};
	}
}), He = /* @__PURE__ */ S({
	__name: "TabsView",
	props: {
		tabs: {},
		current: {},
		inset: { type: Boolean }
	},
	emits: ["select"],
	setup(e, { emit: t }) {
		let n = t;
		return (t, r) => (p(), N(x(Ve), {
			"model-value": e.current,
			color: "primary",
			class: E({ "px-2": e.inset }),
			"data-part": "tabs",
			"onUpdate:modelValue": r[0] ||= (e) => n("select", e)
		}, {
			default: y(() => [(p(!0), j(T, null, u(e.tabs, (e) => (p(), N(x(K), {
				key: e.value,
				value: e.value,
				disabled: e.disabled,
				"prepend-icon": e.icon || void 0,
				"data-tab": e.value
			}, {
				default: y(() => [ie(D(e.label), 1)]),
				_: 2
			}, 1032, [
				"value",
				"disabled",
				"prepend-icon",
				"data-tab"
			]))), 128))]),
			_: 1
		}, 8, ["model-value", "class"]));
	}
}), Ue = {
	class: "smartview-root smartview-tabs",
	"data-part": "root"
}, We = {
	role: "tabpanel",
	"data-part": "panel"
};
//#endregion
//#region src/entries/smartview-tabs.ts
ce("smartview-tabs", /* @__PURE__ */ S({
	__name: "SmartviewTabs.ce",
	props: {
		tabs: {
			default: () => [],
			type: Array
		},
		tab: {
			default: "",
			type: String
		}
	},
	emits: ["tab-change"],
	setup(e, { emit: t }) {
		let n = e, r = t, i = k(() => Array.isArray(n.tabs) ? n.tabs : []), { current: a, select: o } = Te(() => i.value, () => n.tab, (e) => r("tab-change", e));
		return (e, t) => (p(), j("div", Ue, [
			R(He, {
				tabs: i.value,
				current: x(a),
				inset: !1,
				onSelect: x(o)
			}, null, 8, [
				"tabs",
				"current",
				"onSelect"
			]),
			R(x(me)),
			F("div", We, [(p(!0), j(T, null, u([`tab-${x(a)}`], (t) => f(e.$slots, t, {}, () => [f(e.$slots, "default")], void 0, t)), 128))])
		]));
	}
}));
//#endregion
