import { Rn as e, cr as t, nr as n, or as r } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/composables/ssrBoot.js
function i() {
	let i = r(!1);
	return e(() => {
		window.requestAnimationFrame(() => {
			i.value = !0;
		});
	}), {
		ssrBootStyles: t(() => i.value ? void 0 : { transition: "none !important" }),
		isBooted: n(i)
	};
}
//#endregion
export { i as t };
