import { A as e, Dn as t, En as n, Hn as r, Jn as i, T as a, Zn as o, _t as s, g as c, in as l, rt as u, vt as d, yn as f } from "./vuetify-DJ4bsPds.js";
import { a as p } from "./rounded-CXkAtXly.js";
import { a as m, i as h, n as g, t as _ } from "./VOverlay-BI1rs3Fd.js";
import { c as v } from "./define-BG7hCbXs.js";
import { t as y } from "./scopeId-BKRO7vOB.js";
import { t as b } from "./dialog-transition-CImwpYBr.js";
import { t as x } from "./forwardRefs-BcUquh0G.js";
//#region node_modules/vuetify/lib/components/VDialog/VDialog.js
var S = e({
	fullscreen: Boolean,
	scrollable: Boolean,
	...d(g({
		captureFocus: !0,
		location: "center center",
		origin: "center center",
		scrollStrategy: "block",
		transition: { component: b },
		zIndex: 2400,
		retainFocus: !0
	}), ["disableInitialFocus"])
}, "VDialog"), C = a()({
	name: "VDialog",
	props: S(),
	emits: {
		"update:modelValue": (e) => !0,
		afterEnter: () => !0,
		afterLeave: () => !0
	},
	setup(e, { emit: i, slots: a }) {
		let l = c(e, "modelValue"), { scopeId: d } = y(), m = o();
		function h() {
			i("afterEnter"), (e.scrim || e.retainFocus) && m.value?.contentEl && !m.value.contentEl.contains(u()) && m.value.contentEl.focus({ preventScroll: !0 });
		}
		function g() {
			i("afterLeave");
		}
		return r(l, async (e) => {
			e || (await t(), m.value?.activatorEl?.focus({ preventScroll: !0 }));
		}), v(() => {
			let t = _.filterProps(e), r = n({ "aria-haspopup": "dialog" }, e.activatorProps), i = n({ tabindex: -1 }, e.contentProps), o = e.fullscreen ? s : e.locationStrategy;
			return f(_, n({
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
				modelValue: l.value,
				"onUpdate:modelValue": (e) => l.value = e,
				"aria-modal": "true",
				activatorProps: r,
				contentProps: i,
				height: e.fullscreen ? void 0 : e.height,
				width: e.fullscreen ? void 0 : e.width,
				maxHeight: e.fullscreen ? void 0 : e.maxHeight,
				maxWidth: e.fullscreen ? void 0 : e.maxWidth,
				locationStrategy: o,
				role: "dialog",
				onAfterEnter: h,
				onAfterLeave: g
			}, d), {
				activator: a.activator,
				default: (...e) => f(p, { root: "VDialog" }, { default: () => [a.default?.(...e)] })
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
function j(e, t) {
	let n = null;
	function a(e) {
		if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
		let n = t();
		if (!n) return;
		let r = D(n);
		if (!r.length) return;
		let i = A(), a = r.findIndex((e) => e === i), o = e.shiftKey ? -1 : 1, s = a < 0 ? o > 0 ? 0 : r.length - 1 : (a + o + r.length) % r.length;
		e.preventDefault(), r[s]?.focus();
	}
	function o() {
		n = A(), document.addEventListener("keydown", a, !0);
	}
	function s() {
		document.removeEventListener("keydown", a, !0);
		let e = n;
		n = null;
		let r = A(), i = t(), o = !!r && !!i && (i.contains(r) || D(i).some((e) => e === r)), s = !r || r === document.body || !r.isConnected;
		(o || s) && e instanceof HTMLElement && e.isConnected && e.focus({ preventScroll: !0 });
	}
	r(e, (e, t) => {
		e && !t ? o() : !e && t && s();
	}, { immediate: !0 }), i(() => document.removeEventListener("keydown", a, !0));
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
	let t = !1, n = (e) => {
		e && !t ? (P(), t = !0) : !e && t && (F(), t = !1);
	};
	r(e, n, { immediate: !0 }), i(() => n(!1));
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
	let { attachTarget: t } = h(e.overlayTarget);
	I(e.open);
	let n = l(), a = n ? V(n) : null, s = o("default"), c = k();
	function u() {
		return (e.overlayTarget() === "body" ? m() : n?.shadowRoot)?.querySelector(`[data-dialog-id="${c}"]`) ?? null;
	}
	j(e.open, u), r(() => e.open() && e.overlayTarget() === "body", (t) => {
		a && (t ? a.mount(m().host) : e.overlayTarget() !== "body" && a.restore(), s.value = a.slotName);
	}, { immediate: !0 });
	function d() {
		a && !e.open() && (a.restore(), s.value = a.slotName);
	}
	return i(() => a?.restore()), {
		attachTarget: t,
		contentSlotName: s,
		dialogId: c,
		onAfterLeave: d
	};
}
//#endregion
export { C as n, H as t };
