import { A as e, G as t, Ht as n, T as r, Tn as i, c as a, cr as o, et as s, gn as c, gr as l, k as u, mr as d, or as f, u as p, v as m, vn as h, y as g } from "./vuetify-C39-WP9g.js";
import { c as _, i as v, l as y, n as b, r as x, s as S } from "./define-BovISfN4.js";
//#region node_modules/vuetify/lib/components/VIcon/VIcon.js
var C = e({
	color: String,
	disabled: Boolean,
	start: Boolean,
	end: Boolean,
	icon: m,
	opacity: [String, Number],
	...y(),
	...x(),
	...b({ tag: "i" }),
	...a()
}, "VIcon"), w = r()({
	name: "VIcon",
	props: C(),
	setup(e, { attrs: r, slots: a }) {
		let o = f(), { themeClasses: u } = p(), { iconData: m } = g(() => o.value || e.icon), { sizeClasses: h } = v(e), { textColorClasses: y, textColorStyles: b } = S(() => e.color);
		return _(() => {
			let f = a.default?.();
			f && (o.value = s(f).filter((e) => e.type === c && e.children && n(e.children))[0]?.children);
			let p = !!(r.onClick || r.onClickOnce);
			return i(m.value.component, {
				tag: e.tag,
				icon: m.value.icon,
				class: d([
					"v-icon",
					"notranslate",
					u.value,
					h.value,
					y.value,
					{
						"v-icon--clickable": p,
						"v-icon--disabled": e.disabled,
						"v-icon--start": e.start,
						"v-icon--end": e.end
					},
					e.class
				]),
				style: l([
					{ "--v-icon-opacity": e.opacity },
					h.value ? void 0 : {
						fontSize: t(e.size),
						height: t(e.size),
						width: t(e.size)
					},
					b.value,
					e.style
				]),
				role: p ? "button" : void 0,
				"aria-hidden": !p,
				tabindex: p ? e.disabled ? -1 : 0 : void 0
			}, { default: () => [f] });
		}), {};
	}
}), T = e({
	height: [Number, String],
	maxHeight: [Number, String],
	maxWidth: [Number, String],
	minHeight: [Number, String],
	minWidth: [Number, String],
	width: [Number, String]
}, "dimension");
function E(e) {
	return { dimensionStyles: h(() => {
		let n = {}, r = t(e.height), i = t(e.maxHeight), a = t(e.maxWidth), o = t(e.minHeight), s = t(e.minWidth), c = t(e.width);
		return r && (n.height = r), i && (n.maxHeight = i), a && (n.maxWidth = a), o && (n.minHeight = o), s && (n.minWidth = s), c && (n.width = c), n;
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/composables/density.js
var D = [
	null,
	"default",
	"comfortable",
	"compact"
], O = e({ density: {
	type: String,
	default: "default",
	validator: (e) => D.includes(e)
} }, "density");
function k(e, t = u()) {
	return { densityClasses: o(() => `${t}--density-${e.density}`) };
}
//#endregion
export { w as a, E as i, k as n, T as r, O as t };
