import type { SmartviewPromptEvents, SmartviewPromptProps, SmartviewDataTableEvents, SmartviewDataTableProps, SmartviewFilterBarEvents, SmartviewFilterBarProps, SmartviewModalEvents, SmartviewModalProps, SmartviewHintBannerEvents, SmartviewHintBannerProps, SmartviewPageHeaderEvents, SmartviewPageHeaderProps, SmartviewCardEvents, SmartviewCardProps, SmartviewStatCardEvents, SmartviewStatCardProps, SmartviewEmptyStateEvents, SmartviewEmptyStateProps, SmartviewBadgeEvents, SmartviewBadgeProps, SmartviewInfoListEvents, SmartviewInfoListProps, SmartviewRefreshedAtEvents, SmartviewRefreshedAtProps, SmartviewPasswordFieldEvents, SmartviewPasswordFieldProps, SmartviewMultiPicklistEvents, SmartviewMultiPicklistProps, SmartviewRepeatableRowsEvents, SmartviewRepeatableRowsProps, SmartviewCheckboxButtonGroupEvents, SmartviewCheckboxButtonGroupProps, SmartviewAppShellEvents, SmartviewAppShellProps, SmartviewLoginEvents, SmartviewLoginProps, SmartviewStateNoticeEvents, SmartviewStateNoticeProps, SmartviewTabsEvents, SmartviewTabsProps, SmartviewInputEvents, SmartviewInputProps, SmartviewCheckboxToggleEvents, SmartviewCheckboxToggleProps, SmartviewSpinnerEvents, SmartviewSpinnerProps, SmartviewTextareaEvents, SmartviewTextareaProps, SmartviewComboboxEvents, SmartviewComboboxProps, SmartviewButtonEvents, SmartviewButtonProps, SmartviewCheckboxEvents, SmartviewCheckboxProps } from './types';
/** 요소 이벤트에 타입이 붙은 addEventListener. HTMLElement 의 문자열 오버로드보다 먼저 맞도록 교차 타입 앞에 둔다. */
export interface SmartviewEventTarget<Events> {
    addEventListener<K extends keyof Events & string>(type: K, listener: (event: CustomEvent<Events[K]>) => void, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof Events & string>(type: K, listener: (event: CustomEvent<Events[K]>) => void, options?: boolean | EventListenerOptions): void;
}
/** 요소 인스턴스: 기본값이 있는 props 는 프로퍼티로 늘 값이 있다. */
export type SmartviewElement<Props, Events> = SmartviewEventTarget<Events> & HTMLElement & Required<Props>;
export type SmartviewPageHeaderElement = SmartviewElement<SmartviewPageHeaderProps, SmartviewPageHeaderEvents>;
export type SmartviewCardElement = SmartviewElement<SmartviewCardProps, SmartviewCardEvents>;
export type SmartviewHintBannerElement = SmartviewElement<SmartviewHintBannerProps, SmartviewHintBannerEvents>;
export type SmartviewModalElement = SmartviewElement<SmartviewModalProps, SmartviewModalEvents>;
export type SmartviewStatCardElement = SmartviewElement<SmartviewStatCardProps, SmartviewStatCardEvents>;
export type SmartviewFilterBarElement = SmartviewElement<SmartviewFilterBarProps, SmartviewFilterBarEvents>;
export type SmartviewDataTableElement = SmartviewElement<SmartviewDataTableProps, SmartviewDataTableEvents>;
export type SmartviewPromptElement = SmartviewElement<SmartviewPromptProps, SmartviewPromptEvents>;
export type SmartviewEmptyStateElement = SmartviewElement<SmartviewEmptyStateProps, SmartviewEmptyStateEvents>;
export type SmartviewBadgeElement = SmartviewElement<SmartviewBadgeProps, SmartviewBadgeEvents>;
export type SmartviewInfoListElement = SmartviewElement<SmartviewInfoListProps, SmartviewInfoListEvents>;
export type SmartviewRefreshedAtElement = SmartviewElement<SmartviewRefreshedAtProps, SmartviewRefreshedAtEvents>;
export type SmartviewPasswordFieldElement = SmartviewElement<SmartviewPasswordFieldProps, SmartviewPasswordFieldEvents>;
export type SmartviewMultiPicklistElement = SmartviewElement<SmartviewMultiPicklistProps, SmartviewMultiPicklistEvents>;
export type SmartviewRepeatableRowsElement = SmartviewElement<SmartviewRepeatableRowsProps, SmartviewRepeatableRowsEvents>;
export type SmartviewCheckboxButtonGroupElement = SmartviewElement<SmartviewCheckboxButtonGroupProps, SmartviewCheckboxButtonGroupEvents>;
export type SmartviewAppShellElement = SmartviewElement<SmartviewAppShellProps, SmartviewAppShellEvents>;
export type SmartviewLoginElement = SmartviewElement<SmartviewLoginProps, SmartviewLoginEvents>;
export type SmartviewStateNoticeElement = SmartviewElement<SmartviewStateNoticeProps, SmartviewStateNoticeEvents>;
export type SmartviewTabsElement = SmartviewElement<SmartviewTabsProps, SmartviewTabsEvents>;
export type SmartviewInputElement = SmartviewElement<SmartviewInputProps, SmartviewInputEvents>;
export type SmartviewCheckboxToggleElement = SmartviewElement<SmartviewCheckboxToggleProps, SmartviewCheckboxToggleEvents>;
export type SmartviewSpinnerElement = SmartviewElement<SmartviewSpinnerProps, SmartviewSpinnerEvents>;
export type SmartviewTextareaElement = SmartviewElement<SmartviewTextareaProps, SmartviewTextareaEvents>;
export type SmartviewComboboxElement = SmartviewElement<SmartviewComboboxProps, SmartviewComboboxEvents>;
export type SmartviewButtonElement = SmartviewElement<SmartviewButtonProps, SmartviewButtonEvents>;
export type SmartviewCheckboxElement = SmartviewElement<SmartviewCheckboxProps, SmartviewCheckboxEvents>;
export interface SmartviewElementTagNameMap {
    'smartview-page-header': SmartviewPageHeaderElement;
    'smartview-card': SmartviewCardElement;
    'smartview-hint-banner': SmartviewHintBannerElement;
    'smartview-stat-card': SmartviewStatCardElement;
    'smartview-filter-bar': SmartviewFilterBarElement;
    'smartview-data-table': SmartviewDataTableElement;
    'smartview-prompt': SmartviewPromptElement;
    'smartview-modal': SmartviewModalElement;
    'smartview-empty-state': SmartviewEmptyStateElement;
    'smartview-badge': SmartviewBadgeElement;
    'smartview-info-list': SmartviewInfoListElement;
    'smartview-refreshed-at': SmartviewRefreshedAtElement;
    'smartview-password-field': SmartviewPasswordFieldElement;
    'smartview-multi-picklist': SmartviewMultiPicklistElement;
    'smartview-repeatable-rows': SmartviewRepeatableRowsElement;
    'smartview-checkbox-button-group': SmartviewCheckboxButtonGroupElement;
    'smartview-app-shell': SmartviewAppShellElement;
    'smartview-login': SmartviewLoginElement;
    'smartview-state-notice': SmartviewStateNoticeElement;
    'smartview-tabs': SmartviewTabsElement;
    'smartview-input': SmartviewInputElement;
    'smartview-checkbox-toggle': SmartviewCheckboxToggleElement;
    'smartview-spinner': SmartviewSpinnerElement;
    'smartview-textarea': SmartviewTextareaElement;
    'smartview-combobox': SmartviewComboboxElement;
    'smartview-button': SmartviewButtonElement;
    'smartview-checkbox': SmartviewCheckboxElement;
}
declare global {
    interface HTMLElementTagNameMap extends SmartviewElementTagNameMap {
    }
}
