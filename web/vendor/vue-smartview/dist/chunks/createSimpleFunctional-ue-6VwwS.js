import { T as e, fr as t, kn as n, pr as r } from "./vuetify-C39-WP9g.js";
import { l as i } from "./define-BovISfN4.js";
//#region node_modules/vuetify/lib/util/createSimpleFunctional.js
function a(a, o = "div", s) {
	return e()({
		name: s ?? r(t(a.replace(/__/g, "-"))),
		props: {
			tag: {
				type: String,
				default: o
			},
			...i()
		},
		setup(e, { slots: t }) {
			return () => n(e.tag, {
				class: [a, e.class],
				style: e.style
			}, t.default?.());
		}
	});
}
//#endregion
export { a as t };
