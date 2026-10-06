import { In as e, Pn as t, Wn as n, ar as r, bn as i, cn as a, dr as o, en as s, fn as c, gn as l, hn as u, mn as d, pn as f, ur as p, vn as m, yn as h } from "../chunks/vuetify-DJ4bsPds.js";
import { t as g } from "../chunks/VSelect-tmFN_T5n.js";
import { a as _ } from "../chunks/rounded-CXkAtXly.js";
import { i as v } from "../chunks/VOverlay-BI1rs3Fd.js";
import { t as y } from "../chunks/define-BG7hCbXs.js";
import { t as b } from "../chunks/hostValue-Q4jXLLiG.js";
import { t as x } from "../chunks/VBtn-D2PPPp70.js";
import { t as S } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { n as C, t as w } from "../chunks/VCard-CIgInzZL.js";
import { t as T } from "../chunks/VSwitch-rcpcpGXz.js";
import { t as E } from "../chunks/VTextField-uapT17Ep.js";
//#region src/elements/SmartviewFilterBar.ce.vue?vue&type=script&setup=true&lang.ts
var D = { class: "smartview-root" }, O = { class: "smartview-filter-row" }, k = {
	key: 0,
	class: "smartview-filter-cell--tail d-flex align-center justify-end flex-wrap ga-4"
};
//#endregion
//#region src/entries/smartview-filter-bar.ts
y("smartview-filter-bar", /* @__PURE__ */ S(/* @__PURE__ */ i({
	__name: "SmartviewFilterBar.ce",
	props: {
		filters: {
			default: () => [],
			type: Array
		},
		switches: {
			default: () => [],
			type: Array
		},
		values: {
			default: () => ({}),
			type: Object
		},
		search: {
			default: "",
			type: String
		},
		searchLabel: {
			default: "",
			type: String
		},
		loading: {
			type: Boolean,
			default: !1
		},
		hideRefresh: {
			type: Boolean,
			default: !1
		},
		overlayTarget: {
			default: "body",
			type: String
		}
	},
	emits: [
		"filter-change",
		"search-change",
		"refresh"
	],
	setup(i, { emit: y }) {
		let S = i, A = y, { t: j } = s(), { overlayDefaults: M } = v(() => S.overlayTarget), N = c(() => !S.hideRefresh || S.switches.length > 0), P = c(() => {
			let e = S.filters.length;
			return {
				filter: e === 2 ? 2 : 3,
				search: e === 2 ? 4 : 5
			};
		}), { current: F, commit: I } = b("values", () => S.values, { normalize: (e) => ({ ...e }) }), { current: L, commit: R } = b("search", () => S.search);
		function z(e, t) {
			I({
				...F.value,
				[e]: t
			}), A("filter-change", {
				key: e,
				value: t
			});
		}
		function B(e) {
			R(e ?? ""), A("search-change", L.value);
		}
		return (s, c) => (t(), d(r(_), { defaults: r(M) }, {
			default: n(() => [f("div", D, [h(r(w), {
				rounded: "xl",
				variant: "outlined",
				"data-part": "root"
			}, {
				default: n(() => [h(r(C), null, {
					default: n(() => [f("div", O, [
						(t(!0), l(a, null, e(i.filters, (e) => (t(), l("div", {
							key: e.key,
							class: "smartview-filter-cell--filter",
							style: p({ "--smartview-span": P.value.filter })
						}, [h(r(g), {
							"model-value": r(F)[e.key] ?? null,
							items: e.items,
							label: e.label || r(j)("smartview.filter"),
							"prepend-inner-icon": e.icon || "mdi-filter-variant",
							variant: "outlined",
							density: "compact",
							rounded: "lg",
							"hide-details": "",
							"data-part": "filter",
							"data-filter": e.key,
							"onUpdate:modelValue": (t) => z(e.key, t)
						}, null, 8, [
							"model-value",
							"items",
							"label",
							"prepend-inner-icon",
							"data-filter",
							"onUpdate:modelValue"
						])], 4))), 128)),
						f("div", {
							class: "smartview-filter-cell--search",
							style: p({ "--smartview-span": P.value.search })
						}, [h(r(E), {
							"model-value": r(L),
							label: i.searchLabel || r(j)("smartview.search"),
							"prepend-inner-icon": "mdi-magnify",
							variant: "outlined",
							density: "compact",
							rounded: "lg",
							clearable: "",
							"hide-details": "",
							"data-part": "search",
							"onUpdate:modelValue": B
						}, null, 8, ["model-value", "label"])], 4),
						N.value ? (t(), l("div", k, [(t(!0), l(a, null, e(i.switches, (e) => (t(), d(r(T), {
							key: e.key,
							"model-value": r(F)[e.key] === !0,
							label: e.label,
							color: "primary",
							density: "compact",
							"hide-details": "",
							class: "flex-grow-0",
							"data-part": "switch",
							"data-switch": e.key,
							"onUpdate:modelValue": (t) => z(e.key, t === !0)
						}, null, 8, [
							"model-value",
							"label",
							"data-switch",
							"onUpdate:modelValue"
						]))), 128)), i.hideRefresh ? u("", !0) : (t(), d(r(x), {
							key: 0,
							variant: "text",
							"prepend-icon": "mdi-refresh",
							loading: i.loading,
							"data-part": "refresh",
							onClick: c[0] ||= (e) => A("refresh")
						}, {
							default: n(() => [m(o(r(j)("smartview.refresh")), 1)]),
							_: 1
						}, 8, ["loading"]))])) : u("", !0)
					])]),
					_: 1
				})]),
				_: 1
			})])]),
			_: 1
		}, 8, ["defaults"]));
	}
}), [["styles", [".smartview-filter-row{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.smartview-filter-cell--filter,.smartview-filter-cell--search,.smartview-filter-cell--tail{flex:0 1 calc(var(--smartview-span) * (100% + 8px) / 12 - 8px)}.smartview-filter-cell--filter{min-width:160px}.smartview-filter-cell--search{flex-grow:1;min-width:240px}.smartview-filter-cell--tail{--smartview-span:4;flex-grow:1;min-width:max-content}"]]]));
//#endregion
