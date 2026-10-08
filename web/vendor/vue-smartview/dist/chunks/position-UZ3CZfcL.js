import { A as e, cr as t, k as n } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/composables/position.js
var r = [
	"static",
	"relative",
	"fixed",
	"absolute",
	"sticky"
], i = e({ position: {
	type: String,
	validator: /* istanbul ignore next */ (e) => r.includes(e)
} }, "position");
function a(e, r = n()) {
	return { positionClasses: t(() => e.position ? `${r}--${e.position}` : void 0) };
}
//#endregion
export { a as n, i as t };
