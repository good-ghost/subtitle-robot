import { A as e, G as t, Ht as n, T as r, c as i, cr as a, er as o, et as s, fn as c, k as l, nr as u, u as d, un as f, ur as p, v as m, y as h, yn as g } from "./vuetify-DJ4bsPds.js";
import { c as _, i as v, l as y, n as b, r as x, s as S } from "./define-BG7hCbXs.js";
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
	...i()
}, "VIcon"), w = r()({
	name: "VIcon",
	props: C(),
	setup(e, { attrs: r, slots: i }) {
		let c = o(), { themeClasses: l } = d(), { iconData: u } = h(() => c.value || e.icon), { sizeClasses: m } = v(e), { textColorClasses: y, textColorStyles: b } = S(() => e.color);
		return _(() => {
			let o = i.default?.();
			o && (c.value = s(o).filter((e) => e.type === f && e.children && n(e.children))[0]?.children);
			let d = !!(r.onClick || r.onClickOnce);
			return g(u.value.component, {
				tag: e.tag,
				icon: u.value.icon,
				class: a([
					"v-icon",
					"notranslate",
					l.value,
					m.value,
					y.value,
					{
						"v-icon--clickable": d,
						"v-icon--disabled": e.disabled,
						"v-icon--start": e.start,
						"v-icon--end": e.end
					},
					e.class
				]),
				style: p([
					{ "--v-icon-opacity": e.opacity },
					m.value ? void 0 : {
						fontSize: t(e.size),
						height: t(e.size),
						width: t(e.size)
					},
					b.value,
					e.style
				]),
				role: d ? "button" : void 0,
				"aria-hidden": !d,
				tabindex: d ? e.disabled ? -1 : 0 : void 0
			}, { default: () => [o] });
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
	return { dimensionStyles: c(() => {
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
function k(e, t = l()) {
	return { densityClasses: u(() => `${t}--density-${e.density}`) };
}
//#endregion
export { w as a, E as i, k as n, T as r, O as t };
