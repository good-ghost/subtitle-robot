import { A as e, Et as t, T as n, cn as r, kn as i, sn as a } from "./vuetify-C39-WP9g.js";
//#region node_modules/vuetify/lib/components/transitions/createTransition.js
var o = e({
	disabled: Boolean,
	group: Boolean,
	hideOnLeave: Boolean,
	leaveAbsolute: Boolean,
	mode: String,
	origin: String
}, "transition");
function s(e, t, s) {
	return n()({
		name: e,
		props: o({
			mode: s,
			origin: t
		}),
		setup(t, { slots: n }) {
			let o = {
				onBeforeEnter(e) {
					t.origin && (e.style.transformOrigin = t.origin);
				},
				onLeave(e) {
					if (t.leaveAbsolute) {
						let { offsetTop: t, offsetLeft: n, offsetWidth: r, offsetHeight: i } = e;
						e._transitionInitialStyles = {
							position: e.style.position,
							top: e.style.top,
							left: e.style.left,
							width: e.style.width,
							height: e.style.height
						}, e.style.position = "absolute", e.style.top = `${t}px`, e.style.left = `${n}px`, e.style.width = `${r}px`, e.style.height = `${i}px`;
					}
					t.hideOnLeave && e.style.setProperty("display", "none", "important");
				},
				onAfterLeave(e) {
					if (t.leaveAbsolute && e?._transitionInitialStyles) {
						let { position: t, top: n, left: r, width: i, height: a } = e._transitionInitialStyles;
						delete e._transitionInitialStyles, e.style.position = t || "", e.style.top = n || "", e.style.left = r || "", e.style.width = i || "", e.style.height = a || "";
					}
				}
			};
			return () => {
				let s = t.group ? r : a;
				return i(s, {
					name: t.disabled ? "" : e,
					css: !t.disabled,
					...t.group ? void 0 : { mode: t.mode },
					...t.disabled ? {} : o
				}, n.default);
			};
		}
	});
}
function c(e, o, s = "in-out") {
	return n()({
		name: e,
		props: {
			mode: {
				type: String,
				default: s
			},
			disabled: {
				type: Boolean,
				default: t()
			},
			group: Boolean,
			hideOnLeave: Boolean
		},
		setup(t, { slots: n }) {
			let s = t.group ? r : a;
			return () => i(s, {
				name: t.disabled ? "" : e,
				css: !t.disabled,
				...t.disabled ? {} : {
					...o,
					onLeave: (e) => {
						t.hideOnLeave ? e.style.setProperty("display", "none", "important") : o.onLeave?.(e);
					}
				}
			}, n.default);
		}
	});
}
//#endregion
//#region node_modules/vuetify/lib/components/transitions/expand-transition.js
function l(e = "", t = "y") {
	return {
		onBeforeEnter(e) {
			e._parent = e.parentNode, e._initialStyle = {
				transition: e.style.transition,
				overflow: e.style.overflow,
				width: e.style.width,
				height: e.style.height
			};
		},
		onEnter(n) {
			let r = n._initialStyle;
			if (!r) return;
			n.style.setProperty("transition", "none", "important"), n.style.overflow = "hidden";
			let i = `${n.offsetWidth}px`, a = `${n.offsetHeight}px`;
			["x", "both"].includes(t) && (n.style.width = "0"), ["y", "both"].includes(t) && (n.style.height = "0"), n.offsetHeight, n.style.transition = r.transition, e && n._parent && n._parent.classList.add(e), requestAnimationFrame(() => {
				["x", "both"].includes(t) && (n.style.width = i), ["y", "both"].includes(t) && (n.style.height = a);
			});
		},
		onAfterEnter: r,
		onEnterCancelled: r,
		onLeave(e) {
			e._initialStyle = {
				transition: "",
				overflow: e.style.overflow,
				width: e.style.width,
				height: e.style.height
			}, e.style.overflow = "hidden", ["x", "both"].includes(t) && (e.style.width = `${e.offsetWidth}px`), ["y", "both"].includes(t) && (e.style.height = `${e.offsetHeight}px`), e.offsetHeight, requestAnimationFrame(() => {
				["x", "both"].includes(t) && (e.style.width = "0"), ["y", "both"].includes(t) && (e.style.height = "0");
			});
		},
		onAfterLeave: n,
		onLeaveCancelled: n
	};
	function n(t) {
		e && t._parent && t._parent.classList.remove(e), r(t);
	}
	function r(e) {
		if (!e._initialStyle) return;
		let { width: n, height: r } = e._initialStyle;
		e.style.overflow = e._initialStyle.overflow, n != null && ["x", "both"].includes(t) && (e.style.width = n), r != null && ["y", "both"].includes(t) && (e.style.height = r), delete e._initialStyle;
	}
}
s("fab-transition", "center center", "out-in"), s("dialog-bottom-transition"), s("dialog-top-transition");
var u = s("fade-transition"), d = s("scale-transition");
s("scroll-x-transition"), s("scroll-x-reverse-transition"), s("scroll-y-transition"), s("scroll-y-reverse-transition"), s("slide-x-transition"), s("slide-x-reverse-transition");
var f = s("slide-y-transition");
s("slide-y-reverse-transition");
var p = c("expand-transition", l()), m = c("expand-x-transition", l("", "x"));
c("expand-both-transition", l("", "both"));
//#endregion
export { f as a, d as i, m as n, u as r, p as t };
