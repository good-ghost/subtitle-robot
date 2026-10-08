import { tr as e } from "./vuetify-C39-WP9g.js";
//#region src/runtime/notifyStore.ts
var t = e({
	id: 0,
	show: !1,
	text: "",
	color: "success",
	timeout: 3e3
}), n = e([]), r = 0;
function i() {
	r += 1;
	let e = r;
	return n.push(e), {
		id: e,
		unregister: () => {
			let t = n.indexOf(e);
			t >= 0 && n.splice(t, 1);
		},
		isActive: () => n[n.length - 1] === e
	};
}
//#endregion
export { t as n, i as r, n as t };
