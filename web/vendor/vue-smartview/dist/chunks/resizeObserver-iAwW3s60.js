import { Ct as e, F as t, Hn as n, Tt as r, Xn as i, Zn as a, kn as o } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/composables/resizeObserver.js
function s(s, c = "content") {
	let l = e(), u = a();
	if (r) {
		let e = new ResizeObserver((n) => {
			if (s?.(n, e), n.length) {
				if (c === "content") u.value = n[0].contentRect;
				else {
					let e = n[0].borderBoxSize?.[0], r = n[0].target;
					u.value = new t({
						x: 0,
						y: 0,
						width: e?.inlineSize ?? r.offsetWidth,
						height: e?.blockSize ?? r.offsetHeight
					});
				}
			}
		});
		o(() => {
			e.disconnect();
		}), n(() => l.el, (t, n) => {
			n && (e.unobserve(n), u.value = void 0), t && e.observe(t);
		}, { flush: "post" });
	}
	return {
		resizeRef: l,
		contentRect: i(u)
	};
}
//#endregion
export { s as t };
