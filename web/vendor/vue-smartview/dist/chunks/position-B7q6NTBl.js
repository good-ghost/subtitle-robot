import { A as e, k as t, nr as n } from "./vuetify-DJ4bsPds.js";
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
function a(e, r = t()) {
	return { positionClasses: n(() => e.position ? `${r}--${e.position}` : void 0) };
}
//#endregion
export { a as n, i as t };
