import { A as e, An as t, B as n, Bt as r, D as i, Dn as a, E as o, En as s, Fn as c, G as l, Hn as u, Ht as d, In as f, It as p, Kt as m, Lt as h, O as g, Pn as _, Rn as v, Sn as y, T as b, Tn as x, Un as S, V as C, Vt as w, W as T, Wn as E, Yt as D, Zn as O, _n as ee, ar as k, at as A, bn as j, bt as M, c as te, cn as N, cr as P, dr as F, dt as I, en as ne, er as L, f as R, fn as z, ft as B, g as V, gn as H, h as re, hn as U, ir as W, l as ie, lr as G, m as K, mn as q, mt as ae, nr as J, ot as oe, p as se, pn as Y, pt as ce, rr as le, sn as ue, sr as de, tr as fe, ur as pe, v as X, vn as me, vt as he, w as ge, wt as _e, xt as ve, yn as Z } from "../chunks/vuetify-DJ4bsPds.js";
import { a as ye, d as be, i as xe, t as Se } from "../chunks/VSelect-tmFN_T5n.js";
import { a as Ce, t as we } from "../chunks/rounded-CXkAtXly.js";
import { i as Te } from "../chunks/VOverlay-BI1rs3Fd.js";
import { a as Ee, c as Q, l as De, n as Oe, r as ke, t as Ae } from "../chunks/define-BG7hCbXs.js";
import { n as je } from "../chunks/ripple-B14E6MmL.js";
import { t as Me } from "../chunks/resizeObserver-iAwW3s60.js";
import { t as Ne } from "../chunks/cancelableLink-DUAoXNUy.js";
import { n as Pe, t as Fe } from "../chunks/hostValue-Q4jXLLiG.js";
import { n as Ie } from "../chunks/ssrBoot-BMVtmVZ_.js";
import { a as Le, n as Re, t as ze } from "../chunks/density-Dh8nVFPw.js";
import { t as Be } from "../chunks/transitions-CbTxUG_W.js";
import { t as Ve } from "../chunks/transition-Dl3j6lCH.js";
import { t as He } from "../chunks/VAvatar-B5evLdR9.js";
import { a as Ue, c as We, u as Ge } from "../chunks/router-BNmKTwUJ.js";
import { t as Ke } from "../chunks/VTooltip-2jm4OuLA.js";
import { t as $ } from "../chunks/VBtn-D2PPPp70.js";
import { i as qe, n as Je, r as Ye, t as Xe } from "../chunks/loader-3S-Ajd36.js";
import { t as Ze } from "../chunks/VChip-Dqfk0_yh.js";
import { t as Qe } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as $e, r as et, t as tt } from "../chunks/status-J4FIN71L.js";
import { t as nt } from "../chunks/StatusChipView-D9jwXAKX.js";
import { t as rt } from "../chunks/VCard-CIgInzZL.js";
import { t as it } from "../chunks/VSwitch-rcpcpGXz.js";
import { t as at } from "../chunks/VCheckboxBtn-BD1XFHaj.js";
import { n as ot, r as st } from "../chunks/format-CSc3hJdu.js";
import { t as ct } from "../chunks/EmptyStateView-OOc_A5tE.js";
//#region node_modules/vuetify/lib/util/events.js
function lt(e, t, n) {
	return Object.keys(e).filter((e) => B(e) && e.endsWith(t)).reduce((r, i) => (r[i.slice(0, -t.length)] = (t) => C(e[i], t, n(t)), r), {});
}
//#endregion
//#region node_modules/vuetify/lib/composables/refs.js
function ut() {
	let e = O([]);
	t(() => e.value = []);
	function n(t, n) {
		e.value[n] = t;
	}
	return {
		refs: e,
		updateRef: n
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VPagination/VPagination.js
var dt = e({
	activeColor: String,
	start: {
		type: [Number, String],
		default: 1
	},
	modelValue: {
		type: Number,
		default: (e) => e.start
	},
	disabled: Boolean,
	length: {
		type: [Number, String],
		default: 1,
		validator: (e) => e % 1 == 0
	},
	totalVisible: [Number, String],
	firstIcon: {
		type: X,
		default: "$first"
	},
	prevIcon: {
		type: X,
		default: "$prev"
	},
	nextIcon: {
		type: X,
		default: "$next"
	},
	lastIcon: {
		type: X,
		default: "$last"
	},
	ariaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.root"
	},
	pageAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.page"
	},
	currentPageAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.currentPage"
	},
	firstAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.first"
	},
	previousAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.previous"
	},
	nextAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.next"
	},
	lastAriaLabel: {
		type: String,
		default: "$vuetify.pagination.ariaLabel.last"
	},
	ellipsis: {
		type: String,
		default: "..."
	},
	showFirstLastPage: {
		type: [Boolean, String],
		default: !1
	},
	...Ge(),
	...De(),
	...ze(),
	...Ue(),
	...we(),
	...ke(),
	...Oe({ tag: "nav" }),
	...te(),
	...We({ variant: "text" })
}, "VPagination"), ft = b()({
	name: "VPagination",
	props: dt(),
	emits: {
		"update:modelValue": (e) => !0,
		first: (e) => !0,
		prev: (e) => !0,
		next: (e) => !0,
		last: (e) => !0
	},
	setup(e, { slots: t, emit: n }) {
		let r = V(e, "modelValue"), { t: o, n: c } = K(), { isRtl: l } = re(), { themeClasses: u } = ie(e), { width: f } = se(), p = L(-1);
		i(void 0, { scoped: !0 });
		let { resizeRef: h } = Me((e) => {
			if (!e.length) return;
			let { target: t, contentRect: n } = e[0], r = t.querySelector(".v-pagination__list > *");
			if (!r) return;
			let i = n.width, a = r.offsetWidth + parseFloat(getComputedStyle(r).marginRight) * 2;
			p.value = y(i, a);
		}), g = z(() => parseInt(e.length, 10)), _ = z(() => parseInt(e.start, 10)), v = z(() => e.totalVisible == null ? p.value >= 0 ? p.value : y(f.value, 58) : parseInt(e.totalVisible, 10));
		function y(t, n) {
			let r = e.showFirstLastPage ? 5 : 3;
			return Math.max(0, Math.floor(Number(((t - n * r) / n).toFixed(2))));
		}
		let b = z(() => {
			if (g.value <= 0 || isNaN(g.value) || g.value > 2 ** 53 - 1) return [];
			if (e.totalVisible == null && g.value < 3) return m(g.value, _.value);
			if (v.value <= 0) return [];
			if (v.value === 1) return [r.value];
			if (g.value <= v.value) return m(g.value, _.value);
			let t = v.value % 2 == 0, n = t ? v.value / 2 : Math.floor(v.value / 2), i = t ? n : n + 1, a = g.value - n;
			if (i - r.value >= 0) return [
				...m(Math.max(1, v.value - 1), _.value),
				e.ellipsis,
				g.value
			];
			if (r.value - a >= +!!t) {
				let t = v.value - 1, n = g.value - t + _.value;
				return [
					_.value,
					e.ellipsis,
					...m(t, n)
				];
			}
			{
				let t = Math.max(1, v.value - 2), n = t === 1 ? r.value : r.value - Math.ceil(t / 2) + _.value;
				return [
					_.value,
					e.ellipsis,
					...m(t, n),
					e.ellipsis,
					g.value
				];
			}
		});
		function x(e, t, i) {
			e.preventDefault(), r.value = t, i && n(i, t);
		}
		let { refs: S, updateRef: C } = ut();
		i({ VPaginationBtn: {
			color: J(() => e.color),
			border: J(() => e.border),
			density: J(() => e.density),
			size: J(() => e.size),
			variant: J(() => e.variant),
			rounded: J(() => e.rounded),
			elevation: J(() => e.elevation)
		} });
		let w = z(() => b.value.map((t, n) => {
			let i = (e) => C(e, n);
			if (d(t)) return {
				isActive: !1,
				key: `ellipsis-${n}`,
				page: t,
				props: {
					ref: i,
					ellipsis: !0,
					icon: !0,
					disabled: !0
				}
			};
			{
				let n = t === r.value;
				return {
					isActive: n,
					key: t,
					page: c(t),
					props: {
						ref: i,
						ellipsis: !1,
						icon: !0,
						disabled: !!e.disabled || Number(e.length) < 2,
						color: n ? e.activeColor : e.color,
						"aria-current": n,
						"aria-label": o(n ? e.currentPageAriaLabel : e.pageAriaLabel, t),
						onClick: (e) => x(e, t)
					}
				};
			}
		})), T = z(() => {
			let t = !!e.disabled || r.value <= _.value, n = !!e.disabled || r.value >= _.value + g.value - 1;
			return {
				first: [!0, "only-first"].includes(e.showFirstLastPage) ? {
					icon: l.value ? e.lastIcon : e.firstIcon,
					onClick: (e) => x(e, _.value, "first"),
					disabled: t,
					"aria-label": o(e.firstAriaLabel),
					"aria-disabled": t
				} : void 0,
				prev: {
					icon: l.value ? e.nextIcon : e.prevIcon,
					onClick: (e) => x(e, r.value - 1, "prev"),
					disabled: t,
					"aria-label": o(e.previousAriaLabel),
					"aria-disabled": t
				},
				next: {
					icon: l.value ? e.prevIcon : e.nextIcon,
					onClick: (e) => x(e, r.value + 1, "next"),
					disabled: n,
					"aria-label": o(e.nextAriaLabel),
					"aria-disabled": n
				},
				last: e.showFirstLastPage === !0 ? {
					icon: l.value ? e.firstIcon : e.lastIcon,
					onClick: (e) => x(e, _.value + g.value - 1, "last"),
					disabled: n,
					"aria-label": o(e.lastAriaLabel),
					"aria-disabled": n
				} : void 0
			};
		});
		function E() {
			let e = r.value - _.value;
			S.value[e]?.$el.focus();
		}
		function D(t) {
			t.key === ae.left && !e.disabled && r.value > Number(e.start) ? (--r.value, a(E)) : t.key === ae.right && !e.disabled && r.value < _.value + g.value - 1 && (r.value += 1, a(E));
		}
		return Q(() => Z(e.tag, {
			ref: h,
			class: P([
				"v-pagination",
				u.value,
				e.class
			]),
			style: pe(e.style),
			role: "navigation",
			"aria-label": o(e.ariaLabel),
			onKeydown: D,
			"data-testid": "v-pagination-root"
		}, { default: () => [Y("ul", { class: "v-pagination__list" }, [
			[!0, "only-first"].includes(e.showFirstLastPage) && Y("li", {
				key: "first",
				class: "v-pagination__first",
				"data-testid": "v-pagination-first"
			}, [t.first ? t.first(T.value.first) : Z($, s({ _as: "VPaginationBtn" }, T.value.first), null)]),
			Y("li", {
				key: "prev",
				class: "v-pagination__prev",
				"data-testid": "v-pagination-prev"
			}, [t.prev ? t.prev(T.value.prev) : Z($, s({ _as: "VPaginationBtn" }, T.value.prev), null)]),
			w.value.map((e, n) => Y("li", {
				key: e.key,
				class: P(["v-pagination__item", { "v-pagination__item--is-active": e.isActive }]),
				"data-testid": "v-pagination-item"
			}, [t.item ? t.item(e) : Z($, s({ _as: "VPaginationBtn" }, e.props), { default: () => [e.page] })])),
			Y("li", {
				key: "next",
				class: "v-pagination__next",
				"data-testid": "v-pagination-next"
			}, [t.next ? t.next(T.value.next) : Z($, s({ _as: "VPaginationBtn" }, T.value.next), null)]),
			e.showFirstLastPage === !0 && Y("li", {
				key: "last",
				class: "v-pagination__last",
				"data-testid": "v-pagination-last"
			}, [t.last ? t.last(T.value.last) : Z($, s({ _as: "VPaginationBtn" }, T.value.last), null)])
		])] })), {};
	}
}), pt = e({
	page: {
		type: [Number, String],
		default: 1
	},
	itemsPerPage: {
		type: [Number, String],
		default: 10
	},
	pageBy: {
		type: String,
		default: "any"
	}
}, "DataTable-paginate"), mt = Symbol.for("vuetify:data-table-pagination");
function ht(e) {
	return {
		page: V(e, "page", void 0, (e) => Number(e ?? 1)),
		itemsPerPage: V(e, "itemsPerPage", void 0, (e) => Number(e ?? 10))
	};
}
function gt(e) {
	let { page: t, itemsPerPage: n, itemsLength: r } = e, i = z(() => n.value === -1 ? 0 : n.value * (t.value - 1)), a = z(() => n.value === -1 ? r.value : Math.min(r.value, i.value + n.value)), o = z(() => n.value === -1 || r.value === 0 ? 1 : Math.ceil(r.value / n.value));
	u([t, o], () => {
		t.value > o.value && (t.value = o.value);
	});
	function s(e) {
		n.value = e, t.value = 1;
	}
	function l() {
		t.value = T(t.value + 1, 1, o.value);
	}
	function d() {
		t.value = T(t.value - 1, 1, o.value);
	}
	function f(e) {
		t.value = T(e, 1, o.value);
	}
	let p = {
		page: t,
		itemsPerPage: n,
		startIndex: i,
		stopIndex: a,
		pageCount: o,
		itemsLength: r,
		nextPage: l,
		prevPage: d,
		setPage: f,
		setItemsPerPage: s
	};
	return c(mt, p), p;
}
function _t() {
	let e = x(mt);
	if (!e) throw Error("Missing pagination!");
	return e;
}
function vt(e) {
	let t = g("usePaginatedItems"), { items: n, startIndex: r, stopIndex: i, itemsPerPage: a } = e, o = z(() => a.value <= 0 ? W(n) : W(n).slice(r.value, i.value));
	return u(o, (e) => {
		t.emit("update:currentItems", e);
	}, { immediate: !0 }), { paginatedItems: o };
}
function yt(e) {
	let { sortedItems: t, paginate: n, group: r } = e, i = W(e.pageBy);
	if (i === "item") {
		let { paginatedItems: e, pageCount: i, setItemsPerPage: a, prevPage: o, nextPage: s, setPage: c } = n(t), { flatItems: l } = r(e);
		return {
			pageCount: i,
			setItemsPerPage: a,
			prevPage: o,
			nextPage: s,
			setPage: c,
			paginatedItems: l
		};
	}
	if (i === "group") {
		let { flatItems: e, groups: i } = r(t), { paginatedItems: a, pageCount: o, setItemsPerPage: s, prevPage: c, nextPage: l, setPage: u } = n(i);
		return {
			pageCount: o,
			setItemsPerPage: s,
			prevPage: c,
			nextPage: l,
			setPage: u,
			paginatedItems: z(() => {
				if (!a.value.length) return [];
				let t = a.value.at(0).id, n = a.value.at(-1).id, r = e.value.findIndex((e) => e.type === "group" && e.id === t), i = e.value.findIndex((e) => e.type === "group" && e.id === n), o = e.value.findIndex((e, t) => t > i && e.type === "group" && e.depth === 0);
				return e.value.slice(r, o === -1 ? void 0 : o);
			})
		};
	}
	if (i === "any") {
		let { flatItems: e } = r(t), { paginatedItems: i, pageCount: a, setItemsPerPage: o, prevPage: s, nextPage: c, setPage: l } = n(e);
		return {
			pageCount: a,
			setItemsPerPage: o,
			prevPage: s,
			nextPage: c,
			setPage: l,
			paginatedItems: i
		};
	}
	throw Error(`Unrecognized pagination target ${i}`);
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/VDataTableFooter.js
var bt = e({
	color: String,
	prevIcon: {
		type: X,
		default: "$prev"
	},
	nextIcon: {
		type: X,
		default: "$next"
	},
	firstIcon: {
		type: X,
		default: "$first"
	},
	lastIcon: {
		type: X,
		default: "$last"
	},
	itemsPerPageText: {
		type: String,
		default: "$vuetify.dataFooter.itemsPerPageText"
	},
	pageText: {
		type: String,
		default: "$vuetify.dataFooter.pageText"
	},
	firstPageLabel: {
		type: String,
		default: "$vuetify.dataFooter.firstPage"
	},
	prevPageLabel: {
		type: String,
		default: "$vuetify.dataFooter.prevPage"
	},
	nextPageLabel: {
		type: String,
		default: "$vuetify.dataFooter.nextPage"
	},
	lastPageLabel: {
		type: String,
		default: "$vuetify.dataFooter.lastPage"
	},
	itemsPerPageOptions: {
		type: Array,
		default: () => [
			{
				value: 10,
				title: "10"
			},
			{
				value: 25,
				title: "25"
			},
			{
				value: 50,
				title: "50"
			},
			{
				value: 100,
				title: "100"
			},
			{
				value: -1,
				title: "$vuetify.dataFooter.itemsPerPageAll"
			}
		]
	},
	showCurrentPage: Boolean,
	...M(dt({ showFirstLastPage: !0 }), ["showFirstLastPage"])
}, "VDataTableFooter"), xt = b()({
	name: "VDataTableFooter",
	props: bt(),
	setup(e, { slots: t }) {
		let { t: n } = K(), i = o("VSelect"), { page: a, pageCount: c, startIndex: l, stopIndex: u, itemsLength: d, itemsPerPage: f, setItemsPerPage: p } = _t(), m = z(() => e.itemsPerPageOptions.map((e) => r(e) ? {
			value: e,
			title: e === -1 ? n("$vuetify.dataFooter.itemsPerPageAll") : String(e)
		} : {
			...e,
			title: isNaN(Number(e.title)) ? n(e.title) : e.title
		}));
		return Q(() => {
			let r = ft.filterProps(e);
			return Y("div", { class: "v-data-table-footer" }, [
				t.prepend?.(),
				Y("div", { class: "v-data-table-footer__items-per-page" }, [Y("span", null, [n(e.itemsPerPageText)]), Z(Se, {
					items: m.value,
					itemColor: e.color,
					modelValue: f.value,
					"onUpdate:modelValue": (e) => p(Number(e)),
					density: "compact",
					variant: i.value?.variant ?? "outlined",
					"aria-label": n(e.itemsPerPageText),
					hideDetails: !0
				}, null)]),
				Y("div", { class: "v-data-table-footer__info" }, [Y("div", null, [n(e.pageText, d.value ? l.value + 1 : 0, u.value, d.value)])]),
				Y("div", { class: "v-data-table-footer__pagination" }, [Z(ft, s({
					modelValue: a.value,
					"onUpdate:modelValue": (e) => a.value = e,
					density: "comfortable",
					firstAriaLabel: e.firstPageLabel,
					lastAriaLabel: e.lastPageLabel,
					length: c.value,
					nextAriaLabel: e.nextPageLabel,
					previousAriaLabel: e.prevPageLabel,
					rounded: !0,
					showFirstLastPage: !0,
					totalVisible: +!!e.showCurrentPage,
					variant: "plain"
				}, he(r, ["color"])), null)])
			]);
		}), {};
	}
}), St = ge({
	align: {
		type: String,
		default: "start"
	},
	fixed: {
		type: [Boolean, String],
		default: !1
	},
	fixedOffset: [Number, String],
	fixedEndOffset: [Number, String],
	height: [Number, String],
	lastFixed: Boolean,
	firstFixedEnd: Boolean,
	noPadding: Boolean,
	indent: [Number, String],
	empty: Boolean,
	tag: String,
	width: [Number, String],
	maxWidth: [Number, String],
	nowrap: Boolean
}, (e, { slots: t }) => {
	let n = e.tag ?? "td", r = d(e.fixed) ? e.fixed : e.fixed ? "start" : "none";
	return Z(n, {
		class: P([
			"v-data-table__td",
			{
				"v-data-table-column--fixed": r === "start",
				"v-data-table-column--fixed-end": r === "end",
				"v-data-table-column--last-fixed": e.lastFixed,
				"v-data-table-column--first-fixed-end": e.firstFixedEnd,
				"v-data-table-column--no-padding": e.noPadding,
				"v-data-table-column--nowrap": e.nowrap,
				"v-data-table-column--empty": e.empty
			},
			`v-data-table-column--align-${e.align}`
		]),
		style: {
			height: l(e.height),
			width: l(e.width),
			maxWidth: l(e.maxWidth),
			left: r === "start" ? l(e.fixedOffset || null) : void 0,
			right: r === "end" ? l(e.fixedEndOffset || null) : void 0,
			paddingInlineStart: e.indent ? l(e.indent) : void 0
		}
	}, { default: () => [t.default?.()] });
}), Ct = e({ headers: Array }, "DataTable-header"), wt = Symbol.for("vuetify:data-table-headers"), Tt = {
	title: "",
	sortable: !1
}, Et = {
	...Tt,
	width: 48
};
function Dt(e = []) {
	let t = e.map((e) => ({
		element: e,
		priority: 0
	}));
	return {
		enqueue: (e, n) => {
			let r = !1;
			for (let i = 0; i < t.length; i++) if (t[i].priority > n) {
				t.splice(i, 0, {
					element: e,
					priority: n
				}), r = !0;
				break;
			}
			r || t.push({
				element: e,
				priority: n
			});
		},
		size: () => t.length,
		count: () => {
			let e = 0;
			if (!t.length) return 0;
			let n = Math.floor(t[0].priority);
			for (let r = 0; r < t.length; r++) Math.floor(t[r].priority) === n && (e += 1);
			return e;
		},
		dequeue: () => t.shift()
	};
}
function Ot(e, t = []) {
	if (!e.children) t.push(e);
	else for (let n of e.children) Ot(n, t);
	return t;
}
function kt(e, t = /* @__PURE__ */ new Set()) {
	for (let n of e) n.key && t.add(n.key), n.children && kt(n.children, t);
	return t;
}
function At(e) {
	if (e.key) {
		if (e.key === "data-table-group") return Tt;
		if (["data-table-expand", "data-table-select"].includes(e.key)) return Et;
	}
}
function jt(e, t = 0) {
	return e.children ? Math.max(t, ...e.children.map((e) => jt(e, t + 1))) : t;
}
function Mt(e) {
	let t = !1;
	function n(e, r, i = "none") {
		if (e) {
			if (i !== "none" && (e.fixed = i), e.fixed === !0 && (e.fixed = "start"), e.fixed === r) {
				if (e.children) {
					if (r === "start") for (let t = e.children.length - 1; t >= 0; t--) n(e.children[t], r, r);
					else for (let t = 0; t < e.children.length; t++) n(e.children[t], r, r);
				} else !t && r === "start" ? e.lastFixed = !0 : !t && r === "end" ? e.firstFixedEnd = !0 : isNaN(Number(e.width)) ? D(`Multiple fixed columns should have a static width (key: ${e.key})`) : e.minWidth = Math.max(Number(e.width) || 0, Number(e.minWidth) || 0), t = !0;
			} else if (e.children) {
				if (r === "start") for (let t = e.children.length - 1; t >= 0; t--) n(e.children[t], r);
				else for (let t = 0; t < e.children.length; t++) n(e.children[t], r);
			} else t = !1;
		}
	}
	for (let t = e.length - 1; t >= 0; t--) n(e[t], "start");
	for (let t = 0; t < e.length; t++) n(e[t], "end");
	let r = 0;
	for (let t = 0; t < e.length; t++) r = Nt(e[t], r);
	let i = 0;
	for (let t = e.length - 1; t >= 0; t--) i = Pt(e[t], i);
}
function Nt(e, t = 0) {
	if (!e) return t;
	if (e.children) {
		e.fixedOffset = t;
		for (let n of e.children) t = Nt(n, t);
	} else e.fixed && e.fixed !== "end" && (e.fixedOffset = t, t += parseFloat(e.width || "0") || 0);
	return t;
}
function Pt(e, t = 0) {
	if (!e) return t;
	if (e.children) {
		e.fixedEndOffset = t;
		for (let n of e.children) t = Pt(n, t);
	} else e.fixed === "end" && (e.fixedEndOffset = t, t += parseFloat(e.width || "0") || 0);
	return t;
}
function Ft(e, t) {
	let n = [], r = 0, i = Dt(e);
	for (; i.size() > 0;) {
		let e = i.count(), a = [], o = 1;
		for (; e > 0;) {
			let { element: n, priority: s } = i.dequeue(), c = t - r - jt(n);
			if (a.push({
				...n,
				rowspan: c ?? 1,
				colspan: n.children ? Ot(n).length : 1
			}), n.children) for (let e of n.children) {
				let t = s % 1 + o / 10 ** (r + 2);
				i.enqueue(e, r + c + t);
			}
			o += 1, --e;
		}
		r += 1, n.push(a);
	}
	return {
		columns: e.map((e) => Ot(e)).flat(),
		headers: n
	};
}
function It(e) {
	let t = [];
	for (let n of e) {
		let e = {
			...At(n),
			...n
		}, r = e.key ?? (d(e.value) ? e.value : null), i = e.value ?? r ?? null, a = {
			...e,
			key: r,
			value: i,
			sortable: e.sortable ?? (e.key != null || !!e.sort),
			children: e.children ? It(e.children) : void 0
		};
		t.push(a);
	}
	return t;
}
function Lt(e, t) {
	let n = O([]), r = O([]), i = O({}), a = O({}), o = O({});
	S(() => {
		let s = (e.headers || Object.keys(e.items[0] ?? {}).map((e) => ({
			key: e,
			title: de(e)
		}))).slice(), c = kt(s);
		t?.groupBy?.value.length && !c.has("data-table-group") && s.unshift({
			key: "data-table-group",
			title: "Group"
		}), t?.showSelect?.value && !c.has("data-table-select") && s.unshift({ key: "data-table-select" }), t?.showExpand?.value && !c.has("data-table-expand") && s.push({ key: "data-table-expand" });
		let l = It(s);
		Mt(l);
		let u = Ft(l, Math.max(...l.map((e) => jt(e))) + 1);
		n.value = u.headers, r.value = u.columns;
		let d = u.headers.flat(1);
		i.value = {}, a.value = {}, o.value = {};
		for (let e of d) e.key && (e.sortable && (e.sort && (i.value[e.key] = e.sort), e.sortRaw && (a.value[e.key] = e.sortRaw)), e.filter && (o.value[e.key] = e.filter));
	});
	let s = {
		headers: n,
		columns: r,
		sortFunctions: i,
		sortRawFunctions: a,
		filterFunctions: o
	};
	return c(wt, s), s;
}
function Rt() {
	let e = x(wt);
	if (!e) throw Error("Missing headers!");
	return e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/loading.js
function zt(e, t) {
	return {
		active: z(() => {
			let t = e();
			return t != null && t !== !1 && t !== "false";
		}),
		side: z(() => {
			let t = e();
			return w(t) && t.side ? t.side : "start";
		}),
		color: z(() => {
			let n = e();
			return w(n) && n.color ? n.color : d(n) && n !== "true" ? n : t();
		})
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/select.js
var Bt = {
	showSelectAll: !1,
	allSelected: () => [],
	select: ({ items: e, value: t }) => new Set(t ? [e[0]?.value] : []),
	selectAll: ({ selected: e }) => e
}, Vt = {
	showSelectAll: !0,
	allSelected: ({ currentPage: e }) => e,
	select: ({ items: e, value: t, selected: n }) => {
		for (let r of e) t ? n.add(r.value) : n.delete(r.value);
		return n;
	},
	selectAll: ({ value: e, currentPage: t, selected: n }) => Vt.select({
		items: t,
		value: e,
		selected: n
	})
}, Ht = {
	showSelectAll: !0,
	allSelected: ({ allItems: e }) => e,
	select: ({ items: e, value: t, selected: n }) => {
		for (let r of e) t ? n.add(r.value) : n.delete(r.value);
		return n;
	},
	selectAll: ({ value: e, allItems: t }) => new Set(e ? t.map((e) => e.value) : [])
}, Ut = e({
	showSelect: Boolean,
	selectStrategy: {
		type: [String, Object],
		default: "page"
	},
	modelValue: {
		type: Array,
		default: () => []
	},
	valueComparator: Function
}, "DataTable-select"), Wt = Symbol.for("vuetify:data-table-selection");
function Gt(e, { allItems: t, currentPage: n }) {
	let r = V(e, "modelValue", e.modelValue, (n) => {
		let r = e.valueComparator;
		return r ? new Set(_e(n).map((e) => t.value.find((t) => r(e, t.value))?.value ?? e)) : new Set(_e(n).map((e) => ce(e) ? t.value.find((t) => e === t.value)?.value ?? e : t.value.find((t) => je(e, t.value))?.value ?? e));
	}, (e) => [...e.values()]), i = z(() => t.value.filter((e) => e.selectable)), a = z(() => W(n).filter((e) => e.selectable)), o = z(() => {
		if (w(e.selectStrategy)) return e.selectStrategy;
		switch (e.selectStrategy) {
			case "single": return Bt;
			case "all": return Ht;
			default: return Vt;
		}
	}), s = L(null);
	function l(e) {
		return _e(e).every((e) => r.value.has(e.value));
	}
	function u(e) {
		return _e(e).some((e) => r.value.has(e.value));
	}
	function d(e, t) {
		let n = o.value.select({
			items: e,
			value: t,
			selected: new Set(r.value)
		});
		r.value = n;
	}
	function f(t, r, i) {
		let a = [], o = W(n);
		if (r ??= o.findIndex((e) => e.value === t.value), e.selectStrategy !== "single" && i?.shiftKey && s.value !== null) {
			let [e, t] = [s.value, r].sort((e, t) => e - t);
			a.push(...o.slice(e, t + 1).filter((e) => e.selectable));
		} else a.push(t), s.value = r;
		d(a, !l([t]));
	}
	function p(e) {
		let t = o.value.selectAll({
			value: e,
			allItems: i.value,
			currentPage: a.value,
			selected: new Set(r.value)
		});
		r.value = t;
	}
	let m = {
		toggleSelect: f,
		select: d,
		selectAll: p,
		isSelected: l,
		isSomeSelected: u,
		someSelected: z(() => r.value.size > 0),
		allSelected: z(() => {
			let e = o.value.allSelected({
				allItems: i.value,
				currentPage: a.value
			});
			return !!e.length && l(e);
		}),
		showSelectAll: J(() => o.value.showSelectAll),
		lastSelectedIndex: s,
		selectStrategy: o
	};
	return c(Wt, m), m;
}
function Kt() {
	let e = x(Wt);
	if (!e) throw Error("Missing selection!");
	return e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/sort.js
var qt = e({
	initialSortOrder: {
		type: String,
		default: "asc",
		validator: (e) => !e || ["asc", "desc"].includes(e)
	},
	sortBy: {
		type: Array,
		default: () => []
	},
	customKeySort: Object,
	multiSort: {
		type: [Boolean, Object],
		default: !1
	},
	mustSort: Boolean
}, "DataTable-sort"), Jt = Symbol.for("vuetify:data-table-sort");
function Yt(e) {
	let t = J(() => e.initialSortOrder), n = V(e, "sortBy"), r = J(() => e.mustSort);
	return {
		initialSortOrder: t,
		sortBy: n,
		multiSort: J(() => e.multiSort),
		mustSort: r
	};
}
function Xt(e, t) {
	if (!w(e)) return { active: !!e };
	let { key: n, mode: r, modifier: i } = e, a = i === "alt" && t?.altKey || i === "shift" && t?.shiftKey;
	return {
		active: !n || t?.ctrlKey || t?.metaKey || !1,
		mode: a ? r === "append" ? "prepend" : "append" : r
	};
}
function Zt(e) {
	let { initialSortOrder: t, sortBy: n, mustSort: r, multiSort: i, page: a } = e, o = (e, o, s = !1) => {
		if (e.key == null) return;
		let c = n.value.map((e) => ({ ...e })) ?? [], l = c.find((t) => t.key === e.key), u = t.value, d = t.value === "desc" ? "asc" : "desc";
		if (l) l.order === d ? s || r.value && c.length === 1 ? l.order = t.value : c = c.filter((t) => t.key !== e.key) : l.order = d;
		else {
			let { active: t, mode: n } = Xt(i.value, o);
			t ? n === "prepend" ? c.unshift({
				key: e.key,
				order: u
			}) : c.push({
				key: e.key,
				order: u
			}) : c = [{
				key: e.key,
				order: u
			}];
		}
		n.value = c, a && (a.value = 1);
	};
	function s(e) {
		return !!n.value.find((t) => t.key === e.key);
	}
	let l = {
		sortBy: n,
		toggleSort: o,
		isSorted: s
	};
	return c(Jt, l), l;
}
function Qt() {
	let e = x(Jt);
	if (!e) throw Error("Missing sort!");
	return e;
}
function $t(e, t, n, r) {
	let i = K();
	return { sortedItems: z(() => n.value.length ? en(t.value, n.value, i.current.value, {
		transform: r?.transform,
		sortFunctions: {
			...e.customKeySort,
			...r?.sortFunctions?.value
		},
		sortRawFunctions: r?.sortRawFunctions?.value
	}) : t.value) };
}
function en(e, t, n, r) {
	let i = new Intl.Collator(n, {
		sensitivity: "accent",
		usage: "sort"
	});
	return e.map((e) => [e, r?.transform ? r.transform(e) : e]).sort((e, n) => {
		for (let a = 0; a < t.length; a++) {
			let o = !1, s = t[a].key, c = t[a].order ?? "asc";
			if (c === !1) continue;
			let l = A(e[1], s), u = A(n[1], s), d = e[0].raw, f = n[0].raw;
			if (c === "desc" && ([l, u] = [u, l], [d, f] = [f, d]), r?.sortRawFunctions?.[s]) {
				let e = r.sortRawFunctions[s](d, f);
				if (e == null) continue;
				if (o = !0, e) return e;
			}
			if (r?.sortFunctions?.[s]) {
				let e = r.sortFunctions[s](l, u);
				if (e == null) continue;
				if (o = !0, e) return e;
			}
			if (!o && (l instanceof Date && u instanceof Date && (l = l.getTime(), u = u.getTime()), [l, u] = [l, u].map((e) => e == null ? e : e.toString().toLocaleLowerCase()), l !== u)) return I(l) && I(u) ? 0 : I(l) ? -1 : I(u) ? 1 : !isNaN(l) && !isNaN(u) ? Number(l) - Number(u) : i.compare(l, u);
		}
		return 0;
	}).map(([e]) => e);
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/VDataTableHeaders.js
var tn = e({
	color: String,
	disableSort: Boolean,
	fixedHeader: Boolean,
	multiSort: Boolean,
	initialSortOrder: String,
	sortIcon: { type: X },
	sortAscIcon: {
		type: X,
		default: "$sortAsc"
	},
	sortDescIcon: {
		type: X,
		default: "$sortDesc"
	},
	headerProps: { type: Object },
	selectAllLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectAll"
	},
	sticky: Boolean,
	...ze(),
	...R(),
	...Je()
}, "VDataTableHeaders"), nn = b()({
	name: "VDataTableHeaders",
	props: tn(),
	setup(e, { slots: t }) {
		let { t: n } = K(), { toggleSort: r, sortBy: i, isSorted: c } = Qt(), { someSelected: u, allSelected: f, selectAll: p, showSelectAll: m } = Kt(), { columns: h, headers: g } = Rt(), { loaderClasses: _ } = Ye(e), v = o("VSelect");
		function y(t, n) {
			if (!(e.sticky || e.fixedHeader) && !t.fixed) return;
			let r = d(t.fixed) ? t.fixed : t.fixed ? "start" : "none";
			return {
				position: "sticky",
				left: r === "start" ? l(t.fixedOffset) : void 0,
				right: r === "end" ? l(t.fixedEndOffset) : void 0,
				top: e.sticky || e.fixedHeader ? `calc(var(--v-table-header-height) * ${n})` : void 0
			};
		}
		function b(t, n) {
			t.key === "Enter" && !e.disableSort && r(n, t);
		}
		function x(t) {
			switch (i.value.find((e) => e.key === t.key)?.order) {
				case "asc": return e.sortAscIcon;
				case "desc": return e.sortDescIcon;
				default: return e.sortIcon || (e.initialSortOrder === "asc" ? e.sortAscIcon : e.sortDescIcon);
			}
		}
		let { backgroundColorClasses: S, backgroundColorStyles: C } = Ee(() => e.color), { displayClasses: w, mobile: T } = se(e), E = zt(() => e.loading, () => e.color), D = z(() => ({
			headers: g.value,
			columns: h.value,
			toggleSort: r,
			isSorted: c,
			sortBy: i.value,
			someSelected: u.value,
			allSelected: f.value,
			selectAll: p,
			getSortIcon: x
		})), O = z(() => [
			"v-data-table__th",
			{ "v-data-table__th--sticky": e.sticky || e.fixedHeader },
			w.value,
			_.value
		]), ee = ({ column: a, x: o, y: d }) => {
			let h = a.key === "data-table-select" || a.key === "data-table-expand", g = a.key === "data-table-group" && a.width === 0 && !a.title, _ = s(e.headerProps ?? {}, a.headerProps ?? {}), v = a.sortable && !e.disableSort, w = v ? i.value.find((e) => e.key === a.key) : void 0, T = w?.order === "asc" ? "ascending" : w?.order === "desc" ? "descending" : void 0;
			return Z(St, s({
				tag: "th",
				"aria-sort": T,
				align: a.align,
				class: [{
					"v-data-table__th--sortable": v,
					"v-data-table__th--sorted": c(a),
					"v-data-table__th--fixed": a.fixed
				}, ...O.value],
				style: {
					width: l(a.width),
					minWidth: l(a.minWidth),
					maxWidth: l(a.maxWidth),
					...y(a, d)
				},
				colspan: a.colspan,
				rowspan: a.rowspan,
				fixed: a.fixed,
				nowrap: a.nowrap,
				lastFixed: a.lastFixed,
				firstFixedEnd: a.firstFixedEnd,
				noPadding: h,
				empty: g,
				tabindex: v ? 0 : void 0,
				onClick: v ? (e) => r(a, e) : void 0,
				onKeydown: v ? (e) => b(e, a) : void 0
			}, _), { default: () => {
				let o = `header.${a.key}`, s = {
					column: a,
					selectAll: p,
					isSorted: c,
					toggleSort: r,
					sortBy: i.value,
					someSelected: u.value,
					allSelected: f.value,
					getSortIcon: x
				};
				return t[o] ? t[o](s) : g ? "" : a.key === "data-table-select" ? t["header.data-table-select"]?.(s) ?? (m.value && Z(at, {
					"aria-label": n(e.selectAllLabel),
					color: e.color,
					density: e.density,
					modelValue: f.value,
					indeterminate: u.value && !f.value,
					"onUpdate:modelValue": p
				}, null)) : Y("div", { class: "v-data-table-header__content" }, [
					Y("span", null, [a.title]),
					a.sortable && !e.disableSort && Z(Le, {
						key: "icon",
						class: "v-data-table-header__sort-icon",
						icon: x(a)
					}, null),
					e.multiSort && c(a) && Y("div", {
						key: "badge",
						class: P(["v-data-table-header__sort-badge", ...S.value]),
						style: pe(C.value)
					}, [i.value.findIndex((e) => e.key === a.key) + 1])
				]);
			} });
		}, k = () => {
			let o = z(() => h.value.filter((t) => t?.sortable && !e.disableSort)), l = h.value.find((e) => e.key === "data-table-select"), d = z({
				get: () => o.value.filter(({ key: e }) => i.value.some((t) => t.key === e)),
				set: (e) => {
					let t = _e(e), n = i.value.map((e) => e.key);
					t.filter(({ key: e }) => !n.includes(e)).forEach((e) => r(e)), a(() => i.value = i.value.filter(({ key: e }) => t.some((t) => t.key === e)));
				}
			});
			function m() {
				return Z(Se, {
					modelValue: d.value,
					"onUpdate:modelValue": (e) => d.value = e,
					chips: !0,
					color: e.color,
					class: "v-data-table__td-sort-select",
					clearable: !0,
					density: "default",
					items: o.value,
					label: n("$vuetify.dataTable.sortBy"),
					multiple: e.multiSort,
					variant: v.value?.variant ?? "underlined",
					returnObject: !0,
					"onClick:clear": () => i.value = []
				}, { chip: ({ internalItem: e }) => Z(Ze, {
					onClick: e.raw.sortable ? () => r(e.raw, void 0, !0) : void 0,
					onMousedown: (e) => {
						e.preventDefault(), e.stopPropagation();
					}
				}, { default: () => [e.title, Z(Le, {
					class: P(["v-data-table__td-sort-icon", c(e.raw) && "v-data-table__td-sort-icon-active"]),
					icon: x(e.raw),
					size: "small"
				}, null)] }) });
			}
			function _() {
				return Z(at, {
					"aria-label": n(e.selectAllLabel),
					class: "v-data-table-header__select-all",
					color: e.color,
					density: "compact",
					modelValue: f.value,
					indeterminate: u.value && !f.value,
					"onUpdate:modelValue": () => p(!f.value)
				}, null);
			}
			return Z(St, s({
				tag: "th",
				class: [...O.value],
				colspan: g.value.length + 1
			}, e.headerProps), { default: () => [Y("div", { class: "v-data-table-header__content" }, [t["mobile.header"]?.(D.value) ?? Y(N, null, [o.value.length > 0 && m(), l && _()])])] });
		}, A = z(() => {
			if (t["mobile.header"]) return !0;
			let n = h.value.some((t) => t?.sortable && !e.disableSort), r = h.value.some((e) => e.key === "data-table-select");
			return n || r;
		});
		Q(() => T.value ? Y(N, null, [A.value && Y("tr", null, [Z(k, null, null)])]) : Y(N, null, [t.headers ? t.headers(D.value) : g.value.map((e, t) => Y("tr", null, [e.map((e, n) => Z(ee, {
			key: e.key ?? n,
			column: e,
			x: n,
			y: t
		}, null))])), E.active.value && ["start", "both"].includes(E.side.value) && Y("tr", { class: "v-data-table-progress" }, [Y("th", { colspan: h.value.length }, [Z(Xe, {
			name: "v-data-table-progress",
			absolute: !0,
			active: !0,
			color: E.color.value,
			indeterminate: !0
		}, { default: t.loader })])])]));
	}
}), rn = e({
	groupBy: {
		type: Array,
		default: () => []
	},
	opened: {
		type: Array,
		default: () => []
	},
	openAll: Boolean,
	groupKey: Function
}, "DataTable-group"), an = Symbol.for("vuetify:data-table-group");
function on(e) {
	return {
		groupBy: V(e, "groupBy"),
		opened: V(e, "opened"),
		openAll: J(() => e.openAll),
		groupKey: J(() => e.groupKey)
	};
}
function sn(e) {
	let { disableSort: t, groupBy: n, sortBy: r } = e, i = e.opened ?? O([]), a = L(new Set(i.value));
	u(i, (e) => {
		a.value = new Set(e);
	});
	let o = z({
		get: () => a.value,
		set: (e) => {
			a.value = e, i.value = [...e.values()];
		}
	}), s = z(() => n.value.map((e) => ({
		...e,
		order: e.order ?? !1
	})).concat(t?.value ? [] : r.value));
	function l(e) {
		return o.value.has(e.id);
	}
	function d(e) {
		let t = new Set(o.value);
		l(e) ? t.delete(e.id) : t.add(e.id), o.value = t;
	}
	function f(e) {
		function t(e) {
			let n = [];
			for (let r of e.items) "type" in r && r.type === "group" ? n.push(...t(r)) : n.push(r);
			return [...new Set(n)];
		}
		return t({
			type: "group",
			items: e,
			id: "dummy",
			key: "dummy",
			value: "dummy",
			depth: 0
		});
	}
	let p = {
		sortByWithGroups: s,
		toggleGroup: d,
		opened: o,
		groupBy: n,
		extractRows: f,
		isGroupOpen: l
	};
	return c(an, p), p;
}
function cn() {
	let e = x(an);
	if (!e) throw Error("Missing group!");
	return e;
}
function ln(e, t) {
	if (!e.length) return [];
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = A(r.raw, t);
		n.has(e) || n.set(e, []), n.get(e).push(r);
	}
	return n;
}
var un = (e, t, n) => `${n}_${e}_${t}`;
function dn(e, t, n, r = 0, i = "root") {
	if (!t.length) return [];
	let a = ln(e, t[0]), o = [], s = t.slice(1);
	return a.forEach((e, a) => {
		let c = t[0], l = n ? n({
			key: c,
			value: a,
			parentKey: r === 0 ? null : i
		}) : un(c, a, i);
		o.push({
			depth: r,
			id: l,
			key: c,
			value: a,
			items: s.length ? dn(e, s, n, r + 1, l) : e,
			type: "group"
		});
	}), o;
}
function fn(e) {
	return e.flatMap((e) => [e.id, ...fn(e.items.filter((e) => "type" in e && e.type === "group"))]);
}
function pn(e, t, n, r, i) {
	let a = z(() => !W(t) || !r.value.length ? /* @__PURE__ */ new Set() : new Set(fn(dn(W(n), r.value.map((e) => e.key), W(i)))));
	u(a, (n, r) => {
		if (!W(t)) return;
		let i = new Set(e.value), a = !1;
		for (let e of n) !r?.has(e) && !i.has(e) && (i.add(e), a = !0);
		for (let e of r ?? []) !n.has(e) && i.has(e) && (i.delete(e), a = !0);
		a && (e.value = i);
	}, { immediate: !0 });
}
function mn(e, t, n) {
	let r = [];
	for (let i of e) "type" in i && i.type === "group" ? (i.value != null && r.push(i), (t(i) || i.value == null) && (r.push(...mn(i.items, t, n)), n && r.push({
		...i,
		type: "group-summary"
	}))) : r.push(i);
	return r;
}
function hn(e, t, n, r, i, a) {
	let o = z(() => t.value.length ? dn(W(e), t.value.map((e) => e.key), W(a)) : []), s = i ?? ((e) => n.value.has(e.id));
	return {
		groups: o,
		flatItems: z(() => t.value.length ? mn(o.value, s, W(r)) : W(e))
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/VDataTableGroupHeaderRow.js
var gn = e({
	item: {
		type: Object,
		required: !0
	},
	groupCollapseIcon: {
		type: X,
		default: "$tableGroupCollapse"
	},
	groupExpandIcon: {
		type: X,
		default: "$tableGroupExpand"
	},
	selectGroupLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectGroup"
	},
	...ze()
}, "VDataTableGroupHeaderRow"), _n = b()({
	name: "VDataTableGroupHeaderRow",
	props: gn(),
	setup(e, { slots: t }) {
		let { t: n } = K(), { isGroupOpen: r, toggleGroup: i, extractRows: a } = cn(), { isSelected: o, isSomeSelected: s, select: c } = Kt(), { columns: l } = Rt(), u = z(() => a([e.item])), d = J(() => l.value.length - +!!l.value.some((e) => e.key === "data-table-select"));
		return () => Y("tr", {
			class: "v-data-table-group-header-row",
			style: { "--v-data-table-group-header-row-depth": e.item.depth }
		}, [l.value.map((a) => {
			if (a.key === "data-table-group") {
				let n = r(e.item) ? e.groupCollapseIcon : e.groupExpandIcon, a = () => i(e.item);
				return t["data-table-group"]?.({
					item: e.item,
					count: u.value.length,
					props: {
						icon: n,
						onClick: a
					}
				}) ?? Z(St, {
					class: "v-data-table-group-header-row__column",
					colspan: d.value
				}, { default: () => [
					Z($, {
						size: "small",
						variant: "text",
						icon: n,
						onClick: a
					}, null),
					Y("span", null, [e.item.value]),
					Y("span", null, [
						me("("),
						u.value.length,
						me(")")
					])
				] });
			}
			if (a.key === "data-table-select") {
				let r = u.value.filter((e) => e.selectable), i = r.length > 0 && o(r), a = s(r) && !i, l = (e) => c(r, e);
				return t["data-table-select"]?.({ props: {
					modelValue: i,
					indeterminate: a,
					"onUpdate:modelValue": l
				} }) ?? Z(St, {
					class: "v-data-table__td--select-row",
					noPadding: !0
				}, { default: () => [Z(at, {
					"aria-label": n(e.selectGroupLabel),
					density: e.density,
					disabled: r.length === 0,
					modelValue: i,
					indeterminate: a,
					"onUpdate:modelValue": l
				}, null)] });
			}
			return "";
		})]);
	}
}), vn = e({
	expandOnClick: Boolean,
	showExpand: Boolean,
	expanded: {
		type: Array,
		default: () => []
	},
	expandStrategy: {
		type: String,
		default: "multiple"
	}
}, "DataTable-expand"), yn = Symbol.for("vuetify:datatable:expanded");
function bn(e) {
	let t = J(() => e.expandOnClick), n = V(e, "expanded", e.expanded, (e) => new Set(e), (e) => [...e.values()]);
	function r(t, r) {
		let i = fe(t.value), a = r && e.expandStrategy === "single" ? /* @__PURE__ */ new Set() : new Set(n.value);
		if (r) a.add(t.value);
		else {
			let e = [...n.value].find((e) => fe(e) === i);
			a.delete(e);
		}
		n.value = a;
	}
	function i(e) {
		let t = fe(e.value);
		return [...n.value].some((e) => fe(e) === t);
	}
	function a(e) {
		r(e, !i(e));
	}
	let o = {
		expand: r,
		expanded: n,
		expandOnClick: t,
		isExpanded: i,
		toggleExpand: a
	};
	return c(yn, o), o;
}
function xn() {
	let e = x(yn);
	if (!e) throw Error("foo");
	return e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/VDataTableRow.js
var Sn = e({
	color: String,
	index: Number,
	item: Object,
	cellProps: [Object, Function],
	collapseIcon: {
		type: X,
		default: "$collapse"
	},
	expandIcon: {
		type: X,
		default: "$expand"
	},
	selectRowLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectRow"
	},
	getMatches: Function,
	onClick: n(),
	onContextmenu: n(),
	onDblclick: n(),
	...ze(),
	...R()
}, "VDataTableRow"), Cn = b()({
	name: "VDataTableRow",
	props: Sn(),
	setup(e, { slots: t }) {
		let { t: n } = K(), { displayClasses: r, mobile: i } = se(e, "v-data-table__tr"), { isSelected: a, toggleSelect: o, someSelected: c, allSelected: l, selectAll: u } = Kt(), { isExpanded: d, toggleExpand: f } = xn(), { toggleSort: p, sortBy: m, isSorted: g } = Qt(), { columns: _ } = Rt();
		Q(() => Y("tr", {
			class: P([
				"v-data-table__tr",
				{ "v-data-table__tr--clickable": !!(e.onClick || e.onContextmenu || e.onDblclick) },
				r.value
			]),
			onClick: e.onClick,
			onContextmenu: e.onContextmenu,
			onDblclick: e.onDblclick
		}, [e.item && _.value.map((r, _) => {
			let v = e.item, y = `item.${r.key}`, b = `header.${r.key}`, x = {
				index: e.index,
				item: v.raw,
				internalItem: v,
				value: A(v.columns, r.key),
				column: r,
				isSelected: a,
				toggleSelect: o,
				isExpanded: d,
				toggleExpand: f
			}, S = {
				column: r,
				selectAll: u,
				isSorted: g,
				toggleSort: p,
				sortBy: m.value,
				someSelected: c.value,
				allSelected: l.value,
				getSortIcon: () => ""
			}, C = h(e.cellProps) ? e.cellProps({
				index: x.index,
				item: x.item,
				internalItem: x.internalItem,
				value: x.value,
				column: r
			}) : e.cellProps, w = h(r.cellProps) ? r.cellProps({
				index: x.index,
				item: x.item,
				internalItem: x.internalItem,
				value: x.value
			}) : r.cellProps, T = r.key === "data-table-select" || r.key === "data-table-expand", E = r.key === "data-table-group" && r.width === 0 && !r.title;
			return Z(St, s({
				key: r.key ?? _,
				align: r.align,
				indent: r.indent,
				class: {
					"v-data-table__td--expanded-row": r.key === "data-table-expand",
					"v-data-table__td--select-row": r.key === "data-table-select"
				},
				fixed: r.fixed,
				fixedOffset: r.fixedOffset,
				fixedEndOffset: r.fixedEndOffset,
				lastFixed: r.lastFixed,
				firstFixedEnd: r.firstFixedEnd,
				maxWidth: i.value ? void 0 : r.maxWidth,
				noPadding: T,
				empty: E,
				nowrap: r.nowrap,
				width: i.value ? void 0 : r.width
			}, C, w), { default: () => {
				if (r.key === "data-table-select") return t["item.data-table-select"]?.({
					...x,
					props: {
						color: e.color,
						disabled: !v.selectable,
						modelValue: a([v]),
						onClick: ue(() => o(v), ["stop"])
					}
				}) ?? Z(at, {
					"aria-label": n(e.selectRowLabel),
					color: e.color,
					disabled: !v.selectable,
					density: e.density,
					modelValue: a([v]),
					onClick: ue((t) => o(v, e.index, t), ["stop"])
				}, null);
				if (r.key === "data-table-expand") return t["item.data-table-expand"]?.({
					...x,
					props: {
						icon: d(v) ? e.collapseIcon : e.expandIcon,
						size: "small",
						variant: "text",
						onClick: ue(() => f(v), ["stop"])
					}
				}) ?? Z($, {
					icon: d(v) ? e.collapseIcon : e.expandIcon,
					size: "small",
					variant: "text",
					onClick: ue(() => f(v), ["stop"])
				}, null);
				if (t[y] && !i.value) return t[y](x);
				let s = F(x.value), c = e.getMatches?.(v)?.[r.key], l = c?.length ? Z(be, {
					text: s,
					matches: c
				}, null) : s;
				return i.value ? Y(N, null, [Y("div", { class: "v-data-table__td-title" }, [t[b]?.(S) ?? r.title]), Y("div", { class: "v-data-table__td-value" }, [t[y]?.(x) ?? l])]) : l;
			} });
		})]));
	}
}), wn = e({
	color: String,
	loading: [
		Boolean,
		String,
		Object
	],
	loadingText: {
		type: String,
		default: "$vuetify.dataIterator.loadingText"
	},
	hideNoData: Boolean,
	items: {
		type: Array,
		default: () => []
	},
	noDataText: {
		type: String,
		default: "$vuetify.noDataText"
	},
	rowProps: [Object, Function],
	cellProps: [Object, Function],
	expandTransition: {
		type: null,
		default: () => ({ component: Be }),
		validator: (e) => e !== !0
	},
	...M(Sn(), [
		"collapseIcon",
		"expandIcon",
		"density",
		"getMatches"
	]),
	...M(gn(), [
		"groupCollapseIcon",
		"groupExpandIcon",
		"density"
	]),
	...R()
}, "VDataTableRows"), Tn = b()({
	name: "VDataTableRows",
	inheritAttrs: !1,
	props: wn(),
	setup(e, { attrs: t, slots: n }) {
		let { columns: r } = Rt(), { expandOnClick: i, toggleExpand: a, isExpanded: o } = xn(), { isSelected: c, toggleSelect: l } = Kt(), { toggleGroup: u, isGroupOpen: d } = cn(), { t: f } = K(), { mobile: p } = se(e);
		return Q(() => {
			let m = M(e, [
				"groupCollapseIcon",
				"groupExpandIcon",
				"density"
			]);
			return e.loading && (!e.items.length || n.loading) ? Y("tr", {
				class: "v-data-table-rows-loading",
				key: "loading"
			}, [Y("td", { colspan: r.value.length }, [n.loading?.() ?? f(e.loadingText)])]) : !e.loading && !e.items.length && !e.hideNoData ? Y("tr", {
				class: "v-data-table-rows-no-data",
				key: "no-data"
			}, [Y("td", { colspan: r.value.length }, [n["no-data"]?.() ?? f(e.noDataText)])]) : Y(N, null, [e.items.map((f, g) => {
				if (f.type === "group") {
					let e = {
						index: g,
						item: f,
						columns: r.value,
						isExpanded: o,
						toggleExpand: a,
						isSelected: c,
						toggleSelect: l,
						toggleGroup: u,
						isGroupOpen: d
					};
					return n["group-header"] ? n["group-header"](e) : Z(_n, s({
						key: `group-header_${f.id}`,
						item: f
					}, lt(t, ":groupHeader", () => e), m), n);
				}
				if (f.type === "group-summary") {
					let e = {
						index: g,
						item: f,
						columns: r.value,
						toggleGroup: u
					};
					return n["group-summary"]?.(e) ?? "";
				}
				let _ = {
					index: f.virtualIndex ?? g,
					item: f.raw,
					internalItem: f,
					columns: r.value,
					isExpanded: o,
					toggleExpand: a,
					isSelected: c,
					toggleSelect: l
				}, v = {
					..._,
					props: s({
						key: `item_${f.key ?? f.index}`,
						onClick: i.value ? () => {
							a(f);
						} : void 0,
						index: g,
						item: f,
						color: e.color,
						cellProps: e.cellProps,
						collapseIcon: e.collapseIcon,
						expandIcon: e.expandIcon,
						density: e.density,
						mobile: p.value,
						getMatches: e.getMatches
					}, lt(t, ":row", () => _), h(e.rowProps) ? e.rowProps({
						item: _.item,
						index: _.index,
						internalItem: _.internalItem
					}) : e.rowProps)
				};
				return Y(N, { key: v.props.key }, [n.item ? n.item(v) : Z(Cn, v.props, n), n["expanded-row"] ? o(f) && n["expanded-row"](_) : n.expanded && Y("tr", { class: "v-data-table__tr--expanded" }, [Y("td", { colspan: r.value.length }, [e.expandTransition ? Z(Ve, { transition: e.expandTransition }, { default: () => [o(f) ? Y("div", null, [n.expanded(_)]) : null] }) : o(f) && Y("div", null, [n.expanded(_)])])])]);
			})]);
		}), {};
	}
}), En = e({
	gridlines: {
		type: [Boolean, String],
		default: "horizontal",
		validator: (e) => p(e) || [
			"horizontal",
			"vertical",
			"all"
		].includes(e)
	},
	fixedHeader: Boolean,
	fixedFooter: Boolean,
	height: [Number, String],
	hover: Boolean,
	striped: {
		type: String,
		default: null,
		validator: (e) => ["even", "odd"].includes(e)
	},
	...De(),
	...ze(),
	...Oe(),
	...te()
}, "VTable"), Dn = b()({
	name: "VTable",
	inheritAttrs: !1,
	props: En(),
	setup(e, { attrs: t, slots: n, emit: r }) {
		let { themeClasses: i } = ie(e), { densityClasses: a } = Re(e), o = z(() => e.gridlines === !1 ? "none" : e.gridlines === !0 ? "all" : e.gridlines);
		return Q(() => {
			let [r, c] = ve(t, [/^aria-label/]);
			return Z(e.tag, s(c, {
				class: [
					"v-table",
					`v-table--gridlines-${o.value}`,
					{
						"v-table--fixed-height": !!e.height,
						"v-table--fixed-header": e.fixedHeader,
						"v-table--fixed-footer": e.fixedFooter,
						"v-table--has-top": !!n.top,
						"v-table--has-bottom": !!n.bottom,
						"v-table--hover": e.hover,
						"v-table--striped-even": e.striped === "even",
						"v-table--striped-odd": e.striped === "odd"
					},
					i.value,
					a.value,
					e.class
				],
				style: e.style
			}), { default: () => [
				n.top?.(),
				n.default ? Y("div", {
					class: "v-table__wrapper",
					style: { height: l(e.height) }
				}, [Y("table", G(y(r)), [n.caption?.(), n.default()])]) : n.wrapper?.(),
				n.bottom?.()
			] });
		}), {};
	}
}), On = e({
	items: {
		type: Array,
		default: () => []
	},
	itemValue: {
		type: [
			String,
			Array,
			Function
		],
		default: "id"
	},
	itemSelectable: {
		type: [
			String,
			Array,
			Function
		],
		default: null
	},
	rowProps: [Object, Function],
	cellProps: [Object, Function],
	returnObject: Boolean
}, "DataTable-items");
function kn(e, t, n, r) {
	let i = e.returnObject ? t : oe(t, e.itemValue), a = oe(t, e.itemSelectable, !0), o = r.reduce((e, n) => (n.key != null && (e[n.key] = oe(t, n.value)), e), {});
	return {
		type: "item",
		key: e.returnObject ? oe(t, e.itemValue) : i,
		index: n,
		value: i,
		selectable: a,
		columns: o,
		raw: t
	};
}
function An(e, t, n) {
	return t.map((t, r) => kn(e, t, r, n));
}
function jn(e, t) {
	return { items: z(() => An(e, e.items, t.value)) };
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/options.js
function Mn({ page: e, itemsPerPage: t, sortBy: n, groupBy: r, search: i }) {
	let a = g("VDataTable"), o = () => ({
		page: e.value,
		itemsPerPage: t.value,
		sortBy: n.value,
		groupBy: r.value,
		search: i.value
	}), s = null;
	u(o, (t) => {
		je(s, t) || (s && s.search !== t.search && (e.value = 1), a.emit("update:options", t), s = t);
	}, {
		deep: !0,
		immediate: !0
	});
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/VDataTable.js
var Nn = e({
	...wn(),
	hideDefaultBody: Boolean,
	hideDefaultFooter: Boolean,
	hideDefaultHeader: Boolean,
	width: [String, Number],
	search: String,
	...vn(),
	...rn(),
	...Ct(),
	...On(),
	...Ut(),
	...qt(),
	...he(tn(), ["multiSort", "initialSortOrder"]),
	...En()
}, "DataTable"), Pn = e({
	...pt(),
	...Nn(),
	...xe(),
	...bt()
}, "VDataTable"), Fn = b()({
	name: "VDataTable",
	props: Pn(),
	emits: {
		"update:modelValue": (e) => !0,
		"update:page": (e) => !0,
		"update:itemsPerPage": (e) => !0,
		"update:sortBy": (e) => !0,
		"update:options": (e) => !0,
		"update:groupBy": (e) => !0,
		"update:expanded": (e) => !0,
		"update:opened": (e) => !0,
		"update:currentItems": (e) => !0
	},
	setup(e, { attrs: t, slots: n }) {
		let { groupBy: r, opened: a, openAll: o, groupKey: c } = on(e), { initialSortOrder: l, sortBy: u, multiSort: d, mustSort: f } = Yt(e), { page: p, itemsPerPage: m } = ht(e), { disableSort: h } = le(e), { columns: g, headers: _, sortFunctions: v, sortRawFunctions: y, filterFunctions: b } = Lt(e, {
			groupBy: r,
			showSelect: J(() => e.showSelect),
			showExpand: J(() => e.showExpand)
		}), { items: x } = jn(e, g), S = J(() => e.search), { filteredItems: C, getMatches: w } = ye(e, x, S, {
			transform: (e) => e.columns,
			customKeyFilter: b
		}), { toggleSort: T } = Zt({
			initialSortOrder: l,
			sortBy: u,
			multiSort: d,
			mustSort: f,
			page: p
		}), { sortByWithGroups: E, opened: D, extractRows: O, isGroupOpen: ee, toggleGroup: k } = sn({
			groupBy: r,
			sortBy: u,
			disableSort: h,
			opened: a
		}), { sortedItems: A } = $t(e, C, E, {
			transform: (e) => ({
				...e.raw,
				...e.columns
			}),
			sortFunctions: v,
			sortRawFunctions: y
		});
		pn(D, o, A, r, c);
		let { pageCount: j, setItemsPerPage: M, prevPage: te, nextPage: P, setPage: F, paginatedItems: I } = yt({
			pageBy: z(() => e.pageBy === "auto" ? e.groupBy.length ? "group" : "item" : e.pageBy),
			sortedItems: A,
			paginate: (e) => {
				let t = z(() => W(e).length), { startIndex: n, stopIndex: r, pageCount: i, setItemsPerPage: a, prevPage: o, nextPage: s, setPage: c } = gt({
					page: p,
					itemsPerPage: m,
					itemsLength: t
				}), { paginatedItems: l } = vt({
					items: e,
					startIndex: n,
					stopIndex: r,
					itemsPerPage: m
				});
				return {
					paginatedItems: l,
					pageCount: i,
					setItemsPerPage: a,
					prevPage: o,
					nextPage: s,
					setPage: c
				};
			},
			group: (e) => hn(e, r, D, () => !!n["group-summary"], ee, c)
		}), ne = z(() => O(I.value)), { isSelected: L, select: R, selectAll: B, toggleSelect: V, someSelected: H, allSelected: re } = Gt(e, {
			allItems: x,
			currentPage: ne
		}), { isExpanded: U, toggleExpand: ie } = bn(e), G = zt(() => e.loading, () => e.color);
		Mn({
			page: p,
			itemsPerPage: m,
			sortBy: u,
			groupBy: r,
			search: S
		}), i({ VDataTableRows: {
			hideNoData: J(() => e.hideNoData),
			noDataText: J(() => e.noDataText),
			loading: J(() => e.loading),
			loadingText: J(() => e.loadingText)
		} });
		let K = z(() => ({
			page: p.value,
			itemsPerPage: m.value,
			itemsLength: C.value.length,
			sortBy: u.value,
			pageCount: j.value,
			toggleSort: T,
			setItemsPerPage: M,
			prevPage: te,
			nextPage: P,
			setPage: F,
			someSelected: H.value,
			allSelected: re.value,
			isSelected: L,
			select: R,
			selectAll: B,
			toggleSelect: V,
			isExpanded: U,
			toggleExpand: ie,
			isGroupOpen: ee,
			toggleGroup: k,
			items: ne.value.map((e) => e.raw),
			internalItems: ne.value,
			groupedItems: I.value,
			columns: g.value,
			headers: _.value
		}));
		return Q(() => {
			let r = xt.filterProps(e), i = nn.filterProps(he(e, ["multiSort"])), a = Tn.filterProps(e), o = Dn.filterProps(e);
			return Z(Dn, s({
				class: [
					"v-data-table",
					{
						"v-data-table--show-select": e.showSelect,
						"v-data-table--loading": e.loading
					},
					e.class
				],
				style: e.style
			}, o, { fixedHeader: e.fixedHeader || e.sticky }), {
				top: () => n.top?.(K.value),
				caption: n.caption,
				default: () => n.default ? n.default(K.value) : Y(N, null, [
					n.colgroup?.(K.value),
					!e.hideDefaultHeader && Y("thead", { key: "thead" }, [Z(nn, s(i, { multiSort: !!e.multiSort }), n)]),
					n.thead?.(K.value),
					!e.hideDefaultBody && Y("tbody", null, [
						n["body.prepend"]?.(K.value),
						n.body ? n.body(K.value) : Z(Tn, s(t, a, {
							items: I.value,
							getMatches: w
						}), n),
						n["body.append"]?.(K.value),
						G.active.value && ["end", "both"].includes(G.side.value) && Y("tr", { class: "v-data-table-progress v-data-table-progress--bottom" }, [Y("th", { colspan: g.value.length }, [Z(Xe, {
							name: "v-data-table-progress",
							absolute: !0,
							active: !0,
							color: G.color.value,
							indeterminate: !0
						}, { default: n.loader })])])
					]),
					n.tbody?.(K.value),
					n.tfoot?.(K.value)
				]),
				bottom: () => n.bottom ? n.bottom(K.value) : !e.hideDefaultFooter && Y(N, null, [Z(Ie, null, null), Z(xt, r, { prepend: n["footer.prepend"] })])
			});
		}), {};
	}
}), In = e({
	itemsLength: {
		type: [Number, String],
		required: !0
	},
	...pt(),
	...Nn(),
	...bt()
}, "VDataTableServer"), Ln = b()({
	name: "VDataTableServer",
	props: In(),
	emits: {
		"update:modelValue": (e) => !0,
		"update:page": (e) => !0,
		"update:itemsPerPage": (e) => !0,
		"update:sortBy": (e) => !0,
		"update:options": (e) => !0,
		"update:expanded": (e) => !0,
		"update:groupBy": (e) => !0,
		"update:opened": (e) => !0
	},
	setup(e, { attrs: t, slots: n }) {
		let { groupBy: r, opened: a, openAll: o, groupKey: l } = on(e), { initialSortOrder: u, sortBy: d, multiSort: f, mustSort: p } = Yt(e), { page: m, itemsPerPage: h } = ht(e), { disableSort: g } = le(e), _ = z(() => parseInt(e.itemsLength, 10)), { columns: v, headers: y } = Lt(e, {
			groupBy: r,
			showSelect: J(() => e.showSelect),
			showExpand: J(() => e.showExpand)
		}), { items: b } = jn(e, v), { toggleSort: x } = Zt({
			initialSortOrder: u,
			sortBy: d,
			multiSort: f,
			mustSort: p,
			page: m
		}), { opened: S, isGroupOpen: C, toggleGroup: w, extractRows: T } = sn({
			groupBy: r,
			sortBy: d,
			disableSort: g,
			opened: a
		});
		pn(S, o, b, r, l);
		let { pageCount: E, setItemsPerPage: D, prevPage: O, nextPage: ee, setPage: k } = gt({
			page: m,
			itemsPerPage: h,
			itemsLength: _
		}), { flatItems: A } = hn(b, r, S, () => !!n["group-summary"], C, l), { isSelected: j, select: M, selectAll: te, toggleSelect: P, someSelected: F, allSelected: I } = Gt(e, {
			allItems: b,
			currentPage: b
		}), { isExpanded: ne, toggleExpand: L } = bn(e), R = z(() => T(b.value));
		Mn({
			page: m,
			itemsPerPage: h,
			sortBy: d,
			groupBy: r,
			search: J(() => e.search)
		}), c("v-data-table", {
			toggleSort: x,
			sortBy: d
		}), i({ VDataTableRows: {
			hideNoData: J(() => e.hideNoData),
			noDataText: J(() => e.noDataText),
			loading: J(() => e.loading),
			loadingText: J(() => e.loadingText)
		} });
		let B = z(() => ({
			page: m.value,
			itemsPerPage: h.value,
			itemsLength: _.value,
			sortBy: d.value,
			pageCount: E.value,
			toggleSort: x,
			setItemsPerPage: D,
			prevPage: O,
			nextPage: ee,
			setPage: k,
			someSelected: F.value,
			allSelected: I.value,
			isSelected: j,
			select: M,
			selectAll: te,
			toggleSelect: P,
			isExpanded: ne,
			toggleExpand: L,
			isGroupOpen: C,
			toggleGroup: w,
			items: R.value.map((e) => e.raw),
			internalItems: R.value,
			groupedItems: A.value,
			columns: v.value,
			headers: y.value
		}));
		Q(() => {
			let r = xt.filterProps(e), i = nn.filterProps(he(e, ["multiSort"])), a = Tn.filterProps(e), o = Dn.filterProps(e);
			return Z(Dn, s({
				class: [
					"v-data-table",
					{ "v-data-table--loading": e.loading },
					e.class
				],
				style: e.style
			}, o, { fixedHeader: e.fixedHeader || e.sticky }), {
				top: () => n.top?.(B.value),
				caption: n.caption,
				default: () => n.default ? n.default(B.value) : Y(N, null, [
					n.colgroup?.(B.value),
					!e.hideDefaultHeader && Y("thead", {
						key: "thead",
						class: "v-data-table__thead",
						role: "rowgroup"
					}, [Z(nn, s(i, { multiSort: !!e.multiSort }), n)]),
					n.thead?.(B.value),
					!e.hideDefaultBody && Y("tbody", {
						class: "v-data-table__tbody",
						role: "rowgroup"
					}, [
						n["body.prepend"]?.(B.value),
						n.body ? n.body(B.value) : Z(Tn, s(t, a, { items: A.value }), n),
						n["body.append"]?.(B.value)
					]),
					n.tbody?.(B.value),
					n.tfoot?.(B.value)
				]),
				bottom: () => n.bottom ? n.bottom(B.value) : !e.hideDefaultFooter && Y(N, null, [Z(Ie, null, null), Z(xt, r, { prepend: n["footer.prepend"] })])
			});
		});
	}
}), Rn = ["src", "alt"], zn = /* @__PURE__ */ j({
	__name: "AvatarView",
	props: {
		size: {},
		iconSize: {},
		initialsSize: {},
		square: {
			type: Boolean,
			default: !1
		},
		src: { default: "" },
		label: { default: "" },
		initials: { default: "" },
		icon: { default: "mdi-account" },
		color: { default: "primary" }
	},
	setup(e) {
		let t = e, n = O(""), r = z(() => t.src !== "" && t.src !== n.value);
		return (t, i) => (_(), q(k(He), {
			size: e.size,
			color: r.value ? void 0 : e.color,
			variant: r.value ? void 0 : "tonal",
			rounded: e.square ? "lg" : void 0,
			role: e.label && !r.value ? "img" : void 0,
			"aria-label": e.label && !r.value ? e.label : void 0
		}, {
			default: E(() => [r.value ? (_(), H("img", {
				key: 0,
				src: e.src,
				alt: e.label,
				style: {
					width: "100%",
					height: "100%",
					"object-fit": "cover"
				},
				"data-part": "avatar-image",
				onError: i[0] ||= (t) => n.value = e.src
			}, null, 40, Rn)) : e.initials ? (_(), H("span", {
				key: 1,
				class: "font-weight-medium",
				style: pe({ fontSize: `${e.initialsSize}px` }),
				"aria-hidden": "true",
				"data-part": "avatar-initials"
			}, F(e.initials), 5)) : (_(), q(k(Le), {
				key: 2,
				icon: e.icon,
				size: e.iconSize,
				"aria-hidden": "true",
				"data-part": "avatar-icon"
			}, null, 8, ["icon", "size"]))]),
			_: 1
		}, 8, [
			"size",
			"color",
			"variant",
			"rounded",
			"role",
			"aria-label"
		]));
	}
}), Bn = 14, Vn = /* @__PURE__ */ j({
	__name: "PillView",
	props: {
		text: {},
		variant: { default: "outlined" },
		size: { default: "x-small" },
		color: { default: "" },
		icon: { default: "" },
		href: { default: "" },
		closable: {
			type: Boolean,
			default: !1
		},
		closeLabel: { default: "" },
		error: {
			type: Boolean,
			default: !1
		},
		avatarSrc: { default: "" },
		avatarInitials: { default: "" }
	},
	emits: ["close"],
	setup(e, { emit: t }) {
		let n = {
			"x-small": {
				size: 14,
				initials: 8
			},
			small: {
				size: 18,
				initials: 9
			},
			default: {
				size: 24,
				initials: 11
			}
		}, r = e, i = t, a = z(() => n[r.size] ?? n["x-small"]);
		return (t, n) => (_(), q(k(Ze), {
			size: e.size,
			variant: e.variant,
			color: e.error ? "error" : e.color || void 0,
			href: e.href || void 0,
			closable: e.closable,
			"close-label": e.closeLabel || void 0,
			label: "",
			"onClick:close": n[0] ||= (e) => i("close")
		}, {
			default: E(() => [e.error ? (_(), q(k(Le), {
				key: 0,
				start: "",
				size: Bn,
				icon: "mdi-alert-circle-outline",
				"data-part": "chip-error-icon"
			})) : e.icon ? (_(), q(k(Le), {
				key: 1,
				start: "",
				size: Bn,
				icon: e.icon,
				"data-part": "chip-icon"
			}, null, 8, ["icon"])) : e.avatarSrc || e.avatarInitials ? (_(), q(zn, {
				key: 2,
				size: a.value.size,
				"icon-size": a.value.size,
				"initials-size": a.value.initials,
				src: e.avatarSrc,
				initials: e.avatarInitials,
				color: e.color || "primary",
				class: "mr-1 ml-n1",
				"data-part": "chip-avatar"
			}, null, 8, [
				"size",
				"icon-size",
				"initials-size",
				"src",
				"initials",
				"color"
			])) : U("", !0), me(F(e.text), 1)]),
			_: 1
		}, 8, [
			"size",
			"variant",
			"color",
			"href",
			"closable",
			"close-label"
		]));
	}
}), Hn = {
	class: "d-flex flex-wrap ga-1 py-1",
	"data-part": "chips"
}, Un = {
	key: 0,
	class: "text-medium-emphasis",
	"data-part": "chips-empty"
}, Wn = /* @__PURE__ */ j({
	__name: "ChipListView",
	props: {
		items: {},
		variant: { default: "outlined" },
		size: { default: "x-small" },
		color: { default: "" },
		icon: { default: "" },
		emptyText: { default: "-" }
	},
	setup(e) {
		return (t, n) => (_(), H("div", Hn, [(_(!0), H(N, null, f(e.items, (t, n) => (_(), q(Vn, {
			key: `${n}-${t}`,
			text: t,
			size: e.size,
			variant: e.variant,
			color: e.color,
			icon: e.icon,
			"data-part": "chip"
		}, null, 8, [
			"text",
			"size",
			"variant",
			"color",
			"icon"
		]))), 128)), e.items.length ? U("", !0) : (_(), H("span", Un, F(e.emptyText), 1))]));
	}
}), Gn = /* @__PURE__ */ j({
	__name: "IconActionView",
	props: {
		icon: {},
		label: { default: "" },
		tooltip: {
			type: Boolean,
			default: !0
		},
		color: { default: "" },
		href: { default: "" },
		loading: {
			type: Boolean,
			default: !1
		},
		disabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["action"],
	setup(e, { emit: t }) {
		let n = t;
		return (t, r) => (_(), q(k($), {
			icon: "",
			size: "small",
			variant: "text",
			color: e.color || void 0,
			href: e.href || void 0,
			loading: e.loading,
			disabled: e.disabled,
			"aria-label": e.label || void 0,
			"data-part": "icon-action",
			onClick: r[0] ||= (e) => n("action", e)
		}, {
			default: E(() => [Z(k(Le), {
				size: "18",
				icon: e.icon,
				"data-part": "icon-action-icon"
			}, null, 8, ["icon"]), e.tooltip && e.label ? (_(), q(k(Ke), {
				key: 0,
				activator: "parent",
				location: "top",
				"content-props": { "data-part": "icon-action-tooltip" }
			}, {
				default: E(() => [me(F(e.label), 1)]),
				_: 1
			})) : U("", !0)]),
			_: 1
		}, 8, [
			"color",
			"href",
			"loading",
			"disabled",
			"aria-label"
		]));
	}
}), Kn = {
	"x-small": {
		size: 24,
		icon: 14,
		initials: 10
	},
	small: {
		size: 28,
		icon: 16,
		initials: 12
	},
	medium: {
		size: 36,
		icon: 20,
		initials: 14
	},
	large: {
		size: 48,
		icon: 26,
		initials: 18
	},
	"x-large": {
		size: 64,
		icon: 36,
		initials: 24
	}
}, qn = {
	class: "d-flex align-center ga-3",
	style: { "min-width": "0" },
	"data-part": "name-cell"
}, Jn = { style: { "min-width": "0" } }, Yn = ["title"], Xn = ["title"], Zn = /* @__PURE__ */ j({
	__name: "NameCellView",
	props: {
		name: {},
		sub: { default: "" },
		avatarIcon: { default: "" },
		avatarColor: { default: "primary" }
	},
	setup(e) {
		let t = Kn.medium;
		return (n, r) => (_(), H("div", qn, [e.avatarIcon ? (_(), q(zn, {
			key: 0,
			size: k(t).size,
			"icon-size": k(t).icon,
			"initials-size": k(t).initials,
			icon: e.avatarIcon,
			color: e.avatarColor,
			"data-part": "name-avatar"
		}, null, 8, [
			"size",
			"icon-size",
			"initials-size",
			"icon",
			"color"
		])) : U("", !0), Y("div", Jn, [Y("div", {
			class: "font-weight-medium text-truncate",
			title: e.name,
			"data-part": "name"
		}, F(e.name), 9, Yn), e.sub ? (_(), H("div", {
			key: 0,
			class: "text-body-small text-medium-emphasis text-truncate",
			title: e.sub,
			"data-part": "name-sub"
		}, F(e.sub), 9, Xn)) : U("", !0)])]));
	}
}), Qn = {
	key: 0,
	"data-part": "score"
}, $n = {
	key: 0,
	class: "text-body-small text-medium-emphasis mb-1",
	"data-part": "score-text"
}, er = {
	key: 1,
	class: "d-flex align-center ga-2",
	"data-part": "score"
}, tr = 60, nr = 56, rr = /* @__PURE__ */ j({
	__name: "ScoreBarView",
	props: {
		value: {},
		color: { default: "primary" },
		text: { default: "" },
		textPosition: { default: "end" },
		height: { default: 6 }
	},
	setup(e) {
		let t = e, n = z(() => Number.isFinite(t.value) ? Math.min(100, Math.max(0, t.value)) : 0);
		return (t, r) => e.textPosition === "top" ? (_(), H("div", Qn, [e.text ? (_(), H("div", $n, F(e.text), 1)) : U("", !0), Z(k(qe), {
			"model-value": n.value,
			color: e.color,
			height: e.height,
			rounded: "",
			"aria-label": e.text || void 0,
			"data-part": "score-bar"
		}, null, 8, [
			"model-value",
			"color",
			"height",
			"aria-label"
		])])) : (_(), H("div", er, [Z(k(qe), {
			"model-value": n.value,
			color: e.color,
			height: e.height,
			rounded: "",
			"aria-label": e.text || void 0,
			style: pe({ minWidth: `${tr}px` }),
			"data-part": "score-bar"
		}, null, 8, [
			"model-value",
			"color",
			"height",
			"aria-label",
			"style"
		]), e.text ? (_(), H("span", {
			key: 0,
			class: "text-body-small text-medium-emphasis flex-shrink-0 text-end",
			style: pe({ minWidth: `${nr}px` }),
			"data-part": "score-text"
		}, F(e.text), 5)) : U("", !0)]));
	}
}), ir = { class: "smartview-root" }, ar = {
	key: 3,
	class: "text-body-medium text-medium-emphasis"
}, or = {
	key: 4,
	class: "text-body-medium",
	"data-part": "number"
}, sr = ["onChange"], cr = "data-table-select", lr = 32, ur = "button, a, input, label, [role=\"button\"], [role=\"switch\"]", dr = 100;
//#endregion
//#region src/entries/smartview-data-table.ts
Ae("smartview-data-table", /* @__PURE__ */ Qe(/* @__PURE__ */ j({
	__name: "SmartviewDataTable.ce",
	props: {
		headers: {
			default: () => [],
			type: Array
		},
		items: {
			default: () => [],
			type: Array
		},
		loading: {
			type: Boolean,
			default: !1
		},
		search: {
			default: "",
			type: String
		},
		itemValue: {
			default: "id",
			type: String
		},
		itemsPerPage: {
			default: 15,
			type: Number
		},
		page: {
			default: 1,
			type: Number
		},
		sortBy: {
			default: () => [],
			type: Array
		},
		serverItemsLength: {
			default: void 0,
			type: Number
		},
		rowClickable: {
			type: Boolean,
			default: !1
		},
		selectable: {
			type: Boolean,
			default: !1
		},
		selected: {
			default: () => [],
			type: Array
		},
		busy: {
			default: () => [],
			type: Array
		},
		emptyIcon: {
			default: "mdi-database-off-outline",
			type: String
		},
		emptyTitle: {
			default: "",
			type: String
		},
		emptyHint: {
			default: "",
			type: String
		},
		emptyActionText: {
			default: "",
			type: String
		},
		emptyActionHref: {
			default: "",
			type: String
		},
		overlayTarget: {
			default: "body",
			type: String
		},
		flat: {
			type: Boolean,
			default: !1
		},
		hideFooter: {
			type: Boolean,
			default: !1
		}
	},
	emits: [
		"row-action",
		"row-click",
		"sort-change",
		"page-change",
		"switch-change",
		"empty-action",
		"selection-change"
	],
	setup(e, { emit: t }) {
		let n = e, r = t, { t: i, locale: o } = ne(), c = Pe(), { overlayDefaults: l } = Te(() => n.overlayTarget), d = z(() => typeof n.serverItemsLength == "number" && n.serverItemsLength >= 0), p = {
			key: cr,
			width: lr,
			minWidth: lr,
			maxWidth: lr,
			sortable: !1,
			headerProps: { class: "smartview-select-cell" },
			cellProps: { class: "smartview-select-cell" }
		}, m = z(() => [...n.selectable ? [p] : [], ...n.headers.map(({ title: e, key: t, type: n, width: r, maxWidth: i, align: a, sortable: o, value: s }) => ({
			title: e,
			key: t,
			width: r,
			maxWidth: i,
			value: s,
			align: a ?? g(n),
			sortable: o ?? (n !== "actions" && n !== "chips" && n !== "switch")
		}))]), h = z(() => n.headers.filter((e) => e.type && e.type !== "text"));
		function g(e) {
			if (e === "actions" || e === "switch") return "center";
			if (e === "number") return "end";
		}
		function y(e) {
			let t = e.align ?? g(e.type);
			return t === "center" ? "justify-center" : t === "end" ? "justify-end" : "";
		}
		let { current: b, commit: x } = Fe("page", () => n.page), { current: S, commit: C } = Fe("itemsPerPage", () => n.itemsPerPage), { current: w, commit: T } = Fe("sortBy", () => n.sortBy, { normalize: (e) => [...e] });
		function D() {
			return {
				page: b.value,
				itemsPerPage: S.value,
				sortBy: w.value.map((e) => ({ ...e }))
			};
		}
		let O = null;
		function A(e) {
			O === null && a(j), O !== "sort-change" && (O = e);
		}
		function j() {
			let e = O;
			O = null, e === "sort-change" ? r("sort-change", D()) : e === "page-change" && r("page-change", D());
		}
		let M = !1;
		u([
			() => n.items,
			() => n.search,
			() => n.serverItemsLength
		], () => {
			M = !0, globalThis.setTimeout(() => M = !1);
		}, { flush: "sync" });
		function te(e) {
			if (e !== b.value) {
				if (M) {
					b.value = e;
					return;
				}
				x(e), A("page-change");
			}
		}
		function I(e) {
			e !== S.value && (C(e), A("page-change"));
		}
		function L(e) {
			T(e.map(({ key: e, order: t }) => ({
				key: e,
				order: t === "desc" ? "desc" : "asc"
			}))), A("sort-change");
		}
		let { current: R, commit: B } = Fe("selected", () => n.selected, { normalize: (e) => Array.isArray(e) ? [...e] : [] });
		function V(e) {
			let t = [...e];
			t.length === R.value.length && t.every((e, t) => e === R.value[t]) || (B(t), r("selection-change", t));
		}
		let re = z(() => n.rowClickable ? ({ item: e }) => ({
			tabindex: 0,
			"data-part": "row",
			onClick: (t) => {
				t.target instanceof Element && t.target.closest(ur) || r("row-click", { item: e });
			},
			onKeydown: (t) => {
				t.key === "Enter" && t.target === t.currentTarget && r("row-click", { item: e });
			}
		}) : void 0), W = z(() => new Set(n.busy.map((e) => ie(e.id, e.target))));
		function ie(e, t) {
			return JSON.stringify([$e(e), t]);
		}
		function G(e, t) {
			return W.value.has(ie(e[n.itemValue], t));
		}
		function K(e, t) {
			return (e.actions ?? []).filter((e) => !e.visible || e.visible(t));
		}
		function ae(e, t) {
			return typeof e.href == "function" ? e.href(t) : e.href ?? "";
		}
		function J(e, t, n) {
			if (G(t, e.name)) {
				n.preventDefault();
				return;
			}
			Ne(c, "row-action", ae(e, t), n, {
				action: e.name,
				item: t
			});
		}
		function oe(e, t) {
			e.target instanceof HTMLInputElement && (e.target.checked = t);
		}
		function se(e, t) {
			let n = e.scoreMax && e.scoreMax > 0 ? e.scoreMax : dr;
			return typeof t == "number" && Number.isFinite(t) ? t / n * 100 : 0;
		}
		function ce(e, t) {
			return typeof e.scoreColor == "function" ? e.scoreColor(t) : e.scoreColor ?? "primary";
		}
		function le(e, t, n) {
			G(t, e.key) || r("switch-change", {
				key: e.key,
				item: t,
				value: n === !0
			});
		}
		return (t, n) => (_(), q(k(Ce), { defaults: k(l) }, {
			default: E(() => [Y("div", ir, [Z(k(rt), {
				rounded: e.flat ? 0 : "xl",
				elevation: e.flat ? 0 : 2,
				variant: e.flat ? "flat" : void 0,
				"data-part": "root"
			}, {
				default: E(() => [(_(), q(v(d.value ? k(Ln) : k(Fn)), s(d.value ? { itemsLength: e.serverItemsLength } : {}, {
					headers: m.value,
					items: e.items,
					loading: e.loading,
					search: e.search,
					"item-value": e.itemValue,
					"items-per-page": k(S),
					page: k(b),
					"sort-by": k(w),
					"row-props": re.value,
					"hide-default-footer": e.hideFooter,
					"show-select": e.selectable,
					"select-strategy": "page",
					"model-value": k(R),
					hover: "",
					class: "smartview-data-table smartview-table",
					"onUpdate:page": te,
					"onUpdate:itemsPerPage": I,
					"onUpdate:sortBy": L,
					"onUpdate:modelValue": V
				}), ee({
					[`header.${cr}`]: E(({ allSelected: e, someSelected: t, selectAll: n }) => [Z(k(at), {
						"model-value": e,
						indeterminate: t && !e,
						"aria-label": k(i)("smartview.selectPageRows"),
						density: "compact",
						"data-part": "select-all",
						"onUpdate:modelValue": (e) => n(!!e)
					}, null, 8, [
						"model-value",
						"indeterminate",
						"aria-label",
						"onUpdate:modelValue"
					])]),
					[`item.${cr}`]: E(({ props: e }) => [Z(k(at), s(e, {
						"aria-label": k(i)("smartview.selectRow"),
						density: "compact",
						"data-part": "select-row"
					}), null, 16, ["aria-label"])]),
					"no-data": E(() => [Z(ct, {
						heading: e.emptyTitle || k(i)("smartview.noData"),
						icon: e.emptyIcon,
						hint: e.emptyHint,
						"action-text": e.emptyActionText,
						"action-href": e.emptyActionHref,
						onAction: n[0] ||= (t) => k(Ne)(k(c), "empty-action", e.emptyActionHref, t)
					}, null, 8, [
						"heading",
						"icon",
						"hint",
						"action-text",
						"action-href"
					])]),
					_: 2
				}, [f(h.value, (e) => ({
					name: `item.${e.key}`,
					fn: E(({ item: t, value: n }) => [e.type === "name" ? (_(), q(Zn, {
						key: 0,
						name: k($e)(n),
						sub: e.subKey ? k($e)(t[e.subKey]) : "",
						"avatar-icon": e.avatarIcon,
						"avatar-color": e.avatarColor
					}, null, 8, [
						"name",
						"sub",
						"avatar-icon",
						"avatar-color"
					])) : e.type === "status" ? (_(), q(nt, {
						key: 1,
						status: k(et)(n, e.statusMap, {}, e.statusFallback)
					}, null, 8, ["status"])) : e.type === "chips" ? (_(), q(Wn, {
						key: 2,
						items: k(tt)(n),
						icon: e.chipIcon,
						variant: e.chipVariant,
						size: e.chipSize,
						color: e.chipColor
					}, null, 8, [
						"items",
						"icon",
						"variant",
						"size",
						"color"
					])) : e.type === "date" ? (_(), H("span", ar, F(k(ot)(n)), 1)) : e.type === "number" ? (_(), H("span", or, F(k(st)(n, k(o), e.numberFormat)), 1)) : e.type === "actions" ? (_(), H("div", {
						key: 5,
						class: P(["d-flex ga-1", y(e)])
					}, [(_(!0), H(N, null, f(K(e, t), (e) => (_(), q(Gn, {
						key: e.name,
						icon: e.icon,
						color: e.color,
						label: e.tooltip || e.name,
						tooltip: !!e.tooltip,
						href: ae(e, t),
						loading: G(t, e.name),
						"data-action": e.name,
						onAction: (n) => J(e, t, n)
					}, null, 8, [
						"icon",
						"color",
						"label",
						"tooltip",
						"href",
						"loading",
						"data-action",
						"onAction"
					]))), 128))], 2)) : e.type === "score" ? (_(), q(rr, {
						key: 6,
						value: se(e, n),
						color: ce(e, t),
						text: e.scoreText ? e.scoreText(t) : ""
					}, null, 8, [
						"value",
						"color",
						"text"
					])) : e.type === "switch" ? (_(), H("div", {
						key: 7,
						class: P(["d-flex", y(e)]),
						onChange: (e) => oe(e, n === !0)
					}, [Z(k(it), {
						"model-value": n === !0,
						color: e.switchColor || "success",
						loading: G(t, e.key),
						"aria-label": e.title,
						inset: "",
						density: "compact",
						"hide-details": "",
						"data-part": "switch",
						"onUpdate:modelValue": (n) => le(e, t, n)
					}, null, 8, [
						"model-value",
						"color",
						"loading",
						"aria-label",
						"onUpdate:modelValue"
					])], 42, sr)) : U("", !0)])
				}))]), 1040, [
					"headers",
					"items",
					"loading",
					"search",
					"item-value",
					"items-per-page",
					"page",
					"sort-by",
					"row-props",
					"hide-default-footer",
					"show-select",
					"model-value"
				]))]),
				_: 1
			}, 8, [
				"rounded",
				"elevation",
				"variant"
			])])]),
			_: 1
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-table th{text-transform:uppercase;letter-spacing:.5px;font-size:12px;font-weight:700}.smartview-table .smartview-select-cell{box-sizing:border-box;width:32px;min-width:32px;max-width:32px;padding:0 2px}"]]]));
//#endregion
