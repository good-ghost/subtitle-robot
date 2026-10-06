import { i as e, l as t, n, o as r, r as i, t as a, u as o } from "./chunks/settings--jlXedH0.js";
//#region src/register.ts
var s = {
	"smartview-page-header": () => import("./elements/smartview-page-header.js"),
	"smartview-card": () => import("./elements/smartview-card.js"),
	"smartview-form-actions": () => Promise.reject(/* @__PURE__ */ Error("smartview-form-actions 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tabbed-card": () => Promise.reject(/* @__PURE__ */ Error("smartview-tabbed-card 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-notification": () => Promise.reject(/* @__PURE__ */ Error("smartview-notification 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-hint-banner": () => import("./elements/smartview-hint-banner.js"),
	"smartview-stat-card": () => import("./elements/smartview-stat-card.js"),
	"smartview-filter-bar": () => import("./elements/smartview-filter-bar.js"),
	"smartview-data-table": () => import("./elements/smartview-data-table.js"),
	"smartview-prompt": () => import("./elements/smartview-prompt.js"),
	"smartview-modal": () => import("./elements/smartview-modal.js"),
	"smartview-toast": () => Promise.reject(/* @__PURE__ */ Error("smartview-toast 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-empty-state": () => import("./elements/smartview-empty-state.js"),
	"smartview-badge": () => import("./elements/smartview-badge.js"),
	"smartview-name-cell": () => Promise.reject(/* @__PURE__ */ Error("smartview-name-cell 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-pill-container": () => Promise.reject(/* @__PURE__ */ Error("smartview-pill-container 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-button-icon": () => Promise.reject(/* @__PURE__ */ Error("smartview-button-icon 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-chart-card": () => Promise.reject(/* @__PURE__ */ Error("smartview-chart-card 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-info-list": () => import("./elements/smartview-info-list.js"),
	"smartview-refreshed-at": () => import("./elements/smartview-refreshed-at.js"),
	"smartview-pager": () => Promise.reject(/* @__PURE__ */ Error("smartview-pager 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-report-tile": () => Promise.reject(/* @__PURE__ */ Error("smartview-report-tile 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-progress-bar": () => Promise.reject(/* @__PURE__ */ Error("smartview-progress-bar 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-password-field": () => import("./elements/smartview-password-field.js"),
	"smartview-multi-picklist": () => import("./elements/smartview-multi-picklist.js"),
	"smartview-field-grid": () => Promise.reject(/* @__PURE__ */ Error("smartview-field-grid 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-repeatable-rows": () => import("./elements/smartview-repeatable-rows.js"),
	"smartview-option-cards": () => Promise.reject(/* @__PURE__ */ Error("smartview-option-cards 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-toggle-row": () => Promise.reject(/* @__PURE__ */ Error("smartview-toggle-row 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-checkbox-button-group": () => import("./elements/smartview-checkbox-button-group.js"),
	"smartview-json-field": () => Promise.reject(/* @__PURE__ */ Error("smartview-json-field 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-file-inspect": () => Promise.reject(/* @__PURE__ */ Error("smartview-file-inspect 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-slider": () => Promise.reject(/* @__PURE__ */ Error("smartview-slider 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-cron-builder": () => Promise.reject(/* @__PURE__ */ Error("smartview-cron-builder 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-code-editor": () => Promise.reject(/* @__PURE__ */ Error("smartview-code-editor 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-status-dot": () => Promise.reject(/* @__PURE__ */ Error("smartview-status-dot 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-vertical-navigation": () => Promise.reject(/* @__PURE__ */ Error("smartview-vertical-navigation 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-global-header": () => Promise.reject(/* @__PURE__ */ Error("smartview-global-header 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-app-shell": () => import("./elements/smartview-app-shell.js"),
	"smartview-login": () => import("./elements/smartview-login.js"),
	"smartview-state-notice": () => import("./elements/smartview-state-notice.js"),
	"smartview-secret-dialog": () => Promise.reject(/* @__PURE__ */ Error("smartview-secret-dialog 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-help-dialog": () => Promise.reject(/* @__PURE__ */ Error("smartview-help-dialog 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-account-dialog": () => Promise.reject(/* @__PURE__ */ Error("smartview-account-dialog 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-backup-restore": () => Promise.reject(/* @__PURE__ */ Error("smartview-backup-restore 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-channel-stages": () => Promise.reject(/* @__PURE__ */ Error("smartview-channel-stages 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-chat": () => Promise.reject(/* @__PURE__ */ Error("smartview-chat 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-widget-preview": () => Promise.reject(/* @__PURE__ */ Error("smartview-widget-preview 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-object-browser": () => Promise.reject(/* @__PURE__ */ Error("smartview-object-browser 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-mapping-grid": () => Promise.reject(/* @__PURE__ */ Error("smartview-mapping-grid 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-color-picker": () => Promise.reject(/* @__PURE__ */ Error("smartview-color-picker 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tabs": () => import("./elements/smartview-tabs.js"),
	"smartview-chart": () => Promise.reject(/* @__PURE__ */ Error("smartview-chart 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-accordion": () => Promise.reject(/* @__PURE__ */ Error("smartview-accordion 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-input": () => import("./elements/smartview-input.js"),
	"smartview-avatar": () => Promise.reject(/* @__PURE__ */ Error("smartview-avatar 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-pill": () => Promise.reject(/* @__PURE__ */ Error("smartview-pill 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-breadcrumbs": () => Promise.reject(/* @__PURE__ */ Error("smartview-breadcrumbs 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-checkbox-toggle": () => import("./elements/smartview-checkbox-toggle.js"),
	"smartview-spinner": () => import("./elements/smartview-spinner.js"),
	"smartview-textarea": () => import("./elements/smartview-textarea.js"),
	"smartview-combobox": () => import("./elements/smartview-combobox.js"),
	"smartview-radio-button-group": () => Promise.reject(/* @__PURE__ */ Error("smartview-radio-button-group 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-file-selector": () => Promise.reject(/* @__PURE__ */ Error("smartview-file-selector 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-path": () => Promise.reject(/* @__PURE__ */ Error("smartview-path 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-progress-indicator": () => Promise.reject(/* @__PURE__ */ Error("smartview-progress-indicator 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tile": () => Promise.reject(/* @__PURE__ */ Error("smartview-tile 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-related-list": () => Promise.reject(/* @__PURE__ */ Error("smartview-related-list 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-button": () => import("./elements/smartview-button.js"),
	"smartview-checkbox": () => import("./elements/smartview-checkbox.js"),
	"smartview-radio-group": () => Promise.reject(/* @__PURE__ */ Error("smartview-radio-group 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-counter": () => Promise.reject(/* @__PURE__ */ Error("smartview-counter 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-progress-ring": () => Promise.reject(/* @__PURE__ */ Error("smartview-progress-ring 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tooltip": () => Promise.reject(/* @__PURE__ */ Error("smartview-tooltip 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-popover": () => Promise.reject(/* @__PURE__ */ Error("smartview-popover 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-menu": () => Promise.reject(/* @__PURE__ */ Error("smartview-menu 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-dropdown-menu": () => Promise.reject(/* @__PURE__ */ Error("smartview-dropdown-menu 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-panel": () => Promise.reject(/* @__PURE__ */ Error("smartview-panel 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-datepicker": () => Promise.reject(/* @__PURE__ */ Error("smartview-datepicker 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-timepicker": () => Promise.reject(/* @__PURE__ */ Error("smartview-timepicker 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-datetime-picker": () => Promise.reject(/* @__PURE__ */ Error("smartview-datetime-picker 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-dueling-picklist": () => Promise.reject(/* @__PURE__ */ Error("smartview-dueling-picklist 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tree": () => Promise.reject(/* @__PURE__ */ Error("smartview-tree 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-tree-grid": () => Promise.reject(/* @__PURE__ */ Error("smartview-tree-grid 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-activity-timeline": () => Promise.reject(/* @__PURE__ */ Error("smartview-activity-timeline 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-builder-header": () => Promise.reject(/* @__PURE__ */ Error("smartview-builder-header 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-pulldown-menu": () => Promise.reject(/* @__PURE__ */ Error("smartview-pulldown-menu 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-status-bar": () => Promise.reject(/* @__PURE__ */ Error("smartview-status-bar 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-explorer": () => Promise.reject(/* @__PURE__ */ Error("smartview-explorer 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-rich-text-editor": () => Promise.reject(/* @__PURE__ */ Error("smartview-rich-text-editor 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)")),
	"smartview-grid": () => Promise.reject(/* @__PURE__ */ Error("smartview-grid 는 이 부분 빌드에 없다 (SMARTVIEW_ELEMENTS)"))
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
	if (t.length) throw Error(`vue-smartview 에 없는 태그입니다: ${t.join(", ")} (가능: ${l.join(", ")})`);
	await Promise.all(e.filter(u).map((e) => s[e]()));
}
//#endregion
//#region src/notify.ts
var f = 3e3, p = "smartview-toast", m = null;
function h() {
	let e = () => t.length > 0 || document.querySelector(p) !== null;
	return e() ? Promise.resolve() : (m ??= import("./chunks/smartview-toast-BCum-Tx4.js").then(() => {
		e() || document.body.append(document.createElement(p));
	}), m);
}
async function g({ text: e, color: t = "success", timeout: n = f }) {
	Object.assign(o, {
		id: o.id + 1,
		show: !0,
		text: e,
		color: t,
		timeout: n
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
//#region src/utils/channelStages.ts
var b = [
	"available",
	"loaded",
	"auth",
	"enabled"
];
function x(e, t) {
	let n = e ?? {}, r = t ?? {}, i = !n.requires_credentials, a = r.credentials ?? {}, o = (n.credential_fields ?? []).filter((e) => e.required !== !1), s = o.length ? o.every((e) => !!a[e.name]) : !!r.api_key, c = {
		available: !!(n.available || n.loaded),
		loaded: !!n.loaded,
		auth: i || s,
		enabled: !!r.enabled
	}, l = !1;
	return b.map((e) => l ? {
		key: e,
		state: e === "enabled" && c.enabled ? "waiting" : "pending"
	} : c[e] ? {
		key: e,
		state: e === "auth" && i ? "skipped" : "done"
	} : (l = !0, {
		key: e,
		state: "blocked"
	}));
}
function S(e, t) {
	return x(e, t).find((e) => e.state === "blocked")?.key ?? null;
}
function C(e, t) {
	return S(e, t) === null;
}
//#endregion
//#region src/utils/fieldMapping.ts
function w(e) {
	let t = (e ?? "").toLowerCase();
	return /bool/.test(t) ? "boolean" : /datetime|timestamp/.test(t) ? "datetime" : /\bdate\b|^date/.test(t) ? "date" : /time/.test(t) ? "time" : /int|number|numeric|decimal|float|double|currency|real|long|percent|money/.test(t) ? "number" : /char|text|string|varchar|clob|email|url|picklist|phone|reference|id|uuid/.test(t) ? "string" : "other";
}
function T(e, t) {
	let n = w(e), r = w(t);
	return n === "other" || r === "other" || n === r ? "ok" : r === "boolean" || n === "boolean" ? "bad" : r === "datetime" ? n === "date" ? "ok" : n === "string" ? "warn" : "bad" : r === "date" ? n === "datetime" || n === "string" ? "warn" : "bad" : r === "time" || r === "number" ? n === "string" ? "warn" : "bad" : r === "string" ? "ok" : "warn";
}
function E(e, t, n) {
	if (!e?.target || typeof e.formula == "string") return "ok";
	let r = t.find((t) => t.name === e.source)?.type, i = n.find((t) => t.name === e.target)?.type;
	return T(r, i);
}
function D(e) {
	let t = (e ?? "").toLowerCase();
	if ([
		"string",
		"text",
		"varchar",
		"char"
	].some((e) => t.includes(e))) return "primary";
	if ([
		"int",
		"number",
		"decimal",
		"float",
		"double",
		"currency"
	].some((e) => t.includes(e))) return "warning";
	if (t.includes("date") || t.includes("time")) return "secondary";
	if (t.includes("bool") || t.includes("checkbox")) return "accent";
	if (t.includes("id") || t.includes("reference")) return "info";
}
var O = (e) => e.toLowerCase().replace(/[_\s]/g, "");
function k(e, t, n) {
	let r = [...n], i = 0;
	for (let n of e) {
		if (r.some((e) => e.source === n.name && e.target)) continue;
		let e = O(n.name), a = t.find((t) => O(t.name) === e) ?? t.find((t) => {
			let n = O(t.name);
			return e.includes(n) || n.includes(e);
		});
		a && (r.push({
			source: n.name,
			target: a.name
		}), i += 1);
	}
	return {
		mappings: r,
		count: i
	};
}
//#endregion
export { b as CHANNEL_STAGES, l as SMARTVIEW_TAGS, r as SUPPORTED_LOCALES, k as autoMapFields, S as blockedStage, x as channelStages, a as getLocale, n as getTheme, C as isChannelLive, u as isSmartviewTag, E as mappingCompatibility, g as notify, v as notifyError, y as notifyInfo, _ as notifySuccess, d as register, i as setLocale, e as setTheme, w as typeCategory, D as typeColor, T as typeCompatibility };
