import { A as e, G as t, Mn as n, T as r, Xn as i, c as a, cr as o, er as s, fn as c, l, nr as u, pn as d, ur as f } from "./vuetify-DJ4bsPds.js";
import { c as p, l as m, s as h } from "./define-BG7hCbXs.js";
//#region node_modules/vuetify/lib/components/VDivider/VDivider.js
var g = [
	"dotted",
	"dashed",
	"solid",
	"double"
], _ = e({
	color: String,
	contentOffset: [
		Number,
		String,
		Array
	],
	gradient: Boolean,
	inset: Boolean,
	length: [Number, String],
	opacity: [Number, String],
	thickness: [Number, String],
	vertical: Boolean,
	variant: {
		type: String,
		default: "solid",
		validator: (e) => g.includes(e)
	},
	...m(),
	...a()
}, "VDivider"), v = r()({
	name: "VDivider",
	props: _(),
	setup(e, { attrs: n, slots: r }) {
		let { themeClasses: i } = l(e), { textColorClasses: a, textColorStyles: s } = h(() => e.color), m = c(() => {
			let n = {};
			return e.length && (n[e.vertical ? "height" : "width"] = t(e.length)), e.thickness && (n[e.vertical ? "borderRightWidth" : "borderTopWidth"] = t(e.thickness)), n;
		}), g = u(() => {
			let n = Array.isArray(e.contentOffset) ? e.contentOffset[0] : e.contentOffset, r = Array.isArray(e.contentOffset) ? e.contentOffset[1] : 0;
			return {
				marginBlock: e.vertical && n ? t(n) : void 0,
				marginInline: !e.vertical && n ? t(n) : void 0,
				transform: r ? `translate${e.vertical ? "X" : "Y"}(${t(r)})` : void 0
			};
		});
		return p(() => {
			let t = n.role, c = !!r.default, l = d("hr", {
				class: o([
					{
						"v-divider": !0,
						"v-divider--gradient": e.gradient && !r.default,
						"v-divider--inset": e.inset,
						"v-divider--vertical": e.vertical
					},
					i.value,
					a.value,
					e.class
				]),
				style: f([
					m.value,
					s.value,
					{ "--v-border-opacity": e.opacity },
					{ "border-style": e.variant },
					e.style
				]),
				"aria-orientation": !c && !t ? e.vertical ? "vertical" : "horizontal" : void 0,
				role: c ? void 0 : t
			}, null);
			return c ? d("div", { class: o(["v-divider__wrapper", {
				"v-divider__wrapper--gradient": e.gradient,
				"v-divider__wrapper--inset": e.inset,
				"v-divider__wrapper--vertical": e.vertical
			}]) }, [
				l,
				d("div", {
					class: "v-divider__content",
					style: f(g.value)
				}, [r.default()]),
				l
			]) : l;
		}), {};
	}
});
//#endregion
//#region node_modules/vuetify/lib/composables/ssrBoot.js
function y() {
	let e = s(!1);
	return n(() => {
		window.requestAnimationFrame(() => {
			e.value = !0;
		});
	}), {
		ssrBootStyles: u(() => e.value ? void 0 : { transition: "none !important" }),
		isBooted: i(e)
	};
}
//#endregion
export { v as n, y as t };
