import { In as e, Pn as t, Wn as n, ar as r, bn as i, cn as a, cr as o, dr as s, gn as c, mn as l, vn as u, yn as d } from "../chunks/vuetify-DJ4bsPds.js";
import { t as f } from "../chunks/define-BG7hCbXs.js";
import { c as p, o as m, s as h, t as g } from "../chunks/VList-BOnRbwg2.js";
import { t as _ } from "../chunks/VChip-Dqfk0_yh.js";
import { t as v } from "../chunks/_plugin-vue_export-helper-B3ysoDQm.js";
import { i as y } from "../chunks/status-J4FIN71L.js";
//#region src/elements/SmartviewInfoList.ce.vue?vue&type=script&setup=true&lang.ts
var b = { class: "smartview-root" }, x = {
	key: 1,
	"data-part": "value"
}, S = ["title"];
//#endregion
//#region src/entries/smartview-info-list.ts
f("smartview-info-list", /* @__PURE__ */ v(/* @__PURE__ */ i({
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
	setup(i) {
		function f(e) {
			let t = y(e);
			return t === "" ? "-" : t;
		}
		return (v, y) => (t(), c("div", b, [d(r(g), {
			density: "compact",
			class: o(["bg-transparent", `smartview-info-list--${i.layout}`]),
			"data-part": "list"
		}, {
			default: n(() => [i.layout === "title-subtitle" ? (t(!0), c(a, { key: 0 }, e(i.rows, (e, i) => (t(), l(r(m), {
				key: `${i}-${e.label}`,
				"prepend-icon": e.icon || void 0,
				"data-part": "row"
			}, {
				default: n(() => [d(r(h), { "data-part": "value-cell" }, {
					default: n(() => [e.chip ? (t(), l(r(_), {
						key: 0,
						size: "small",
						variant: "tonal",
						color: e.chip,
						label: "",
						"data-part": "value"
					}, {
						default: n(() => [u(s(f(e.value)), 1)]),
						_: 2
					}, 1032, ["color"])) : (t(), c("span", x, s(f(e.value)), 1))]),
					_: 2
				}, 1024), d(r(p), { "data-part": "label" }, {
					default: n(() => [u(s(e.label), 1)]),
					_: 2
				}, 1024)]),
				_: 2
			}, 1032, ["prepend-icon"]))), 128)) : (t(!0), c(a, { key: 1 }, e(i.rows, (e, i) => (t(), l(r(m), {
				key: `${i}-${e.label}`,
				"prepend-icon": e.icon || void 0,
				"data-part": "row"
			}, {
				append: n(() => [e.chip ? (t(), l(r(_), {
					key: 0,
					size: "small",
					variant: "tonal",
					color: e.chip,
					label: "",
					"data-part": "value"
				}, {
					default: n(() => [u(s(f(e.value)), 1)]),
					_: 2
				}, 1032, ["color"])) : (t(), c("span", {
					key: 1,
					class: "font-weight-medium text-truncate",
					title: f(e.value),
					"data-part": "value"
				}, s(f(e.value)), 9, S))]),
				default: n(() => [d(r(h), {
					class: "text-body-medium text-medium-emphasis",
					"data-part": "label"
				}, {
					default: n(() => [u(s(e.label), 1)]),
					_: 2
				}, 1024)]),
				_: 2
			}, 1032, ["prepend-icon"]))), 128))]),
			_: 1
		}, 8, ["class"])]));
	}
}), [["styles", [".smartview-info-list--value-right .v-list-item{grid-template-columns:max-content max-content minmax(0,1fr)}.smartview-info-list--value-right .v-list-item__append{justify-content:flex-end;min-width:0;padding-inline-start:16px}"]]]));
//#endregion
