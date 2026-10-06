import { $t as e, A as t, Bt as n, G as r, Ht as i, J as a, M as o, N as s, O as c, P as l, Qt as u, a as d, ct as f, ir as p, j as m, k as h, n as g, o as _, r as v, rn as y, s as b, t as x } from "./vuetify-DJ4bsPds.js";
//#region node_modules/vuetify/lib/composables/component.js
var S = t({
	class: [
		String,
		Array,
		Object
	],
	style: {
		type: [
			String,
			Array,
			Object
		],
		default: null
	}
}, "component");
//#endregion
//#region node_modules/vuetify/lib/util/useRender.js
function C(e) {
	let t = c("useRender");
	t.render = e;
}
//#endregion
//#region node_modules/vuetify/lib/composables/color.js
function w(e) {
	return a(() => {
		let { class: t, style: n } = O(e);
		return {
			colorClasses: t,
			colorStyles: n
		};
	});
}
function T(e) {
	let { colorClasses: t, colorStyles: n } = w(() => ({ text: p(e) }));
	return {
		textColorClasses: t,
		textColorStyles: n
	};
}
function E(e) {
	let { colorClasses: t, colorStyles: n } = w(() => ({ background: p(e) }));
	return {
		backgroundColorClasses: t,
		backgroundColorStyles: n
	};
}
function D(e) {
	return {
		text: i(e.text) ? e.text.replace(/^text-/, "") : e.text,
		background: i(e.background) ? e.background.replace(/^bg-/, "") : e.background
	};
}
function O(e) {
	let t = D(p(e)), r = [], i = {};
	if (t.background) {
		if (o(t.background)) {
			if (i.backgroundColor = t.background, !t.text && s(t.background)) {
				let e = l(t.background);
				(!n(e.a) || e.a === 1) && r.push(m(e) ? "v-theme-on-dark" : "v-theme-on-light");
			}
		} else r.push(`bg-${t.background}`);
	}
	return t.text && (o(t.text) ? (i.color = t.text, i.caretColor = t.text) : r.push(`text-${t.text}`)), {
		class: r,
		style: i
	};
}
//#endregion
//#region node_modules/vuetify/lib/composables/size.js
var k = [
	"x-small",
	"small",
	"default",
	"large",
	"x-large"
], A = t({ size: {
	type: [String, Number],
	default: "default"
} }, "size");
function j(e, t = h()) {
	return a(() => {
		let n = e.size, i, a;
		return f(k, n) ? i = `${t}--size-${n}` : n && (a = {
			width: r(n),
			height: r(n)
		}), {
			sizeClasses: i,
			sizeStyles: a
		};
	});
}
//#endregion
//#region node_modules/vuetify/lib/composables/tag.js
var M = t({ tag: {
	type: [
		String,
		Object,
		Function
	],
	default: "div"
} }, "tag");
//#endregion
//#region src/runtime/define.ts
function N(e, t) {
	if (t.length === 0) return;
	let n = Reflect.get(e, "_setProp");
	if (typeof n != "function") throw Error("Vue 요소의 _setProp 을 찾지 못해 비밀 prop 을 속성에서 뺄 수 없습니다 (vue 버전 확인)");
	let r = new Set(t);
	Object.defineProperty(e, "_setProp", {
		configurable: !0,
		writable: !0,
		value(e, t, i = !0, a = !1) {
			return Reflect.apply(n, this, [
				e,
				t,
				!r.has(e) && i,
				a
			]);
		}
	});
}
function P(t) {
	let n = t._context.provides, r = Object.getPrototypeOf(n);
	Object.setPrototypeOf(n, null), t.provide("usehead", x), t.use(g), t.use(u), t.provide(e, u), typeof r == "object" && r && Object.setPrototypeOf(n, r);
}
function F(e, t = {}) {
	let { styles: n = [], ...r } = e, i = n.map(d);
	b(i);
	let a = y({
		...r,
		inheritAttrs: !1
	}, { configureApp: P });
	class o extends a {
		constructor(...e) {
			if (super(...e), _(), !this.shadowRoot) throw Error(`Shadow Root 가 없습니다: <${this.localName}>`);
			v(this.shadowRoot, i);
		}
	}
	return N(o.prototype, t.unreflectedProps ?? []), t.formAssociated ? class extends o {
		static formAssociated = !0;
		internals = this.attachInternals();
		formHooks = null;
		formDisabled = !1;
		formResetCallback() {
			this.formHooks?.reset();
		}
		formDisabledCallback(e) {
			this.formDisabled = e, this.formHooks?.setDisabled(e);
		}
		get form() {
			return this.internals.form;
		}
		get validity() {
			return this.internals.validity;
		}
		get validationMessage() {
			return this.internals.validationMessage;
		}
		get willValidate() {
			return this.internals.willValidate;
		}
		checkValidity() {
			return this.internals.checkValidity();
		}
		reportValidity() {
			return this.internals.reportValidity();
		}
	} : o;
}
function I(e, t, n = {}) {
	if (customElements.get(e)) throw Error(`<${e}> 가 다른 정의로 이미 등록되어 있습니다. vue-smartview 가 두 번 로드됐는지 확인하세요.`);
	let r = F(t, n);
	return customElements.define(e, r), r;
}
//#endregion
export { E as a, C as c, j as i, S as l, M as n, w as o, A as r, T as s, I as t };
