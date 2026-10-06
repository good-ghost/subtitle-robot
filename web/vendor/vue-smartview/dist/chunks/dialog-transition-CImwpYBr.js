import { A as e, En as t, Et as n, R as r, S as i, T as a, b as o, tn as s, x as c, yn as l } from "./vuetify-DJ4bsPds.js";
import { n as u, t as d } from "./animation-BZ-bP6So.js";
//#region node_modules/vuetify/lib/components/transitions/dialog-transition.js
var f = e({ target: [Object, Array] }, "v-dialog-transition"), p = /* @__PURE__ */ new WeakMap(), m = a()({
	name: "VDialogTransition",
	props: f(),
	setup(e, { slots: r }) {
		let a = {
			onBeforeEnter(e) {
				e.style.pointerEvents = "none", e.style.visibility = "hidden";
			},
			async onEnter(t, r) {
				await new Promise((e) => requestAnimationFrame(e)), await new Promise((e) => requestAnimationFrame(e)), t.style.visibility = "";
				let a = g(e.target, t), { x: o, y: s, sx: l, sy: u, speed: f } = a;
				if (p.set(t, a), n()) d(t, [{ opacity: 0 }, {}], {
					duration: 125 * f,
					easing: c
				}).finished.then(() => r());
				else {
					let e = d(t, [{
						transform: `translate(${o}px, ${s}px) scale(${l}, ${u})`,
						opacity: 0
					}, {}], {
						duration: 225 * f,
						easing: c
					});
					h(t)?.forEach((e) => {
						d(e, [
							{ opacity: 0 },
							{
								opacity: 0,
								offset: .33
							},
							{}
						], {
							duration: 450 * f,
							easing: i
						});
					}), e.finished.then(() => r());
				}
			},
			onAfterEnter(e) {
				e.style.removeProperty("pointer-events");
			},
			onBeforeLeave(e) {
				e.style.pointerEvents = "none";
			},
			async onLeave(t, r) {
				await new Promise((e) => requestAnimationFrame(e));
				let a;
				a = !p.has(t) || Array.isArray(e.target) || e.target.offsetParent || e.target.getClientRects().length ? g(e.target, t) : p.get(t);
				let { x: s, y: c, sx: l, sy: u, speed: f } = a;
				n() ? d(t, [{}, { opacity: 0 }], {
					duration: 85 * f,
					easing: o
				}).finished.then(() => r()) : (d(t, [{}, {
					transform: `translate(${s}px, ${c}px) scale(${l}, ${u})`,
					opacity: 0
				}], {
					duration: 125 * f,
					easing: o
				}).finished.then(() => r()), h(t)?.forEach((e) => {
					d(e, [
						{},
						{
							opacity: 0,
							offset: .2
						},
						{ opacity: 0 }
					], {
						duration: 250 * f,
						easing: i
					});
				}));
			},
			onAfterLeave(e) {
				e.style.removeProperty("pointer-events");
			}
		};
		return () => e.target ? l(s, t({ name: "dialog-transition" }, a, { css: !1 }), r) : l(s, { name: "dialog-transition" }, r);
	}
});
function h(e) {
	let t = e.querySelector(":scope > .v-card, :scope > .v-sheet, :scope > .v-list")?.children;
	return t && [...t];
}
function g(e, t) {
	let n = r(e), i = u(t), [a, o] = getComputedStyle(t).transformOrigin.split(" ").map((e) => parseFloat(e)), [s, c] = getComputedStyle(t).getPropertyValue("--v-overlay-anchor-origin").split(" "), l = n.left + n.width / 2;
	s === "left" || c === "left" ? l -= n.width / 2 : (s === "right" || c === "right") && (l += n.width / 2);
	let d = n.top + n.height / 2;
	s === "top" || c === "top" ? d -= n.height / 2 : (s === "bottom" || c === "bottom") && (d += n.height / 2);
	let f = n.width / i.width, p = n.height / i.height, m = Math.max(1, f, p), h = f / m || 0, g = p / m || 0, _ = i.width * i.height / (window.innerWidth * window.innerHeight), v = _ > .12 ? Math.min(1.5, (_ - .12) * 10 + 1) : 1;
	return {
		x: l - (a + i.left),
		y: d - (o + i.top),
		sx: h,
		sy: g,
		speed: v
	};
}
//#endregion
export { m as t };
