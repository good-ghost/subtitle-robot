import { A as e, Ht as t, It as n, Jn as r, T as i, Tn as a, Tt as o, Vt as s, W as c, d as ee, f as l, gr as te, gt as ne, h as re, mr as u, nt as ie, or as d, p as ae, v as f, vn as p, yn as m } from "./vuetify-C39-WP9g.js";
import { c as oe, l as h, n as g } from "./define-BovISfN4.js";
import { t as _ } from "./resizeObserver-4FxWWYaw.js";
import { a as v } from "./density-9WZgplEH.js";
import { r as se } from "./transitions-DYv6opPi.js";
import { n as y, r as ce } from "./group-BD9eNBcR.js";
//#region node_modules/vuetify/lib/components/VSlideGroup/helpers.js
function le({ selectedElement: e, containerElement: t, isRtl: n, isHorizontal: r }) {
	let i = S(r, t), a = x(r, n, t), o = S(r, e), s = C(r, e), c = o * .4;
	return a > s ? s - c : a + i < s + o ? s - i + o + c : a;
}
function ue({ selectedElement: e, containerElement: t, isHorizontal: n }) {
	let r = S(n, t), i = C(n, e), a = S(n, e);
	return i - r / 2 + a / 2;
}
function b(e, t) {
	return t?.[e ? "scrollWidth" : "scrollHeight"] || 0;
}
function x(e, t, n) {
	if (!n) return 0;
	let { scrollLeft: r, offsetWidth: i, scrollWidth: a } = n;
	return e ? t ? a - i + r : r : n.scrollTop;
}
function S(e, t) {
	return t?.[e ? "offsetWidth" : "offsetHeight"] || 0;
}
function C(e, t) {
	return t?.[e ? "offsetLeft" : "offsetTop"] || 0;
}
function de(e, n) {
	return t(n) && n.endsWith("%") ? e * parseFloat(n) / 100 : parseFloat(String(n)) || e;
}
//#endregion
//#region node_modules/vuetify/lib/components/VSlideGroup/VSlideGroup.js
var w = Symbol.for("vuetify:v-slide-group"), T = e({
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
		default: w
	},
	nextIcon: {
		type: f,
		default: "$next"
	},
	prevIcon: {
		type: f,
		default: "$prev"
	},
	showArrows: {
		type: [Boolean, String],
		validator: (e) => n(e) || [
			"always",
			"desktop",
			"mobile",
			"never"
		].includes(e)
	},
	...h(),
	...l({ mobile: null }),
	...g(),
	...y({ selectedClass: "v-slide-group-item--active" })
}, "VSlideGroup"), E = i()({
	name: "VSlideGroup",
	props: T(),
	emits: {
		"update:modelValue": (e) => !0,
		edge: (e) => !0
	},
	setup(e, { emit: n, slots: i }) {
		let { isRtl: l } = re(), { displayClasses: f, mobile: h } = ae(e), g = ce(e, e.symbol), y = d(!1), w = d(0), T = d(0), E = d(0), D = p(() => e.direction === "horizontal"), { resizeRef: O, contentRect: k } = _(), { resizeRef: A, contentRect: j } = _(), M = ee(), N = p(() => ({
			container: O.el,
			duration: 200,
			easing: "easeOutQuart"
		})), fe = p(() => g.selected.value.length ? g.items.value.findIndex((e) => e.id === g.selected.value[0]) : -1), pe = p(() => g.selected.value.length ? g.items.value.findIndex((e) => e.id === g.selected.value[g.selected.value.length - 1]) : -1);
		if (o) {
			let t = -1;
			r(() => [
				g.selected.value,
				k.value,
				j.value,
				D.value
			], () => {
				cancelAnimationFrame(t), t = requestAnimationFrame(() => {
					if (k.value && j.value) {
						let e = D.value ? "width" : "height";
						T.value = k.value[e], E.value = j.value[e], y.value = T.value + 1 < E.value;
					}
					if (e.scrollToActive && fe.value >= 0 && A.el) {
						let t = A.el.children[pe.value];
						F(t, e.centerActive);
					}
				});
			});
		}
		let P = d(!1);
		function F(t, n) {
			if (e.scrollSnap) return L(xe(t, n));
			let r = 0;
			r = n ? ue({
				containerElement: O.el,
				isHorizontal: D.value,
				selectedElement: t
			}) : le({
				containerElement: O.el,
				isHorizontal: D.value,
				isRtl: l.value,
				selectedElement: t
			}), L(H(r));
		}
		let I = 0;
		function L(t) {
			if (!o || !O.el) return;
			let n = S(D.value, O.el), r = b(D.value, O.el);
			if (r <= n || (t = c(t, 0, r - n), Math.abs(t - U()) <= 1)) return;
			let i = D.value ? M.horizontal(t, N.value) : M(t, N.value);
			if (e.scrollSnap) {
				let e = O.el;
				e.style.scrollSnapType = "none", I++, i.finally(() => --I || (e.style.scrollSnapType = ""));
			}
		}
		function me(e) {
			if (P.value = !0, y.value && A.el && ne(e.target, ":focus-visible") !== !1) {
				for (let t of e.composedPath()) for (let e of A.el.children) if (e === t) {
					F(e);
					return;
				}
			}
		}
		function he(e) {
			P.value = !1;
		}
		let R = !1;
		function ge(e) {
			!R && !P.value && !(e.relatedTarget && A.el?.contains(e.relatedTarget)) && V(), R = !1;
		}
		function z() {
			R = !0;
		}
		function _e(e) {
			if (!A.el) return;
			function t(t) {
				e.preventDefault(), V(t);
			}
			D.value ? e.key === "ArrowRight" ? t(l.value ? "prev" : "next") : e.key === "ArrowLeft" && t(l.value ? "next" : "prev") : e.key === "ArrowDown" ? t("next") : e.key === "ArrowUp" && t("prev"), e.key === "Home" ? t("first") : e.key === "End" && t("last");
		}
		function B(e, t) {
			if (!e) return;
			let n = e;
			do
				n = n?.[t === "next" ? "nextElementSibling" : "previousElementSibling"];
			while (n?.hasAttribute("disabled"));
			return n;
		}
		function V(e) {
			if (!A.el) return;
			let t;
			if (!e) t = ie(A.el)[0];
			else if (e === "next") {
				if (t = B(A.el.querySelector(":focus"), e), !t) return V("first");
			} else if (e === "prev") {
				if (t = B(A.el.querySelector(":focus"), e), !t) return V("last");
			} else e === "first" ? (t = A.el.firstElementChild, t?.hasAttribute("disabled") && (t = B(t, "next"))) : e === "last" && (t = A.el.lastElementChild, t?.hasAttribute("disabled") && (t = B(t, "prev")));
			t && t.focus({ preventScroll: !0 });
		}
		function H(e) {
			return D.value && l.value ? b(!0, O.el) - S(!0, O.el) - e : e;
		}
		function U() {
			return H(x(D.value, l.value, O.el));
		}
		function W(e) {
			let t = S(D.value, e), n = D.value && l.value ? b(!0, O.el) - e.offsetLeft - t : C(D.value, e);
			return {
				start: n,
				end: n + t
			};
		}
		function G() {
			return A.el ? Array.from(A.el.children, W) : [];
		}
		function K(t) {
			return e.scrollSnap === "end" ? t.end - T.value : e.scrollSnap === "center" ? (t.start + t.end - T.value) / 2 : t.start;
		}
		function q() {
			return G().map(K);
		}
		function ve(e) {
			return G().find((t) => t.start < e - 1 && t.end > e + 1);
		}
		function ye(e) {
			return (t) => !e || t <= e.start + 1 && t + T.value >= e.end - 1;
		}
		function be(e) {
			return (t, n) => Math.abs(n - e) < Math.abs(t - e) ? n : t;
		}
		function xe(e, t) {
			let n = W(e), r = t ? (n.start + n.end - T.value) / 2 : U();
			return q().filter(ye(n)).reduce(be(r), K(n));
		}
		function Se(e, t) {
			let n = t > 0, r = e + t, i = q().filter((t) => n ? t > e + 1 : t < e - 1), a = i.filter(ye(ve(n ? r : e))), o = a.length ? a : i;
			return (n ? o.findLast((e) => e <= r) ?? o[0] : o.find((e) => e >= r) ?? o.at(-1)) ?? r;
		}
		function J(n) {
			if (!O.el || !T.value) return;
			if (s(n) && "index" in n) {
				let t = A.el?.children[n.index];
				t && F(t, e.centerActive);
				return;
			}
			let r = U(), i = t(n) ? e.scrollDistance : n.by, a = de(T.value, i) * (n === "prev" ? -1 : 1);
			L(e.scrollSnap ? Se(r, a) : r + a);
		}
		let Y = p(() => ({
			next: g.next,
			prev: g.prev,
			select: g.select,
			isSelected: g.isSelected
		})), X = p(() => y.value || Math.abs(w.value) > 0), Z = p(() => {
			switch (e.showArrows) {
				case "never": return !1;
				case "always": return !0;
				case "desktop": return !h.value;
				case !0: return X.value;
				case "mobile": return h.value || X.value;
				default: return !h.value && X.value;
			}
		}), Q = p(() => Math.abs(w.value) > 1), $ = p(() => X.value ? E.value - T.value - Math.abs(w.value) > 1 : !1);
		function Ce() {
			let e = Q.value, t = $.value;
			w.value = U(), e && !Q.value && n("edge", "start"), t && !$.value && n("edge", "end");
		}
		return oe(() => a(e.tag, {
			class: u([
				"v-slide-group",
				{
					"v-slide-group--vertical": !D.value,
					"v-slide-group--has-affixes": Z.value,
					"v-slide-group--is-overflowing": y.value,
					"v-slide-group--snap": !!e.scrollSnap
				},
				f.value,
				e.class
			]),
			style: te(e.style),
			tabindex: P.value || g.selected.value.length ? -1 : 0,
			onFocus: ge
		}, { default: () => [
			Z.value && m("div", {
				key: "prev",
				class: u(["v-slide-group__prev", { "v-slide-group__prev--disabled": !Q.value }]),
				onMousedown: z,
				onClick: () => Q.value && J("prev")
			}, [i.prev?.(Y.value) ?? a(se, null, { default: () => [a(v, { icon: l.value ? e.nextIcon : e.prevIcon }, null)] })]),
			m("div", {
				key: "container",
				ref: O,
				class: u(["v-slide-group__container", e.contentClass]),
				style: { "--v-slide-group-snap-align": e.scrollSnap },
				onScroll: Ce
			}, [m("div", {
				ref: A,
				class: "v-slide-group__content",
				onFocusin: me,
				onFocusout: he,
				onKeydown: _e
			}, [i.default?.(Y.value)])]),
			Z.value && m("div", {
				key: "next",
				class: u(["v-slide-group__next", { "v-slide-group__next--disabled": !$.value }]),
				onMousedown: z,
				onClick: () => $.value && J("next")
			}, [i.next?.(Y.value) ?? a(se, null, { default: () => [a(v, { icon: l.value ? e.prevIcon : e.nextIcon }, null)] })])
		] })), {
			selected: g.selected,
			slide: J,
			scrollOffset: w,
			focus: V,
			hasPrev: Q,
			hasNext: $,
			hasOverflow: y
		};
	}
});
//#endregion
export { w as n, T as r, E as t };
