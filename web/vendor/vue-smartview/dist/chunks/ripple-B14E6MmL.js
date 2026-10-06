import { F as e, It as t, R as n, Vt as r, pt as i } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/util/deepEqual.js
function a(e, t, n, r) {
	if (!n || i(e) || i(t)) return;
	let a = n.get(e);
	if (a) a.set(t, r);
	else {
		let i = /* @__PURE__ */ new WeakMap();
		i.set(t, r), n.set(e, i);
	}
}
function o(e, n, r) {
	if (!r || i(e) || i(n)) return null;
	let a = r.get(e)?.get(n);
	if (t(a)) return a;
	let o = r.get(n)?.get(e);
	return t(o) ? o : null;
}
function s(e, t, n = /* @__PURE__ */ new WeakMap()) {
	if (e === t) return !0;
	if (e instanceof Date && t instanceof Date && e.getTime() !== t.getTime() || e !== Object(e) || t !== Object(t)) return !1;
	let r = Object.keys(e);
	return r.length === Object.keys(t).length ? o(e, t, n) || (a(e, t, n, !0), r.every((r) => s(e[r], t[r], n))) : !1;
}
//#endregion
//#region node_modules/vuetify/lib/directives/ripple/index.js
var c = Symbol("rippleStop"), l = 80;
function u(e, t) {
	e.style.transform = t, e.style.webkitTransform = t;
}
function d(e) {
	return e.constructor.name === "TouchEvent";
}
function f(e) {
	return e.constructor.name === "KeyboardEvent";
}
var p = (t, r, i = {}) => {
	let a = 0, o = 0;
	if (!f(t)) {
		let i = new e(r), s = d(t) ? t.touches[t.touches.length - 1] : t, c = n([s.clientX, s.clientY]);
		a = c.x - i.left, o = c.y - i.top;
	}
	let s = 0, c = .3;
	r._ripple?.circle ? (c = .15, s = r.clientWidth / 2, s = i.center ? s : s + Math.sqrt((a - s) ** 2 + (o - s) ** 2) / 4) : s = Math.sqrt(r.clientWidth ** 2 + r.clientHeight ** 2) / 2;
	let l = `${(r.clientWidth - s * 2) / 2}px`, u = `${(r.clientHeight - s * 2) / 2}px`, p = i.center ? l : `${a - s}px`, m = i.center ? u : `${o - s}px`;
	return {
		radius: s,
		scale: c,
		x: p,
		y: m,
		centerX: l,
		centerY: u
	};
}, m = {
	show(e, t, n = {}) {
		if (!t?._ripple?.enabled) return;
		let r = document.createElement("span"), i = document.createElement("span");
		r.appendChild(i), r.className = "v-ripple__container", n.class && (r.className += ` ${n.class}`);
		let { radius: a, scale: o, x: s, y: c, centerX: l, centerY: d } = p(e, t, n), f = `${a * 2}px`;
		i.className = "v-ripple__animation", i.style.width = f, i.style.height = f, t.appendChild(r);
		let m = window.getComputedStyle(t);
		m && m.position === "static" && (t.style.position = "relative", t.dataset.previousPosition = "static"), i.classList.add("v-ripple__animation--enter"), i.classList.add("v-ripple__animation--visible"), u(i, `translate(${s}, ${c}) scale3d(${o},${o},${o})`), i.dataset.activated = String(performance.now()), requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				i.classList.remove("v-ripple__animation--enter"), i.classList.add("v-ripple__animation--in"), u(i, `translate(${l}, ${d}) scale3d(1,1,1)`);
			});
		});
	},
	hide(e) {
		if (!e?._ripple?.enabled) return;
		let t = e.getElementsByClassName("v-ripple__animation");
		if (t.length === 0) return;
		let n = Array.from(t).findLast((e) => !e.dataset.isHiding);
		if (n) n.dataset.isHiding = "true";
		else return;
		let r = performance.now() - Number(n.dataset.activated), i = Math.max(250 - r, 0);
		setTimeout(() => {
			n.classList.remove("v-ripple__animation--in"), n.classList.add("v-ripple__animation--out"), setTimeout(() => {
				e.getElementsByClassName("v-ripple__animation").length === 1 && e.dataset.previousPosition && (e.style.position = e.dataset.previousPosition, delete e.dataset.previousPosition), n.parentNode?.parentNode === e && e.removeChild(n.parentNode);
			}, 300);
		}, i);
	}
};
function h(e) {
	return e === void 0 || !!e;
}
function g(e) {
	let t = {}, n = e.currentTarget;
	if (!(!n?._ripple || n._ripple.touched || e[c])) {
		if (e[c] = !0, d(e)) n._ripple.touched = !0, n._ripple.isTouch = !0;
		else if (n._ripple.isTouch) return;
		if (t.center = n._ripple.centered || f(e), n._ripple.class && (t.class = n._ripple.class), d(e)) {
			if (n._ripple.showTimerCommit) return;
			n._ripple.showTimerCommit = () => {
				m.show(e, n, t);
			}, n._ripple.showTimer = window.setTimeout(() => {
				n?._ripple?.showTimerCommit && (n._ripple.showTimerCommit(), n._ripple.showTimerCommit = null);
			}, l);
		} else m.show(e, n, t);
	}
}
function _(e) {
	e[c] = !0;
}
function v(e) {
	let t = e.currentTarget;
	if (t?._ripple) {
		if (window.clearTimeout(t._ripple.showTimer), e.type === "touchend" && t._ripple.showTimerCommit) {
			t._ripple.showTimerCommit(), t._ripple.showTimerCommit = null, t._ripple.showTimer = window.setTimeout(() => {
				v(e);
			});
			return;
		}
		window.setTimeout(() => {
			t._ripple && (t._ripple.touched = !1);
		}), m.hide(t);
	}
}
function y(e) {
	let t = e.currentTarget;
	t?._ripple && (t._ripple.showTimerCommit && (t._ripple.showTimerCommit = null), window.clearTimeout(t._ripple.showTimer));
}
var b = !1;
function x(e, t) {
	!b && t.includes(e.key) && (b = !0, g(e));
}
function S(e) {
	b = !1, v(e);
}
function C(e) {
	b && (b = !1, v(e));
}
function w(e, t, n) {
	let { value: i, modifiers: a } = t, o = h(i);
	o || m.hide(e), e._ripple = e._ripple ?? {}, e._ripple.enabled = o, e._ripple.centered = a.center, e._ripple.circle = a.circle;
	let s = r(i) ? i : {};
	s.class && (e._ripple.class = s.class);
	let c = s.keys ?? ["Enter", "Space"];
	if (e._ripple.keyDownHandler = (e) => x(e, c), o && !n) {
		if (a.stop) {
			e.addEventListener("touchstart", _, { passive: !0 }), e.addEventListener("mousedown", _);
			return;
		}
		e.addEventListener("touchstart", g, { passive: !0 }), e.addEventListener("touchend", v, { passive: !0 }), e.addEventListener("touchmove", y, { passive: !0 }), e.addEventListener("touchcancel", v), e.addEventListener("mousedown", g), e.addEventListener("mouseup", v), e.addEventListener("mouseleave", v), e.addEventListener("keydown", e._ripple.keyDownHandler), e.addEventListener("keyup", S), e.addEventListener("blur", C), e.addEventListener("dragstart", v, { passive: !0 });
	} else !o && n && T(e);
}
function T(e) {
	e.removeEventListener("touchstart", _), e.removeEventListener("mousedown", _), e.removeEventListener("touchstart", g), e.removeEventListener("touchend", v), e.removeEventListener("touchmove", y), e.removeEventListener("touchcancel", v), e.removeEventListener("mousedown", g), e.removeEventListener("mouseup", v), e.removeEventListener("mouseleave", v), e._ripple?.keyDownHandler && e.removeEventListener("keydown", e._ripple.keyDownHandler), e.removeEventListener("keyup", S), e.removeEventListener("blur", C), e.removeEventListener("dragstart", v);
}
function E(e, t) {
	w(e, t, !1);
}
function D(e) {
	T(e), delete e._ripple;
}
function O(e, t) {
	t.value !== t.oldValue && w(e, t, h(t.oldValue));
}
var k = {
	mounted: E,
	unmounted: D,
	updated: O
};
//#endregion
export { s as n, k as t };
