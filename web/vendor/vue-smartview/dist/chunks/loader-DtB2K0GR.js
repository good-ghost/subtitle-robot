import { A as e, G as t, T as n, Tn as r, Vt as i, W as a, Yn as o, _ as s, c, cr as l, g as u, gr as d, h as f, k as p, l as m, mn as h, mr as g, or as _, rr as v, sn as y, ur as b, vn as x, yn as S } from "./vuetify-C39-WP9g.js";
import { i as ee, n as te, r as C, t as w } from "./rounded-1DPtyqNn.js";
import { a as T, c as E, l as D, n as O, s as ne } from "./define-BovISfN4.js";
import { t as re } from "./resizeObserver-4FxWWYaw.js";
import { n as k, r as A, t as j } from "./reveal-61xKjn-t.js";
//#region node_modules/vuetify/lib/components/VProgressLinear/chunks.js
var M = e({
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
function N(e, n, r, i, o) {
	let s = l(() => e.variant === "split"), c = l(() => s.value ? 2 : Number(e.chunkCount) || 0), u = l(() => !s.value && (!!c.value || !!e.chunkWidth)), d = x(() => {
		let t = b(n);
		return t ? c.value ? (t - Number(e.chunkGap) * (c.value - 1)) / c.value : Number(e.chunkWidth) : 0;
	}), f = l(() => Number(e.chunkGap)), p = x(() => {
		if (!u.value) return {};
		let e = t(f.value), n = t(d.value);
		return {
			maskRepeat: "repeat-x",
			maskImage: `linear-gradient(90deg, #000, #000 ${n}, transparent ${n}, transparent)`,
			maskSize: `calc(${n} + ${e}) 100%`
		};
	}), m = x(() => {
		if (!s.value) return;
		let e = t(f.value / 2), n = b(o) ? "right" : "left", a = b(r);
		if (a <= 0 || a >= 100) return;
		let c = b(i), l = t(a, "%"), u = c > a && c < 100, d = t(c, "%");
		return {
			bar: { width: `calc(${l} - ${e})` },
			buffer: u ? {
				[n]: `calc(${l} + ${e})`,
				width: `calc(${d} - ${l} - ${t(f.value)})`
			} : void 0,
			background: {
				[n]: `calc(${u ? d : l} + ${e})`,
				width: `calc(100% - ${u ? d : l} - ${e})`
			}
		};
	});
	function h(e) {
		if (s.value) return e;
		let t = b(n);
		if (!t) return e;
		let r = 100 * f.value / t, i = 100 * (d.value + f.value) / t, o = Math.floor((e + r) / i + 1e-9);
		return a(o * i - r / 2, 0, 100);
	}
	return {
		hasChunks: l(() => u.value || s.value),
		isSplit: s,
		chunkCount: c,
		chunksMaskStyles: p,
		splitStyles: m,
		snapValueToChunk: h
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
	...M(),
	...D(),
	...C({ location: "top" }),
	...j(),
	...w(),
	...O(),
	...c()
}, "VProgressLinear"), F = n()({
	name: "VProgressLinear",
	props: P(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: n }) {
		let c = v(), l = u(e, "modelValue"), { isRtl: p, rtlClasses: b } = f(), { themeClasses: C } = m(e), { locationStyles: w } = ee(e), { textColorClasses: D, textColorStyles: O } = ne(() => e.color), { backgroundColorClasses: j, backgroundColorStyles: M } = T(() => e.bgColor || e.color), { backgroundColorClasses: P, backgroundColorStyles: F } = T(() => e.bufferColor || e.bgColor || e.color), { backgroundColorClasses: I, backgroundColorStyles: L } = T(() => e.color), { roundedClasses: R, roundedStyles: z } = te(e), { intersectionRef: B, isIntersecting: V } = A(), { state: H, duration: U } = k(e), W = x(() => parseFloat(e.max)), G = x(() => t(e.height)), K = x(() => a(parseFloat(e.bufferValue) / W.value * 100, 0, 100)), q = x(() => H.value === "initial" ? 0 : a(parseFloat(l.value) / W.value * 100, 0, 100)), J = x(() => p.value !== e.reverse), ie = x(() => e.transition === !1 ? void 0 : t(i(e.transition) ? e.transition.duration : void 0, "ms")), ae = x(() => e.indeterminate ? "fade-transition" : "slide-x-transition"), Y = _(0), { hasChunks: X, splitStyles: Z, chunksMaskStyles: oe, snapValueToChunk: Q } = N(e, Y, q, K, J);
		s(X, () => {
			let { resizeRef: e } = re((e) => Y.value = e[0].contentRect.width);
			o(() => e.value = c.value);
		});
		let se = x(() => X.value ? Q(K.value) : K.value), ce = x(() => X.value ? Q(q.value) : q.value);
		function le(e) {
			if (!B.value) return;
			let { left: t, right: n, width: r } = B.value.getBoundingClientRect(), i = J.value ? r - e.clientX + (n - r) : e.clientX - t;
			l.value = Math.round(i / r * W.value);
		}
		o(() => {
			B.value = c.value;
		});
		function $() {
			return S("div", {
				class: g(["v-progress-linear__background", j.value]),
				style: d([
					M.value,
					{
						opacity: e.bgOpacity == null ? void 0 : parseFloat(e.bgOpacity),
						width: e.stream ? 0 : void 0
					},
					e.indeterminate ? {} : Z.value?.background
				])
			}, null);
		}
		return E(() => r(e.tag, {
			ref: c,
			class: g([
				"v-progress-linear",
				{
					"v-progress-linear--absolute": e.absolute,
					"v-progress-linear--active": e.active && V.value,
					"v-progress-linear--reverse": J.value,
					"v-progress-linear--rounded": e.rounded,
					"v-progress-linear--rounded-bar": e.roundedBar,
					"v-progress-linear--striped": e.striped,
					"v-progress-linear--clickable": e.clickable,
					"v-progress-linear--no-transition": e.transition === !1,
					"v-progress-linear--revealing": ["initial", "pending"].includes(H.value),
					"v-progress-linear--variant-split": e.variant === "split"
				},
				R.value,
				C.value,
				b.value,
				e.class
			]),
			style: d([
				{
					bottom: e.location === "bottom" ? 0 : void 0,
					top: e.location === "top" ? 0 : void 0,
					height: e.active ? G.value : 0,
					"--v-progress-linear-height": G.value,
					"--v-progress-linear-transition-duration": ie.value,
					"--v-progress-reveal-duration": `${U.value}ms`,
					"--v-progress-chunk-gap": t(e.chunkGap),
					...e.absolute ? w.value : {}
				},
				oe.value,
				z.value,
				e.style
			]),
			role: "progressbar",
			"aria-hidden": e.active ? "false" : "true",
			"aria-valuemin": "0",
			"aria-valuemax": e.max,
			"aria-valuenow": e.indeterminate ? void 0 : Math.min(parseFloat(l.value), W.value),
			onClick: e.clickable && le
		}, { default: () => [
			e.stream && S("div", {
				key: "stream",
				class: g(["v-progress-linear__stream", D.value]),
				style: {
					...O.value,
					[J.value ? "left" : "right"]: `calc(${G.value} * -1)`,
					borderTop: `calc(${G.value} / 2) dotted`,
					opacity: e.bufferOpacity == null ? void 0 : parseFloat(e.bufferOpacity),
					top: `calc(50% - ${G.value} / 4)`,
					width: t(100 - K.value, "%"),
					"--v-progress-linear-stream-to": `calc(${G.value} * ${J.value ? 1 : -1})`
				}
			}, null),
			(e.variant !== "split" || !e.indeterminate) && $(),
			S("div", {
				class: g(["v-progress-linear__buffer", P.value]),
				style: d([
					F.value,
					{
						opacity: e.bufferOpacity == null ? void 0 : parseFloat(e.bufferOpacity),
						width: t(se.value, "%")
					},
					Z.value?.buffer
				])
			}, null),
			r(y, { name: ae.value }, { default: () => [e.indeterminate ? S("div", { class: "v-progress-linear__indeterminate" }, [e.variant === "split" && S(h, null, [
				$(),
				$(),
				$()
			]), ["long", "short"].map((e) => S("div", {
				key: e,
				class: g([
					"v-progress-linear__indeterminate",
					e,
					I.value
				]),
				style: d(L.value)
			}, null))]) : S("div", {
				class: g(["v-progress-linear__determinate", I.value]),
				style: d([
					L.value,
					{ width: t(ce.value, "%") },
					Z.value?.bar
				])
			}, null)] }),
			n.default && S("div", { class: "v-progress-linear__content" }, [n.default({
				value: q.value,
				buffer: K.value
			})])
		] })), {};
	}
}), I = e({ loading: [Boolean, String] }, "loader");
function L(e, t = p()) {
	return { loaderClasses: l(() => ({ [`${t}--loading`]: e.loading })) };
}
function R(e, { slots: t }) {
	return S("div", { class: g(`${e.name}__loader`) }, [t.default?.({
		color: e.color,
		isActive: e.active
	}) || r(F, {
		absolute: e.absolute,
		active: e.active,
		color: e.color,
		height: "2",
		indeterminate: !0
	}, null)]);
}
//#endregion
export { F as i, I as n, L as r, R as t };
