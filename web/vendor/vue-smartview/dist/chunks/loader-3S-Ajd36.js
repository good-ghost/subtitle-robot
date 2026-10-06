import { A as e, G as t, T as n, Un as r, Vt as i, W as a, Zn as o, _ as s, c, cn as l, cr as u, er as d, fn as f, g as p, h as m, ir as h, k as g, l as _, nr as v, pn as y, tn as b, ur as x, yn as S } from "./vuetify-DJ4bsPds.js";
import { i as ee, n as C, r as w, t as T } from "./rounded-CXkAtXly.js";
import { a as E, c as D, l as O, n as k, s as te } from "./define-BG7hCbXs.js";
import { t as ne } from "./resizeObserver-iAwW3s60.js";
import { n as A, r as j, t as M } from "./reveal-BpRkxe7j.js";
//#region node_modules/vuetify/lib/components/VProgressLinear/chunks.js
var N = e({
	chunkCount: {
		type: [Number, String],
		default: null
	},
	chunkWidth: {
		type: [Number, String],
		default: null
	},
	chunkGap: {
		type: [Number, String],
		default: 4
	},
	variant: {
		type: String,
		default: void 0,
		validator: (e) => ["split"].includes(e)
	}
}, "chunks");
function re(e, n, r, i, o) {
	let s = v(() => e.variant === "split"), c = v(() => s.value ? 2 : Number(e.chunkCount) || 0), l = v(() => !s.value && (!!c.value || !!e.chunkWidth)), u = f(() => {
		let t = h(n);
		return t ? c.value ? (t - Number(e.chunkGap) * (c.value - 1)) / c.value : Number(e.chunkWidth) : 0;
	}), d = v(() => Number(e.chunkGap)), p = f(() => {
		if (!l.value) return {};
		let e = t(d.value), n = t(u.value);
		return {
			maskRepeat: "repeat-x",
			maskImage: `linear-gradient(90deg, #000, #000 ${n}, transparent ${n}, transparent)`,
			maskSize: `calc(${n} + ${e}) 100%`
		};
	}), m = f(() => {
		if (!s.value) return;
		let e = t(d.value / 2), n = h(o) ? "right" : "left", a = h(r);
		if (a <= 0 || a >= 100) return;
		let c = h(i), l = t(a, "%"), u = c > a && c < 100, f = t(c, "%");
		return {
			bar: { width: `calc(${l} - ${e})` },
			buffer: u ? {
				[n]: `calc(${l} + ${e})`,
				width: `calc(${f} - ${l} - ${t(d.value)})`
			} : void 0,
			background: {
				[n]: `calc(${u ? f : l} + ${e})`,
				width: `calc(100% - ${u ? f : l} - ${e})`
			}
		};
	});
	function g(e) {
		if (s.value) return e;
		let t = h(n);
		if (!t) return e;
		let r = 100 * d.value / t, i = 100 * (u.value + d.value) / t, o = Math.floor((e + r) / i + 1e-9);
		return a(o * i - r / 2, 0, 100);
	}
	return {
		hasChunks: v(() => l.value || s.value),
		isSplit: s,
		chunkCount: c,
		chunksMaskStyles: p,
		splitStyles: m,
		snapValueToChunk: g
	};
}
//#endregion
//#region node_modules/vuetify/lib/components/VProgressLinear/VProgressLinear.js
var P = e({
	absolute: Boolean,
	active: {
		type: Boolean,
		default: !0
	},
	bgColor: String,
	bgOpacity: [Number, String],
	bufferValue: {
		type: [Number, String],
		default: 0
	},
	bufferColor: String,
	bufferOpacity: [Number, String],
	clickable: Boolean,
	color: String,
	height: {
		type: [Number, String],
		default: 4
	},
	indeterminate: Boolean,
	max: {
		type: [Number, String],
		default: 100
	},
	modelValue: {
		type: [Number, String],
		default: 0
	},
	opacity: [Number, String],
	reverse: Boolean,
	stream: Boolean,
	striped: Boolean,
	roundedBar: Boolean,
	transition: {
		type: [Boolean, Object],
		default: void 0
	},
	...N(),
	...O(),
	...w({ location: "top" }),
	...M(),
	...T(),
	...k(),
	...c()
}, "VProgressLinear"), F = n()({
	name: "VProgressLinear",
	props: P(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: n }) {
		let c = o(), h = p(e, "modelValue"), { isRtl: g, rtlClasses: v } = m(), { themeClasses: w } = _(e), { locationStyles: T } = ee(e), { textColorClasses: O, textColorStyles: k } = te(() => e.color), { backgroundColorClasses: M, backgroundColorStyles: N } = E(() => e.bgColor || e.color), { backgroundColorClasses: P, backgroundColorStyles: F } = E(() => e.bufferColor || e.bgColor || e.color), { backgroundColorClasses: I, backgroundColorStyles: L } = E(() => e.color), { roundedClasses: R, roundedStyles: z } = C(e), { intersectionRef: B, isIntersecting: ie } = j(), { state: V, duration: H } = A(e), U = f(() => parseFloat(e.max)), W = f(() => t(e.height)), G = f(() => a(parseFloat(e.bufferValue) / U.value * 100, 0, 100)), K = f(() => V.value === "initial" ? 0 : a(parseFloat(h.value) / U.value * 100, 0, 100)), q = f(() => g.value !== e.reverse), J = f(() => e.transition === !1 ? void 0 : t(i(e.transition) ? e.transition.duration : void 0, "ms")), ae = f(() => e.indeterminate ? "fade-transition" : "slide-x-transition"), Y = d(0), { hasChunks: X, splitStyles: Z, chunksMaskStyles: oe, snapValueToChunk: Q } = re(e, Y, K, G, q);
		s(X, () => {
			let { resizeRef: e } = ne((e) => Y.value = e[0].contentRect.width);
			r(() => e.value = c.value);
		});
		let se = f(() => X.value ? Q(G.value) : G.value), ce = f(() => X.value ? Q(K.value) : K.value);
		function le(e) {
			if (!B.value) return;
			let { left: t, right: n, width: r } = B.value.getBoundingClientRect(), i = q.value ? r - e.clientX + (n - r) : e.clientX - t;
			h.value = Math.round(i / r * U.value);
		}
		r(() => {
			B.value = c.value;
		});
		function $() {
			return y("div", {
				class: u(["v-progress-linear__background", M.value]),
				style: x([
					N.value,
					{
						opacity: e.bgOpacity == null ? void 0 : parseFloat(e.bgOpacity),
						width: e.stream ? 0 : void 0
					},
					e.indeterminate ? {} : Z.value?.background
				])
			}, null);
		}
		return D(() => S(e.tag, {
			ref: c,
			class: u([
				"v-progress-linear",
				{
					"v-progress-linear--absolute": e.absolute,
					"v-progress-linear--active": e.active && ie.value,
					"v-progress-linear--reverse": q.value,
					"v-progress-linear--rounded": e.rounded,
					"v-progress-linear--rounded-bar": e.roundedBar,
					"v-progress-linear--striped": e.striped,
					"v-progress-linear--clickable": e.clickable,
					"v-progress-linear--no-transition": e.transition === !1,
					"v-progress-linear--revealing": ["initial", "pending"].includes(V.value),
					"v-progress-linear--variant-split": e.variant === "split"
				},
				R.value,
				w.value,
				v.value,
				e.class
			]),
			style: x([
				{
					bottom: e.location === "bottom" ? 0 : void 0,
					top: e.location === "top" ? 0 : void 0,
					height: e.active ? W.value : 0,
					"--v-progress-linear-height": W.value,
					"--v-progress-linear-transition-duration": J.value,
					"--v-progress-reveal-duration": `${H.value}ms`,
					"--v-progress-chunk-gap": t(e.chunkGap),
					...e.absolute ? T.value : {}
				},
				oe.value,
				z.value,
				e.style
			]),
			role: "progressbar",
			"aria-hidden": e.active ? "false" : "true",
			"aria-valuemin": "0",
			"aria-valuemax": e.max,
			"aria-valuenow": e.indeterminate ? void 0 : Math.min(parseFloat(h.value), U.value),
			onClick: e.clickable && le
		}, { default: () => [
			e.stream && y("div", {
				key: "stream",
				class: u(["v-progress-linear__stream", O.value]),
				style: {
					...k.value,
					[q.value ? "left" : "right"]: `calc(${W.value} * -1)`,
					borderTop: `calc(${W.value} / 2) dotted`,
					opacity: e.bufferOpacity == null ? void 0 : parseFloat(e.bufferOpacity),
					top: `calc(50% - ${W.value} / 4)`,
					width: t(100 - G.value, "%"),
					"--v-progress-linear-stream-to": `calc(${W.value} * ${q.value ? 1 : -1})`
				}
			}, null),
			(e.variant !== "split" || !e.indeterminate) && $(),
			y("div", {
				class: u(["v-progress-linear__buffer", P.value]),
				style: x([
					F.value,
					{
						opacity: e.bufferOpacity == null ? void 0 : parseFloat(e.bufferOpacity),
						width: t(se.value, "%")
					},
					Z.value?.buffer
				])
			}, null),
			S(b, { name: ae.value }, { default: () => [e.indeterminate ? y("div", { class: "v-progress-linear__indeterminate" }, [e.variant === "split" && y(l, null, [
				$(),
				$(),
				$()
			]), ["long", "short"].map((e) => y("div", {
				key: e,
				class: u([
					"v-progress-linear__indeterminate",
					e,
					I.value
				]),
				style: x(L.value)
			}, null))]) : y("div", {
				class: u(["v-progress-linear__determinate", I.value]),
				style: x([
					L.value,
					{ width: t(ce.value, "%") },
					Z.value?.bar
				])
			}, null)] }),
			n.default && y("div", { class: "v-progress-linear__content" }, [n.default({
				value: K.value,
				buffer: G.value
			})])
		] })), {};
	}
}), I = e({ loading: [Boolean, String] }, "loader");
function L(e, t = g()) {
	return { loaderClasses: v(() => ({ [`${t}--loading`]: e.loading })) };
}
function R(e, { slots: t }) {
	return y("div", { class: u(`${e.name}__loader`) }, [t.default?.({
		color: e.color,
		isActive: e.active
	}) || S(F, {
		absolute: e.absolute,
		active: e.active,
		color: e.color,
		height: "2",
		indeterminate: !0
	}, null)]);
}
//#endregion
export { F as i, I as n, L as r, R as t };
