//#region src/runtime/status.ts
function e(e) {
	return typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? String(e) : "-";
}
function t(t, n, r = {}, i = {}) {
	let a = e(t), o = n?.[a] ?? i;
	return {
		color: r.color || o.color || "grey",
		icon: r.icon || o.icon || "",
		label: r.label || o.label || a
	};
}
function n(e) {
	if (e && !/^grey(-lighten-\d)?$/.test(e)) return e;
}
function r(t) {
	return Array.isArray(t) ? t.map((t) => e(t)).filter((e) => e !== "" && e !== "-") : [];
}
//#endregion
export { e as i, n, t as r, r as t };
