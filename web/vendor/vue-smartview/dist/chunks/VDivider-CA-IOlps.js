import { A as e, G as t, T as n, c as r, cr as i, gr as a, l as o, mr as s, vn as c, yn as l } from "./vuetify-C39-WP9g.js";
import { c as u, l as d, s as f } from "./define-BovISfN4.js";
//#region node_modules/vuetify/lib/components/VDivider/VDivider.js
var p = [
	"dotted",
	"dashed",
	"solid",
	"double"
], m = e({
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
		validator: (e) => p.includes(e)
	},
	...d(),
	...r()
}, "VDivider"), h = n()({
	name: "VDivider",
	props: m(),
	setup(e, { attrs: n, slots: r }) {
		let { themeClasses: d } = o(e), { textColorClasses: p, textColorStyles: m } = f(() => e.color), h = c(() => {
			let n = {};
			return e.length && (n[e.vertical ? "height" : "width"] = t(e.length)), e.thickness && (n[e.vertical ? "borderRightWidth" : "borderTopWidth"] = t(e.thickness)), n;
		}), g = i(() => {
			let n = Array.isArray(e.contentOffset) ? e.contentOffset[0] : e.contentOffset, r = Array.isArray(e.contentOffset) ? e.contentOffset[1] : 0;
			return {
				marginBlock: e.vertical && n ? t(n) : void 0,
				marginInline: !e.vertical && n ? t(n) : void 0,
				transform: r ? `translate${e.vertical ? "X" : "Y"}(${t(r)})` : void 0
			};
		});
		return u(() => {
			let t = n.role, i = !!r.default, o = l("hr", {
				class: s([
					{
						"v-divider": !0,
						"v-divider--gradient": e.gradient && !r.default,
						"v-divider--inset": e.inset,
						"v-divider--vertical": e.vertical
					},
					d.value,
					p.value,
					e.class
				]),
				style: a([
					h.value,
					m.value,
					{ "--v-border-opacity": e.opacity },
					{ "border-style": e.variant },
					e.style
				]),
				"aria-orientation": !i && !t ? e.vertical ? "vertical" : "horizontal" : void 0,
				role: i ? void 0 : t
			}, null);
			return i ? l("div", { class: s(["v-divider__wrapper", {
				"v-divider__wrapper--gradient": e.gradient,
				"v-divider__wrapper--inset": e.inset,
				"v-divider__wrapper--vertical": e.vertical
			}]) }, [
				o,
				l("div", {
					class: "v-divider__content",
					style: a(g.value)
				}, [r.default()]),
				o
			]) : o;
		}), {};
	}
});
//#endregion
export { h as t };
