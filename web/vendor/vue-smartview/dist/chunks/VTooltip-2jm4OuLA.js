import { A as e, En as t, T as n, Zn as r, fn as i, g as a, nr as o, vt as s, yn as c, zn as l } from "./vuetify-DJ4bsPds.js";
import { n as u, t as d } from "./VOverlay-BI1rs3Fd.js";
import { c as f, o as p } from "./define-BG7hCbXs.js";
import { t as m } from "./scopeId-BKRO7vOB.js";
import { t as h } from "./forwardRefs-BcUquh0G.js";
//#region node_modules/vuetify/lib/components/VTooltip/VTooltip.js
var g = e({
	id: String,
	interactive: Boolean,
	text: String,
	color: String,
	...s(u({
		closeOnBack: !1,
		location: "end",
		locationStrategy: "connected",
		eager: !0,
		minWidth: 0,
		offset: 10,
		openOnClick: !1,
		openOnHover: !0,
		origin: "auto",
		scrim: !1,
		scrollStrategy: "reposition",
		transition: null
	}), [
		"absolute",
		"retainFocus",
		"captureFocus",
		"disableInitialFocus"
	])
}, "VTooltip"), _ = n()({
	name: "VTooltip",
	props: g(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: n }) {
		let s = a(e, "modelValue"), { scopeId: u } = m(), { colorClasses: g, colorStyles: _ } = p(() => ({ background: e.color })), v = l(), y = o(() => e.id || `v-tooltip-${v}`), b = r(), x = i(() => e.location.split(" ").length > 1 ? e.location : e.location + " center"), S = i(() => e.origin === "auto" || e.origin === "overlap" || e.origin.split(" ").length > 1 || e.location.split(" ").length > 1 ? e.origin : e.origin + " center"), C = o(() => e.transition == null ? s.value ? "scale-transition" : "fade-transition" : e.transition), w = i(() => t({ "aria-describedby": y.value }, e.activatorProps));
		return f(() => {
			let r = d.filterProps(e);
			return c(d, t({
				ref: b,
				class: [
					"v-tooltip",
					{ "v-tooltip--interactive": e.interactive },
					e.class
				],
				style: [e.style],
				id: y.value
			}, r, {
				contentClass: [g.value, e.contentClass],
				contentProps: t({ style: [_.value] }, e.contentProps),
				modelValue: s.value,
				"onUpdate:modelValue": (e) => s.value = e,
				transition: C.value,
				absolute: !0,
				location: x.value,
				origin: S.value,
				role: "tooltip",
				activatorProps: w.value,
				_disableGlobalStack: !0
			}, u), {
				activator: n.activator,
				default: (...t) => n.default?.(...t) ?? e.text
			});
		}), h({}, b);
	}
});
//#endregion
export { _ as t };
