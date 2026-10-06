import { A as e, Cn as t, En as n, Vt as r, nn as i, tn as a, yt as o } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/composables/transition.js
var s = e({ transition: {
	type: null,
	default: "fade-transition",
	validator: (e) => e !== !0
} }, "transition"), c = (e, { slots: s }) => {
	let { transition: c, disabled: l, group: u, target: d, ...f } = e, { component: p = u ? i : a, ...m } = r(c) ? c : {}, h;
	return h = r(c) ? n(m, o({
		disabled: l,
		group: u,
		target: d
	}), f) : n({ name: l || !c ? "" : c }, f), t(p, h, s);
};
//#endregion
export { s as n, c as t };
