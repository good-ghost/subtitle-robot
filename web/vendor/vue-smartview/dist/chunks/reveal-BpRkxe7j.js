import { A as e, Dt as t, Hn as n, Jn as r, Mn as i, Vt as a, Zn as o, er as s, nr as c } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/composables/intersectionObserver.js
function l(e, i) {
	let a = o(), c = s(!1);
	if (t) {
		let t = new IntersectionObserver((n) => {
			e?.(n, t), c.value = !!n.find((e) => e.isIntersecting);
		}, i);
		r(() => {
			t.disconnect();
		}), n(a, (e, n) => {
			n && (t.unobserve(n), c.value = !1), e && t.observe(e);
		}, { flush: "post" });
	}
	return {
		intersectionRef: a,
		isIntersecting: c
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/reveal.js
var u = e({ reveal: {
	type: [Boolean, Object],
	default: !1
} }, "reveal");
function d(e) {
	let t = c(() => a(e.reveal) ? Math.max(0, Number(e.reveal.duration ?? 900)) : 900), n = s(e.reveal ? "initial" : "disabled");
	return i(async () => {
		e.reveal && (n.value = "initial", await new Promise((e) => requestAnimationFrame(e)), n.value = "pending", await new Promise((e) => setTimeout(e, t.value)), n.value = "done");
	}), {
		duration: t,
		state: n
	};
}
//#endregion
export { d as n, l as r, u as t };
