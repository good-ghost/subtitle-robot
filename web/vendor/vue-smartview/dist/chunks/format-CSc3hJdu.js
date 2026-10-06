//#region src/runtime/format.ts
function e(e) {
	if (!e) return null;
	let t = e;
	/[zZ]|[+-]\d{2}:?\d{2}$/.test(t) || (t = t.replace(" ", "T") + "Z");
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? null : n;
}
var t = (e) => String(e).padStart(2, "0");
function n(n) {
	let r = e(n);
	return r ? `${r.getFullYear()}-${t(r.getMonth() + 1)}-${t(r.getDate())} ${t(r.getHours())}:${t(r.getMinutes())}` : "-";
}
function r(n) {
	let r = e(n);
	return r ? `${t(r.getHours())}:${t(r.getMinutes())}:${t(r.getSeconds())}` : "";
}
function i(e, t, n) {
	return typeof e != "number" || !Number.isFinite(e) ? "-" : new Intl.NumberFormat(t, n).format(e);
}
//#endregion
export { e as i, n, i as r, r as t };
