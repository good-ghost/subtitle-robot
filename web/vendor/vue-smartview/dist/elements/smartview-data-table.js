import { A as e, B as t, Bn as n, Bt as r, Cn as i, D as a, E as o, En as s, G as c, Hn as l, Ht as u, In as d, It as f, Jn as p, Kt as m, Lt as h, Mn as g, Nn as _, O as v, On as y, Sn as b, T as x, Tn as S, V as C, Vn as w, Vt as T, W as E, Wn as D, Xn as O, Yn as ee, Yt as k, _r as A, at as j, bn as M, bt as N, c as te, cr as P, dr as F, dt as ne, f as I, ft as re, g as L, gr as R, h as z, hr as ie, jn as B, l as ae, lr as oe, m as V, mn as H, mr as U, mt as W, on as G, or as se, ot as ce, p as le, pn as ue, pr as de, pt as fe, rr as K, sr as pe, ur as q, v as J, vn as Y, vt as me, w as he, wn as ge, wt as _e, xn as X, xt as ve, yn as Z } from "../chunks/vuetify-C39-WP9g.js";
import { a as ye, d as be, i as xe, t as Se } from "../chunks/VSelect-DuDSSQDf.js";
import { a as Ce, t as we } from "../chunks/rounded-1DPtyqNn.js";
import { i as Te } from "../chunks/VOverlay-DFwN_aF6.js";
import { a as Ee, c as Q, l as De, n as Oe, r as ke, t as Ae } from "../chunks/define-BovISfN4.js";
import { n as je } from "../chunks/ripple-BBz9XQtx.js";
import { t as Me } from "../chunks/resizeObserver-4FxWWYaw.js";
import { t as Ne } from "../chunks/cancelableLink-DUAoXNUy.js";
import { n as Pe, t as Fe } from "../chunks/hostValue-CjEvr2gM.js";
import { t as Ie } from "../chunks/VDivider-CA-IOlps.js";
import { a as Le, n as Re, t as ze } from "../chunks/density-9WZgplEH.js";
import { t as Be } from "../chunks/transitions-DYv6opPi.js";
import { t as Ve } from "../chunks/transition-Cv515_M1.js";
import { t as He } from "../chunks/VAvatar-DdB1q11O.js";
import { a as Ue, c as We, u as Ge } from "../chunks/router-C0qlu-KG.js";
import { t as Ke } from "../chunks/VTooltip-CGIxG6WB.js";
import { t as $ } from "../chunks/VBtn-CV2MWNTN.js";
import { i as qe, n as Je, r as Ye, t as Xe } from "../chunks/loader-DtB2K0GR.js";
import { t as Ze } from "../chunks/VChip-C-IhEdKW.js";
import { t as Qe } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as $e, r as et, t as tt } from "../chunks/status-J4FIN71L.js";
import { t as nt } from "../chunks/StatusChipView-CFTFffvZ.js";
import { t as rt } from "../chunks/VCard-Z58vOTy1.js";
import { t as it } from "../chunks/VSwitch-I8aX_dOy.js";
import { t as at } from "../chunks/VCheckboxBtn-Z27PqfdZ.js";
import { n as ot, r as st } from "../chunks/format-CSc3hJdu.js";
import { t as ct } from "../chunks/EmptyStateView-CbY6x7it.js";
//#region node_modules/vuetify/lib/util/events.js
function lt(e, t, n) {
	return Object.keys(e).filter((e) => re(e) && e.endsWith(t)).reduce((r, i) => (r[i.slice(0, -t.length)] = (t) => C(e[i], t, n(t)), r), {});
}
//#endregion
//#region node_modules/vuetify/lib/composables/refs.js
function ut() {
	let e = K([]);
	d(() => e.value = []);
	function t(t, n) {
		e.value[n] = t;
	}
	return {
		refs: e,
		updateRef: t
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
		type: J,
		default: "$first"
	},
	prevIcon: {
		type: J,
		default: "$prev"
	},
	nextIcon: {
		type: J,
		default: "$next"
	},
	lastIcon: {
		type: J,
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
}, "VPagination"), ft = x()({
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
		let r = L(e, "modelValue"), { t: i, n: o } = V(), { isRtl: s } = z(), { themeClasses: c } = ae(e), { width: l } = le(), d = se(-1);
		a(void 0, { scoped: !0 });
		let { resizeRef: f } = Me((e) => {
			if (!e.length) return;
			let { target: t, contentRect: n } = e[0], r = t.querySelector(".v-pagination__list > *");
			if (!r) return;
			let i = n.width, a = r.offsetWidth + parseFloat(getComputedStyle(r).marginRight) * 2;
			d.value = y(i, a);
		}), p = Y(() => parseInt(e.length, 10)), h = Y(() => parseInt(e.start, 10)), v = Y(() => e.totalVisible == null ? d.value >= 0 ? d.value : y(l.value, 58) : parseInt(e.totalVisible, 10));
		function y(t, n) {
			let r = e.showFirstLastPage ? 5 : 3;
			return Math.max(0, Math.floor(Number(((t - n * r) / n).toFixed(2))));
		}
		let b = Y(() => {
			if (p.value <= 0 || isNaN(p.value) || p.value > 2 ** 53 - 1) return [];
			if (e.totalVisible == null && p.value < 3) return m(p.value, h.value);
			if (v.value <= 0) return [];
			if (v.value === 1) return [r.value];
			if (p.value <= v.value) return m(p.value, h.value);
			let t = v.value % 2 == 0, n = t ? v.value / 2 : Math.floor(v.value / 2), i = t ? n : n + 1, a = p.value - n;
			if (i - r.value >= 0) return [
				...m(Math.max(1, v.value - 1), h.value),
				e.ellipsis,
				p.value
			];
			if (r.value - a >= +!!t) {
				let t = v.value - 1, n = p.value - t + h.value;
				return [
					h.value,
					e.ellipsis,
					...m(t, n)
				];
			}
			{
				let t = Math.max(1, v.value - 2), n = t === 1 ? r.value : r.value - Math.ceil(t / 2) + h.value;
				return [
					h.value,
					e.ellipsis,
					...m(t, n),
					e.ellipsis,
					p.value
				];
			}
		});
		function x(e, t, i) {
			e.preventDefault(), r.value = t, i && n(i, t);
		}
		let { refs: C, updateRef: w } = ut();
		a({ VPaginationBtn: {
			color: P(() => e.color),
			border: P(() => e.border),
			density: P(() => e.density),
			size: P(() => e.size),
			variant: P(() => e.variant),
			rounded: P(() => e.rounded),
			elevation: P(() => e.elevation)
		} });
		let T = Y(() => b.value.map((t, n) => {
			let a = (e) => w(e, n);
			if (u(t)) return {
				isActive: !1,
				key: `ellipsis-${n}`,
				page: t,
				props: {
					ref: a,
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
					page: o(t),
					props: {
						ref: a,
						ellipsis: !1,
						icon: !0,
						disabled: !!e.disabled || Number(e.length) < 2,
						color: n ? e.activeColor : e.color,
						"aria-current": n,
						"aria-label": i(n ? e.currentPageAriaLabel : e.pageAriaLabel, t),
						onClick: (e) => x(e, t)
					}
				};
			}
		})), E = Y(() => {
			let t = !!e.disabled || r.value <= h.value, n = !!e.disabled || r.value >= h.value + p.value - 1;
			return {
				first: [!0, "only-first"].includes(e.showFirstLastPage) ? {
					icon: s.value ? e.lastIcon : e.firstIcon,
					onClick: (e) => x(e, h.value, "first"),
					disabled: t,
					"aria-label": i(e.firstAriaLabel),
					"aria-disabled": t
				} : void 0,
				prev: {
					icon: s.value ? e.nextIcon : e.prevIcon,
					onClick: (e) => x(e, r.value - 1, "prev"),
					disabled: t,
					"aria-label": i(e.previousAriaLabel),
					"aria-disabled": t
				},
				next: {
					icon: s.value ? e.prevIcon : e.nextIcon,
					onClick: (e) => x(e, r.value + 1, "next"),
					disabled: n,
					"aria-label": i(e.nextAriaLabel),
					"aria-disabled": n
				},
				last: e.showFirstLastPage === !0 ? {
					icon: s.value ? e.firstIcon : e.lastIcon,
					onClick: (e) => x(e, h.value + p.value - 1, "last"),
					disabled: n,
					"aria-label": i(e.lastAriaLabel),
					"aria-disabled": n
				} : void 0
			};
		});
		function D() {
			let e = r.value - h.value;
			C.value[e]?.$el.focus();
		}
		function O(t) {
			t.key === W.left && !e.disabled && r.value > Number(e.start) ? (--r.value, _(D)) : t.key === W.right && !e.disabled && r.value < h.value + p.value - 1 && (r.value += 1, _(D));
		}
		return Q(() => S(e.tag, {
			ref: f,
			class: U([
				"v-pagination",
				c.value,
				e.class
			]),
			style: R(e.style),
			role: "navigation",
			"aria-label": i(e.ariaLabel),
			onKeydown: O,
			"data-testid": "v-pagination-root"
		}, { default: () => [Z("ul", { class: "v-pagination__list" }, [
			[!0, "only-first"].includes(e.showFirstLastPage) && Z("li", {
				key: "first",
				class: "v-pagination__first",
				"data-testid": "v-pagination-first"
			}, [t.first ? t.first(E.value.first) : S($, g({ _as: "VPaginationBtn" }, E.value.first), null)]),
			Z("li", {
				key: "prev",
				class: "v-pagination__prev",
				"data-testid": "v-pagination-prev"
			}, [t.prev ? t.prev(E.value.prev) : S($, g({ _as: "VPaginationBtn" }, E.value.prev), null)]),
			T.value.map((e, n) => Z("li", {
				key: e.key,
				class: U(["v-pagination__item", { "v-pagination__item--is-active": e.isActive }]),
				"data-testid": "v-pagination-item"
			}, [t.item ? t.item(e) : S($, g({ _as: "VPaginationBtn" }, e.props), { default: () => [e.page] })])),
			Z("li", {
				key: "next",
				class: "v-pagination__next",
				"data-testid": "v-pagination-next"
			}, [t.next ? t.next(E.value.next) : S($, g({ _as: "VPaginationBtn" }, E.value.next), null)]),
			e.showFirstLastPage === !0 && Z("li", {
				key: "last",
				class: "v-pagination__last",
				"data-testid": "v-pagination-last"
			}, [t.last ? t.last(E.value.last) : S($, g({ _as: "VPaginationBtn" }, E.value.last), null)])
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
		page: L(e, "page", void 0, (e) => Number(e ?? 1)),
		itemsPerPage: L(e, "itemsPerPage", void 0, (e) => Number(e ?? 10))
	};
}
function gt(e) {
	let { page: t, itemsPerPage: n, itemsLength: r } = e, i = Y(() => n.value === -1 ? 0 : n.value * (t.value - 1)), a = Y(() => n.value === -1 ? r.value : Math.min(r.value, i.value + n.value)), o = Y(() => n.value === -1 || r.value === 0 ? 1 : Math.ceil(r.value / n.value));
	p([t, o], () => {
		t.value > o.value && (t.value = o.value);
	});
	function s(e) {
		n.value = e, t.value = 1;
	}
	function c() {
		t.value = E(t.value + 1, 1, o.value);
	}
	function l() {
		t.value = E(t.value - 1, 1, o.value);
	}
	function u(e) {
		t.value = E(e, 1, o.value);
	}
	let d = {
		page: t,
		itemsPerPage: n,
		startIndex: i,
		stopIndex: a,
		pageCount: o,
		itemsLength: r,
		nextPage: c,
		prevPage: l,
		setPage: u,
		setItemsPerPage: s
	};
	return w(mt, d), d;
}
function _t() {
	let e = B(mt);
	if (!e) throw Error("Missing pagination!");
	return e;
}
function vt(e) {
	let t = v("usePaginatedItems"), { items: n, startIndex: r, stopIndex: i, itemsPerPage: a } = e, o = Y(() => a.value <= 0 ? q(n) : q(n).slice(r.value, i.value));
	return p(o, (e) => {
		t.emit("update:currentItems", e);
	}, { immediate: !0 }), { paginatedItems: o };
}
function yt(e) {
	let { sortedItems: t, paginate: n, group: r } = e, i = q(e.pageBy);
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
			paginatedItems: Y(() => {
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
		type: J,
		default: "$prev"
	},
	nextIcon: {
		type: J,
		default: "$next"
	},
	firstIcon: {
		type: J,
		default: "$first"
	},
	lastIcon: {
		type: J,
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
	...N(dt({ showFirstLastPage: !0 }), ["showFirstLastPage"])
}, "VDataTableFooter"), xt = x()({
	name: "VDataTableFooter",
	props: bt(),
	setup(e, { slots: t }) {
		let { t: n } = V(), i = o("VSelect"), { page: a, pageCount: s, startIndex: c, stopIndex: l, itemsLength: u, itemsPerPage: d, setItemsPerPage: f } = _t(), p = Y(() => e.itemsPerPageOptions.map((e) => r(e) ? {
			value: e,
			title: e === -1 ? n("$vuetify.dataFooter.itemsPerPageAll") : String(e)
		} : {
			...e,
			title: isNaN(Number(e.title)) ? n(e.title) : e.title
		}));
		return Q(() => {
			let r = ft.filterProps(e);
			return Z("div", { class: "v-data-table-footer" }, [
				t.prepend?.(),
				Z("div", { class: "v-data-table-footer__items-per-page" }, [Z("span", null, [n(e.itemsPerPageText)]), S(Se, {
					items: p.value,
					itemColor: e.color,
					modelValue: d.value,
					"onUpdate:modelValue": (e) => f(Number(e)),
					density: "compact",
					variant: i.value?.variant ?? "outlined",
					"aria-label": n(e.itemsPerPageText),
					hideDetails: !0
				}, null)]),
				Z("div", { class: "v-data-table-footer__info" }, [Z("div", null, [n(e.pageText, u.value ? c.value + 1 : 0, l.value, u.value)])]),
				Z("div", { class: "v-data-table-footer__pagination" }, [S(ft, g({
					modelValue: a.value,
					"onUpdate:modelValue": (e) => a.value = e,
					density: "comfortable",
					firstAriaLabel: e.firstPageLabel,
					lastAriaLabel: e.lastPageLabel,
					length: s.value,
					nextAriaLabel: e.nextPageLabel,
					previousAriaLabel: e.prevPageLabel,
					rounded: !0,
					showFirstLastPage: !0,
					totalVisible: +!!e.showCurrentPage,
					variant: "plain"
				}, me(r, ["color"])), null)])
			]);
		}), {};
	}
}), St = he({
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
	let n = e.tag ?? "td", r = u(e.fixed) ? e.fixed : e.fixed ? "start" : "none";
	return S(n, {
		class: U([
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
			height: c(e.height),
			width: c(e.width),
			maxWidth: c(e.maxWidth),
			left: r === "start" ? c(e.fixedOffset || null) : void 0,
			right: r === "end" ? c(e.fixedEndOffset || null) : void 0,
			paddingInlineStart: e.indent ? c(e.indent) : void 0
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
				} else !t && r === "start" ? e.lastFixed = !0 : !t && r === "end" ? e.firstFixedEnd = !0 : isNaN(Number(e.width)) ? k(`Multiple fixed columns should have a static width (key: ${e.key})`) : e.minWidth = Math.max(Number(e.width) || 0, Number(e.minWidth) || 0), t = !0;
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
		}, r = e.key ?? (u(e.value) ? e.value : null), i = e.value ?? r ?? null, a = {
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
	let n = K([]), r = K([]), i = K({}), a = K({}), o = K({});
	ee(() => {
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
	return w(wt, s), s;
}
function Rt() {
	let e = B(wt);
	if (!e) throw Error("Missing headers!");
	return e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/loading.js
function zt(e, t) {
	return {
		active: Y(() => {
			let t = e();
			return t != null && t !== !1 && t !== "false";
		}),
		side: Y(() => {
			let t = e();
			return T(t) && t.side ? t.side : "start";
		}),
		color: Y(() => {
			let n = e();
			return T(n) && n.color ? n.color : u(n) && n !== "true" ? n : t();
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
	let r = L(e, "modelValue", e.modelValue, (n) => {
		let r = e.valueComparator;
		return r ? new Set(_e(n).map((e) => t.value.find((t) => r(e, t.value))?.value ?? e)) : new Set(_e(n).map((e) => fe(e) ? t.value.find((t) => e === t.value)?.value ?? e : t.value.find((t) => je(e, t.value))?.value ?? e));
	}, (e) => [...e.values()]), i = Y(() => t.value.filter((e) => e.selectable)), a = Y(() => q(n).filter((e) => e.selectable)), o = Y(() => {
		if (T(e.selectStrategy)) return e.selectStrategy;
		switch (e.selectStrategy) {
			case "single": return Bt;
			case "all": return Ht;
			default: return Vt;
		}
	}), s = se(null);
	function c(e) {
		return _e(e).every((e) => r.value.has(e.value));
	}
	function l(e) {
		return _e(e).some((e) => r.value.has(e.value));
	}
	function u(e, t) {
		let n = o.value.select({
			items: e,
			value: t,
			selected: new Set(r.value)
		});
		r.value = n;
	}
	function d(t, r, i) {
		let a = [], o = q(n);
		if (r ??= o.findIndex((e) => e.value === t.value), e.selectStrategy !== "single" && i?.shiftKey && s.value !== null) {
			let [e, t] = [s.value, r].sort((e, t) => e - t);
			a.push(...o.slice(e, t + 1).filter((e) => e.selectable));
		} else a.push(t), s.value = r;
		u(a, !c([t]));
	}
	function f(e) {
		let t = o.value.selectAll({
			value: e,
			allItems: i.value,
			currentPage: a.value,
			selected: new Set(r.value)
		});
		r.value = t;
	}
	let p = {
		toggleSelect: d,
		select: u,
		selectAll: f,
		isSelected: c,
		isSomeSelected: l,
		someSelected: Y(() => r.value.size > 0),
		allSelected: Y(() => {
			let e = o.value.allSelected({
				allItems: i.value,
				currentPage: a.value
			});
			return !!e.length && c(e);
		}),
		showSelectAll: P(() => o.value.showSelectAll),
		lastSelectedIndex: s,
		selectStrategy: o
	};
	return w(Wt, p), p;
}
function Kt() {
	let e = B(Wt);
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
	let t = P(() => e.initialSortOrder), n = L(e, "sortBy"), r = P(() => e.mustSort);
	return {
		initialSortOrder: t,
		sortBy: n,
		multiSort: P(() => e.multiSort),
		mustSort: r
	};
}
function Xt(e, t) {
	if (!T(e)) return { active: !!e };
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
	let c = {
		sortBy: n,
		toggleSort: o,
		isSorted: s
	};
	return w(Jt, c), c;
}
function Qt() {
	let e = B(Jt);
	if (!e) throw Error("Missing sort!");
	return e;
}
function $t(e, t, n, r) {
	let i = V();
	return { sortedItems: Y(() => n.value.length ? en(t.value, n.value, i.current.value, {
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
			let l = j(e[1], s), u = j(n[1], s), d = e[0].raw, f = n[0].raw;
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
			if (!o && (l instanceof Date && u instanceof Date && (l = l.getTime(), u = u.getTime()), [l, u] = [l, u].map((e) => e == null ? e : e.toString().toLocaleLowerCase()), l !== u)) return ne(l) && ne(u) ? 0 : ne(l) ? -1 : ne(u) ? 1 : !isNaN(l) && !isNaN(u) ? Number(l) - Number(u) : i.compare(l, u);
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
	sortIcon: { type: J },
	sortAscIcon: {
		type: J,
		default: "$sortAsc"
	},
	sortDescIcon: {
		type: J,
		default: "$sortDesc"
	},
	headerProps: { type: Object },
	selectAllLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectAll"
	},
	sticky: Boolean,
	...ze(),
	...I(),
	...Je()
}, "VDataTableHeaders"), nn = x()({
	name: "VDataTableHeaders",
	props: tn(),
	setup(e, { slots: t }) {
		let { t: n } = V(), { toggleSort: r, sortBy: i, isSorted: a } = Qt(), { someSelected: s, allSelected: l, selectAll: d, showSelectAll: f } = Kt(), { columns: p, headers: m } = Rt(), { loaderClasses: h } = Ye(e), v = o("VSelect");
		function y(t, n) {
			if (!(e.sticky || e.fixedHeader) && !t.fixed) return;
			let r = u(t.fixed) ? t.fixed : t.fixed ? "start" : "none";
			return {
				position: "sticky",
				left: r === "start" ? c(t.fixedOffset) : void 0,
				right: r === "end" ? c(t.fixedEndOffset) : void 0,
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
		let { backgroundColorClasses: C, backgroundColorStyles: w } = Ee(() => e.color), { displayClasses: T, mobile: E } = le(e), D = zt(() => e.loading, () => e.color), O = Y(() => ({
			headers: m.value,
			columns: p.value,
			toggleSort: r,
			isSorted: a,
			sortBy: i.value,
			someSelected: s.value,
			allSelected: l.value,
			selectAll: d,
			getSortIcon: x
		})), ee = Y(() => [
			"v-data-table__th",
			{ "v-data-table__th--sticky": e.sticky || e.fixedHeader },
			T.value,
			h.value
		]), k = ({ column: o, x: u, y: p }) => {
			let m = o.key === "data-table-select" || o.key === "data-table-expand", h = o.key === "data-table-group" && o.width === 0 && !o.title, _ = g(e.headerProps ?? {}, o.headerProps ?? {}), v = o.sortable && !e.disableSort, T = v ? i.value.find((e) => e.key === o.key) : void 0, E = T?.order === "asc" ? "ascending" : T?.order === "desc" ? "descending" : void 0;
			return S(St, g({
				tag: "th",
				"aria-sort": E,
				align: o.align,
				class: [{
					"v-data-table__th--sortable": v,
					"v-data-table__th--sorted": a(o),
					"v-data-table__th--fixed": o.fixed
				}, ...ee.value],
				style: {
					width: c(o.width),
					minWidth: c(o.minWidth),
					maxWidth: c(o.maxWidth),
					...y(o, p)
				},
				colspan: o.colspan,
				rowspan: o.rowspan,
				fixed: o.fixed,
				nowrap: o.nowrap,
				lastFixed: o.lastFixed,
				firstFixedEnd: o.firstFixedEnd,
				noPadding: m,
				empty: h,
				tabindex: v ? 0 : void 0,
				onClick: v ? (e) => r(o, e) : void 0,
				onKeydown: v ? (e) => b(e, o) : void 0
			}, _), { default: () => {
				let c = `header.${o.key}`, u = {
					column: o,
					selectAll: d,
					isSorted: a,
					toggleSort: r,
					sortBy: i.value,
					someSelected: s.value,
					allSelected: l.value,
					getSortIcon: x
				};
				return t[c] ? t[c](u) : h ? "" : o.key === "data-table-select" ? t["header.data-table-select"]?.(u) ?? (f.value && S(at, {
					"aria-label": n(e.selectAllLabel),
					color: e.color,
					density: e.density,
					modelValue: l.value,
					indeterminate: s.value && !l.value,
					"onUpdate:modelValue": d
				}, null)) : Z("div", { class: "v-data-table-header__content" }, [
					Z("span", null, [o.title]),
					o.sortable && !e.disableSort && S(Le, {
						key: "icon",
						class: "v-data-table-header__sort-icon",
						icon: x(o)
					}, null),
					e.multiSort && a(o) && Z("div", {
						key: "badge",
						class: U(["v-data-table-header__sort-badge", ...C.value]),
						style: R(w.value)
					}, [i.value.findIndex((e) => e.key === o.key) + 1])
				]);
			} });
		}, A = () => {
			let o = Y(() => p.value.filter((t) => t?.sortable && !e.disableSort)), c = p.value.find((e) => e.key === "data-table-select"), u = Y({
				get: () => o.value.filter(({ key: e }) => i.value.some((t) => t.key === e)),
				set: (e) => {
					let t = _e(e), n = i.value.map((e) => e.key);
					t.filter(({ key: e }) => !n.includes(e)).forEach((e) => r(e)), _(() => i.value = i.value.filter(({ key: e }) => t.some((t) => t.key === e)));
				}
			});
			function f() {
				return S(Se, {
					modelValue: u.value,
					"onUpdate:modelValue": (e) => u.value = e,
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
				}, { chip: ({ internalItem: e }) => S(Ze, {
					onClick: e.raw.sortable ? () => r(e.raw, void 0, !0) : void 0,
					onMousedown: (e) => {
						e.preventDefault(), e.stopPropagation();
					}
				}, { default: () => [e.title, S(Le, {
					class: U(["v-data-table__td-sort-icon", a(e.raw) && "v-data-table__td-sort-icon-active"]),
					icon: x(e.raw),
					size: "small"
				}, null)] }) });
			}
			function h() {
				return S(at, {
					"aria-label": n(e.selectAllLabel),
					class: "v-data-table-header__select-all",
					color: e.color,
					density: "compact",
					modelValue: l.value,
					indeterminate: s.value && !l.value,
					"onUpdate:modelValue": () => d(!l.value)
				}, null);
			}
			return S(St, g({
				tag: "th",
				class: [...ee.value],
				colspan: m.value.length + 1
			}, e.headerProps), { default: () => [Z("div", { class: "v-data-table-header__content" }, [t["mobile.header"]?.(O.value) ?? Z(H, null, [o.value.length > 0 && f(), c && h()])])] });
		}, j = Y(() => {
			if (t["mobile.header"]) return !0;
			let n = p.value.some((t) => t?.sortable && !e.disableSort), r = p.value.some((e) => e.key === "data-table-select");
			return n || r;
		});
		Q(() => E.value ? Z(H, null, [j.value && Z("tr", null, [S(A, null, null)])]) : Z(H, null, [t.headers ? t.headers(O.value) : m.value.map((e, t) => Z("tr", null, [e.map((e, n) => S(k, {
			key: e.key ?? n,
			column: e,
			x: n,
			y: t
		}, null))])), D.active.value && ["start", "both"].includes(D.side.value) && Z("tr", { class: "v-data-table-progress" }, [Z("th", { colspan: p.value.length }, [S(Xe, {
			name: "v-data-table-progress",
			absolute: !0,
			active: !0,
			color: D.color.value,
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
		groupBy: L(e, "groupBy"),
		opened: L(e, "opened"),
		openAll: P(() => e.openAll),
		groupKey: P(() => e.groupKey)
	};
}
function sn(e) {
	let { disableSort: t, groupBy: n, sortBy: r } = e, i = e.opened ?? K([]), a = se(new Set(i.value));
	p(i, (e) => {
		a.value = new Set(e);
	});
	let o = Y({
		get: () => a.value,
		set: (e) => {
			a.value = e, i.value = [...e.values()];
		}
	}), s = Y(() => n.value.map((e) => ({
		...e,
		order: e.order ?? !1
	})).concat(t?.value ? [] : r.value));
	function c(e) {
		return o.value.has(e.id);
	}
	function l(e) {
		let t = new Set(o.value);
		c(e) ? t.delete(e.id) : t.add(e.id), o.value = t;
	}
	function u(e) {
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
	let d = {
		sortByWithGroups: s,
		toggleGroup: l,
		opened: o,
		groupBy: n,
		extractRows: u,
		isGroupOpen: c
	};
	return w(an, d), d;
}
function cn() {
	let e = B(an);
	if (!e) throw Error("Missing group!");
	return e;
}
function ln(e, t) {
	if (!e.length) return [];
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = j(r.raw, t);
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
	let a = Y(() => !q(t) || !r.value.length ? /* @__PURE__ */ new Set() : new Set(fn(dn(q(n), r.value.map((e) => e.key), q(i)))));
	p(a, (n, r) => {
		if (!q(t)) return;
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
	let o = Y(() => t.value.length ? dn(q(e), t.value.map((e) => e.key), q(a)) : []), s = i ?? ((e) => n.value.has(e.id));
	return {
		groups: o,
		flatItems: Y(() => t.value.length ? mn(o.value, s, q(r)) : q(e))
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
		type: J,
		default: "$tableGroupCollapse"
	},
	groupExpandIcon: {
		type: J,
		default: "$tableGroupExpand"
	},
	selectGroupLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectGroup"
	},
	...ze()
}, "VDataTableGroupHeaderRow"), _n = x()({
	name: "VDataTableGroupHeaderRow",
	props: gn(),
	setup(e, { slots: t }) {
		let { t: n } = V(), { isGroupOpen: r, toggleGroup: i, extractRows: a } = cn(), { isSelected: o, isSomeSelected: s, select: c } = Kt(), { columns: l } = Rt(), u = Y(() => a([e.item])), d = P(() => l.value.length - +!!l.value.some((e) => e.key === "data-table-select"));
		return () => Z("tr", {
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
				}) ?? S(St, {
					class: "v-data-table-group-header-row__column",
					colspan: d.value
				}, { default: () => [
					S($, {
						size: "small",
						variant: "text",
						icon: n,
						onClick: a
					}, null),
					Z("span", null, [e.item.value]),
					Z("span", null, [
						ge("("),
						u.value.length,
						ge(")")
					])
				] });
			}
			if (a.key === "data-table-select") {
				let r = u.value.filter((e) => e.selectable), i = r.length > 0 && o(r), a = s(r) && !i, l = (e) => c(r, e);
				return t["data-table-select"]?.({ props: {
					modelValue: i,
					indeterminate: a,
					"onUpdate:modelValue": l
				} }) ?? S(St, {
					class: "v-data-table__td--select-row",
					noPadding: !0
				}, { default: () => [S(at, {
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
	let t = P(() => e.expandOnClick), n = L(e, "expanded", e.expanded, (e) => new Set(e), (e) => [...e.values()]);
	function r(t, r) {
		let i = pe(t.value), a = r && e.expandStrategy === "single" ? /* @__PURE__ */ new Set() : new Set(n.value);
		if (r) a.add(t.value);
		else {
			let e = [...n.value].find((e) => pe(e) === i);
			a.delete(e);
		}
		n.value = a;
	}
	function i(e) {
		let t = pe(e.value);
		return [...n.value].some((e) => pe(e) === t);
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
	return w(yn, o), o;
}
function xn() {
	let e = B(yn);
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
		type: J,
		default: "$collapse"
	},
	expandIcon: {
		type: J,
		default: "$expand"
	},
	selectRowLabel: {
		type: String,
		default: "$vuetify.dataTable.ariaLabel.selectRow"
	},
	getMatches: Function,
	onClick: t(),
	onContextmenu: t(),
	onDblclick: t(),
	...ze(),
	...I()
}, "VDataTableRow"), Cn = x()({
	name: "VDataTableRow",
	props: Sn(),
	setup(e, { slots: t }) {
		let { t: n } = V(), { displayClasses: r, mobile: i } = le(e, "v-data-table__tr"), { isSelected: a, toggleSelect: o, someSelected: s, allSelected: c, selectAll: l } = Kt(), { isExpanded: u, toggleExpand: d } = xn(), { toggleSort: f, sortBy: p, isSorted: m } = Qt(), { columns: _ } = Rt();
		Q(() => Z("tr", {
			class: U([
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
				value: j(v.columns, r.key),
				column: r,
				isSelected: a,
				toggleSelect: o,
				isExpanded: u,
				toggleExpand: d
			}, C = {
				column: r,
				selectAll: l,
				isSorted: m,
				toggleSort: f,
				sortBy: p.value,
				someSelected: s.value,
				allSelected: c.value,
				getSortIcon: () => ""
			}, w = h(e.cellProps) ? e.cellProps({
				index: x.index,
				item: x.item,
				internalItem: x.internalItem,
				value: x.value,
				column: r
			}) : e.cellProps, T = h(r.cellProps) ? r.cellProps({
				index: x.index,
				item: x.item,
				internalItem: x.internalItem,
				value: x.value
			}) : r.cellProps, E = r.key === "data-table-select" || r.key === "data-table-expand", D = r.key === "data-table-group" && r.width === 0 && !r.title;
			return S(St, g({
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
				noPadding: E,
				empty: D,
				nowrap: r.nowrap,
				width: i.value ? void 0 : r.width
			}, w, T), { default: () => {
				if (r.key === "data-table-select") return t["item.data-table-select"]?.({
					...x,
					props: {
						color: e.color,
						disabled: !v.selectable,
						modelValue: a([v]),
						onClick: ue(() => o(v), ["stop"])
					}
				}) ?? S(at, {
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
						icon: u(v) ? e.collapseIcon : e.expandIcon,
						size: "small",
						variant: "text",
						onClick: ue(() => d(v), ["stop"])
					}
				}) ?? S($, {
					icon: u(v) ? e.collapseIcon : e.expandIcon,
					size: "small",
					variant: "text",
					onClick: ue(() => d(v), ["stop"])
				}, null);
				if (t[y] && !i.value) return t[y](x);
				let s = A(x.value), c = e.getMatches?.(v)?.[r.key], l = c?.length ? S(be, {
					text: s,
					matches: c
				}, null) : s;
				return i.value ? Z(H, null, [Z("div", { class: "v-data-table__td-title" }, [t[b]?.(C) ?? r.title]), Z("div", { class: "v-data-table__td-value" }, [t[y]?.(x) ?? l])]) : l;
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
	...N(Sn(), [
		"collapseIcon",
		"expandIcon",
		"density",
		"getMatches"
	]),
	...N(gn(), [
		"groupCollapseIcon",
		"groupExpandIcon",
		"density"
	]),
	...I()
}, "VDataTableRows"), Tn = x()({
	name: "VDataTableRows",
	inheritAttrs: !1,
	props: wn(),
	setup(e, { attrs: t, slots: n }) {
		let { columns: r } = Rt(), { expandOnClick: i, toggleExpand: a, isExpanded: o } = xn(), { isSelected: s, toggleSelect: c } = Kt(), { toggleGroup: l, isGroupOpen: u } = cn(), { t: d } = V(), { mobile: f } = le(e);
		return Q(() => {
			let p = N(e, [
				"groupCollapseIcon",
				"groupExpandIcon",
				"density"
			]);
			return e.loading && (!e.items.length || n.loading) ? Z("tr", {
				class: "v-data-table-rows-loading",
				key: "loading"
			}, [Z("td", { colspan: r.value.length }, [n.loading?.() ?? d(e.loadingText)])]) : !e.loading && !e.items.length && !e.hideNoData ? Z("tr", {
				class: "v-data-table-rows-no-data",
				key: "no-data"
			}, [Z("td", { colspan: r.value.length }, [n["no-data"]?.() ?? d(e.noDataText)])]) : Z(H, null, [e.items.map((d, m) => {
				if (d.type === "group") {
					let e = {
						index: m,
						item: d,
						columns: r.value,
						isExpanded: o,
						toggleExpand: a,
						isSelected: s,
						toggleSelect: c,
						toggleGroup: l,
						isGroupOpen: u
					};
					return n["group-header"] ? n["group-header"](e) : S(_n, g({
						key: `group-header_${d.id}`,
						item: d
					}, lt(t, ":groupHeader", () => e), p), n);
				}
				if (d.type === "group-summary") {
					let e = {
						index: m,
						item: d,
						columns: r.value,
						toggleGroup: l
					};
					return n["group-summary"]?.(e) ?? "";
				}
				let _ = {
					index: d.virtualIndex ?? m,
					item: d.raw,
					internalItem: d,
					columns: r.value,
					isExpanded: o,
					toggleExpand: a,
					isSelected: s,
					toggleSelect: c
				}, v = {
					..._,
					props: g({
						key: `item_${d.key ?? d.index}`,
						onClick: i.value ? () => {
							a(d);
						} : void 0,
						index: m,
						item: d,
						color: e.color,
						cellProps: e.cellProps,
						collapseIcon: e.collapseIcon,
						expandIcon: e.expandIcon,
						density: e.density,
						mobile: f.value,
						getMatches: e.getMatches
					}, lt(t, ":row", () => _), h(e.rowProps) ? e.rowProps({
						item: _.item,
						index: _.index,
						internalItem: _.internalItem
					}) : e.rowProps)
				};
				return Z(H, { key: v.props.key }, [n.item ? n.item(v) : S(Cn, v.props, n), n["expanded-row"] ? o(d) && n["expanded-row"](_) : n.expanded && Z("tr", { class: "v-data-table__tr--expanded" }, [Z("td", { colspan: r.value.length }, [e.expandTransition ? S(Ve, { transition: e.expandTransition }, { default: () => [o(d) ? Z("div", null, [n.expanded(_)]) : null] }) : o(d) && Z("div", null, [n.expanded(_)])])])]);
			})]);
		}), {};
	}
}), En = e({
	gridlines: {
		type: [Boolean, String],
		default: "horizontal",
		validator: (e) => f(e) || [
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
}, "VTable"), Dn = x()({
	name: "VTable",
	inheritAttrs: !1,
	props: En(),
	setup(e, { attrs: t, slots: n, emit: r }) {
		let { themeClasses: i } = ae(e), { densityClasses: a } = Re(e), o = Y(() => e.gridlines === !1 ? "none" : e.gridlines === !0 ? "all" : e.gridlines);
		return Q(() => {
			let [r, s] = ve(t, [/^aria-label/]);
			return S(e.tag, g(s, {
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
				n.default ? Z("div", {
					class: "v-table__wrapper",
					style: { height: c(e.height) }
				}, [Z("table", ie(y(r)), [n.caption?.(), n.default()])]) : n.wrapper?.(),
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
	let i = e.returnObject ? t : ce(t, e.itemValue), a = ce(t, e.itemSelectable, !0), o = r.reduce((e, n) => (n.key != null && (e[n.key] = ce(t, n.value)), e), {});
	return {
		type: "item",
		key: e.returnObject ? ce(t, e.itemValue) : i,
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
	return { items: Y(() => An(e, e.items, t.value)) };
}
//#endregion
//#region node_modules/vuetify/lib/components/VDataTable/composables/options.js
function Mn({ page: e, itemsPerPage: t, sortBy: n, groupBy: r, search: i }) {
	let a = v("VDataTable"), o = () => ({
		page: e.value,
		itemsPerPage: t.value,
		sortBy: n.value,
		groupBy: r.value,
		search: i.value
	}), s = null;
	p(o, (t) => {
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
	...me(tn(), ["multiSort", "initialSortOrder"]),
	...En()
}, "DataTable"), Pn = e({
	...pt(),
	...Nn(),
	...xe(),
	...bt()
}, "VDataTable"), Fn = x()({
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
		let { groupBy: r, opened: i, openAll: o, groupKey: s } = on(e), { initialSortOrder: c, sortBy: l, multiSort: u, mustSort: d } = Yt(e), { page: f, itemsPerPage: p } = ht(e), { disableSort: m } = oe(e), { columns: h, headers: _, sortFunctions: v, sortRawFunctions: y, filterFunctions: b } = Lt(e, {
			groupBy: r,
			showSelect: P(() => e.showSelect),
			showExpand: P(() => e.showExpand)
		}), { items: x } = jn(e, h), C = P(() => e.search), { filteredItems: w, getMatches: T } = ye(e, x, C, {
			transform: (e) => e.columns,
			customKeyFilter: b
		}), { toggleSort: E } = Zt({
			initialSortOrder: c,
			sortBy: l,
			multiSort: u,
			mustSort: d,
			page: f
		}), { sortByWithGroups: D, opened: O, extractRows: ee, isGroupOpen: k, toggleGroup: A } = sn({
			groupBy: r,
			sortBy: l,
			disableSort: m,
			opened: i
		}), { sortedItems: j } = $t(e, w, D, {
			transform: (e) => ({
				...e.raw,
				...e.columns
			}),
			sortFunctions: v,
			sortRawFunctions: y
		});
		pn(O, o, j, r, s);
		let { pageCount: M, setItemsPerPage: N, prevPage: te, nextPage: F, setPage: ne, paginatedItems: I } = yt({
			pageBy: Y(() => e.pageBy === "auto" ? e.groupBy.length ? "group" : "item" : e.pageBy),
			sortedItems: j,
			paginate: (e) => {
				let t = Y(() => q(e).length), { startIndex: n, stopIndex: r, pageCount: i, setItemsPerPage: a, prevPage: o, nextPage: s, setPage: c } = gt({
					page: f,
					itemsPerPage: p,
					itemsLength: t
				}), { paginatedItems: l } = vt({
					items: e,
					startIndex: n,
					stopIndex: r,
					itemsPerPage: p
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
			group: (e) => hn(e, r, O, () => !!n["group-summary"], k, s)
		}), re = Y(() => ee(I.value)), { isSelected: L, select: R, selectAll: z, toggleSelect: ie, someSelected: B, allSelected: ae } = Gt(e, {
			allItems: x,
			currentPage: re
		}), { isExpanded: V, toggleExpand: U } = bn(e), W = zt(() => e.loading, () => e.color);
		Mn({
			page: f,
			itemsPerPage: p,
			sortBy: l,
			groupBy: r,
			search: C
		}), a({ VDataTableRows: {
			hideNoData: P(() => e.hideNoData),
			noDataText: P(() => e.noDataText),
			loading: P(() => e.loading),
			loadingText: P(() => e.loadingText)
		} });
		let G = Y(() => ({
			page: f.value,
			itemsPerPage: p.value,
			itemsLength: w.value.length,
			sortBy: l.value,
			pageCount: M.value,
			toggleSort: E,
			setItemsPerPage: N,
			prevPage: te,
			nextPage: F,
			setPage: ne,
			someSelected: B.value,
			allSelected: ae.value,
			isSelected: L,
			select: R,
			selectAll: z,
			toggleSelect: ie,
			isExpanded: V,
			toggleExpand: U,
			isGroupOpen: k,
			toggleGroup: A,
			items: re.value.map((e) => e.raw),
			internalItems: re.value,
			groupedItems: I.value,
			columns: h.value,
			headers: _.value
		}));
		return Q(() => {
			let r = xt.filterProps(e), i = nn.filterProps(me(e, ["multiSort"])), a = Tn.filterProps(e), o = Dn.filterProps(e);
			return S(Dn, g({
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
				top: () => n.top?.(G.value),
				caption: n.caption,
				default: () => n.default ? n.default(G.value) : Z(H, null, [
					n.colgroup?.(G.value),
					!e.hideDefaultHeader && Z("thead", { key: "thead" }, [S(nn, g(i, { multiSort: !!e.multiSort }), n)]),
					n.thead?.(G.value),
					!e.hideDefaultBody && Z("tbody", null, [
						n["body.prepend"]?.(G.value),
						n.body ? n.body(G.value) : S(Tn, g(t, a, {
							items: I.value,
							getMatches: T
						}), n),
						n["body.append"]?.(G.value),
						W.active.value && ["end", "both"].includes(W.side.value) && Z("tr", { class: "v-data-table-progress v-data-table-progress--bottom" }, [Z("th", { colspan: h.value.length }, [S(Xe, {
							name: "v-data-table-progress",
							absolute: !0,
							active: !0,
							color: W.color.value,
							indeterminate: !0
						}, { default: n.loader })])])
					]),
					n.tbody?.(G.value),
					n.tfoot?.(G.value)
				]),
				bottom: () => n.bottom ? n.bottom(G.value) : !e.hideDefaultFooter && Z(H, null, [S(Ie, null, null), S(xt, r, { prepend: n["footer.prepend"] })])
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
}, "VDataTableServer"), Ln = x()({
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
		let { groupBy: r, opened: i, openAll: o, groupKey: s } = on(e), { initialSortOrder: c, sortBy: l, multiSort: u, mustSort: d } = Yt(e), { page: f, itemsPerPage: p } = ht(e), { disableSort: m } = oe(e), h = Y(() => parseInt(e.itemsLength, 10)), { columns: _, headers: v } = Lt(e, {
			groupBy: r,
			showSelect: P(() => e.showSelect),
			showExpand: P(() => e.showExpand)
		}), { items: y } = jn(e, _), { toggleSort: b } = Zt({
			initialSortOrder: c,
			sortBy: l,
			multiSort: u,
			mustSort: d,
			page: f
		}), { opened: x, isGroupOpen: C, toggleGroup: T, extractRows: E } = sn({
			groupBy: r,
			sortBy: l,
			disableSort: m,
			opened: i
		});
		pn(x, o, y, r, s);
		let { pageCount: D, setItemsPerPage: O, prevPage: ee, nextPage: k, setPage: A } = gt({
			page: f,
			itemsPerPage: p,
			itemsLength: h
		}), { flatItems: j } = hn(y, r, x, () => !!n["group-summary"], C, s), { isSelected: M, select: N, selectAll: te, toggleSelect: F, someSelected: ne, allSelected: I } = Gt(e, {
			allItems: y,
			currentPage: y
		}), { isExpanded: re, toggleExpand: L } = bn(e), R = Y(() => E(y.value));
		Mn({
			page: f,
			itemsPerPage: p,
			sortBy: l,
			groupBy: r,
			search: P(() => e.search)
		}), w("v-data-table", {
			toggleSort: b,
			sortBy: l
		}), a({ VDataTableRows: {
			hideNoData: P(() => e.hideNoData),
			noDataText: P(() => e.noDataText),
			loading: P(() => e.loading),
			loadingText: P(() => e.loadingText)
		} });
		let z = Y(() => ({
			page: f.value,
			itemsPerPage: p.value,
			itemsLength: h.value,
			sortBy: l.value,
			pageCount: D.value,
			toggleSort: b,
			setItemsPerPage: O,
			prevPage: ee,
			nextPage: k,
			setPage: A,
			someSelected: ne.value,
			allSelected: I.value,
			isSelected: M,
			select: N,
			selectAll: te,
			toggleSelect: F,
			isExpanded: re,
			toggleExpand: L,
			isGroupOpen: C,
			toggleGroup: T,
			items: R.value.map((e) => e.raw),
			internalItems: R.value,
			groupedItems: j.value,
			columns: _.value,
			headers: v.value
		}));
		Q(() => {
			let r = xt.filterProps(e), i = nn.filterProps(me(e, ["multiSort"])), a = Tn.filterProps(e), o = Dn.filterProps(e);
			return S(Dn, g({
				class: [
					"v-data-table",
					{ "v-data-table--loading": e.loading },
					e.class
				],
				style: e.style
			}, o, { fixedHeader: e.fixedHeader || e.sticky }), {
				top: () => n.top?.(z.value),
				caption: n.caption,
				default: () => n.default ? n.default(z.value) : Z(H, null, [
					n.colgroup?.(z.value),
					!e.hideDefaultHeader && Z("thead", {
						key: "thead",
						class: "v-data-table__thead",
						role: "rowgroup"
					}, [S(nn, g(i, { multiSort: !!e.multiSort }), n)]),
					n.thead?.(z.value),
					!e.hideDefaultBody && Z("tbody", {
						class: "v-data-table__tbody",
						role: "rowgroup"
					}, [
						n["body.prepend"]?.(z.value),
						n.body ? n.body(z.value) : S(Tn, g(t, a, { items: j.value }), n),
						n["body.append"]?.(z.value)
					]),
					n.tbody?.(z.value),
					n.tfoot?.(z.value)
				]),
				bottom: () => n.bottom ? n.bottom(z.value) : !e.hideDefaultFooter && Z(H, null, [S(Ie, null, null), S(xt, r, { prepend: n["footer.prepend"] })])
			});
		});
	}
}), Rn = ["src", "alt"], zn = /* @__PURE__ */ s({
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
		let t = e, r = K(""), i = Y(() => t.src !== "" && t.src !== r.value);
		return (t, a) => (n(), M(F(He), {
			size: e.size,
			color: i.value ? void 0 : e.color,
			variant: i.value ? void 0 : "tonal",
			rounded: e.square ? "lg" : void 0,
			role: e.label && !i.value ? "img" : void 0,
			"aria-label": e.label && !i.value ? e.label : void 0
		}, {
			default: O(() => [i.value ? (n(), b("img", {
				key: 0,
				src: e.src,
				alt: e.label,
				style: {
					width: "100%",
					height: "100%",
					"object-fit": "cover"
				},
				"data-part": "avatar-image",
				onError: a[0] ||= (t) => r.value = e.src
			}, null, 40, Rn)) : e.initials ? (n(), b("span", {
				key: 1,
				class: "font-weight-medium",
				style: R({ fontSize: `${e.initialsSize}px` }),
				"aria-hidden": "true",
				"data-part": "avatar-initials"
			}, A(e.initials), 5)) : (n(), M(F(Le), {
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
}), Bn = 14, Vn = /* @__PURE__ */ s({
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
		let r = {
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
		}, i = e, a = t, o = Y(() => r[i.size] ?? r["x-small"]);
		return (t, r) => (n(), M(F(Ze), {
			size: e.size,
			variant: e.variant,
			color: e.error ? "error" : e.color || void 0,
			href: e.href || void 0,
			closable: e.closable,
			"close-label": e.closeLabel || void 0,
			label: "",
			"onClick:close": r[0] ||= (e) => a("close")
		}, {
			default: O(() => [e.error ? (n(), M(F(Le), {
				key: 0,
				start: "",
				size: Bn,
				icon: "mdi-alert-circle-outline",
				"data-part": "chip-error-icon"
			})) : e.icon ? (n(), M(F(Le), {
				key: 1,
				start: "",
				size: Bn,
				icon: e.icon,
				"data-part": "chip-icon"
			}, null, 8, ["icon"])) : e.avatarSrc || e.avatarInitials ? (n(), M(zn, {
				key: 2,
				size: o.value.size,
				"icon-size": o.value.size,
				"initials-size": o.value.initials,
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
			])) : X("", !0), ge(A(e.text), 1)]),
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
}, Wn = /* @__PURE__ */ s({
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
		return (t, r) => (n(), b("div", Hn, [(n(!0), b(H, null, l(e.items, (t, r) => (n(), M(Vn, {
			key: `${r}-${t}`,
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
		]))), 128)), e.items.length ? X("", !0) : (n(), b("span", Un, A(e.emptyText), 1))]));
	}
}), Gn = /* @__PURE__ */ s({
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
		let r = t;
		return (t, i) => (n(), M(F($), {
			icon: "",
			size: "small",
			variant: "text",
			color: e.color || void 0,
			href: e.href || void 0,
			loading: e.loading,
			disabled: e.disabled,
			"aria-label": e.label || void 0,
			"data-part": "icon-action",
			onClick: i[0] ||= (e) => r("action", e)
		}, {
			default: O(() => [S(F(Le), {
				size: "18",
				icon: e.icon,
				"data-part": "icon-action-icon"
			}, null, 8, ["icon"]), e.tooltip && e.label ? (n(), M(F(Ke), {
				key: 0,
				activator: "parent",
				location: "top",
				"content-props": { "data-part": "icon-action-tooltip" }
			}, {
				default: O(() => [ge(A(e.label), 1)]),
				_: 1
			})) : X("", !0)]),
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
}, Jn = { style: { "min-width": "0" } }, Yn = ["title"], Xn = ["title"], Zn = /* @__PURE__ */ s({
	__name: "NameCellView",
	props: {
		name: {},
		sub: { default: "" },
		avatarIcon: { default: "" },
		avatarColor: { default: "primary" }
	},
	setup(e) {
		let t = Kn.medium;
		return (r, i) => (n(), b("div", qn, [e.avatarIcon ? (n(), M(zn, {
			key: 0,
			size: F(t).size,
			"icon-size": F(t).icon,
			"initials-size": F(t).initials,
			icon: e.avatarIcon,
			color: e.avatarColor,
			"data-part": "name-avatar"
		}, null, 8, [
			"size",
			"icon-size",
			"initials-size",
			"icon",
			"color"
		])) : X("", !0), Z("div", Jn, [Z("div", {
			class: "font-weight-medium text-truncate",
			title: e.name,
			"data-part": "name"
		}, A(e.name), 9, Yn), e.sub ? (n(), b("div", {
			key: 0,
			class: "text-body-small text-medium-emphasis text-truncate",
			title: e.sub,
			"data-part": "name-sub"
		}, A(e.sub), 9, Xn)) : X("", !0)])]));
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
}, tr = 60, nr = 56, rr = /* @__PURE__ */ s({
	__name: "ScoreBarView",
	props: {
		value: {},
		color: { default: "primary" },
		text: { default: "" },
		textPosition: { default: "end" },
		height: { default: 6 }
	},
	setup(e) {
		let t = e, r = Y(() => Number.isFinite(t.value) ? Math.min(100, Math.max(0, t.value)) : 0);
		return (t, i) => e.textPosition === "top" ? (n(), b("div", Qn, [e.text ? (n(), b("div", $n, A(e.text), 1)) : X("", !0), S(F(qe), {
			"model-value": r.value,
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
		])])) : (n(), b("div", er, [S(F(qe), {
			"model-value": r.value,
			color: e.color,
			height: e.height,
			rounded: "",
			"aria-label": e.text || void 0,
			style: R({ minWidth: `${tr}px` }),
			"data-part": "score-bar"
		}, null, 8, [
			"model-value",
			"color",
			"height",
			"aria-label",
			"style"
		]), e.text ? (n(), b("span", {
			key: 0,
			class: "text-body-small text-medium-emphasis flex-shrink-0 text-end",
			style: R({ minWidth: `${nr}px` }),
			"data-part": "score-text"
		}, A(e.text), 5)) : X("", !0)]));
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
Ae("smartview-data-table", /* @__PURE__ */ Qe(/* @__PURE__ */ s({
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
		let r = e, a = t, { t: o, locale: s } = G(), c = Pe(), { overlayDefaults: u } = Te(() => r.overlayTarget), d = Y(() => typeof r.serverItemsLength == "number" && r.serverItemsLength >= 0), f = {
			key: cr,
			width: lr,
			minWidth: lr,
			maxWidth: lr,
			sortable: !1,
			headerProps: { class: "smartview-select-cell" },
			cellProps: { class: "smartview-select-cell" }
		}, m = Y(() => [...r.selectable ? [f] : [], ...r.headers.map(({ title: e, key: t, type: n, width: r, maxWidth: i, align: a, sortable: o, value: s }) => ({
			title: e,
			key: t,
			width: r,
			maxWidth: i,
			value: s,
			align: a ?? v(n),
			sortable: o ?? (n !== "actions" && n !== "chips" && n !== "switch")
		}))]), h = Y(() => r.headers.filter((e) => e.type && e.type !== "text"));
		function v(e) {
			if (e === "actions" || e === "switch") return "center";
			if (e === "number") return "end";
		}
		function y(e) {
			let t = e.align ?? v(e.type);
			return t === "center" ? "justify-center" : t === "end" ? "justify-end" : "";
		}
		let { current: x, commit: C } = Fe("page", () => r.page), { current: w, commit: T } = Fe("itemsPerPage", () => r.itemsPerPage), { current: E, commit: ee } = Fe("sortBy", () => r.sortBy, { normalize: (e) => [...e] });
		function k() {
			return {
				page: x.value,
				itemsPerPage: w.value,
				sortBy: E.value.map((e) => ({ ...e }))
			};
		}
		let j = null;
		function N(e) {
			j === null && _(te), j !== "sort-change" && (j = e);
		}
		function te() {
			let e = j;
			j = null, e === "sort-change" ? a("sort-change", k()) : e === "page-change" && a("page-change", k());
		}
		let P = !1;
		p([
			() => r.items,
			() => r.search,
			() => r.serverItemsLength
		], () => {
			P = !0, globalThis.setTimeout(() => P = !1);
		}, { flush: "sync" });
		function ne(e) {
			if (e !== x.value) {
				if (P) {
					x.value = e;
					return;
				}
				C(e), N("page-change");
			}
		}
		function I(e) {
			e !== w.value && (T(e), N("page-change"));
		}
		function re(e) {
			ee(e.map(({ key: e, order: t }) => ({
				key: e,
				order: t === "desc" ? "desc" : "asc"
			}))), N("sort-change");
		}
		let { current: L, commit: R } = Fe("selected", () => r.selected, { normalize: (e) => Array.isArray(e) ? [...e] : [] });
		function z(e) {
			let t = [...e];
			t.length === L.value.length && t.every((e, t) => e === L.value[t]) || (R(t), a("selection-change", t));
		}
		let ie = Y(() => r.rowClickable ? ({ item: e }) => ({
			tabindex: 0,
			"data-part": "row",
			onClick: (t) => {
				t.target instanceof Element && t.target.closest(ur) || a("row-click", { item: e });
			},
			onKeydown: (t) => {
				t.key === "Enter" && t.target === t.currentTarget && a("row-click", { item: e });
			}
		}) : void 0), B = Y(() => new Set(r.busy.map((e) => ae(e.id, e.target))));
		function ae(e, t) {
			return JSON.stringify([$e(e), t]);
		}
		function oe(e, t) {
			return B.value.has(ae(e[r.itemValue], t));
		}
		function V(e, t) {
			return (e.actions ?? []).filter((e) => !e.visible || e.visible(t));
		}
		function W(e, t) {
			return typeof e.href == "function" ? e.href(t) : e.href ?? "";
		}
		function se(e, t, n) {
			if (oe(t, e.name)) {
				n.preventDefault();
				return;
			}
			Ne(c, "row-action", W(e, t), n, {
				action: e.name,
				item: t
			});
		}
		function ce(e, t) {
			e.target instanceof HTMLInputElement && (e.target.checked = t);
		}
		function le(e, t) {
			let n = e.scoreMax && e.scoreMax > 0 ? e.scoreMax : dr;
			return typeof t == "number" && Number.isFinite(t) ? t / n * 100 : 0;
		}
		function ue(e, t) {
			return typeof e.scoreColor == "function" ? e.scoreColor(t) : e.scoreColor ?? "primary";
		}
		function de(e, t, n) {
			oe(t, e.key) || a("switch-change", {
				key: e.key,
				item: t,
				value: n === !0
			});
		}
		return (t, r) => (n(), M(F(Ce), { defaults: F(u) }, {
			default: O(() => [Z("div", ir, [S(F(rt), {
				rounded: e.flat ? 0 : "xl",
				elevation: e.flat ? 0 : 2,
				variant: e.flat ? "flat" : void 0,
				"data-part": "root"
			}, {
				default: O(() => [(n(), M(D(d.value ? F(Ln) : F(Fn)), g(d.value ? { itemsLength: e.serverItemsLength } : {}, {
					headers: m.value,
					items: e.items,
					loading: e.loading,
					search: e.search,
					"item-value": e.itemValue,
					"items-per-page": F(w),
					page: F(x),
					"sort-by": F(E),
					"row-props": ie.value,
					"hide-default-footer": e.hideFooter,
					"show-select": e.selectable,
					"select-strategy": "page",
					"model-value": F(L),
					hover: "",
					class: "smartview-data-table smartview-table",
					"onUpdate:page": ne,
					"onUpdate:itemsPerPage": I,
					"onUpdate:sortBy": re,
					"onUpdate:modelValue": z
				}), i({
					[`header.${cr}`]: O(({ allSelected: e, someSelected: t, selectAll: n }) => [S(F(at), {
						"model-value": e,
						indeterminate: t && !e,
						"aria-label": F(o)("smartview.selectPageRows"),
						density: "compact",
						"data-part": "select-all",
						"onUpdate:modelValue": (e) => n(!!e)
					}, null, 8, [
						"model-value",
						"indeterminate",
						"aria-label",
						"onUpdate:modelValue"
					])]),
					[`item.${cr}`]: O(({ props: e }) => [S(F(at), g(e, {
						"aria-label": F(o)("smartview.selectRow"),
						density: "compact",
						"data-part": "select-row"
					}), null, 16, ["aria-label"])]),
					"no-data": O(() => [S(ct, {
						heading: e.emptyTitle || F(o)("smartview.noData"),
						icon: e.emptyIcon,
						hint: e.emptyHint,
						"action-text": e.emptyActionText,
						"action-href": e.emptyActionHref,
						onAction: r[0] ||= (t) => F(Ne)(F(c), "empty-action", e.emptyActionHref, t)
					}, null, 8, [
						"heading",
						"icon",
						"hint",
						"action-text",
						"action-href"
					])]),
					_: 2
				}, [l(h.value, (e) => ({
					name: `item.${e.key}`,
					fn: O(({ item: t, value: r }) => [e.type === "name" ? (n(), M(Zn, {
						key: 0,
						name: F($e)(r),
						sub: e.subKey ? F($e)(t[e.subKey]) : "",
						"avatar-icon": e.avatarIcon,
						"avatar-color": e.avatarColor
					}, null, 8, [
						"name",
						"sub",
						"avatar-icon",
						"avatar-color"
					])) : e.type === "status" ? (n(), M(nt, {
						key: 1,
						status: F(et)(r, e.statusMap, {}, e.statusFallback)
					}, null, 8, ["status"])) : e.type === "chips" ? (n(), M(Wn, {
						key: 2,
						items: F(tt)(r),
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
					])) : e.type === "date" ? (n(), b("span", ar, A(F(ot)(r)), 1)) : e.type === "number" ? (n(), b("span", or, A(F(st)(r, F(s), e.numberFormat)), 1)) : e.type === "actions" ? (n(), b("div", {
						key: 5,
						class: U(["d-flex ga-1", y(e)])
					}, [(n(!0), b(H, null, l(V(e, t), (e) => (n(), M(Gn, {
						key: e.name,
						icon: e.icon,
						color: e.color,
						label: e.tooltip || e.name,
						tooltip: !!e.tooltip,
						href: W(e, t),
						loading: oe(t, e.name),
						"data-action": e.name,
						onAction: (n) => se(e, t, n)
					}, null, 8, [
						"icon",
						"color",
						"label",
						"tooltip",
						"href",
						"loading",
						"data-action",
						"onAction"
					]))), 128))], 2)) : e.type === "score" ? (n(), M(rr, {
						key: 6,
						value: le(e, r),
						color: ue(e, t),
						text: e.scoreText ? e.scoreText(t) : ""
					}, null, 8, [
						"value",
						"color",
						"text"
					])) : e.type === "switch" ? (n(), b("div", {
						key: 7,
						class: U(["d-flex", y(e)]),
						onChange: (e) => ce(e, r === !0)
					}, [S(F(it), {
						"model-value": r === !0,
						color: e.switchColor || "success",
						loading: oe(t, e.key),
						"aria-label": e.title,
						inset: "",
						density: "compact",
						"hide-details": "",
						"data-part": "switch",
						"onUpdate:modelValue": (n) => de(e, t, n)
					}, null, 8, [
						"model-value",
						"color",
						"loading",
						"aria-label",
						"onUpdate:modelValue"
					])], 42, sr)) : X("", !0)])
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
