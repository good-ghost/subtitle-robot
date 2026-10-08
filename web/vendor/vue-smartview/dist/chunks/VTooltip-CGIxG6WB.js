import { A as e, Gn as t, Mn as n, T as r, Tn as i, cr as a, g as o, rr as s, vn as c, vt as l } from "./vuetify-C39-WP9g.js";
import { n as u, t as d } from "./VOverlay-DFwN_aF6.js";
import { c as f, o as p } from "./define-BovISfN4.js";
import { t as m } from "./scopeId-3i3jaqkB.js";
import { t as h } from "./forwardRefs-mn8VYMvs.js";
//#region node_modules/vuetify/lib/components/VTooltip/VTooltip.js
var g = e({
	id: String,
	interactive: Boolean,
	text: String,
	color: String,
	...l(u({
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
}, "VTooltip"), _ = r()({
	name: "VTooltip",
	props: g(),
	emits: { "update:modelValue": (e) => !0 },
	setup(e, { slots: r }) {
		let l = o(e, "modelValue"), { scopeId: u } = m(), { colorClasses: g, colorStyles: _ } = p(() => ({ background: e.color })), v = t(), y = a(() => e.id || `v-tooltip-${v}`), b = s(), x = c(() => e.location.split(" ").length > 1 ? e.location : e.location + " center"), S = c(() => e.origin === "auto" || e.origin === "overlap" || e.origin.split(" ").length > 1 || e.location.split(" ").length > 1 ? e.origin : e.origin + " center"), C = a(() => e.transition == null ? l.value ? "scale-transition" : "fade-transition" : e.transition), w = c(() => n({ "aria-describedby": y.value }, e.activatorProps));
		return f(() => {
			let t = d.filterProps(e);
			return i(d, n({
				ref: b,
				class: [
					"v-tooltip",
					{ "v-tooltip--interactive": e.interactive },
					e.class
				],
				style: [e.style],
				id: y.value
			}, t, {
				contentClass: [g.value, e.contentClass],
				contentProps: n({ style: [_.value] }, e.contentProps),
				modelValue: l.value,
				"onUpdate:modelValue": (e) => l.value = e,
				transition: C.value,
				absolute: !0,
				location: x.value,
				origin: S.value,
				role: "tooltip",
				activatorProps: w.value,
				_disableGlobalStack: !0
			}, u), {
				activator: r.activator,
				default: (...t) => r.default?.(...t) ?? e.text
			});
		}), h({}, b);
	}
});
//#endregion
export { _ as t };
