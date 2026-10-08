import { A as e, Mn as t, Vt as n, cn as r, kn as i, sn as a, yt as o } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/composables/transition.js
var s = e({ transition: {
	type: null,
	default: "fade-transition",
	validator: (e) => e !== !0
} }, "transition"), c = (e, { slots: s }) => {
	let { transition: c, disabled: l, group: u, target: d, ...f } = e, { component: p = u ? r : a, ...m } = n(c) ? c : {}, h;
	return h = n(c) ? t(m, o({
		disabled: l,
		group: u,
		target: d
	}), f) : t({ name: l || !c ? "" : c }, f), i(p, h, s);
};
//#endregion
export { s as n, c as t };
