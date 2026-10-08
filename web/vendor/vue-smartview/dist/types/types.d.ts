/** v-select 항목 */
export interface SelectItem {
    title: string;
    value: string;
}
/** 상태 칩 한 종류의 모양 (DataTable `status` 열) */
export interface StatusStyle {
    color: string;
    icon?: string;
    label: string;
}
/** 행 액션 버튼 (DataTable `actions` 열) */
export interface RowActionDef {
    name: string;
    icon: string;
    color?: string;
    tooltip?: string;
    /** 링크 주소. 함수면 행마다 만든다. 있으면 `row-action`을 취소하지 않을 때 이 주소로 이동한다 */
    href?: string | ((item: DataTableItem) => string);
    /** 행마다 보일지. 없으면 항상 보인다 (원본 ApiKeys·Channels 처럼 상태에 따라 버튼을 바꿀 때) */
    visible?: (item: DataTableItem) => boolean;
}
export type DataTableColumnType = 'text' | 'name' | 'status' | 'chips' | 'date' | 'number' | 'actions' | 'switch' | 'score';
export interface DataTableHeader {
    title: string;
    key: string;
    type?: DataTableColumnType;
    width?: number | string;
    /**
     * 최대 폭. 긴 문구 열(예: 원본 FAQ 답변 미리보기 420px)이 표를 옆으로 밀지 않게 한다. name 열은 넘치면 말줄임.
     * 표가 카드 폭을 채우고도 남는 폭은 브라우저가 열에 나눠 주므로, 넓은 화면에서는 이 값보다 넓어질 수 있다.
     */
    maxWidth?: number | string;
    align?: 'start' | 'center' | 'end';
    sortable?: boolean;
    /** `name` 열: 이름 아래 보조 문구로 쓸 필드 */
    subKey?: string;
    /** `name` 열: 앞 아바타 아이콘 (MDI 이름) */
    avatarIcon?: string;
    /** `name` 열: 아바타 테마 색 */
    avatarColor?: string;
    /**
     * 셀 값을 행에서 만드는 함수. 표시·정렬·검색에 모두 쓴다 (없으면 `item[key]`).
     * 예: 객체 배열 → 문자열 배열(`chips`), 코드 → 번역된 문구(`text`)
     */
    value?: (item: DataTableItem) => unknown;
    /** `status` 열: 값별 칩 모양 */
    statusMap?: Record<string, StatusStyle>;
    /** `status` 열: statusMap 에 없는 값의 색·아이콘. 없으면 회색 */
    statusFallback?: Pick<Partial<StatusStyle>, 'color' | 'icon'>;
    /** `chips` 열: 칩 앞 아이콘 (MDI 이름) */
    chipIcon?: string;
    /** `chips` 열: 칩 모양. 기본 outlined */
    chipVariant?: ChipListVariant;
    /** `chips` 열: 칩 크기. 기본 x-small */
    chipSize?: StatusChipSize;
    /** `chips` 열: 칩 테마 색 */
    chipColor?: string;
    /** `number` 열: `Intl.NumberFormat` 옵션 (언어는 패키지 언어를 따른다) */
    numberFormat?: Intl.NumberFormatOptions;
    /** `switch` 열: 켜짐 색. 기본 success */
    switchColor?: string;
    /** `score` 열: 값의 최댓값. 기본 100 (원본 FAQ 도움 비율은 0~1 이라 1). 값이 숫자가 아니면 빈 막대 */
    scoreMax?: number;
    /** `score` 열: 막대 옆 문구 (원본 FAQ "도움 수 / 전체") */
    scoreText?: (item: DataTableItem) => string;
    /** `score` 열: 막대 색. 함수면 행마다 (원본 FAQ: 피드백 없으면 grey, 0.7 이상 success, 0.4 이상 warning, 그 밖 error) */
    scoreColor?: string | ((item: DataTableItem) => string);
    /** `actions` 열: 행 액션 버튼 */
    actions?: RowActionDef[];
}
/** 정렬 기준 하나 (`sortBy`) */
export interface DataTableSortItem {
    key: string;
    order: 'asc' | 'desc';
}
/** 페이지·정렬 상태 (`page-change`·`sort-change` detail[0]) */
export interface DataTableOptions {
    page: number;
    itemsPerPage: number;
    sortBy: DataTableSortItem[];
}
/** 진행 중으로 표시할 셀: 행 id(`item-value` 필드 값)와 액션 이름 또는 `switch` 열 key */
export interface DataTableBusyCell {
    id: string | number;
    target: string;
}
export type DataTableItem = Record<string, unknown>;
/** `row-action` 이벤트 detail[0]. 링크 액션이 아니면 href 는 '' */
export interface RowActionPayload {
    action: string;
    item: DataTableItem;
    href: string;
}
/** `switch-change` 이벤트 detail[0] */
export interface SwitchChangePayload {
    key: string;
    item: DataTableItem;
    value: boolean;
}
/** 요소 안 오버레이(다이얼로그·메뉴·툴팁)를 여는 위치 (REQ-004) */
export type OverlayTarget = 'self' | 'body';
export interface SmartviewPageHeaderProps {
    heading?: string;
    subtitle?: string;
    /** 있으면 뒤로 가기 버튼을 보인다 */
    backHref?: string;
    /** 주 액션 버튼 문구. 없으면 버튼을 숨긴다 */
    actionText?: string;
    actionIcon?: string;
    /** 주 액션 버튼을 비활성으로 둔다 (예: 권한 없음, 처리 중) */
    actionDisabled?: boolean;
}
export interface SmartviewPageHeaderEvents {
    action: [];
    /**
     * 뒤로 버튼을 눌렀을 때. 취소 가능하다(`event.preventDefault()`): 취소하면 back-href 로 이동하지 않는다.
     * 라우터가 있는 앱은 취소하고 자기 라우터로 이동한다.
     */
    back: [payload: {
        href: string;
    }];
}
export type SectionCardVariant = 'elevated' | 'outlined';
export interface SmartviewCardProps {
    heading?: string;
    /** 제목 앞 아이콘 (MDI 이름). 없으면 숨긴다 */
    icon?: string;
    /** 제목 옆 개수 칩. 속성이 없으면 숨긴다 (0 은 보인다) */
    count?: number;
    /** 'elevated'(기본, 원본과 같은 그림자) | 'outlined' */
    variant?: SectionCardVariant;
    /** 제목 오른쪽 tonal 버튼 문구 (원본의 "백엔드 추가" 등). 없으면 숨긴다 */
    actionText?: string;
    actionIcon?: string;
    actionDisabled?: boolean;
}
export interface SmartviewCardEvents {
    action: [];
}
/** 탭 하나 (Tabs, TabbedCard) */
export interface TabItem {
    value: string;
    label: string;
    /** 글자 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 비활성 탭은 누를 수 없고 키보드 포커스도 건너뛴다 */
    disabled?: boolean;
}
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export interface SmartviewHintBannerProps {
    /** 안내 문구. 줄바꿈(\n)마다 문단을 나눈다. 비면 아무것도 그리지 않는다 */
    text?: string;
    /** 색·아이콘 종류. 기본 info */
    type?: AlertType;
    /** 앞 아이콘 (MDI 이름). 기본 mdi-information-outline */
    icon?: string;
}
export type SmartviewHintBannerEvents = Record<never, never>;
export interface SmartviewModalProps {
    open?: boolean;
    heading?: string;
    /** 제목 앞 아이콘 (MDI 이름). 없으면 숨긴다 */
    icon?: string;
    /** 제목 아이콘 테마 색. 기본 primary */
    iconColor?: string;
    /** 최대 폭 (px 숫자 또는 CSS 길이). 기본 620 */
    maxWidth?: number | string;
    /** 바깥 클릭·Esc 를 cancel 로 알린다. 없으면(기본) 반응하지 않는다 (원본의 persistent) */
    dismissible?: boolean;
    /** 저장 중. 확정 버튼에 로딩 표시를 하고 다시 확정되지 않는다 */
    loading?: boolean;
    /** 확정 버튼 문구. 없으면 "Save"/"저장" */
    confirmText?: string;
    /** 취소 버튼 문구. 없으면 "Cancel"/"취소" */
    cancelText?: string;
    confirmDisabled?: boolean;
    /** 왼쪽 보조 tonal 버튼 문구 (원본 Plugins 의 "검증"). 없으면 숨긴다 */
    secondaryText?: string;
    secondaryIcon?: string;
    secondaryLoading?: boolean;
    secondaryDisabled?: boolean;
    overlayTarget?: OverlayTarget;
}
export interface SmartviewModalEvents {
    confirm: [];
    /** 취소 버튼, 또는 dismissible 일 때 바깥 클릭·Esc */
    cancel: [];
    secondary: [];
}
/** 스낵바 위치 (Vuetify location 값 중 화면 가장자리 위치) */
export type SnackbarLocation = 'top' | 'bottom' | 'top left' | 'top right' | 'top center' | 'bottom left' | 'bottom right' | 'bottom center';
export interface SmartviewToastProps {
    /** 화면 위치. 기본 'top right' (원본과 같음) */
    location?: SnackbarLocation;
    overlayTarget?: OverlayTarget;
}
export type SmartviewToastEvents = Record<never, never>;
export type StatCardAccent = 'blue' | 'cyan' | 'green' | 'red' | 'orange';
export interface SmartviewStatCardProps {
    label?: string;
    value?: string | number;
    caption?: string;
    icon?: string;
    /** 아이콘 원의 테마 색 */
    color?: string;
    /** 오른쪽 장식 그라디언트 색. 원본 대시보드가 쓰는 다섯 가지 */
    accent?: StatCardAccent;
    /** 여러 장을 나란히 둘 때 등장 애니메이션 지연 계산용 순번 */
    index?: number;
    /** 있으면 카드 전체가 링크가 된다. navigate 이벤트를 취소하지 않으면 이 주소로 이동한다 */
    href?: string;
    /**
     * decorated(기본): 원본 대시보드 카드 — 오른쪽 방사형 장식, 52px 아이콘, hover 때 떠오르며 그림자·아이콘 확대.
     * plain: 원본 Supervisor metric 카드 — 장식 없음, 48px 아이콘, hover 때 조금 떠오르기만 한다.
     */
    variant?: StatCardVariant;
}
export type StatCardVariant = 'decorated' | 'plain';
export interface SmartviewStatCardEvents {
    /** 링크 카드(href)를 눌렀을 때. 취소 가능: `preventDefault()`하면 이동하지 않는다 (라우터 앱) */
    navigate: [payload: {
        href: string;
    }];
}
/** 필터 바의 선택 필터 하나 */
export interface FilterDef {
    key: string;
    label: string;
    items: SelectItem[];
    /** 입력칸 앞 아이콘 (MDI 이름). 기본 mdi-filter-variant */
    icon?: string;
}
/** 필터 바의 켜기/끄기 스위치 하나 (원본 FAQ "사용 중만") */
export interface FilterSwitchDef {
    key: string;
    label: string;
}
/** 필터 값: 선택 필터는 항목 value(문자열), 스위치는 Boolean */
export type FilterValue = string | boolean;
/** `filter-change` 이벤트 detail[0] */
export interface FilterChangePayload {
    key: string;
    value: FilterValue;
}
export interface SmartviewFilterBarProps {
    /** 선택 필터 (프로퍼티). 비어 있으면 필터 칸이 없다 */
    filters?: FilterDef[];
    /** 스위치 (프로퍼티). 새로고침 버튼 왼쪽에 놓인다 */
    switches?: FilterSwitchDef[];
    /** 필터·스위치의 값 (프로퍼티). key → 값. 요소는 이 값에서 시작하고 이후 입력은 스스로 들고 있다 */
    values?: Record<string, FilterValue>;
    search?: string;
    searchLabel?: string;
    loading?: boolean;
    /** 기본값이 true 인 Boolean 은 HTML 속성으로 끌 수 없으므로 부정형 이름을 쓴다 */
    hideRefresh?: boolean;
    /** 필터 메뉴를 여는 위치 ('body' 기본: 공용 오버레이 호스트, 'self': 요소 안) */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewFilterBarEvents {
    /** 필터를 고르거나 스위치를 눌렀을 때 */
    'filter-change': [payload: FilterChangePayload];
    'search-change': [value: string];
    refresh: [];
}
export interface SmartviewDataTableProps {
    /** 열 정의 (프로퍼티) */
    headers?: DataTableHeader[];
    /** 행 데이터 (프로퍼티) */
    items?: DataTableItem[];
    loading?: boolean;
    search?: string;
    /** 행을 구분하는 필드 이름 */
    itemValue?: string;
    /** 페이지당 행 수. -1 이면 모두 */
    itemsPerPage?: number;
    /** 현재 페이지 (1부터). 바꾸면 그 페이지로 간다 */
    page?: number;
    /** 정렬 기준 (프로퍼티). 원본 Routes 는 우선순위 내림차순, ApiKeys 는 만든 시각 내림차순으로 시작한다 */
    sortBy?: DataTableSortItem[];
    /**
     * 서버 페이지 모드: 전체 행 수. 주면 items 를 현재 페이지로 보고 정렬·검색·자르기를 하지 않는다.
     * 호스트는 `page-change`·`sort-change`를 받아 해당 페이지를 불러와 items 를 바꾼다.
     */
    serverItemsLength?: number;
    /** 행을 누르면(또는 행에서 Enter) `row-click`을 보낸다. 행 안 버튼·스위치·링크를 누른 것은 제외 */
    rowClickable?: boolean;
    /** 맨 앞에 여러 행 고르기 체크박스 열(폭 32px 고정)을 둔다. 머리글 체크박스는 지금 페이지의 행을 모두 고르거나 푼다 */
    selectable?: boolean;
    /** 고른 행의 item-value 값 (프로퍼티). 프로퍼티는 현재 값. 다른 페이지로 옮겨도 유지한다 */
    selected?: unknown[];
    /** 진행 중으로 표시할 셀 (프로퍼티): 행 액션 버튼·스위치에 로딩 표시, 이때 누르면 무시 */
    busy?: DataTableBusyCell[];
    emptyIcon?: string;
    emptyTitle?: string;
    emptyHint?: string;
    /** 빈 상태의 액션 버튼 문구. 없으면 버튼을 숨긴다 */
    emptyActionText?: string;
    /** 있으면 빈 상태 액션이 링크가 된다. `empty-action`을 취소하지 않으면 이 주소로 이동한다 */
    emptyActionHref?: string;
    /** 행 액션 툴팁·페이지당 행 수 메뉴를 여는 위치 ('body' 기본: 공용 오버레이 호스트, 'self': 요소 안) */
    overlayTarget?: OverlayTarget;
    /** 카드 틀(그림자·모서리) 없이 표만 그린다. 다른 카드 안에 둘 때 (다른 요소) */
    flat?: boolean;
    /** 아래 줄(페이지당 행·페이지 단추)을 숨긴다. 모든 행을 한 번에 보이거나 호스트가 페이지를 따로 다룰 때 (다른 요소) */
    hideFooter?: boolean;
}
export interface SmartviewDataTableEvents {
    /** 행 액션 버튼. 취소 가능: 링크 액션이면 `preventDefault()`로 이동을 막는다 */
    'row-action': [payload: RowActionPayload];
    'row-click': [payload: {
        item: DataTableItem;
    }];
    /** 사용자가 정렬을 바꿨을 때 */
    'sort-change': [options: DataTableOptions];
    /** 사용자가 페이지나 페이지당 행 수를 바꿨을 때 */
    'page-change': [options: DataTableOptions];
    /** 스위치를 눌렀을 때. 요소는 값을 바꾸지 않는다: 호스트가 저장한 뒤 items 를 바꿔야 스위치가 바뀐다 */
    'switch-change': [payload: SwitchChangePayload];
    /** 빈 상태 액션 버튼. 취소 가능: empty-action-href 가 있으면 `preventDefault()`로 이동을 막는다 */
    'empty-action': [payload: {
        href: string;
    }];
    /** 사용자가 행 체크박스·머리글 체크박스로 고른 행을 바꿨을 때 [고른 행의 item-value 값 배열] (selectable) */
    'selection-change': [selected: unknown[]];
}
export interface SmartviewPromptProps {
    open?: boolean;
    heading?: string;
    message?: string;
    warning?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    /** 확인 버튼·아이콘 테마 색. 원본 ETL 은 실행 확인에 success, 위험 SQL 확인에 warning 을 썼다 */
    color?: string;
    loading?: boolean;
    /** 바깥 클릭·Esc 로 닫기(cancel 이벤트)를 허용한다 */
    dismissible?: boolean;
    /**
     * 'body'(기본): <body> 수준 공용 호스트에서 연다 (transform·쌓임 맥락에 갇히지 않음).
     *   슬롯 내용은 열린 동안 슬롯 브리지로 공용 호스트에 옮겨 보이고, 닫히면 요소 안으로 돌아온다.
     * 'self': 요소의 Shadow Root 안에서 연다.
     */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewPromptEvents {
    confirm: [];
    cancel: [];
}
/** 빈 상태 크기. 'compact' 는 한 줄 문구만 (대시보드 카드 안 등) */
export type EmptyStateSize = 'default' | 'compact';
export interface SmartviewEmptyStateProps {
    /** 아이콘 (MDI 이름). compact 에서는 보이지 않는다 */
    icon?: string;
    /** 제목. 없으면 "No data"/"데이터가 없습니다" */
    heading?: string;
    /** 제목 아래 설명 */
    hint?: string;
    /** 액션 버튼 문구. 없으면 숨긴다 (compact 에서는 보이지 않는다) */
    actionText?: string;
    actionIcon?: string;
    /** 있으면 액션이 링크가 된다. action 이벤트를 취소하지 않으면 이 주소로 이동한다 */
    actionHref?: string;
    size?: EmptyStateSize;
}
export interface SmartviewEmptyStateEvents {
    /** 액션 버튼. action-href 가 있으면 취소 가능하다 (`event.preventDefault()` 하면 이동하지 않는다) */
    action: [payload: {
        href: string;
    }];
}
export type StatusChipSize = 'x-small' | 'small' | 'default';
export interface SmartviewBadgeProps {
    /** 상태 값. statusMap 에서 이 값으로 모양을 찾는다 */
    status?: string;
    /** 상태 값 → 모양 (프로퍼티). 없는 값은 회색 + 값 그대로 */
    statusMap?: Record<string, StatusStyle>;
    /** 직접 준 색. statusMap 보다 우선한다 */
    color?: string;
    /** 직접 준 아이콘 (MDI 이름). statusMap 보다 우선한다 */
    icon?: string;
    /** 직접 준 라벨. statusMap 보다 우선한다 */
    label?: string;
    size?: StatusChipSize;
}
export type SmartviewBadgeEvents = Record<never, never>;
export type ChipListVariant = 'outlined' | 'tonal' | 'flat' | 'text';
/** 정보 목록 한 줄 */
export interface InfoRow {
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 항목 이름 (버전, 가동 시간, 사용자 ID …) */
    label: string;
    /** 값. 비었거나 문자열·숫자·Boolean 이 아니면 '-' */
    value?: string | number | boolean | null;
    /** 있으면 값을 이 테마 색의 tonal 칩으로 보인다 (원본 대시보드 상태: healthy → success) */
    chip?: string;
}
/**
 * value-right: 이름 왼쪽, 값 오른쪽 (원본 대시보드 상태·시스템 런타임).
 * title-subtitle: 값이 제목, 이름이 아래 부제 (원본 계정 모달).
 */
export type InfoListLayout = 'value-right' | 'title-subtitle';
export interface SmartviewInfoListProps {
    /** 줄 목록 (프로퍼티) */
    rows?: InfoRow[];
    layout?: InfoListLayout;
}
export type SmartviewInfoListEvents = Record<never, never>;
export interface SmartviewRefreshedAtProps {
    /** 갱신 시각 (ISO 8601). 시간대 표기가 없으면 UTC 로 본다. 로컬 시각 HH:mm:ss 로 보인다. 비었거나 해석할 수 없으면 --:--:-- */
    time?: string;
}
export type SmartviewRefreshedAtEvents = Record<never, never>;
/** 입력 요소가 공통으로 받는 속성 */
export interface SmartviewInputCommonProps {
    label?: string;
    hint?: string;
    /** 호스트가 주는 오류 문구 (서버 검증 등) */
    errorMessage?: string;
    /** 비었으면 <form> 제출을 막고, 입력칸을 떠나면 "필수 항목" 문구를 보인다 */
    required?: boolean;
    disabled?: boolean;
}
export interface SmartviewPasswordFieldProps extends SmartviewInputCommonProps {
    value?: string;
    /** 기본 current-password (로그인). 새 비밀번호 입력이면 new-password */
    autocomplete?: string;
    placeholder?: string;
}
export interface SmartviewPasswordFieldEvents {
    /** 입력할 때마다 */
    input: [value: string];
    /** 값을 바꾸고 입력칸을 떠났을 때 */
    change: [value: string];
}
export interface SmartviewMultiPicklistProps extends SmartviewInputCommonProps {
    /** 태그 목록 (프로퍼티) */
    value?: string[];
    /** 입력칸 앞 아이콘 (MDI 이름). 원본: IP 는 mdi-ip-network-outline, 경로는 mdi-slash-forward */
    icon?: string;
    /** 한 번에 여러 태그를 나누는 문자. 기본 쉼표. Enter 로도 추가한다 */
    separator?: string;
    /** 고를 수 있는 제안 목록 (프로퍼티). 없으면 목록 없이 입력만 */
    suggestions?: string[];
    /** 제안 목록 메뉴를 여는 위치 ('body' 기본: 공용 오버레이 호스트, 'self': 요소 안) */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewMultiPicklistEvents {
    /** 태그를 더하거나 뺄 때마다 */
    input: [value: string[]];
    /** 태그 목록이 바뀌었을 때 (태그 입력은 더하고 빼는 즉시 확정이라 input 과 같은 때) */
    change: [value: string[]];
}
/** 반복 행 입력칸 종류. 값: text·select → 문자열, number → 숫자|null, tags → 문자열 배열, switch·checkbox → Boolean */
export type RepeatableColumnType = 'text' | 'number' | 'select' | 'tags' | 'switch' | 'checkbox';
/** 반복 행의 열(행 안의 입력칸) 하나 */
export interface RepeatableColumn {
    key: string;
    type?: RepeatableColumnType;
    /** 입력칸 라벨. inline 원본(테이블 컬럼)처럼 라벨 없이 placeholder 만 쓸 수도 있다 */
    label?: string;
    placeholder?: string;
    /** 입력칸 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 12칸 격자에서 차지하는 칸 수. 없으면 남은 칸을 나눈다. 요소가 좁으면 모두 한 줄 */
    span?: number;
    /** select 항목 */
    items?: SelectItem[];
    /** 비었으면 <form> 제출을 막는다 */
    required?: boolean;
    /** 새 행의 값. 없으면 종류별 빈 값 */
    defaultValue?: unknown;
}
/** inline: 행이 한 줄 입력칸 묶음 (원본 백엔드·테이블 컬럼). card: 행마다 테두리 카드 (원본 pre-chat 필드) */
export type RepeatableLayout = 'inline' | 'card';
export interface SmartviewRepeatableRowsProps extends SmartviewInputCommonProps {
    /** 열 선언 (프로퍼티) */
    columns?: RepeatableColumn[];
    /** 행 목록 (프로퍼티) */
    value?: Record<string, unknown>[];
    /** 추가 버튼 문구. 비우면 "Add row"/"행 추가" */
    addText?: string;
    /** 이 수보다 적게는 지울 수 없다. 행이 적으면 빈 행으로 채운다 (원본 백엔드는 1) */
    minRows?: number;
    /** 행이 없을 때 문구 */
    emptyText?: string;
    layout?: RepeatableLayout;
    /** 삭제 버튼 아이콘. 기본 mdi-close (원본 백엔드·테이블), pre-chat 은 mdi-delete-outline */
    removeIcon?: string;
    /** 선택·태그 목록 메뉴와 툴팁을 여는 위치 ('body' 기본: 공용 오버레이 호스트, 'self': 요소 안) */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewRepeatableRowsEvents {
    /** 입력하거나 행을 더하고 지울 때마다 (모든 행) */
    input: [value: Record<string, unknown>[]];
    /** 값을 바꾸고 입력칸을 떠났을 때, 행을 더하거나 지웠을 때 (모든 행) */
    change: [value: Record<string, unknown>[]];
}
/** 칩 선택 항목 하나 */
export interface ChipSelectOption {
    value: string;
    /** 없으면 value */
    label?: string;
    /** 칩 테마 색. 기본 primary */
    color?: string;
}
/** 미리 정한 항목: http-methods = 원본 API Gateway 의 GET·POST·PUT·PATCH·DELETE·HEAD·OPTIONS 와 메서드 색 */
export type ChipSelectPreset = 'http-methods';
export interface SmartviewCheckboxButtonGroupProps extends SmartviewInputCommonProps {
    /** 항목 (프로퍼티). 비어 있고 preset 이 있으면 preset 항목 */
    options?: ChipSelectOption[];
    preset?: ChipSelectPreset | '';
    /** 고른 값 (프로퍼티). 항목 순서로 정리한다 */
    value?: string[];
}
export interface SmartviewCheckboxButtonGroupEvents {
    /** 칩을 켜거나 끌 때마다 (고른 값, 항목 순서) */
    input: [value: string[]];
    /** 같은 때 (고르는 즉시 확정) */
    change: [value: string[]];
}
export type SmartviewDotState = 'ok' | 'error' | 'unknown';
/** 드로어 메뉴 항목 (원본 navItems) */
export interface SmartviewNavItem {
    /** 항목 식별자. current 와 navigate detail 에 쓴다 */
    key: string;
    label: string;
    /** mdi 아이콘 이름 */
    icon?: string;
    /** 링크 주소. 누르면 취소 가능한 navigate 를 보내고, 취소하지 않으면 브라우저가 이동한다 */
    href?: string;
}
/** 드로어 하단 추가 메뉴 (원본 내 계정·Setup·로그아웃) */
export interface SmartviewNavFooterItem {
    key: string;
    label: string;
    icon?: string;
    /** 글자·아이콘 색 (원본 로그아웃 error) */
    color?: string;
}
/** 브레드크럼 항목 (원본 Home > 현재 메뉴) */
export interface SmartviewBreadcrumb {
    label: string;
    /** 링크 주소. 마지막 항목(지금 화면)은 링크로 그리지 않는다 */
    href?: string;
}
export interface SmartviewAppShellProps {
    /** 드로어 메뉴 (프로퍼티, <다른 요소> items) */
    items?: SmartviewNavItem[];
    /** 드로어 하단 추가 메뉴 (프로퍼티) */
    footerItems?: SmartviewNavFooterItem[];
    brandName?: string;
    brandIcon?: string;
    version?: string;
    /** 지금 화면의 메뉴 key */
    current?: string;
    /** 드로어 접힘. 프로퍼티는 현재 값 */
    rail?: boolean;
    /** 브레드크럼 (프로퍼티, <다른 요소> breadcrumbs) */
    breadcrumbs?: SmartviewBreadcrumb[];
    /** 서버 연결 상태. 비우면 칩을 숨긴다 */
    status?: '' | SmartviewDotState;
    statusLabel?: string;
    showHelp?: boolean;
    /** 스낵바 위치. 기본 top right (원본 ETL·GW), CHAT 은 bottom right */
    snackbarLocation?: SnackbarLocation;
    /** 툴팁·메뉴·스낵바를 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewAppShellEvents {
    /**
     * 드로어 메뉴나 브레드크럼 링크를 눌렀을 때. 취소 가능하다 (Q-05). source 로 어디서 눌렀는지 구분한다.
     * 드로어는 key, 브레드크럼은 label·index 가 함께 온다.
     */
    navigate: [payload: {
        source: 'drawer' | 'breadcrumb';
        href: string;
        key?: string;
        label?: string;
        index?: number;
    }];
    /** 드로어 접기 메뉴나 상단 바 메뉴 버튼으로 rail 을 바꿨을 때 */
    'rail-change': [rail: boolean];
    /** 드로어 하단 추가 메뉴 */
    'footer-action': [item: {
        key: string;
    }];
    /** 상단 바 도움말 버튼 */
    help: [];
}
export interface SmartviewLoginProps {
    /** 제품 이름 (카드 제목) */
    productName?: string;
    /** 제품 아이콘 (mdi, 로고 원 안) */
    productIcon?: string;
    /** 제목 아래 문구. 비우면 "Sign in to the admin console" */
    subtitle?: string;
    /** 로그인 처리 중: 입력칸·버튼 비활성, 버튼 로딩, submit 을 보내지 않는다 */
    loading?: boolean;
    /** 로그인 실패 문구 (닫기 버튼으로 숨기면 프로퍼티가 비워진다) */
    errorMessage?: string;
    /** 카드 아래 보안 안내 (원본 "JWT 인증으로 보호됩니다"). 비우면 숨긴다 */
    securedText?: string;
}
export interface SmartviewLoginEvents {
    /** 로그인 버튼·Enter. 두 칸이 모두 채워졌을 때만 보낸다. 인증은 호스트가 한다 */
    submit: [credentials: {
        username: string;
        password: string;
    }];
}
export type StateNoticeType = 'info' | 'warning' | 'error';
export interface SmartviewStateNoticeProps {
    /** info(다른 시스템이 관리), warning(미설치), error(조회 실패). 기본 info */
    type?: StateNoticeType;
    /** 굵은 첫 줄 */
    heading?: string;
    /** 설명 */
    text?: string;
    /** 아이콘 (mdi). 비우면 종류별 원본 아이콘 */
    icon?: string;
    /** 이동 버튼 문구. 없으면 버튼을 숨긴다 */
    actionText?: string;
    /** 이동 버튼 링크. 누르면 취소 가능한 action 을 보낸다 */
    actionHref?: string;
    /** 이동 버튼 아이콘. 기본 mdi-arrow-right */
    actionIcon?: string;
}
export interface SmartviewStateNoticeEvents {
    /** 이동 버튼. 취소 가능하다: href 가 있으면 취소하지 않을 때 그리로 이동한다 */
    action: [payload: {
        href: string;
    }];
}
export interface SmartviewTabsProps {
    /** 탭 목록 (프로퍼티) */
    tabs?: TabItem[];
    /** 현재 탭 값. 프로퍼티는 현재 값. 없거나 비활성 탭이면 첫 번째 활성 탭을 보인다 */
    tab?: string;
}
export interface SmartviewTabsEvents {
    /** 사용자가 다른 탭을 골랐을 때. 값은 새 탭의 value */
    'tab-change': [value: string];
}
/** 입력칸 종류 (네이티브 <input type>). 비밀번호 표시 토글이 필요하면 smartview-password-field */
export type InputType = 'text' | 'email' | 'number' | 'url' | 'tel' | 'search' | 'password';
/** 입력칸 높이. comfortable 48px(원본 기본), compact 40px(원본 필터·격자) */
export type InputDensity = 'comfortable' | 'compact';
export interface SmartviewInputProps extends SmartviewInputCommonProps {
    /** 값. 프로퍼티는 현재 값 (number 도 문자열) */
    value?: string;
    /** 기본 text. email·url·number 는 형식·범위가 틀리면 떠난 뒤 문구를 보이고 제출을 막는다 */
    type?: InputType;
    placeholder?: string;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 브라우저 자동 완성 (네이티브 autocomplete). 비우면 넣지 않는다 */
    autocomplete?: string;
    /** 입력칸 앞 아이콘 (MDI 이름). 원본 입력칸의 prepend-inner-icon */
    icon?: string;
    /** 값 지우기 버튼 */
    clearable?: boolean;
    /** 입력칸 안 끝 글자 (단위 등, 예: 초·ms) */
    suffix?: string;
    /** number 최솟값 */
    min?: number;
    /** number 최댓값 */
    max?: number;
    /** number 간격 (기본 1, 네이티브와 같다) */
    step?: number;
    /** 최대 글자 수 (그 이상은 입력되지 않는다) */
    maxlength?: number;
    /** 값 형식 정규식 (네이티브 pattern, 값 전체와 맞아야 한다) */
    pattern?: string;
    /** 기본 comfortable */
    density?: InputDensity;
}
export interface SmartviewInputEvents {
    /** 입력할 때마다 (지우기 버튼 포함) */
    input: [value: string];
    /** 값을 바꾸고 입력칸을 떠났을 때, 지우기 버튼을 눌렀을 때 */
    change: [value: string];
}
export interface SmartviewCheckboxToggleProps extends SmartviewInputCommonProps {
    /** 켜짐. 프로퍼티는 현재 상태 (사용자가 바꾸면 바뀐다) */
    checked?: boolean;
    /** 켜져 있을 때 <form> 에 제출할 값 (네이티브 체크박스처럼 꺼져 있으면 제출하지 않는다). 기본 'on' */
    value?: string;
    /** 읽기 전용: 바꿀 수 없다 (비활성처럼 흐리지 않는다) */
    readonly?: boolean;
    /** 켜졌을 때 스위치 옆 글자. 비우면 "Enabled"/"사용" */
    messageToggleActive?: string;
    /** 꺼졌을 때 스위치 옆 글자. 비우면 "Disabled"/"사용 안 함" */
    messageToggleInactive?: string;
    /** 스위치 옆 글자를 화면에서 숨긴다 (스크린 리더는 읽는다) */
    hideStatusText?: boolean;
    /** 켜졌을 때 테마 색. 기본 success (원본) */
    color?: string;
}
export interface SmartviewCheckboxToggleEvents {
    /** 스위치를 바꿀 때마다 (켜짐 여부) */
    input: [checked: boolean];
    /** 스위치를 바꿨을 때 (토글은 바꾸는 즉시 확정이라 input 과 같은 때) */
    change: [checked: boolean];
}
/** 스피너 크기 (LightningSpinner size). xx-small 16px, x-small 20px, small 24px, medium 32px, large 64px */
export type SpinnerSize = 'xx-small' | 'x-small' | 'small' | 'medium' | 'large';
export interface SmartviewSpinnerProps {
    /** 기본 medium (32px, 원본 v-progress-circular 기본) */
    size?: SpinnerSize;
    /** 색: brand(primary, 원본 기본) · base(글자색) · inverse(흰색, 어두운 바탕 위). 기본 brand */
    variant?: 'brand' | 'base' | 'inverse';
    /** 가장 가까운 position 조상을 반투명으로 덮고 가운데에 돈다 (영역 로딩) */
    overlay?: boolean;
    /** 스크린 리더가 읽는 글자. 비우면 "Loading"/"불러오는 중" */
    alternativeText?: string;
}
export type SmartviewSpinnerEvents = Record<never, never>;
export interface SmartviewTextareaProps extends SmartviewInputCommonProps {
    /** 값. 프로퍼티는 현재 값 */
    value?: string;
    placeholder?: string;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 처음 줄 수. 기본 3 */
    rows?: number;
    /** 입력에 맞춰 높이가 늘어난다 (원본 auto-grow) */
    autoGrow?: boolean;
    /** 최대 글자 수. 있으면 아래에 글자 수(n / 최대)를 보이고 그 이상은 입력되지 않는다 */
    maxlength?: number;
    /** 최소 글자 수. 비어 있지 않은데 모자라면 떠난 뒤 문구를 보이고 제출을 막는다 */
    minlength?: number;
    /** 입력칸 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 기본 comfortable */
    density?: InputDensity;
}
export interface SmartviewTextareaEvents {
    /** 입력할 때마다 */
    input: [value: string];
    /** 값을 바꾸고 입력칸을 떠났을 때 */
    change: [value: string];
}
/** 콤보박스 항목 (LightningCombobox SelectOption) */
export interface ComboboxOption {
    label: string;
    value: string;
    /** 고를 수 없다 */
    disabled?: boolean;
    /** 같은 group 끼리 머리글 아래에 묶는다 (처음 나온 순서) */
    group?: string;
    /** 항목 앞 아이콘 (MDI 이름) */
    icon?: string;
    /**
     * 이 항목을 골라도 목록을 닫지 않는다. 호스트가 change 를 받아 항목을 바꿔 다음 단계를 고르게 할 때
     * (예: 폴더를 고르면 그 폴더 내용으로). keepOpen 이 아닌 항목을 고르면 닫는다 (WI-6.017b)
     */
    keepOpen?: boolean;
}
export interface SmartviewComboboxProps extends SmartviewInputCommonProps {
    /** 고른 항목의 value. 프로퍼티는 현재 값 */
    value?: string;
    /** 항목 (프로퍼티) */
    options?: ComboboxOption[];
    /** 글자를 쳐서 항목을 거른다. 기본은 목록에서 고르기만 (LWC lightning-combobox, 원본 v-select) */
    searchable?: boolean;
    placeholder?: string;
    /** 읽기 전용: 목록을 열지 않는다 (값은 제출된다) */
    readonly?: boolean;
    /** 값 지우기 버튼 */
    clearable?: boolean;
    /** 입력칸 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 기본 comfortable */
    density?: InputDensity;
    /** 목록 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewComboboxEvents {
    /** 항목을 고르거나 지웠을 때 (고르는 즉시 확정이라 change 와 같은 때) */
    input: [value: string];
    /** 항목을 고르거나 지웠을 때 */
    change: [value: string];
}
/** 버튼 모양 (LightningButton variant) */
export type ButtonVariant = 'neutral' | 'brand' | 'outline-brand' | 'destructive' | 'destructive-text' | 'success' | 'base';
export interface SmartviewButtonProps {
    /** 글자. 기본 슬롯이 있으면 슬롯이 앞선다 */
    label?: string;
    /** 기본 neutral (테두리) */
    variant?: ButtonVariant;
    /** 아이콘 (MDI 이름) */
    iconName?: string;
    /** 아이콘 위치. 기본 left */
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    /** 진행 중: 글자 대신 원이 돌고 누를 수 없다 (원본 저장 중 버튼) */
    loading?: boolean;
    /** submit·reset 이면 요소가 속한 호스트 <form> 을 제출·초기화한다. 기본 button */
    type?: 'button' | 'submit' | 'reset';
    /** 줄 폭을 꽉 채운다 */
    stretch?: boolean;
}
/** 버튼은 네이티브 click 을 쓴다 (detail 없음). 비활성·진행 중·<fieldset disabled> 이면 호스트에서 막는다 */
export type SmartviewButtonEvents = Record<never, never>;
export interface SmartviewCheckboxProps extends SmartviewInputCommonProps {
    /** 켜짐. 프로퍼티는 현재 상태 (사용자가 바꾸면 바뀐다) */
    checked?: boolean;
    /** 켜져 있을 때 <form> 에 제출할 값 (꺼져 있으면 제출하지 않는다). 기본 'on' */
    value?: string;
    /** 일부 선택(–) 모양. 사용자가 누르면 풀린다 (프로퍼티는 호스트가 다시 넣는다) */
    indeterminate?: boolean;
    /** 읽기 전용: 바꿀 수 없다 */
    readonly?: boolean;
    /** 켜졌을 때 테마 색. 기본 primary */
    color?: string;
}
export interface SmartviewCheckboxEvents {
    /** 바꿀 때마다 (켜짐 여부) */
    input: [checked: boolean];
    /** 바꿨을 때 (바꾸는 즉시 확정이라 input 과 같은 때) */
    change: [checked: boolean];
}
