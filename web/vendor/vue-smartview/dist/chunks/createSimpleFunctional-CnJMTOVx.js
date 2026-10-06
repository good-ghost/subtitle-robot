import { Cn as e, T as t, or as n, sr as r } from "./vuetify-DJ4bsPds.js";
import { l as i } from "./define-BG7hCbXs.js";
//#region node_modules/vuetify/lib/util/createSimpleFunctional.js
function a(a, o = "div", s) {
	return t()({
		name: s ?? r(n(a.replace(/__/g, "-"))),
		props: {
			tag: {
				type: String,
				default: o
			},
			...i()
		},
		setup(t, { slots: n }) {
			return () => e(t.tag, {
				class: [a, t.class],
				style: t.style
			}, n.default?.());
		}
	});
}
//#endregion
export { a as t };
