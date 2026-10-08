import { $n as e, A as t, Ht as n, Nn as r, O as i, Tt as a, Wn as o, cr as s, er as c, k as l, mn as u, mr as d, st as f, tr as p, ur as m, vn as h, yn as g, zt as _ } from "./vuetify-C39-WP9g.js";
import { o as v } from "./define-BovISfN4.js";
import { n as y } from "./ripple-BBz9XQtx.js";
//#region node_modules/vuetify/lib/composables/border.js
var b = t({ border: [
	Boolean,
	Number,
	String
] }, "border");
function x(e, t = l()) {
	return { borderClasses: h(() => {
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
	return g(u, null, [e && g("span", {
		key: "overlay",
		class: d(`${t}__overlay`)
	}, null), g("span", {
		key: "underlay",
		class: d(`${t}__underlay`)
	}, null)]);
}
var w = t({
	color: String,
	variant: {
		type: String,
		default: "elevated",
		validator: (e) => S.includes(e)
	}
}, "variant");
function T(e, t = l()) {
	let n = s(() => {
		let { variant: n } = m(e);
		return `${t}--variant-${n}`;
	}), { colorClasses: r, colorStyles: i } = v(() => {
		let { variant: t, color: n } = m(e);
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
var E = t({
	elevation: {
		type: [Number, String],
		validator: (e) => parseInt(e) >= 0
	},
	hoverElevation: {
		type: [Number, String],
		validator: (e) => parseInt(e) >= 0
	}
}, "elevation");
function D(t) {
	return { elevationClasses: s(() => {
		let n = e(t) ? t.value : t.elevation, r = e(t) ? null : t.hoverElevation;
		return [..._(n) ? [] : [`elevation-${parseInt(n)}`], ..._(r) ? [] : [`hover-elevation-${parseInt(r)}`]];
	}) };
}
//#endregion
//#region node_modules/vuetify/lib/composables/router.js
function O() {
	let e = i("useRoute");
	return h(() => e?.proxy?.$route);
}
function k() {
	return i("useRouter")?.proxy?.$router;
}
function A(e, t) {
	let r = o("RouterLink"), i = s(() => !!(e.href || e.to)), a = h(() => i?.value || f(t, "click") || f(e, "click"));
	if (n(r) || !("useLink" in r)) {
		let t = s(() => e.href);
		return {
			isLink: i,
			isRouterLink: s(() => !1),
			isClickable: a,
			href: t,
			linkProps: p({ href: t }),
			route: s(() => void 0),
			navigate: s(() => void 0)
		};
	}
	let c = r.useLink({
		to: s(() => e.to || ""),
		replace: s(() => e.replace)
	}), l = h(() => e.to ? c : void 0), u = O(), d = h(() => l.value ? u.value && u.value.matched.length === 0 && u.value.name == null ? l.value.isExactActive?.value ?? !1 : e.exact ? u.value ? l.value.isExactActive?.value && y(l.value.route.value.query, u.value.query) : l.value.isExactActive?.value ?? !1 : l.value.isActive?.value ?? !1 : !1), m = h(() => e.to ? l.value?.route.value.href : e.href);
	return {
		isLink: i,
		isRouterLink: s(() => !!e.to),
		isClickable: a,
		isActive: d,
		route: s(() => l.value?.route.value),
		navigate: s(() => l.value?.navigate),
		href: m,
		linkProps: p({
			href: m,
			"aria-current": s(() => d.value ? "page" : void 0),
			"aria-disabled": s(() => e.disabled && i.value ? "true" : void 0),
			tabindex: s(() => e.disabled && i.value ? "-1" : void 0)
		})
	};
}
var j = t({
	href: String,
	replace: Boolean,
	to: [String, Object],
	exact: Boolean
}, "router"), M = !1;
function N(e, t) {
	let n = !1, i, o;
	a && e?.beforeEach && (r(() => {
		window.addEventListener("popstate", s), i = e.beforeEach(() => M ? n ? t() : void 0 : (M = !0, new Promise((e) => {
			setTimeout(() => e(n ? t() : void 0));
		}))), o = e?.afterEach(() => {
			M = !1;
		});
	}), c(() => {
		window.removeEventListener("popstate", s), i?.(), o?.();
	}));
	function s(e) {
		e.state?.replaced || (n = !0, setTimeout(() => n = !1));
	}
}
//#endregion
export { E as a, w as c, x as d, k as i, T as l, N as n, D as o, A as r, C as s, j as t, b as u };
