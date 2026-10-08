import { Dt as e, Lt as t, Vt as n } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/directives/intersect/index.js
function r(r, a) {
	if (!e) return;
	let o = a.modifiers || {}, s = a.value, c = t(s) || !n(s) ? s : s.handler, l = t(s) || !n(s) ? {} : s.options, u = new IntersectionObserver((e = [], t) => {
		let n = r._observe?.[a.instance.$.uid];
		if (!n) return;
		let s = e.some((e) => e.isIntersecting);
		c && (!o.quiet || n.init) && (!o.once || s || n.init) && c(s, e, t), s && o.once ? i(r, a) : n.init = !0;
	}, l);
	r._observe = Object(r._observe), r._observe[a.instance.$.uid] = {
		init: !1,
		observer: u
	}, u.observe(r);
}
function i(e, t) {
	let n = e._observe?.[t.instance.$.uid];
	n && (n.observer.unobserve(e), delete e._observe[t.instance.$.uid]);
}
var a = {
	mounted: r,
	unmounted: i,
	updated: (e, t) => {
		e._observe?.[t.instance.$.uid] && (i(e, t), r(e, t));
	}
};
//#endregion
export { a as t };
