import { A as e, Dn as t, Ht as n, Jn as r, O as i, Rn as a, Tt as o, Yn as s, cn as c, cr as l, fn as u, ir as d, k as f, nr as p, pn as m, qn as h, st as g, zt as _ } from "./vuetify-DJ4bsPds.js";
import { o as v } from "./define-BG7hCbXs.js";
import { n as y } from "./ripple-B14E6MmL.js";
//#region node_modules/vuetify/lib/composables/border.js
var b = e({ border: [
	Boolean,
	Number,
	String
] }, "border");
function x(e, t = f()) {
	return { borderClasses: u(() => {
		let r = e.border;
		return r === !0 || r === "" ? `${t}--border` : n(r) || r === 0 ? String(r).split(" ").map((e) => `border-${e}`) : [];
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/composables/variant.js
var S = [
	"elevated",
	"flat",
	"tonal",
	"outlined",
	"text",
	"plain"
];
function C(e, t) {
	return m(c, null, [e && m("span", {
		key: "overlay",
		class: l(`${t}__overlay`)
	}, null), m("span", {
		key: "underlay",
		class: l(`${t}__underlay`)
	}, null)]);
}
var w = e({
	color: String,
	variant: {
		type: String,
		default: "elevated",
		validator: (e) => S.includes(e)
	}
}, "variant");
function T(e, t = f()) {
	let n = p(() => {
		let { variant: n } = d(e);
		return `${t}--variant-${n}`;
	}), { colorClasses: r, colorStyles: i } = v(() => {
		let { variant: t, color: n } = d(e);
		return { [["elevated", "flat"].includes(t) ? "background" : "text"]: n };
	});
	return {
		colorClasses: r,
		colorStyles: i,
		variantClasses: n
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/elevation.js
var E = e({
	elevation: {
		type: [Number, String],
		validator: (e) => parseInt(e) >= 0
	},
	hoverElevation: {
		type: [Number, String],
		validator: (e) => parseInt(e) >= 0
	}
}, "elevation");
function D(e) {
	return { elevationClasses: p(() => {
		let t = h(e) ? e.value : e.elevation, n = h(e) ? null : e.hoverElevation;
		return [..._(t) ? [] : [`elevation-${parseInt(t)}`], ..._(n) ? [] : [`hover-elevation-${parseInt(n)}`]];
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/composables/router.js
function O() {
	let e = i("useRoute");
	return u(() => e?.proxy?.$route);
}
function k() {
	return i("useRouter")?.proxy?.$router;
}
function A(e, t) {
	let r = a("RouterLink"), i = p(() => !!(e.href || e.to)), o = u(() => i?.value || g(t, "click") || g(e, "click"));
	if (n(r) || !("useLink" in r)) {
		let t = p(() => e.href);
		return {
			isLink: i,
			isRouterLink: p(() => !1),
			isClickable: o,
			href: t,
			linkProps: s({ href: t }),
			route: p(() => void 0),
			navigate: p(() => void 0)
		};
	}
	let c = r.useLink({
		to: p(() => e.to || ""),
		replace: p(() => e.replace)
	}), l = u(() => e.to ? c : void 0), d = O(), f = u(() => l.value ? d.value && d.value.matched.length === 0 && d.value.name == null ? l.value.isExactActive?.value ?? !1 : e.exact ? d.value ? l.value.isExactActive?.value && y(l.value.route.value.query, d.value.query) : l.value.isExactActive?.value ?? !1 : l.value.isActive?.value ?? !1 : !1), m = u(() => e.to ? l.value?.route.value.href : e.href);
	return {
		isLink: i,
		isRouterLink: p(() => !!e.to),
		isClickable: o,
		isActive: f,
		route: p(() => l.value?.route.value),
		navigate: p(() => l.value?.navigate),
		href: m,
		linkProps: s({
			href: m,
			"aria-current": p(() => f.value ? "page" : void 0),
			"aria-disabled": p(() => e.disabled && i.value ? "true" : void 0),
			tabindex: p(() => e.disabled && i.value ? "-1" : void 0)
		})
	};
}
var j = e({
	href: String,
	replace: Boolean,
	to: [String, Object],
	exact: Boolean
}, "router"), M = !1;
function N(e, n) {
	let i = !1, a, s;
	o && e?.beforeEach && (t(() => {
		window.addEventListener("popstate", c), a = e.beforeEach(() => M ? i ? n() : void 0 : (M = !0, new Promise((e) => {
			setTimeout(() => e(i ? n() : void 0));
		}))), s = e?.afterEach(() => {
			M = !1;
		});
	}), r(() => {
		window.removeEventListener("popstate", c), a?.(), s?.();
	}));
	function c(e) {
		e.state?.replaced || (i = !0, setTimeout(() => i = !1));
	}
}
//#endregion
export { E as a, w as c, x as d, k as i, T as l, N as n, D as o, A as r, C as s, j as t, b as u };
