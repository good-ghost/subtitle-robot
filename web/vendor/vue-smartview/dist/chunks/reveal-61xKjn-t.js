import { A as e, Dt as t, Jn as n, Rn as r, Vt as i, cr as a, er as o, or as s, rr as c } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/composables/intersectionObserver.js
function l(e, r) {
	let i = c(), a = s(!1);
	if (t) {
		let t = new IntersectionObserver((n) => {
			e?.(n, t), a.value = !!n.find((e) => e.isIntersecting);
		}, r);
		o(() => {
			t.disconnect();
		}), n(i, (e, n) => {
			n && (t.unobserve(n), a.value = !1), e && t.observe(e);
		}, { flush: "post" });
	}
	return {
		intersectionRef: i,
		isIntersecting: a
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/reveal.js
var u = e({ reveal: {
	type: [Boolean, Object],
	default: !1
} }, "reveal");
function d(e) {
	let t = a(() => i(e.reveal) ? Math.max(0, Number(e.reveal.duration ?? 900)) : 900), n = s(e.reveal ? "initial" : "disabled");
	return r(async () => {
		e.reveal && (n.value = "initial", await new Promise((e) => requestAnimationFrame(e)), n.value = "pending", await new Promise((e) => setTimeout(e, t.value)), n.value = "done");
	}), {
		duration: t,
		state: n
	};
}
//#endregion
export { d as n, l as r, u as t };
