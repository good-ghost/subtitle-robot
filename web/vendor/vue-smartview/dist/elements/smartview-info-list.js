import { Bn as e, En as t, Hn as n, Sn as r, Tn as i, Xn as a, _r as o, bn as s, dr as c, mn as l, mr as u, wn as d } from "../chunks/vuetify-C39-WP9g.js";
import { t as f } from "../chunks/define-BovISfN4.js";
import { c as p, o as m, s as h, t as g } from "../chunks/VList-BQKDUGEW.js";
import { t as _ } from "../chunks/VChip-C-IhEdKW.js";
import { t as v } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as y } from "../chunks/status-J4FIN71L.js";
//#region src/elements/SmartviewInfoList.ce.vue?vue&type=script&setup=true&lang.ts
var b = { class: "smartview-root" }, x = {
	key: 1,
	"data-part": "value"
}, S = ["title"];
//#endregion
//#region src/entries/smartview-info-list.ts
f("smartview-info-list", /* @__PURE__ */ v(/* @__PURE__ */ t({
	__name: "SmartviewInfoList.ce",
	props: {
		rows: {
			default: () => [],
			type: Array
		},
		layout: {
			default: "value-right",
			type: String
		}
	},
	setup(t) {
		function f(e) {
			let t = y(e);
			return t === "" ? "-" : t;
		}
		return (v, y) => (e(), r("div", b, [i(c(g), {
			density: "compact",
			class: u(["bg-transparent", `smartview-info-list--${t.layout}`]),
			"data-part": "list"
		}, {
			default: a(() => [t.layout === "title-subtitle" ? (e(!0), r(l, { key: 0 }, n(t.rows, (t, n) => (e(), s(c(m), {
				key: `${n}-${t.label}`,
				"prepend-icon": t.icon || void 0,
				"data-part": "row"
			}, {
				default: a(() => [i(c(h), { "data-part": "value-cell" }, {
					default: a(() => [t.chip ? (e(), s(c(_), {
						key: 0,
						size: "small",
						variant: "tonal",
						color: t.chip,
						label: "",
						"data-part": "value"
					}, {
						default: a(() => [d(o(f(t.value)), 1)]),
						_: 2
					}, 1032, ["color"])) : (e(), r("span", x, o(f(t.value)), 1))]),
					_: 2
				}, 1024), i(c(p), { "data-part": "label" }, {
					default: a(() => [d(o(t.label), 1)]),
					_: 2
				}, 1024)]),
				_: 2
			}, 1032, ["prepend-icon"]))), 128)) : (e(!0), r(l, { key: 1 }, n(t.rows, (t, n) => (e(), s(c(m), {
				key: `${n}-${t.label}`,
				"prepend-icon": t.icon || void 0,
				"data-part": "row"
			}, {
				append: a(() => [t.chip ? (e(), s(c(_), {
					key: 0,
					size: "small",
					variant: "tonal",
					color: t.chip,
					label: "",
					"data-part": "value"
				}, {
					default: a(() => [d(o(f(t.value)), 1)]),
					_: 2
				}, 1032, ["color"])) : (e(), r("span", {
					key: 1,
					class: "font-weight-medium text-truncate",
					title: f(t.value),
					"data-part": "value"
				}, o(f(t.value)), 9, S))]),
				default: a(() => [i(c(h), {
					class: "text-body-medium text-medium-emphasis",
					"data-part": "label"
				}, {
					default: a(() => [d(o(t.label), 1)]),
					_: 2
				}, 1024)]),
				_: 2
			}, 1032, ["prepend-icon"]))), 128))]),
			_: 1
		}, 8, ["class"])]));
	}
}), [["styles", [".smartview-info-list--value-right .v-list-item{grid-template-columns:max-content max-content minmax(0,1fr)}.smartview-info-list--value-right .v-list-item__append{justify-content:flex-end;min-width:0;padding-inline-start:16px}"]]]));
//#endregion
