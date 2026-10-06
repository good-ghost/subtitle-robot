import { A as e, Hn as t, Ht as n, It as r, T as i, Tt as a, Vt as o, W as s, cr as c, d as ee, er as l, f as u, fn as d, gt as te, h as ne, nt as re, p as ie, pn as f, ur as ae, v as p, yn as m } from "./vuetify-DJ4bsPds.js";
import { c as oe, l as h, n as g } from "./define-BG7hCbXs.js";
import { t as _ } from "./resizeObserver-iAwW3s60.js";
import { a as v } from "./density-Dh8nVFPw.js";
import { r as y } from "./transitions-CbTxUG_W.js";
import { n as b, r as se } from "./group-0QbvFWt3.js";
//#region node_modules/vuetify/lib/components/VSlideGroup/helpers.js
function ce({ selectedElement: e, containerElement: t, isRtl: n, isHorizontal: r }) {
	let i = C(r, t), a = S(r, n, t), o = C(r, e), s = w(r, e), c = o * .4;
	return a > s ? s - c : a + i < s + o ? s - i + o + c : a;
}
function le({ selectedElement: e, containerElement: t, isHorizontal: n }) {
	let r = C(n, t), i = w(n, e), a = C(n, e);
	return i - r / 2 + a / 2;
}
function x(e, t) {
	return t?.[e ? "scrollWidth" : "scrollHeight"] || 0;
}
function S(e, t, n) {
	if (!n) return 0;
	let { scrollLeft: r, offsetWidth: i, scrollWidth: a } = n;
	return e ? t ? a - i + r : r : n.scrollTop;
}
function C(e, t) {
	return t?.[e ? "offsetWidth" : "offsetHeight"] || 0;
}
function w(e, t) {
	return t?.[e ? "offsetLeft" : "offsetTop"] || 0;
}
function ue(e, t) {
	return n(t) && t.endsWith("%") ? e * parseFloat(t) / 100 : parseFloat(String(t)) || e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VSlideGroup/VSlideGroup.js
var T = Symbol.for("vuetify:v-slide-group"), E = e({
	centerActive: Boolean,
	scrollDistance: {
		type: [String, Number],
		default: "100%",
		validator: (e) => /^-?\d*\.?\d+(px|%)?$/.test(String(e).trim())
	},
	scrollSnap: {
		type: String,
		validator: (e) => [
			"start",
			"center",
			"end"
		].includes(e)
	},
	scrollToActive: {
		type: Boolean,
		default: !0
	},
	contentClass: null,
	direction: {
		type: String,
		default: "horizontal"
	},
	symbol: {
		type: null,
		default: T
	},
	nextIcon: {
		type: p,
		default: "$next"
	},
	prevIcon: {
		type: p,
		default: "$prev"
	},
	showArrows: {
		type: [Boolean, String],
		validator: (e) => r(e) || [
			"always",
			"desktop",
			"mobile",
			"never"
		].includes(e)
	},
	...h(),
	...u({ mobile: null }),
	...g(),
	...b({ selectedClass: "v-slide-group-item--active" })
}, "VSlideGroup"), D = i()({
	name: "VSlideGroup",
	props: E(),
	emits: {
		"update:modelValue": (e) => !0,
		edge: (e) => !0
	},
	setup(e, { emit: r, slots: i }) {
		let { isRtl: u } = ne(), { displayClasses: p, mobile: h } = ie(e), g = se(e, e.symbol), b = l(!1), T = l(0), E = l(0), D = l(0), O = d(() => e.direction === "horizontal"), { resizeRef: k, contentRect: A } = _(), { resizeRef: j, contentRect: M } = _(), N = ee(), P = d(() => ({
			container: k.el,
			duration: 200,
			easing: "easeOutQuart"
		})), de = d(() => g.selected.value.length ? g.items.value.findIndex((e) => e.id === g.selected.value[0]) : -1), fe = d(() => g.selected.value.length ? g.items.value.findIndex((e) => e.id === g.selected.value[g.selected.value.length - 1]) : -1);
		if (a) {
			let n = -1;
			t(() => [
				g.selected.value,
				A.value,
				M.value,
				O.value
			], () => {
				cancelAnimationFrame(n), n = requestAnimationFrame(() => {
					if (A.value && M.value) {
						let e = O.value ? "width" : "height";
						E.value = A.value[e], D.value = M.value[e], b.value = E.value + 1 < D.value;
					}
					if (e.scrollToActive && de.value >= 0 && j.el) {
						let t = j.el.children[fe.value];
						I(t, e.centerActive);
					}
				});
			});
		}
		let F = l(!1);
		function I(t, n) {
			if (e.scrollSnap) return R(xe(t, n));
			let r = 0;
			r = n ? le({
				containerElement: k.el,
				isHorizontal: O.value,
				selectedElement: t
			}) : ce({
				containerElement: k.el,
				isHorizontal: O.value,
				isRtl: u.value,
				selectedElement: t
			}), R(U(r));
		}
		let L = 0;
		function R(t) {
			if (!a || !k.el) return;
			let n = C(O.value, k.el), r = x(O.value, k.el);
			if (r <= n || (t = s(t, 0, r - n), Math.abs(t - W()) <= 1)) return;
			let i = O.value ? N.horizontal(t, P.value) : N(t, P.value);
			if (e.scrollSnap) {
				let e = k.el;
				e.style.scrollSnapType = "none", L++, i.finally(() => --L || (e.style.scrollSnapType = ""));
			}
		}
		function pe(e) {
			if (F.value = !0, b.value && j.el && te(e.target, ":focus-visible") !== !1) {
				for (let t of e.composedPath()) for (let e of j.el.children) if (e === t) {
					I(e);
					return;
				}
			}
		}
		function me(e) {
			F.value = !1;
		}
		let z = !1;
		function he(e) {
			!z && !F.value && !(e.relatedTarget && j.el?.contains(e.relatedTarget)) && H(), z = !1;
		}
		function B() {
			z = !0;
		}
		function ge(e) {
			if (!j.el) return;
			function t(t) {
				e.preventDefault(), H(t);
			}
			O.value ? e.key === "ArrowRight" ? t(u.value ? "prev" : "next") : e.key === "ArrowLeft" && t(u.value ? "next" : "prev") : e.key === "ArrowDown" ? t("next") : e.key === "ArrowUp" && t("prev"), e.key === "Home" ? t("first") : e.key === "End" && t("last");
		}
		function V(e, t) {
			if (!e) return;
			let n = e;
			do
				n = n?.[t === "next" ? "nextElementSibling" : "previousElementSibling"];
			while (n?.hasAttribute("disabled"));
			return n;
		}
		function H(e) {
			if (!j.el) return;
			let t;
			if (!e) t = re(j.el)[0];
			else if (e === "next") {
				if (t = V(j.el.querySelector(":focus"), e), !t) return H("first");
			} else if (e === "prev") {
				if (t = V(j.el.querySelector(":focus"), e), !t) return H("last");
			} else e === "first" ? (t = j.el.firstElementChild, t?.hasAttribute("disabled") && (t = V(t, "next"))) : e === "last" && (t = j.el.lastElementChild, t?.hasAttribute("disabled") && (t = V(t, "prev")));
			t && t.focus({ preventScroll: !0 });
		}
		function U(e) {
			return O.value && u.value ? x(!0, k.el) - C(!0, k.el) - e : e;
		}
		function W() {
			return U(S(O.value, u.value, k.el));
		}
		function G(e) {
			let t = C(O.value, e), n = O.value && u.value ? x(!0, k.el) - e.offsetLeft - t : w(O.value, e);
			return {
				start: n,
				end: n + t
			};
		}
		function K() {
			return j.el ? Array.from(j.el.children, G) : [];
		}
		function q(t) {
			return e.scrollSnap === "end" ? t.end - E.value : e.scrollSnap === "center" ? (t.start + t.end - E.value) / 2 : t.start;
		}
		function _e() {
			return K().map(q);
		}
		function ve(e) {
			return K().find((t) => t.start < e - 1 && t.end > e + 1);
		}
		function ye(e) {
			return (t) => !e || t <= e.start + 1 && t + E.value >= e.end - 1;
		}
		function be(e) {
			return (t, n) => Math.abs(n - e) < Math.abs(t - e) ? n : t;
		}
		function xe(e, t) {
			let n = G(e), r = t ? (n.start + n.end - E.value) / 2 : W();
			return _e().filter(ye(n)).reduce(be(r), q(n));
		}
		function Se(e, t) {
			let n = t > 0, r = e + t, i = _e().filter((t) => n ? t > e + 1 : t < e - 1), a = i.filter(ye(ve(n ? r : e))), o = a.length ? a : i;
			return (n ? o.findLast((e) => e <= r) ?? o[0] : o.find((e) => e >= r) ?? o.at(-1)) ?? r;
		}
		function J(t) {
			if (!k.el || !E.value) return;
			if (o(t) && "index" in t) {
				let n = j.el?.children[t.index];
				n && I(n, e.centerActive);
				return;
			}
			let r = W(), i = n(t) ? e.scrollDistance : t.by, a = ue(E.value, i) * (t === "prev" ? -1 : 1);
			R(e.scrollSnap ? Se(r, a) : r + a);
		}
		let Y = d(() => ({
			next: g.next,
			prev: g.prev,
			select: g.select,
			isSelected: g.isSelected
		})), X = d(() => b.value || Math.abs(T.value) > 0), Z = d(() => {
			switch (e.showArrows) {
				case "never": return !1;
				case "always": return !0;
				case "desktop": return !h.value;
				case !0: return X.value;
				case "mobile": return h.value || X.value;
				default: return !h.value && X.value;
			}
		}), Q = d(() => Math.abs(T.value) > 1), $ = d(() => X.value ? D.value - E.value - Math.abs(T.value) > 1 : !1);
		function Ce() {
			let e = Q.value, t = $.value;
			T.value = W(), e && !Q.value && r("edge", "start"), t && !$.value && r("edge", "end");
		}
		return oe(() => m(e.tag, {
			class: c([
				"v-slide-group",
				{
					"v-slide-group--vertical": !O.value,
					"v-slide-group--has-affixes": Z.value,
					"v-slide-group--is-overflowing": b.value,
					"v-slide-group--snap": !!e.scrollSnap
				},
				p.value,
				e.class
			]),
			style: ae(e.style),
			tabindex: F.value || g.selected.value.length ? -1 : 0,
			onFocus: he
		}, { default: () => [
			Z.value && f("div", {
				key: "prev",
				class: c(["v-slide-group__prev", { "v-slide-group__prev--disabled": !Q.value }]),
				onMousedown: B,
				onClick: () => Q.value && J("prev")
			}, [i.prev?.(Y.value) ?? m(y, null, { default: () => [m(v, { icon: u.value ? e.nextIcon : e.prevIcon }, null)] })]),
			f("div", {
				key: "container",
				ref: k,
				class: c(["v-slide-group__container", e.contentClass]),
				style: { "--v-slide-group-snap-align": e.scrollSnap },
				onScroll: Ce
			}, [f("div", {
				ref: j,
				class: "v-slide-group__content",
				onFocusin: pe,
				onFocusout: me,
				onKeydown: ge
			}, [i.default?.(Y.value)])]),
			Z.value && f("div", {
				key: "next",
				class: c(["v-slide-group__next", { "v-slide-group__next--disabled": !$.value }]),
				onMousedown: B,
				onClick: () => $.value && J("next")
			}, [i.next?.(Y.value) ?? m(y, null, { default: () => [m(v, { icon: u.value ? e.prevIcon : e.nextIcon }, null)] })])
		] })), {
			selected: g.selected,
			slide: J,
			scrollOffset: T,
			focus: H,
			hasPrev: Q,
			hasNext: $,
			hasOverflow: b
		};
	}
});
//#endregion
export { T as n, E as r, D as t };
