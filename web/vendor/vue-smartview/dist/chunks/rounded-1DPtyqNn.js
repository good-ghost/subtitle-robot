import { $n as e, A as t, D as n, G as r, Ht as i, T as a, ct as o, h as s, k as c, lr as l, vn as u } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/util/anchor.js
var d = ["top", "bottom"], f = [
	"start",
	"end",
	"left",
	"right"
];
function p(e, t) {
	let [n, r] = e.split(" ");
	return r ||= o(d, n) ? "start" : o(f, n) ? "top" : "center", {
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
	return o(d, e.side) ? "y" : "x";
}
//#endregion
//#region node_modules/vuetify/lib/components/VDefaultsProvider/VDefaultsProvider.js
var y = t({
	defaults: Object,
	disabled: Boolean,
	reset: [Number, String],
	root: [Boolean, String],
	scoped: Boolean
}, "VDefaultsProvider"), b = a(!1)({
	name: "VDefaultsProvider",
	props: y(),
	setup(e, { slots: t }) {
		let { defaults: r, disabled: i, reset: a, root: o, scoped: s } = l(e);
		return n(r, {
			reset: a,
			root: o,
			scoped: s,
			disabled: i
		}), () => t.default?.();
	}
}), x = {
	center: "center",
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left"
}, S = t({ location: String }, "location");
function C(e, t = !1, n) {
	let { isRtl: r } = s();
	return { locationStyles: u(() => {
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
var O = t({
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
function k(t, n = c()) {
	return {
		roundedClasses: u(() => {
			let r = e(t) ? t.value : t.rounded, a = !e(t) && t.tile, o = [];
			if (a || r === !1 || String(r) === "0") o.push("rounded-0");
			else if (r === !0 || r === "") o.push(`${n}--rounded`);
			else if (i(r) && !D(r)) for (let e of T(r)) o.push(`rounded-${e}`);
			return o;
		}),
		roundedStyles: u(() => {
			let n = e(t) ? t.value : t.rounded;
			return (!D(n) || String(n) === "0") && (typeof n != "number" || n === 0) ? {} : { borderRadius: r(n) };
		})
	};
}
//#endregion
export { b as a, h as c, C as i, v as l, k as n, g as o, S as r, _ as s, O as t, p as u };
