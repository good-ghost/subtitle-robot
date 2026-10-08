import { A as e, Jn as t, Mn as n, Nn as r, T as i, Tn as a, _t as o, er as s, g as c, rr as l, rt as u, un as d, vt as f } from "./vuetify-C39-WP9g.js";
import { a as p } from "./rounded-1DPtyqNn.js";
import { a as m, i as h, n as g, t as _ } from "./VOverlay-DFwN_aF6.js";
import { c as v } from "./define-BovISfN4.js";
import { t as y } from "./scopeId-3i3jaqkB.js";
import { t as b } from "./dialog-transition-eRX-4flf.js";
import { t as x } from "./forwardRefs-mn8VYMvs.js";
//#region node_modules/vuetify/lib/components/VDialog/VDialog.js
var S = e({
	fullscreen: Boolean,
	scrollable: Boolean,
	...f(g({
		captureFocus: !0,
		location: "center center",
		origin: "center center",
		scrollStrategy: "block",
		transition: { component: b },
		zIndex: 2400,
		retainFocus: !0
	}), ["disableInitialFocus"])
}, "VDialog"), C = i()({
	name: "VDialog",
	props: S(),
	emits: {
		"update:modelValue": (e) => !0,
		afterEnter: () => !0,
		afterLeave: () => !0
	},
	setup(e, { emit: i, slots: s }) {
		let d = c(e, "modelValue"), { scopeId: f } = y(), m = l();
		function h() {
			i("afterEnter"), (e.scrim || e.retainFocus) && m.value?.contentEl && !m.value.contentEl.contains(u()) && m.value.contentEl.focus({ preventScroll: !0 });
		}
		function g() {
			i("afterLeave");
		}
		return t(d, async (e) => {
			e || (await r(), m.value?.activatorEl?.focus({ preventScroll: !0 }));
		}), v(() => {
			let t = _.filterProps(e), r = n({ "aria-haspopup": "dialog" }, e.activatorProps), i = n({ tabindex: -1 }, e.contentProps), c = e.fullscreen ? o : e.locationStrategy;
			return a(_, n({
				ref: m,
				class: [
					"v-dialog",
					{
						"v-dialog--fullscreen": e.fullscreen,
						"v-dialog--scrollable": e.scrollable
					},
					e.class
				],
				style: e.style
			}, t, {
				modelValue: d.value,
				"onUpdate:modelValue": (e) => d.value = e,
				"aria-modal": "true",
				activatorProps: r,
				contentProps: i,
				height: e.fullscreen ? void 0 : e.height,
				width: e.fullscreen ? void 0 : e.width,
				maxHeight: e.fullscreen ? void 0 : e.maxHeight,
				maxWidth: e.fullscreen ? void 0 : e.maxWidth,
				locationStrategy: c,
				role: "dialog",
				onAfterEnter: h,
				onAfterLeave: g
			}, f), {
				activator: s.activator,
				default: (...e) => a(p, { root: "VDialog" }, { default: () => [s.default?.(...e)] })
			});
		}), x({}, m);
	}
}), w = [
	"button",
	"[href]",
	"input:not([type=\"hidden\"])",
	"select",
	"textarea",
	"details > summary",
	"[tabindex]",
	"[contenteditable]:not([contenteditable=\"false\"])",
	"audio[controls]",
	"video[controls]"
].join(", ");
function T(e) {
	return !(e instanceof HTMLElement) || !e.matches(w) || e.tabIndex < 0 || e.matches(":disabled") || e.closest("[inert]") || e.closest("details:not([open])") && (e.tagName !== "SUMMARY" || e.parentElement?.tagName !== "DETAILS") ? !1 : e.getClientRects().length > 0;
}
function E(e) {
	if (e instanceof HTMLSlotElement) {
		let t = e.assignedElements({ flatten: !0 });
		return t.length ? t : [...e.children];
	}
	return e.shadowRoot ? [...e.shadowRoot.children] : [...e.children];
}
function D(e) {
	let t = [], n = (e) => {
		for (let r of E(e)) T(r) && t.push(r), n(r);
	};
	return n(e), t;
}
var O = 0;
function k() {
	return O += 1, `smartview-dialog-${O}`;
}
function A() {
	let e = document.activeElement;
	for (; e?.shadowRoot?.activeElement;) e = e.shadowRoot.activeElement;
	return e;
}
function j(e, n, r = {}) {
	let i = null;
	function a(e) {
		if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = n();
		if (!t) return;
		let i = D(t);
		if (!i.length) return;
		let a = A(), o = i.findIndex((e) => e === a), s = e.shiftKey ? -1 : 1, c = o < 0 ? s > 0 ? 0 : i.length - 1 : (o + s + i.length) % i.length;
		e.preventDefault(), r.stopPropagation && e.stopPropagation(), i[c]?.focus();
	}
	function o() {
		i = A(), document.addEventListener("keydown", a, !0);
	}
	function c() {
		document.removeEventListener("keydown", a, !0);
		let e = i;
		i = null;
		let t = A(), r = n(), o = !!t && !!r && (r.contains(t) || D(r).some((e) => e === t)), s = !t || t === document.body || !t.isConnected;
		(o || s) && e instanceof HTMLElement && e.isConnected && e.focus({ preventScroll: !0 });
	}
	t(e, (e, t) => {
		e && !t ? o() : !e && t && c();
	}, { immediate: !0 }), s(() => document.removeEventListener("keydown", a, !0));
}
//#endregion
//#region src/runtime/scrollLock.ts
var M = 0, N = null;
function P() {
	if (M += 1, M > 1) return;
	let e = document.documentElement, t = window.innerWidth - e.clientWidth;
	N = {
		overflow: e.style.overflow,
		paddingRight: e.style.paddingRight
	}, e.style.overflow = "hidden", t > 0 && (e.style.paddingRight = `${t}px`);
}
function F() {
	if (M === 0 || (--M, M > 0 || !N)) return;
	let e = document.documentElement;
	e.style.overflow = N.overflow, e.style.paddingRight = N.paddingRight, N = null;
}
function I(e) {
	let n = !1, r = (e) => {
		e && !n ? (P(), n = !0) : !e && n && (F(), n = !1);
	};
	t(e, r, { immediate: !0 }), s(() => r(!1));
}
//#endregion
//#region src/runtime/slotBridge.ts
var L = "smartview-slot-anchor", R = "smartview-slot", z = 0;
function B(e, t) {
	return [...e.childNodes].filter((e) => e instanceof Element ? (e.getAttribute("slot") || "default") === t : e instanceof Text && t === "default" && (e.textContent ?? "").trim() !== "");
}
function V(e, t = "default") {
	z += 1;
	let n = `smartview-slot-${z}-${t}`, r = [], i = !1;
	return {
		get slotName() {
			return i ? n : t;
		},
		get mounted() {
			return i;
		},
		get movedCount() {
			return r.length;
		},
		mount(a) {
			i ||= (r = B(e, t).map((e) => {
				let t = document.createComment(L);
				if (e.before(t), e instanceof Element) {
					let r = e.getAttribute("slot");
					return e.setAttribute("slot", n), a.append(e), {
						anchor: t,
						node: e,
						projected: e,
						originalSlot: r
					};
				}
				let r = document.createElement(R);
				return r.setAttribute("slot", n), r.style.display = "contents", r.append(e), a.append(r), {
					anchor: t,
					node: e,
					projected: r,
					originalSlot: null
				};
			}), !0);
		},
		restore() {
			if (i) {
				for (let { anchor: t, node: n, projected: i, originalSlot: a } of r) n instanceof Element && (a === null ? n.removeAttribute("slot") : n.setAttribute("slot", a)), t.parentNode ? t.replaceWith(n) : e.append(n), i !== n && i.remove();
				r = [], i = !1;
			}
		}
	};
}
//#endregion
//#region src/runtime/dialog.ts
function H(e) {
	let { attachTarget: n } = h(e.overlayTarget);
	I(e.open);
	let r = d(), i = r ? V(r) : null, a = l("default"), o = k();
	function c() {
		return (e.overlayTarget() === "body" ? m() : r?.shadowRoot)?.querySelector(`[data-dialog-id="${o}"]`) ?? null;
	}
	j(e.open, c), t(() => e.open() && e.overlayTarget() === "body", (t) => {
		i && (t ? i.mount(m().host) : e.overlayTarget() !== "body" && i.restore(), a.value = i.slotName);
	}, { immediate: !0 });
	function u() {
		i && !e.open() && (i.restore(), a.value = i.slotName);
	}
	return s(() => i?.restore()), {
		attachTarget: n,
		contentSlotName: a,
		dialogId: o,
		onAfterLeave: u
	};
}
//#endregion
export { C as n, H as t };
