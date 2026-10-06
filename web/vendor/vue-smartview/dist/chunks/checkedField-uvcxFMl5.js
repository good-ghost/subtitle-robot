import { en as e, fn as t } from "./vuetify-DJ4bsPds.js";
import { t as n } from "./hostValue-Q4jXLLiG.js";
import { n as r } from "./formField-B1NnTyqU.js";
//#region src/runtime/checkedField.ts
var i = "on";
function a(a, o, s) {
	let { t: c } = e(), { current: l, commit: u, reset: d } = n("checked", () => a.checked === !0), { formDisabled: f, touched: p } = r({
		value: () => l.value ? a.value || i : null,
		isEmpty: () => !l.value,
		required: () => a.required === !0,
		requiredMessage: () => c("smartview.required"),
		anchor: o,
		reset: d
	}), m = t(() => a.errorMessage ? a.errorMessage : p.value && a.required && !l.value ? c("smartview.required") : "");
	function h(e) {
		u(e), p.value = !0, s("input", e), s("change", e);
	}
	return {
		current: l,
		formDisabled: f,
		shownError: m,
		change: h
	};
}
//#endregion
export { a as t };
