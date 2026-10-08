import { nn as e } from "./chunks/vuetify-C39-WP9g.js";
import { n as t, t as n } from "./chunks/notifyStore-DTKHnvLP.js";
import { i as r, n as i, r as a, t as o } from "./chunks/settings-D7A6aKel.js";
//#region src/register.ts
var s = {
	"smartview-page-header": () => import("./elements/smartview-page-header.js"),
	"smartview-card": () => import("./elements/smartview-card.js"),
	"smartview-hint-banner": () => import("./elements/smartview-hint-banner.js"),
	"smartview-stat-card": () => import("./elements/smartview-stat-card.js"),
	"smartview-filter-bar": () => import("./elements/smartview-filter-bar.js"),
	"smartview-data-table": () => import("./elements/smartview-data-table.js"),
	"smartview-prompt": () => import("./elements/smartview-prompt.js"),
	"smartview-modal": () => import("./elements/smartview-modal.js"),
	"smartview-toast": () => import("./elements/smartview-toast.js"),
	"smartview-empty-state": () => import("./elements/smartview-empty-state.js"),
	"smartview-badge": () => import("./elements/smartview-badge.js"),
	"smartview-info-list": () => import("./elements/smartview-info-list.js"),
	"smartview-refreshed-at": () => import("./elements/smartview-refreshed-at.js"),
	"smartview-password-field": () => import("./elements/smartview-password-field.js"),
	"smartview-multi-picklist": () => import("./elements/smartview-multi-picklist.js"),
	"smartview-repeatable-rows": () => import("./elements/smartview-repeatable-rows.js"),
	"smartview-checkbox-button-group": () => import("./elements/smartview-checkbox-button-group.js"),
	"smartview-app-shell": () => import("./elements/smartview-app-shell.js"),
	"smartview-login": () => import("./elements/smartview-login.js"),
	"smartview-state-notice": () => import("./elements/smartview-state-notice.js"),
	"smartview-tabs": () => import("./elements/smartview-tabs.js"),
	"smartview-input": () => import("./elements/smartview-input.js"),
	"smartview-checkbox-toggle": () => import("./elements/smartview-checkbox-toggle.js"),
	"smartview-spinner": () => import("./elements/smartview-spinner.js"),
	"smartview-textarea": () => import("./elements/smartview-textarea.js"),
	"smartview-combobox": () => import("./elements/smartview-combobox.js"),
	"smartview-button": () => import("./elements/smartview-button.js"),
	"smartview-checkbox": () => import("./elements/smartview-checkbox.js")
};
function c(e) {
	return Object.hasOwn(s, e);
}
var l = /* @__PURE__ */ Object.keys(s).filter(c);
function u(e) {
	return c(e);
}
async function d(e = l) {
	let t = e.filter((e) => !u(e));
	if (t.length) throw Error(`이 vue-smartview 빌드에 없는 태그입니다: ${t.join(", ")} (가능: ${l.join(", ")})`);
	await Promise.all(e.filter(u).map((e) => s[e]()));
}
//#endregion
//#region src/notify.ts
var f = 3e3, p = "smartview-toast", m = null;
function h() {
	let e = () => n.length > 0 || document.querySelector(p) !== null;
	return e() ? Promise.resolve() : (m ??= import("./elements/smartview-toast.js").then(() => {
		e() || document.body.append(document.createElement(p));
	}), m);
}
async function g({ text: e, color: n = "success", timeout: r = f }) {
	Object.assign(t, {
		id: t.id + 1,
		show: !0,
		text: e,
		color: n,
		timeout: r
	}), await h();
}
function _(e) {
	return g({
		text: e,
		color: "success"
	});
}
function v(e) {
	return g({
		text: e,
		color: "error"
	});
}
function y(e) {
	return g({
		text: e,
		color: "info"
	});
}
//#endregion
export { l as SMARTVIEW_TAGS, e as SUPPORTED_LOCALES, o as getLocale, i as getTheme, u as isSmartviewTag, g as notify, v as notifyError, y as notifyInfo, _ as notifySuccess, d as register, a as setLocale, r as setTheme };
