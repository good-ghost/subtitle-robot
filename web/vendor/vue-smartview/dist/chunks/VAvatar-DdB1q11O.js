import { A as e, Dt as t, Fn as n, G as r, Ht as i, Jn as a, Mn as o, Nn as s, O as c, Pn as l, Q as u, T as d, Tn as f, Vt as p, Zn as m, c as h, cr as g, fn as _, gr as v, l as y, m as b, mn as ee, mr as x, or as S, rr as te, u as C, v as w, vn as T, xt as E, yn as D } from "./vuetify-C39-WP9g.js";
import { a as O, i as k, n as A, r as j, t as M } from "./rounded-1DPtyqNn.js";
import { a as N, c as P, i as F, l as I, n as L, r as R, s as z } from "./define-BovISfN4.js";
import { a as B, i as V, n as H, r as U, t as W } from "./density-9WZgplEH.js";
import { n as G, t as K } from "./transition-Cv515_M1.js";
import { t as q } from "./intersect-BDACueiR.js";
import { c as J, d as Y, l as X, s as Z, u as Q } from "./router-C0qlu-KG.js";
//#region node_modules/vuetify/lib/components/VBadge/VBadge.js
var ne = e({
	bordered: Boolean,
	color: String,
	content: [Number, String],
	dot: Boolean,
	dotSize: [Number, String],
	floating: Boolean,
	icon: w,
	inline: Boolean,
	label: {
		type: String,
		default: "$vuetify.badge"
	},
	max: [Number, String],
	modelValue: {
		type: Boolean,
		default: !0
	},
	offsetX: [Number, String],
	offsetY: [Number, String],
	textColor: String,
	...I(),
	...j({ location: "top end" }),
	...M(),
	...L(),
	...h(),
	...G({ transition: "scale-rotate-transition" }),
	...U()
}, "VBadge"), re = d()({
	name: "VBadge",
	inheritAttrs: !1,
	props: ne(),
	setup(e, t) {
		let { backgroundColorClasses: n, backgroundColorStyles: i } = N(() => e.color), { roundedClasses: a, roundedStyles: s } = A(e), { t: c } = b(), { textColorClasses: l, textColorStyles: u } = z(() => e.textColor), { themeClasses: d } = C(), { locationStyles: p } = k(e, !0, (t) => (e.floating ? e.dot ? 2 : 4 : e.dot ? Number(e.dotSize ?? 8) : 12) + (["top", "bottom"].includes(t) ? Number(e.offsetY ?? 0) : ["left", "right"].includes(t) ? Number(e.offsetX ?? 0) : 0)), { dimensionStyles: h } = V(e);
		return P(() => {
			let g = Number(e.content), v = !e.max || isNaN(g) ? e.content : g <= Number(e.max) ? g : `${e.max}+`, [y, b] = E(t.attrs, [
				"aria-atomic",
				"aria-label",
				"aria-live",
				"role",
				"title"
			]);
			return f(e.tag, o({ class: [
				"v-badge",
				{
					"v-badge--bordered": e.bordered,
					"v-badge--dot": e.dot,
					"v-badge--floating": e.floating,
					"v-badge--inline": e.inline
				},
				e.class
			] }, b, { style: e.style }), { default: () => [D("div", { class: "v-badge__wrapper" }, [t.slots.default?.(), f(K, { transition: e.transition }, { default: () => [m(D("span", o({
				class: [
					"v-badge__badge",
					d.value,
					n.value,
					a.value,
					l.value
				],
				style: [
					i.value,
					u.value,
					h.value,
					e.inline ? {} : p.value,
					e.dot && e.dotSize ? {
						width: r(e.dotSize),
						height: r(e.dotSize)
					} : {},
					s.value
				],
				"aria-atomic": "true",
				"aria-label": c(e.label, g),
				"aria-live": "polite",
				role: "status"
			}, y), [e.dot ? void 0 : t.slots.badge ? t.slots.badge?.() : e.icon ? f(B, { icon: e.icon }, null) : v]), [[_, e.modelValue]])] })])] });
		}), {};
	}
});
//#endregion
//#region node_modules/vuetify/lib/components/VResponsive/VResponsive.js
function ie(e) {
	return { aspectStyles: T(() => {
		let t = Number(e.aspectRatio);
		return t ? { paddingBottom: String(1 / t * 100) + "%" } : void 0;
	}) };
}
var $ = e({
	aspectRatio: [String, Number],
	contentClass: null,
	inline: Boolean,
	...I(),
	...U()
}, "VResponsive"), ae = d()({
	name: "VResponsive",
	props: $(),
	setup(e, { slots: t }) {
		let { aspectStyles: n } = ie(e), { dimensionStyles: r } = V(e);
		return P(() => D("div", {
			class: x([
				"v-responsive",
				{ "v-responsive--inline": e.inline },
				e.class
			]),
			style: v([r.value, e.style])
		}, [
			D("div", {
				class: "v-responsive__sizer",
				style: v(n.value)
			}, null),
			t.additional?.(),
			t.default && D("div", { class: x(["v-responsive__content", e.contentClass]) }, [t.default()])
		])), {};
	}
}), oe = e({
	absolute: Boolean,
	alt: String,
	cover: Boolean,
	color: String,
	draggable: {
		type: [Boolean, String],
		default: void 0
	},
	eager: Boolean,
	gradient: String,
	imageClass: null,
	lazySrc: String,
	options: {
		type: Object,
		default: () => ({
			root: void 0,
			rootMargin: void 0,
			threshold: void 0
		})
	},
	sizes: String,
	src: {
		type: [String, Object],
		default: ""
	},
	crossorigin: String,
	referrerpolicy: String,
	srcset: String,
	position: String,
	...$(),
	...I(),
	...M(),
	...G()
}, "VImg"), se = d()({
	name: "VImg",
	directives: { vIntersect: q },
	inheritAttrs: !1,
	props: oe(),
	emits: {
		loadstart: (e) => !0,
		load: (e) => !0,
		error: (e) => !0
	},
	setup(e, { attrs: i, emit: d, slots: h }) {
		let { backgroundColorClasses: v, backgroundColorStyles: y } = N(() => e.color), { roundedClasses: b, roundedStyles: C } = A(e), w = c("VImg"), E = S(""), O = te(), k = S(e.eager ? "loading" : "idle"), j = S(), M = S(), F = !1, I = T(() => p(e.src) ? {
			src: e.src.src,
			srcset: e.srcset || e.src.srcset,
			lazySrc: e.lazySrc || e.src.lazySrc,
			aspect: Number(e.aspectRatio || e.src.aspect || 0)
		} : {
			src: e.src,
			srcset: e.srcset,
			lazySrc: e.lazySrc,
			aspect: Number(e.aspectRatio || 0)
		}), L = T(() => I.value.aspect || j.value / M.value || 0);
		a(() => e.src, () => {
			R(k.value !== "idle");
		}), a(L, (e, t) => {
			!e && t && O.value && U(O.value);
		}), a(O, (e) => {
			e && k.value !== "idle" && (L.value || U(e), V(e), F && (F = !1, d("load", e.currentSrc || I.value.src)));
		}), l(() => R());
		function R(n) {
			if (!(e.eager && n) && (!t || n || e.eager)) {
				if (k.value = "loading", I.value.lazySrc) {
					let e = new Image();
					e.src = I.value.lazySrc, U(e, null);
				}
				I.value.src && s(() => {
					d("loadstart", O.value?.currentSrc || I.value.src), setTimeout(() => {
						if (!w.isUnmounted) {
							if (O.value?.complete) {
								if (O.value.naturalWidth || B(), k.value === "error") return;
								L.value || U(O.value, null), k.value === "loading" && z();
							} else O.value && (L.value || U(O.value), V(O.value));
						}
					});
				});
			}
		}
		function z() {
			w.isUnmounted || (O.value ? (V(O.value), U(O.value), d("load", O.value.currentSrc || I.value.src)) : F = !0, k.value = "loaded");
		}
		function B() {
			w.isUnmounted || (k.value = "error", d("error", O.value?.currentSrc || I.value.src));
		}
		function V(e) {
			E.value = e.currentSrc || e.src;
		}
		let H = -1;
		n(() => {
			clearTimeout(H);
		});
		function U(e, t = 100) {
			let n = () => {
				if (clearTimeout(H), w.isUnmounted) return;
				let { naturalHeight: r, naturalWidth: i } = e;
				r || i ? (j.value = i, M.value = r) : !e.complete && k.value === "loading" && t != null ? H = window.setTimeout(n, t) : (e.currentSrc.endsWith(".svg") || e.currentSrc.startsWith("data:image/svg+xml")) && (j.value = 1, M.value = 1);
			};
			n();
		}
		let W = g(() => ({
			"v-img__img--cover": e.cover,
			"v-img__img--contain": !e.cover
		})), G = () => {
			if (!I.value.src || k.value === "idle") return null;
			let t = D("img", {
				class: x([
					"v-img__img",
					W.value,
					e.imageClass
				]),
				style: { objectPosition: e.position },
				crossorigin: e.crossorigin,
				src: I.value.src,
				srcset: I.value.srcset,
				alt: e.alt,
				referrerpolicy: e.referrerpolicy,
				draggable: e.draggable,
				sizes: e.sizes,
				ref: O,
				onLoad: z,
				onError: B
			}, null), n = h.sources?.();
			return f(K, {
				transition: e.transition,
				appear: !0
			}, { default: () => [m(n ? D("picture", { class: "v-img__picture" }, [n, t]) : t, [[_, k.value === "loaded"]])] });
		}, J = () => f(K, { transition: e.transition }, { default: () => [I.value.lazySrc && k.value !== "loaded" && D("img", {
			class: x([
				"v-img__img",
				"v-img__img--preload",
				W.value
			]),
			style: { objectPosition: e.position },
			crossorigin: e.crossorigin,
			src: I.value.lazySrc,
			alt: e.alt,
			referrerpolicy: e.referrerpolicy,
			draggable: e.draggable
		}, null)] }), Y = () => h.placeholder ? f(K, {
			transition: e.transition,
			appear: !0
		}, { default: () => [(k.value === "loading" || k.value === "error" && !h.error) && D("div", { class: "v-img__placeholder" }, [h.placeholder()])] }) : null, X = () => h.error ? f(K, {
			transition: e.transition,
			appear: !0
		}, { default: () => [k.value === "error" && D("div", { class: "v-img__error" }, [h.error()])] }) : null, Z = () => e.gradient ? D("div", {
			class: "v-img__gradient",
			style: { backgroundImage: `linear-gradient(${e.gradient})` }
		}, null) : null, Q = S(!1);
		{
			let e = a(L, (t) => {
				t && (requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						Q.value = !0;
					});
				}), e());
			});
		}
		return P(() => {
			let t = ae.filterProps(e), [n, a] = u(i);
			return m(f(ae, o({
				class: [
					"v-img",
					{
						"v-img--absolute": e.absolute,
						"v-img--booting": !Q.value,
						"v-img--fit-content": e.width === "fit-content"
					},
					v.value,
					b.value,
					e.class
				],
				style: [
					{ width: r(e.width === "auto" ? j.value : e.width) },
					y.value,
					C.value,
					e.style
				]
			}, t, n, {
				aspectRatio: L.value,
				"aria-label": e.alt || void 0,
				role: e.alt ? "img" : void 0
			}), {
				additional: () => D(ee, null, [
					f(G, a, null),
					f(J, null, null),
					f(Z, null, null),
					f(Y, null, null),
					f(X, null, null)
				]),
				default: h.default
			}), [[
				q,
				{
					handler: R,
					options: e.options
				},
				null,
				{ once: !0 }
			]]);
		}), {
			currentSrc: E,
			image: O,
			state: k,
			naturalWidth: j,
			naturalHeight: M
		};
	}
}), ce = e({
	badge: {
		type: [Boolean, Object],
		default: !1
	},
	start: Boolean,
	end: Boolean,
	icon: w,
	image: String,
	text: String,
	...Q(),
	...I(),
	...W(),
	...M(),
	...R(),
	...L(),
	...h(),
	...J({ variant: "flat" })
}, "VAvatar"), le = d()({
	name: "VAvatar",
	props: ce(),
	setup(e, { slots: t }) {
		let { themeClasses: n } = y(e), { borderClasses: r } = Y(e), { colorClasses: a, colorStyles: o, variantClasses: s } = X(e), { densityClasses: c } = H(e), { roundedClasses: l, roundedStyles: u } = A(e), { sizeClasses: d, sizeStyles: m } = F(e), h = T(() => {
			switch (e.size) {
				case "x-small": return 8;
				case "small": return 10;
				case "large": return 14;
				case "x-large": return 16;
				default: return 12;
			}
		}), g = T(() => {
			let { floating: t } = p(e.badge) ? e.badge : {};
			return (t ? h.value / 2 : 0) - 1.5;
		}), _ = T(() => ({
			bordered: !0,
			dot: !t.badge,
			dotSize: h.value,
			offsetX: g.value,
			offsetY: g.value,
			color: i(e.badge) ? e.badge : "primary",
			...p(e.badge) ? e.badge : {}
		}));
		return P(() => {
			let i = f(e.tag, {
				class: x([
					"v-avatar",
					{
						"v-avatar--start": e.start,
						"v-avatar--end": e.end
					},
					n.value,
					r.value,
					a.value,
					c.value,
					l.value,
					d.value,
					s.value,
					e.class
				]),
				style: v([
					o.value,
					m.value,
					u.value,
					e.style
				])
			}, { default: () => [t.default ? f(O, {
				key: "content-defaults",
				defaults: {
					VImg: {
						cover: !0,
						src: e.image
					},
					VIcon: { icon: e.icon }
				}
			}, { default: () => [t.default()] }) : e.image ? f(se, {
				key: "image",
				src: e.image,
				alt: "",
				cover: !0
			}, null) : e.icon ? f(B, {
				key: "icon",
				icon: e.icon
			}, null) : e.text, Z(!1, "v-avatar")] });
			return e.badge ? f(re, _.value, {
				default: () => i,
				badge: t.badge
			}) : i;
		}), {};
	}
});
//#endregion
export { se as n, le as t };
