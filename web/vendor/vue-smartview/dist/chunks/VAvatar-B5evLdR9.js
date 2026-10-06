import { A as e, Dn as t, Dt as n, En as r, G as i, Gn as a, Hn as o, Ht as s, O as c, On as l, Q as u, T as d, Vt as f, Zn as p, c as m, cn as h, cr as g, er as _, fn as v, kn as ee, l as y, m as b, nr as te, on as x, pn as S, u as C, ur as w, v as T, xt as E, yn as D } from "./vuetify-DJ4bsPds.js";
import { a as O, i as k, n as A, r as j, t as M } from "./rounded-CXkAtXly.js";
import { a as N, c as P, i as F, l as I, n as L, r as R, s as z } from "./define-BG7hCbXs.js";
import { a as B, i as V, n as H, r as U, t as W } from "./density-Dh8nVFPw.js";
import { n as G, t as K } from "./transition-Dl3j6lCH.js";
import { t as q } from "./intersect-B2u7q2lh.js";
import { c as J, d as Y, l as X, s as Z, u as Q } from "./router-BNmKTwUJ.js";
//#region node_modules/vuetify/lib/components/VBadge/VBadge.js
var ne = e({
	bordered: Boolean,
	color: String,
	content: [Number, String],
	dot: Boolean,
	dotSize: [Number, String],
	floating: Boolean,
	icon: T,
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
	...m(),
	...G({ transition: "scale-rotate-transition" }),
	...U()
}, "VBadge"), re = d()({
	name: "VBadge",
	inheritAttrs: !1,
	props: ne(),
	setup(e, t) {
		let { backgroundColorClasses: n, backgroundColorStyles: o } = N(() => e.color), { roundedClasses: s, roundedStyles: c } = A(e), { t: l } = b(), { textColorClasses: u, textColorStyles: d } = z(() => e.textColor), { themeClasses: f } = C(), { locationStyles: p } = k(e, !0, (t) => (e.floating ? e.dot ? 2 : 4 : e.dot ? Number(e.dotSize ?? 8) : 12) + (["top", "bottom"].includes(t) ? Number(e.offsetY ?? 0) : ["left", "right"].includes(t) ? Number(e.offsetX ?? 0) : 0)), { dimensionStyles: m } = V(e);
		return P(() => {
			let h = Number(e.content), g = !e.max || isNaN(h) ? e.content : h <= Number(e.max) ? h : `${e.max}+`, [_, v] = E(t.attrs, [
				"aria-atomic",
				"aria-label",
				"aria-live",
				"role",
				"title"
			]);
			return D(e.tag, r({ class: [
				"v-badge",
				{
					"v-badge--bordered": e.bordered,
					"v-badge--dot": e.dot,
					"v-badge--floating": e.floating,
					"v-badge--inline": e.inline
				},
				e.class
			] }, v, { style: e.style }), { default: () => [S("div", { class: "v-badge__wrapper" }, [t.slots.default?.(), D(K, { transition: e.transition }, { default: () => [a(S("span", r({
				class: [
					"v-badge__badge",
					f.value,
					n.value,
					s.value,
					u.value
				],
				style: [
					o.value,
					d.value,
					m.value,
					e.inline ? {} : p.value,
					e.dot && e.dotSize ? {
						width: i(e.dotSize),
						height: i(e.dotSize)
					} : {},
					c.value
				],
				"aria-atomic": "true",
				"aria-label": l(e.label, h),
				"aria-live": "polite",
				role: "status"
			}, _), [e.dot ? void 0 : t.slots.badge ? t.slots.badge?.() : e.icon ? D(B, { icon: e.icon }, null) : g]), [[x, e.modelValue]])] })])] });
		}), {};
	}
});
//#endregion
//#region node_modules/vuetify/lib/components/VResponsive/VResponsive.js
function ie(e) {
	return { aspectStyles: v(() => {
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
		return P(() => S("div", {
			class: g([
				"v-responsive",
				{ "v-responsive--inline": e.inline },
				e.class
			]),
			style: w([r.value, e.style])
		}, [
			S("div", {
				class: "v-responsive__sizer",
				style: w(n.value)
			}, null),
			t.additional?.(),
			t.default && S("div", { class: g(["v-responsive__content", e.contentClass]) }, [t.default()])
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
	setup(e, { attrs: s, emit: d, slots: m }) {
		let { backgroundColorClasses: y, backgroundColorStyles: b } = N(() => e.color), { roundedClasses: C, roundedStyles: w } = A(e), T = c("VImg"), E = _(""), O = p(), k = _(e.eager ? "loading" : "idle"), j = _(), M = _(), F = !1, I = v(() => f(e.src) ? {
			src: e.src.src,
			srcset: e.srcset || e.src.srcset,
			lazySrc: e.lazySrc || e.src.lazySrc,
			aspect: Number(e.aspectRatio || e.src.aspect || 0)
		} : {
			src: e.src,
			srcset: e.srcset,
			lazySrc: e.lazySrc,
			aspect: Number(e.aspectRatio || 0)
		}), L = v(() => I.value.aspect || j.value / M.value || 0);
		o(() => e.src, () => {
			R(k.value !== "idle");
		}), o(L, (e, t) => {
			!e && t && O.value && U(O.value);
		}), o(O, (e) => {
			e && k.value !== "idle" && (L.value || U(e), V(e), F && (F = !1, d("load", e.currentSrc || I.value.src)));
		}), l(() => R());
		function R(r) {
			if (!(e.eager && r) && (!n || r || e.eager)) {
				if (k.value = "loading", I.value.lazySrc) {
					let e = new Image();
					e.src = I.value.lazySrc, U(e, null);
				}
				I.value.src && t(() => {
					d("loadstart", O.value?.currentSrc || I.value.src), setTimeout(() => {
						if (!T.isUnmounted) {
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
			T.isUnmounted || (O.value ? (V(O.value), U(O.value), d("load", O.value.currentSrc || I.value.src)) : F = !0, k.value = "loaded");
		}
		function B() {
			T.isUnmounted || (k.value = "error", d("error", O.value?.currentSrc || I.value.src));
		}
		function V(e) {
			E.value = e.currentSrc || e.src;
		}
		let H = -1;
		ee(() => {
			clearTimeout(H);
		});
		function U(e, t = 100) {
			let n = () => {
				if (clearTimeout(H), T.isUnmounted) return;
				let { naturalHeight: r, naturalWidth: i } = e;
				r || i ? (j.value = i, M.value = r) : !e.complete && k.value === "loading" && t != null ? H = window.setTimeout(n, t) : (e.currentSrc.endsWith(".svg") || e.currentSrc.startsWith("data:image/svg+xml")) && (j.value = 1, M.value = 1);
			};
			n();
		}
		let W = te(() => ({
			"v-img__img--cover": e.cover,
			"v-img__img--contain": !e.cover
		})), G = () => {
			if (!I.value.src || k.value === "idle") return null;
			let t = S("img", {
				class: g([
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
			}, null), n = m.sources?.();
			return D(K, {
				transition: e.transition,
				appear: !0
			}, { default: () => [a(n ? S("picture", { class: "v-img__picture" }, [n, t]) : t, [[x, k.value === "loaded"]])] });
		}, J = () => D(K, { transition: e.transition }, { default: () => [I.value.lazySrc && k.value !== "loaded" && S("img", {
			class: g([
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
		}, null)] }), Y = () => m.placeholder ? D(K, {
			transition: e.transition,
			appear: !0
		}, { default: () => [(k.value === "loading" || k.value === "error" && !m.error) && S("div", { class: "v-img__placeholder" }, [m.placeholder()])] }) : null, X = () => m.error ? D(K, {
			transition: e.transition,
			appear: !0
		}, { default: () => [k.value === "error" && S("div", { class: "v-img__error" }, [m.error()])] }) : null, Z = () => e.gradient ? S("div", {
			class: "v-img__gradient",
			style: { backgroundImage: `linear-gradient(${e.gradient})` }
		}, null) : null, Q = _(!1);
		{
			let e = o(L, (t) => {
				t && (requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						Q.value = !0;
					});
				}), e());
			});
		}
		return P(() => {
			let t = ae.filterProps(e), [n, o] = u(s);
			return a(D(ae, r({
				class: [
					"v-img",
					{
						"v-img--absolute": e.absolute,
						"v-img--booting": !Q.value,
						"v-img--fit-content": e.width === "fit-content"
					},
					y.value,
					C.value,
					e.class
				],
				style: [
					{ width: i(e.width === "auto" ? j.value : e.width) },
					b.value,
					w.value,
					e.style
				]
			}, t, n, {
				aspectRatio: L.value,
				"aria-label": e.alt || void 0,
				role: e.alt ? "img" : void 0
			}), {
				additional: () => S(h, null, [
					D(G, o, null),
					D(J, null, null),
					D(Z, null, null),
					D(Y, null, null),
					D(X, null, null)
				]),
				default: m.default
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
	icon: T,
	image: String,
	text: String,
	...Q(),
	...I(),
	...W(),
	...M(),
	...R(),
	...L(),
	...m(),
	...J({ variant: "flat" })
}, "VAvatar"), le = d()({
	name: "VAvatar",
	props: ce(),
	setup(e, { slots: t }) {
		let { themeClasses: n } = y(e), { borderClasses: r } = Y(e), { colorClasses: i, colorStyles: a, variantClasses: o } = X(e), { densityClasses: c } = H(e), { roundedClasses: l, roundedStyles: u } = A(e), { sizeClasses: d, sizeStyles: p } = F(e), m = v(() => {
			switch (e.size) {
				case "x-small": return 8;
				case "small": return 10;
				case "large": return 14;
				case "x-large": return 16;
				default: return 12;
			}
		}), h = v(() => {
			let { floating: t } = f(e.badge) ? e.badge : {};
			return (t ? m.value / 2 : 0) - 1.5;
		}), _ = v(() => ({
			bordered: !0,
			dot: !t.badge,
			dotSize: m.value,
			offsetX: h.value,
			offsetY: h.value,
			color: s(e.badge) ? e.badge : "primary",
			...f(e.badge) ? e.badge : {}
		}));
		return P(() => {
			let s = D(e.tag, {
				class: g([
					"v-avatar",
					{
						"v-avatar--start": e.start,
						"v-avatar--end": e.end
					},
					n.value,
					r.value,
					i.value,
					c.value,
					l.value,
					d.value,
					o.value,
					e.class
				]),
				style: w([
					a.value,
					p.value,
					u.value,
					e.style
				])
			}, { default: () => [t.default ? D(O, {
				key: "content-defaults",
				defaults: {
					VImg: {
						cover: !0,
						src: e.image
					},
					VIcon: { icon: e.icon }
				}
			}, { default: () => [t.default()] }) : e.image ? D(se, {
				key: "image",
				src: e.image,
				alt: "",
				cover: !0
			}, null) : e.icon ? D(B, {
				key: "icon",
				icon: e.icon
			}, null) : e.text, Z(!1, "v-avatar")] });
			return e.badge ? D(re, _.value, {
				default: () => s,
				badge: t.badge
			}) : s;
		}), {};
	}
});
//#endregion
export { se as n, le as t };
