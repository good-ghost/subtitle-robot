import { A as e, D as t, G as n, Ht as r, T as i, ct as a, fn as o, h as s, k as c, qn as l, rr as u } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/util/anchor.js
var d = ["top", "bottom"], f = [
	"start",
	"end",
	"left",
	"right"
];
function p(e, t) {
	let [n, r] = e.split(" ");
	return r ||= a(d, n) ? "start" : a(f, n) ? "top" : "center", {
		side: m(n, t),
		align: m(r, t)
	};
}
function m(e, t) {
	return e === "start" ? t ? "right" : "left" : e === "end" ? t ? "left" : "right" : e;
}
function h(e) {
	return {
		side: {
			center: "center",
			top: "bottom",
			bottom: "top",
			left: "right",
			right: "left"
		}[e.side],
		align: e.align
	};
}
function g(e) {
	return {
		side: e.side,
		align: {
			center: "center",
			top: "bottom",
			bottom: "top",
			left: "right",
			right: "left"
		}[e.align]
	};
}
function _(e) {
	return {
		side: e.align,
		align: e.side
	};
}
function v(e) {
	return a(d, e.side) ? "y" : "x";
}
//#endregion
//#region node_modules/vuetify/lib/components/VDefaultsProvider/VDefaultsProvider.js
var y = e({
	defaults: Object,
	disabled: Boolean,
	reset: [Number, String],
	root: [Boolean, String],
	scoped: Boolean
}, "VDefaultsProvider"), b = i(!1)({
	name: "VDefaultsProvider",
	props: y(),
	setup(e, { slots: n }) {
		let { defaults: r, disabled: i, reset: a, root: o, scoped: s } = u(e);
		return t(r, {
			reset: a,
			root: o,
			scoped: s,
			disabled: i
		}), () => n.default?.();
	}
}), x = {
	center: "center",
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left"
}, S = e({ location: String }, "location");
function C(e, t = !1, n) {
	let { isRtl: r } = s();
	return { locationStyles: o(() => {
		if (!e.location) return {};
		let { side: i, align: a } = p(e.location.split(" ").length > 1 ? e.location : `${e.location} center`, r.value);
		function o(e) {
			return n ? n(e) : 0;
		}
		let s = {};
		return i !== "center" && (t ? s[x[i]] = `calc(100% - ${o(i)}px)` : s[i] = 0), a === "center" ? (i === "center" ? s.top = s.left = "50%" : s[{
			top: "left",
			bottom: "left",
			left: "top",
			right: "top"
		}[i]] = "50%", s.transform = {
			top: "translateX(-50%)",
			bottom: "translateX(-50%)",
			left: "translateY(-50%)",
			right: "translateY(-50%)",
			center: "translate(-50%, -50%)"
		}[i]) : t ? s[x[a]] = `calc(100% - ${o(a)}px)` : s[a] = 0, s;
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/composables/rounded.js
var w = /^-?\d*\.?\d+([a-z%]{0,4})$/i;
function T(e) {
	return String(e).trim().split(/\s+/);
}
function E(e) {
	return e.toLowerCase().match(w)?.at(1)?.startsWith("x") === !1;
}
function D(e) {
	return typeof e == "string" && !!e && (e.includes("(") || T(e).every(E));
}
var O = e({
	rounded: {
		type: [
			Boolean,
			Number,
			String
		],
		default: void 0
	},
	tile: Boolean
}, "rounded");
function k(e, t = c()) {
	return {
		roundedClasses: o(() => {
			let n = l(e) ? e.value : e.rounded, i = !l(e) && e.tile, a = [];
			if (i || n === !1 || String(n) === "0") a.push("rounded-0");
			else if (n === !0 || n === "") a.push(`${t}--rounded`);
			else if (r(n) && !D(n)) for (let e of T(n)) a.push(`rounded-${e}`);
			return a;
		}),
		roundedStyles: o(() => {
			let t = l(e) ? e.value : e.rounded;
			return (!D(t) || String(t) === "0") && (typeof t != "number" || t === 0) ? {} : { borderRadius: n(t) };
		})
	};
}
//#endregion
export { b as a, h as c, C as i, v as l, k as n, g as o, S as r, _ as s, O as t, p as u };
