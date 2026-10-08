import { A as e, Bn as t, D as n, En as r, Et as i, G as a, Hn as o, Ht as s, It as c, Jn as l, Mn as u, Nn as d, S as f, Sn as p, T as m, Tn as h, Tt as g, Un as _, Vn as ee, Vt as v, Xn as y, Zn as b, _r as x, bn as S, bt as C, c as w, cr as T, dr as E, fn as D, g as O, gr as k, h as te, ht as A, jn as j, l as ne, m as re, mn as M, mr as N, or as P, rr as F, vn as I, vt as L, wn as ie, yn as R } from "../chunks/vuetify-C39-WP9g.js";
import { t as ae } from "../chunks/animation-B_ZSS1p4.js";
import { a as z, c as B, l as V, n as H, s as oe, t as se } from "../chunks/define-BovISfN4.js";
import { i as ce, n as le, r as ue, t as de } from "../chunks/scopeId-3i3jaqkB.js";
import { t as fe } from "../chunks/hostValue-CjEvr2gM.js";
import { t as pe } from "../chunks/VDivider-CA-IOlps.js";
import { n as me, t as he } from "../chunks/density-9WZgplEH.js";
import { t as ge } from "../chunks/ssrBoot-SlAOwzRN.js";
import { t as _e } from "../chunks/transition-Cv515_M1.js";
import { t as ve } from "../chunks/forwardRefs-mn8VYMvs.js";
import { n as ye, t as U } from "../chunks/VBtn-CV2MWNTN.js";
import { i as be, r as xe, t as Se } from "../chunks/group-BD9eNBcR.js";
import { r as Ce, t as W } from "../chunks/VSlideGroup-Cw8ThMHD.js";
//#region src/runtime/tabs.ts
function we(e, t, n) {
	let { current: r, commit: i } = fe("tab", t), a = I(() => {
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
var G = Symbol.for("vuetify:v-tabs"), K = e({
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
	...L(ye({
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
}, "VTab"), q = m()({
	name: "VTab",
	props: K(),
	setup(e, { slots: t, attrs: n }) {
		let { textColorClasses: r, textColorStyles: i } = oe(() => e.sliderColor), { backgroundColorClasses: a, backgroundColorStyles: o } = z(() => e.sliderColor), s = F(), c = F(), l = I(() => e.direction === "horizontal"), d = I(() => s.value?.group?.isSelected.value ?? !1);
		function p(e, t) {
			return { opacity: [0, 1] };
		}
		function m(t, n) {
			return e.direction === "vertical" ? { transform: ["scaleY(0)", "scaleY(1)"] } : { transform: ["scaleX(0)", "scaleX(1)"] };
		}
		function g(e, t) {
			let n = t.getBoundingClientRect(), r = e.getBoundingClientRect(), i = l.value ? "x" : "y", a = l.value ? "X" : "Y", o = l.value ? "right" : "bottom", s = l.value ? "width" : "height", c = n[i] > r[i] ? n[o] - r[o] : n[i] - r[i], u = Math.sign(c) > 0 ? l.value ? "right" : "bottom" : Math.sign(c) < 0 ? l.value ? "left" : "top" : "center", d = (Math.abs(c) + (Math.sign(c) < 0 ? n[s] : r[s])) / Math.max(n[s], r[s]) || 0, f = n[s] / r[s] || 0, p = 1.5;
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
				].fill(u)
			};
		}
		function _({ value: t }) {
			if (t) {
				let t = s.value?.$el.parentElement?.querySelector(".v-tab--selected .v-tab__slider"), n = c.value;
				if (!t || !n) return;
				let r = getComputedStyle(t).backgroundColor, i = {
					fade: p,
					grow: m,
					shift: g
				}[e.sliderTransition ?? "shift"] ?? g, a = Number(e.sliderTransitionDuration) || ({
					fade: 400,
					grow: 350,
					shift: 225
				}[e.sliderTransition ?? "shift"] ?? 225);
				ae(n, {
					backgroundColor: [r, r],
					...i(n, t)
				}, {
					duration: a,
					easing: f
				});
			}
		}
		return B(() => {
			let l = U.filterProps(e);
			return h(U, u({
				symbol: G,
				ref: s,
				class: [
					"v-tab",
					e.class,
					d.value && e.inset ? a.value : []
				],
				style: [
					e.style,
					d.value && e.inset ? o.value : [],
					{ backgroundColor: d.value && e.inset ? "transparent !important" : void 0 }
				],
				tabindex: d.value ? 0 : -1,
				role: "tab",
				"aria-selected": String(d.value),
				active: !1
			}, l, n, {
				block: e.fixed,
				maxWidth: e.fixed ? 300 : void 0,
				"onGroup:selected": _
			}), {
				...t,
				default: () => R(M, null, [t.default?.() ?? e.text, !e.hideSlider && R("div", {
					ref: c,
					class: N(["v-tab__slider", e.inset ? a.value : r.value]),
					style: k([i.value, e.inset ? o.value : r.value])
				}, null)])
			});
		}), ve({}, s);
	}
}), Te = (e, t) => {
	let { touchstartX: n, touchendX: r, touchstartY: i, touchendY: a } = e, o = .5;
	e.offsetX = r - n, e.offsetY = a - i, !t.x && Math.abs(e.offsetY) < o * Math.abs(e.offsetX) && (e.left && r < n - 16 && e.left(e), e.right && r > n + 16 && e.right(e)), !t.y && Math.abs(e.offsetX) < o * Math.abs(e.offsetY) && (e.up && a < i - 16 && e.up(e), e.down && a > i + 16 && e.down(e));
};
function Ee(e) {
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
function De(e, t) {
	let n = e.changedTouches[0];
	t.touchstartX = n.clientX, t.touchstartY = n.clientY, t.start?.({
		originalEvent: e,
		...t
	});
}
function Oe(e, t, n) {
	let r = e.changedTouches[0];
	t.touchendX = r.clientX, t.touchendY = r.clientY, t.end?.({
		originalEvent: e,
		...t
	}), Te(t, n);
}
function ke(e, t) {
	let n = e.changedTouches[0];
	t.touchmoveX = n.clientX, t.touchmoveY = n.clientY, t.move?.({
		originalEvent: e,
		...t
	});
}
function Ae(e = {}) {
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
			n = Ee(e.target), De(e, t);
		},
		touchend: (e) => Oe(e, t, n()),
		touchmove: (e) => ke(e, t)
	};
}
function J(e, t) {
	let n = t.value, r = n?.parent ? e.parentElement : e, i = n?.options ?? { passive: !0 }, a = t.instance?.$.uid;
	if (!n || !r || a === void 0) return;
	let o = Ae(t.value);
	r._touchHandlers = r._touchHandlers ?? Object.create(null), r._touchHandlers[a] = o, A(o).forEach((e) => {
		r.addEventListener(e, o[e], i);
	});
}
function Y(e, t) {
	let n = t.value?.parent ? e.parentElement : e, r = t.instance?.$.uid;
	if (!n?._touchHandlers || r === void 0) return;
	let i = n._touchHandlers[r];
	i && (A(i).forEach((e) => {
		n.removeEventListener(e, i[e]);
	}), delete n._touchHandlers[r], A(n._touchHandlers).length || delete n._touchHandlers);
}
function je(e, t) {
	t.value !== t.oldValue && (Y(e, {
		...t,
		value: t.oldValue
	}), J(e, t));
}
var X = {
	mounted: J,
	unmounted: Y,
	updated: je
}, Z = Symbol.for("vuetify:v-window"), Q = Symbol.for("vuetify:v-window-group"), $ = e({
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
		validator: (e) => c(e) || e === "hover"
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
	...V(),
	...H(),
	...w()
}, "VWindow"), Me = m()({
	name: "VWindow",
	directives: { vTouch: X },
	props: $(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let { themeClasses: n } = ne(e), { isRtl: r } = te(), { t: o } = re(), s = xe(e, Q), c = F(), u = I(() => r.value ? !e.reverse : e.reverse), f = P(!1), p = I(() => e.crossfade ? "v-window-crossfade-transition" : `v-window-${e.direction === "vertical" ? "y" : "x"}${(u.value ? !f.value : f.value) ? "-reverse" : ""}-transition`), m = P(0), _ = F(void 0), v = I(() => s.items.value.findIndex((e) => s.selected.value.includes(e.id)));
		l(v, (e, t) => {
			let n, r = {
				left: 0,
				top: 0
			};
			g && t >= 0 && (n = ce(c.value), r.left = n?.scrollLeft, r.top = n?.scrollTop);
			let i = s.items.value.length, a = i - 1;
			i <= 2 ? f.value = e < t : e === a && t === 0 ? f.value = !1 : e === 0 && t === a ? f.value = !0 : f.value = e < t, d(() => {
				g && n && (n.scrollTop !== r.top && n.scrollTo({
					...r,
					behavior: "instant"
				}), requestAnimationFrame(() => {
					n && n.scrollTop !== r.top && n.scrollTo({
						...r,
						behavior: "instant"
					});
				}));
			});
		}, { flush: "sync" }), ee(Z, {
			transition: p,
			isReversed: f,
			transitionCount: m,
			transitionHeight: _,
			rootRef: c
		});
		let y = T(() => e.continuous || v.value !== 0), x = T(() => e.continuous || v.value !== s.items.value.length - 1);
		function S() {
			y.value && s.prev();
		}
		function C() {
			x.value && s.next();
		}
		let w = I(() => {
			let n = [], i = {
				icon: r.value ? e.nextIcon : e.prevIcon,
				class: `v-window__${u.value ? "right" : "left"}`,
				onClick: s.prev,
				"aria-label": o("$vuetify.carousel.prev")
			};
			n.push(y.value ? t.prev ? t.prev({ props: i }) : h(U, i, null) : R("div", null, null));
			let a = {
				icon: r.value ? e.prevIcon : e.nextIcon,
				class: `v-window__${u.value ? "left" : "right"}`,
				onClick: s.next,
				"aria-label": o("$vuetify.carousel.next")
			};
			return n.push(x.value ? t.next ? t.next({ props: a }) : h(U, a, null) : R("div", null, null)), n;
		}), E = I(() => e.touch === !1 ? e.touch : {
			left: () => {
				u.value ? S() : C();
			},
			right: () => {
				u.value ? C() : S();
			},
			start: ({ originalEvent: e }) => {
				e.stopPropagation();
			},
			...e.touch === !0 ? {} : e.touch
		});
		function D(t) {
			(e.direction === "horizontal" && t.key === "ArrowLeft" || e.direction === "vertical" && t.key === "ArrowUp") && (t.preventDefault(), S(), d(() => {
				y.value ? O(0) : O(1);
			})), (e.direction === "horizontal" && t.key === "ArrowRight" || e.direction === "vertical" && t.key === "ArrowDown") && (t.preventDefault(), C(), d(() => {
				x.value ? O(1) : O(0);
			}));
		}
		function O(e) {
			let t = w.value[e];
			t && (Array.isArray(t) ? t[0] : t).el?.focus();
		}
		return B(() => b(h(e.tag, {
			ref: c,
			class: N([
				"v-window",
				{
					"v-window--show-arrows-on-hover": e.showArrows === "hover",
					"v-window--vertical-arrows": !!e.verticalArrows,
					"v-window--crossfade": !!e.crossfade
				},
				n.value,
				e.class
			]),
			style: k([e.style, { "--v-window-transition-duration": i() ? null : a(e.transitionDuration, "ms") }])
		}, { default: () => [R("div", {
			class: "v-window__container",
			style: { height: _.value }
		}, [t.default?.({ group: s }), e.showArrows !== !1 && R("div", {
			class: N([
				"v-window__controls",
				{ "v-window__controls--left": e.verticalArrows === "left" || e.verticalArrows === !0 },
				{ "v-window__controls--right": e.verticalArrows === "right" }
			]),
			onKeydown: D
		}, [w.value])]), t.additional?.({ group: s })] }), [[X, E.value]])), { group: s };
	}
}), Ne = e({ ...L($(), [
	"continuous",
	"nextIcon",
	"prevIcon",
	"showArrows",
	"touch",
	"mandatory"
]) }, "VTabsWindow"), Pe = m()({
	name: "VTabsWindow",
	props: Ne(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: t }) {
		let n = j(G, null), r = O(e, "modelValue"), i = I({
			get() {
				return r.value != null || !n ? r.value : n.items.value.find((e) => n.selected.value.includes(e.id))?.value;
			},
			set(e) {
				r.value = e;
			}
		});
		return B(() => {
			let n = Me.filterProps(e);
			return h(Me, u({ _as: "VTabsWindow" }, n, {
				modelValue: i.value,
				"onUpdate:modelValue": (e) => i.value = e,
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
	...V(),
	...Se(),
	...le()
}, "VWindowItem"), Ie = m()({
	name: "VWindowItem",
	directives: { vTouch: X },
	props: Fe(),
	emits: { "group:selected": (e) => !0 },
	setup(e, { slots: t }) {
		let n = j(Z), r = be(e, Q), { isBooted: i } = ge();
		if (!n || !r) throw Error("[Vuetify] VWindowItem must be used inside VWindow");
		let o = P(!1), c = I(() => i.value && (n.isReversed.value ? e.reverseTransition !== !1 : e.transition !== !1));
		function l() {
			o.value && n && (o.value = !1, n.transitionCount.value > 0 && (--n.transitionCount.value, n.transitionCount.value === 0 && (n.transitionHeight.value = void 0)));
		}
		function u() {
			!o.value && n && (o.value = !0, n.transitionCount.value === 0 && (n.transitionHeight.value = a(n.rootRef.value?.clientHeight)), n.transitionCount.value += 1);
		}
		function f() {
			l();
		}
		function p(e) {
			o.value && d(() => {
				c.value && o.value && n && (n.transitionHeight.value = a(e.clientHeight));
			});
		}
		let m = I(() => {
			let t = n.isReversed.value ? e.reverseTransition : e.transition;
			return c.value ? {
				name: s(t) ? t : n.transition.value,
				onBeforeEnter: u,
				onAfterEnter: l,
				onEnterCancelled: f,
				onBeforeLeave: u,
				onAfterLeave: l,
				onLeaveCancelled: f,
				onEnter: p
			} : !1;
		}), { hasContent: g } = ue(e, r.isSelected);
		return B(() => h(_e, {
			transition: m.value,
			disabled: !i.value
		}, { default: () => [b(R("div", {
			class: N([
				"v-window-item",
				r.selectedClass.value,
				e.class
			]),
			style: k(e.style)
		}, [g.value && t.default?.()]), [[D, r.isSelected.value]])] })), { groupItem: r };
	}
}), Le = e({ ...Fe() }, "VTabsWindowItem"), Re = m()({
	name: "VTabsWindowItem",
	props: Le(),
	setup(e, { slots: t }) {
		return B(() => {
			let n = Ie.filterProps(e);
			return h(Ie, u({ _as: "VTabsWindowItem" }, n, {
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
	...C(K(), [
		"spaced",
		"sliderTransition",
		"sliderTransitionDuration"
	]),
	...Ce({
		mandatory: "force",
		selectedClass: "v-tab-item--selected"
	}),
	...he(),
	...H()
}, "VTabs"), Ve = m()({
	name: "VTabs",
	props: Be(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { attrs: t, slots: r }) {
		let i = O(e, "modelValue"), o = I(() => ze(e.items)), { densityClasses: s } = me(e), { backgroundColorClasses: c, backgroundColorStyles: l } = z(() => e.bgColor), { scopeId: d } = de();
		return n({ VTab: {
			color: T(e, "color"),
			direction: T(e, "direction"),
			stacked: T(e, "stacked"),
			fixed: T(e, "fixedTabs"),
			inset: T(e, "inset"),
			sliderColor: T(e, "sliderColor"),
			sliderTransition: T(e, "sliderTransition"),
			sliderTransitionDuration: T(e, "sliderTransitionDuration"),
			hideSlider: T(e, "hideSlider")
		} }), B(() => {
			let n = W.filterProps(e), f = !!(r.window || e.items.length > 0);
			return R(M, null, [h(W, u(n, {
				modelValue: i.value,
				"onUpdate:modelValue": (e) => i.value = e,
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
					s.value,
					c.value,
					e.class
				],
				style: [
					{
						"--v-tabs-height": a(e.height),
						"--v-tabs-inset-padding": e.inset ? a(e.insetPadding) : void 0,
						"--v-tabs-inset-radius": e.inset ? a(e.insetRadius) : void 0
					},
					l.value,
					e.style
				],
				role: "tablist",
				symbol: G
			}, d, t), {
				default: r.default ?? (() => o.value.map((t) => r.tab?.({ item: t }) ?? h(q, u(t, {
					key: t.text,
					value: t.value,
					spaced: e.spaced
				}), { default: r[`tab.${t.value}`] ? () => r[`tab.${t.value}`]?.({ item: t }) : void 0 }))),
				prev: r.prev,
				next: r.next
			}), f && h(Pe, u({
				modelValue: i.value,
				"onUpdate:modelValue": (e) => i.value = e,
				key: "tabs-window"
			}, d), { default: () => [o.value.map((e) => r.item?.({ item: e }) ?? h(Re, { value: e.value }, { default: () => r[`item.${e.value}`]?.({ item: e }) })), r.window?.()] })]);
		}), {};
	}
}), He = /* @__PURE__ */ r({
	__name: "TabsView",
	props: {
		tabs: {},
		current: {},
		inset: { type: Boolean }
	},
	emits: ["select"],
	setup(e, { emit: n }) {
		let r = n;
		return (n, i) => (t(), S(E(Ve), {
			"model-value": e.current,
			color: "primary",
			class: N({ "px-2": e.inset }),
			"data-part": "tabs",
			"onUpdate:modelValue": i[0] ||= (e) => r("select", e)
		}, {
			default: y(() => [(t(!0), p(M, null, o(e.tabs, (e) => (t(), S(E(q), {
				key: e.value,
				value: e.value,
				disabled: e.disabled,
				"prepend-icon": e.icon || void 0,
				"data-tab": e.value
			}, {
				default: y(() => [ie(x(e.label), 1)]),
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
se("smartview-tabs", /* @__PURE__ */ r({
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
	setup(e, { emit: n }) {
		let r = e, i = n, a = I(() => Array.isArray(r.tabs) ? r.tabs : []), { current: s, select: c } = we(() => a.value, () => r.tab, (e) => i("tab-change", e));
		return (e, n) => (t(), p("div", Ue, [
			h(He, {
				tabs: a.value,
				current: E(s),
				inset: !1,
				onSelect: E(c)
			}, null, 8, [
				"tabs",
				"current",
				"onSelect"
			]),
			h(E(pe)),
			R("div", We, [(t(!0), p(M, null, o([`tab-${E(s)}`], (t) => _(e.$slots, t, {}, () => [_(e.$slots, "default")], void 0, t)), 128))])
		]));
	}
}));
//#endregion
