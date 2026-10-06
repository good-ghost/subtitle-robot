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
/** 차트 유형. 새 유형은 src/charts/registry.ts 에 렌더러를 등록한다 (docs/components/charts.md) */
export type ChartType = 'bar';
/** 계열 색. 테마 토큰에서 나오므로 라이트/다크 전환을 따라간다. neutral 은 비활성·기타(회색) */
export type ChartTone = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
/** 값 표시 형식. percent 는 비율(0.25 → 25%)로 받는다. 형식은 패키지 언어(en/ko)를 따른다 */
export type ChartValueFormat = 'integer' | 'decimal' | 'percent';
/** 차트 계열 하나 (막대 차트에서는 색이 같은 막대 묶음) */
export interface ChartSeries {
    key: string;
    label: string;
    /** categories 와 같은 순서·길이. 숫자가 아닌 값은 0 으로 그린다 */
    values: number[];
    /** 없으면 계열 순서대로 primary, success, error, warning, info, neutral */
    tone?: ChartTone;
}
/** 차트 명세 (Chart·ChartCard 의 chart 프로퍼티) */
export interface ChartSpec {
    type: ChartType;
    /** 막대를 쌓는다 (원본 API_GATEWAY·CHAT_SERVER 활성/비활성). 아니면 계열 막대를 나란히 둔다 (원본 ETL 성공/실패) */
    stacked?: boolean;
    /** 가로축 항목 */
    categories: string[];
    series: ChartSeries[];
    /** 기본 integer (원본 y축 stepSize 1) */
    valueFormat?: ChartValueFormat;
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
export interface SmartviewFormActionsProps {
    /** 저장 버튼 문구. 없으면 "Save"/"저장" (생성·편집에 따라 호스트가 "Create" 등으로 바꾼다) */
    submitText?: string;
    submitIcon?: string;
    /** 저장 중. 저장 버튼에 로딩 표시를 하고 다시 눌리지 않는다 */
    loading?: boolean;
    submitDisabled?: boolean;
    /** 보조 tonal 버튼 문구 (원본의 "연결 테스트"). 없으면 숨긴다 */
    secondaryText?: string;
    secondaryIcon?: string;
    secondaryLoading?: boolean;
    secondaryDisabled?: boolean;
    /** 취소 문구. 없으면 "Cancel"/"취소" */
    cancelText?: string;
    /** 있으면 취소가 링크가 된다. cancel 이벤트를 취소하지 않으면 이 주소로 이동한다 */
    cancelHref?: string;
}
export interface SmartviewFormActionsEvents {
    submit: [];
    secondary: [];
    /** 취소 가능하다(`event.preventDefault()`): 취소하면 cancel-href 로 이동하지 않는다 */
    cancel: [payload: {
        href: string;
    }];
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
export interface SmartviewTabbedCardProps {
    /** 탭 목록 (프로퍼티) */
    tabs?: TabItem[];
    /** 현재 탭 값. 없거나 비활성 탭이면 첫 번째 활성 탭을 보인다 */
    tab?: string;
}
export interface SmartviewTabbedCardEvents {
    /** 사용자가 다른 탭을 골랐을 때. 값은 새 탭의 value */
    'tab-change': [value: string];
}
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export interface SmartviewNotificationProps {
    /** 색·아이콘 종류. 기본 info */
    type?: AlertType;
    /** 굵은 제목 */
    heading?: string;
    /** 본문. 하나면 문단, 여럿이면 목록으로 보인다 (프로퍼티) */
    messages?: string[];
    /** 닫기 버튼을 보인다. 눌러도 스스로 숨지 않고 close 이벤트만 보낸다 */
    closable?: boolean;
}
export interface SmartviewNotificationEvents {
    /** 닫기 버튼. 호스트가 heading·messages 를 비우면 알림이 사라진다 */
    close: [];
}
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
    /** 카드 틀(그림자·모서리) 없이 표만 그린다. 다른 카드 안에 둘 때 (smartview-related-list) */
    flat?: boolean;
    /** 아래 줄(페이지당 행·페이지 단추)을 숨긴다. 모든 행을 한 번에 보이거나 호스트가 페이지를 따로 다룰 때 (smartview-object-browser) */
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
export interface SmartviewNameCellProps {
    /** 1줄: 이름 (굵게). 폭이 모자라면 말줄임 */
    name?: string;
    /** 2줄: 부제 (ID 등, 작고 흐리게). 없으면 1줄만 */
    sub?: string;
    /** 앞 아바타 아이콘 (MDI 이름). 없으면 아바타를 숨긴다 */
    avatarIcon?: string;
    /** 아바타 테마 색. 기본 primary */
    avatarColor?: string;
}
export type SmartviewNameCellEvents = Record<never, never>;
export type ChipListVariant = 'outlined' | 'tonal' | 'flat' | 'text';
export interface SmartviewPillContainerProps {
    /** 칩 문구 (프로퍼티). 문자열·숫자 외 값과 빈 문자열은 뺀다 */
    items?: (string | number)[];
    /** 칩 모양. 기본 outlined (원본 목록 표) */
    variant?: ChipListVariant;
    /** 칩 크기. 기본 x-small */
    size?: StatusChipSize;
    /** 칩 테마 색. 없으면 글자색을 따른다 */
    color?: string;
    /** 칩 앞 아이콘 (MDI 이름). 원본 Services 백엔드 칩의 mdi-server */
    icon?: string;
    /** 빈 목록일 때 보일 문구. 기본 '-' */
    emptyText?: string;
}
export type SmartviewPillContainerEvents = Record<never, never>;
export interface SmartviewButtonIconProps {
    /** 아이콘 (MDI 이름) */
    icon?: string;
    /** 동작 이름. 툴팁(버튼 위)과 aria-label 로 쓴다 */
    label?: string;
    /** 테마 색. 원본 의미: primary 편집, info 테스트, error 삭제, success 실행, warning 전환 */
    color?: string;
    /** 있으면 링크가 된다. action 이벤트를 취소하지 않으면 이 주소로 이동한다 */
    href?: string;
    /** 진행 중 표시. 이때는 눌러도 action 을 보내지 않는다 */
    loading?: boolean;
    disabled?: boolean;
    /** 툴팁을 여는 위치 ('body' 기본: 공용 오버레이 호스트, 'self': 요소 안) */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewButtonIconEvents {
    /** 버튼을 눌렀을 때. href 가 있으면 취소 가능하다 (`event.preventDefault()` 하면 이동하지 않는다) */
    action: [payload: {
        href: string;
    }];
}
export interface SmartviewChartCardProps {
    /** 카드 제목 */
    heading?: string;
    /** 제목 앞 아이콘 (MDI 이름). 기본 mdi-chart-bar */
    icon?: string;
    /** 데이터를 불러오는 중. 차트 대신 가운데 원형 진행 표시 */
    loading?: boolean;
    /** 차트 칸 높이(px, 범례 포함). 기본 300 (원본). 로딩·빈 상태도 같은 높이 */
    height?: number;
    /** 빈 데이터일 때 문구. 비우면 "No data"/"데이터가 없습니다" */
    emptyText?: string;
    /** 차트 명세 (프로퍼티). 없거나 항목·계열이 비면 빈 상태 */
    chart?: ChartSpec | null;
}
export type SmartviewChartCardEvents = Record<never, never>;
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
/**
 * default: 가운데 [이전] [페이지 n / 전체] [다음] (원본 Schedules 실행 이력).
 * compact: 오른쪽 "페이지 n" + 아이콘 버튼 (원본 Database 행 보기).
 */
export type PagerVariant = 'default' | 'compact';
export interface SmartviewPagerProps {
    /** 현재 페이지 (1부터). 요소는 이 값에서 시작하고, 누르면 스스로 옮긴 뒤 page-change 를 보낸다 */
    page?: number;
    /** 전체 페이지 수. 0 이면 모른다(다음 페이지가 있는지는 last-page 로 알린다) */
    pageCount?: number;
    /** 전체 수를 모를 때 현재 페이지가 마지막이다 (원본 Database: 받은 행이 페이지 크기보다 적음) */
    lastPage?: boolean;
    /** 불러오는 중 등. 두 버튼 모두 비활성 */
    disabled?: boolean;
    variant?: PagerVariant;
}
export interface SmartviewPagerEvents {
    /** 이전·다음을 눌렀을 때. 새 페이지 번호 */
    'page-change': [page: number];
}
export interface SmartviewReportTileProps {
    /** 항목 이름 (작은 보조 글자) */
    label?: string;
    /** 값 (크게·굵게). 비었으면 '-' */
    value?: string | number;
}
export type SmartviewReportTileEvents = Record<never, never>;
/** end: 막대 오른쪽에 문구 (원본 FAQ 도움 비율). top: 문구 아래 막대 (원본 Quality 신뢰도) */
export type ScoreTextPosition = 'end' | 'top';
export interface SmartviewProgressBarProps {
    /** 0 ~ 100. 범위 밖은 끝값으로, 숫자가 아니면 0 */
    value?: number;
    /** 막대 테마 색 */
    color?: string;
    /** 막대 옆·위 문구 (예: "7 / 10", "Confidence 85%"). 비우면 없다 */
    text?: string;
    textPosition?: ScoreTextPosition;
    /** 막대 두께(px). 기본 6 (원본 FAQ), Quality 는 8 */
    height?: number;
}
export type SmartviewProgressBarEvents = Record<never, never>;
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
/** 필드 격자의 필드 하나 (서버가 주는 선언. 원본 어댑터 credential_fields 와 같은 이름) */
export interface FieldGridField {
    /** 값 키. <form> 제출 이름으로도 쓴다 */
    name: string;
    /** 라벨. 없으면 name */
    label?: string;
    /** 비밀 값: 가림 입력(password) */
    secret?: boolean;
    required?: boolean;
    placeholder?: string;
    /** 필드 아래 도움말 */
    help_text?: string;
}
export interface SmartviewFieldGridProps extends SmartviewInputCommonProps {
    /** 필드 선언 (프로퍼티) */
    fields?: FieldGridField[];
    /** 필드별 값 (프로퍼티). 없는 필드는 빈 문자열 */
    value?: Record<string, string>;
    /** 필드별 호스트 오류 문구 (프로퍼티). 예: 서버 검증 { token: '만료된 토큰' } */
    errors?: Record<string, string>;
    /** 한 줄 최대 칸 수. 기본 2 (원본 sm=6). 요소 폭이 좁으면 줄어든다 */
    columns?: number;
}
export interface SmartviewFieldGridEvents {
    /** 입력할 때마다 (모든 필드 값) */
    input: [value: Record<string, string>];
    /** 값을 바꾸고 필드를 떠났을 때 (모든 필드 값) */
    change: [value: Record<string, string>];
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
/** 옵션 카드 하나 (원본 Salesforce 연동 모드) */
export interface OptionCard {
    value: string;
    label: string;
    description?: string;
    /** 이름 아래 작은 칩 (원본: 출처 "기본 제공"·"플러그인"·"설치 안 됨") */
    badge?: string;
    /** 칩 테마 색. 기본 grey */
    badgeColor?: string;
    /** 고를 수 없음 (원본: 설치되지 않은 모드) */
    disabled?: boolean;
}
export interface SmartviewOptionCardsProps extends SmartviewInputCommonProps {
    /** 옵션 (프로퍼티) */
    options?: OptionCard[];
    /** 고른 옵션의 value */
    value?: string;
    /** 선택 버튼 문구. 비우면 "Use this"/"이것 사용" */
    selectText?: string;
    /** 고른 옵션의 칩 문구. 비우면 "In use"/"사용 중" */
    currentText?: string;
    /** 한 줄 최대 카드 수. 기본 2 (원본 md=6). 요소 폭이 좁으면 줄어든다 */
    columns?: number;
}
export interface SmartviewOptionCardsEvents {
    /** 선택 버튼을 눌렀을 때 (새 value) */
    input: [value: string];
    /** 같은 때 (고르는 즉시 확정) */
    change: [value: string];
}
/**
 * enabled·disabled: 켜기/끄기 스위치.
 * required: 끌 수 없는 항목 — 스위치 대신 칩 (원본 Salesforce "모드에 포함": 토글을 두면 끌 수 있다고 오해한다).
 * unavailable: 쓸 수 없는 항목 — 스위치 대신 칩.
 */
export type ToggleRowState = 'enabled' | 'disabled' | 'required' | 'unavailable';
export interface SmartviewToggleRowProps {
    heading?: string;
    /** 제목 아래 작은 글자 (원본 Bots: 공급자 ID) */
    caption?: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 있으면 아이콘을 이 색의 tonal 원(34px)에 넣는다 (원본 Bots). 없으면 아이콘만 (원본 Salesforce 모듈) */
    iconColor?: string;
    description?: string;
    state?: ToggleRowState;
    /** state=required 일 때 설명 아래 덧붙이는 이유 문구 */
    requiredHint?: string;
    /** 스위치·칩 문구. 비우면 기본 문구 */
    enabledText?: string;
    disabledText?: string;
    requiredText?: string;
    unavailableText?: string;
    /** 스위치 위치: top(오른쪽 위, 원본 Salesforce) | bottom(액션 줄 앞, 원본 Bots). 기본 top */
    togglePosition?: 'top' | 'bottom';
    /** 스위치 비활성 (저장 중 등) */
    disabled?: boolean;
}
export interface SmartviewToggleRowEvents {
    /** 스위치를 눌렀을 때 (켜짐 여부) */
    toggle: [enabled: boolean];
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
export interface SmartviewJsonFieldProps extends SmartviewInputCommonProps {
    /** JSON 문자열 */
    value?: string;
    /** 객체({ … })만 허용 (원본 플러그인 설정). 배열·원시값이면 오류 */
    requireObject?: boolean;
    /** 보이는 줄 수 (내용이 많으면 늘어난다). 기본 7 */
    rows?: number;
}
export interface SmartviewJsonFieldEvents {
    /** 입력할 때마다 (문자열 그대로, 검증과 상관없이) */
    input: [value: string];
    /** 값을 바꾸고 입력칸을 떠났을 때 */
    change: [value: string];
}
/** 호스트가 파일을 검사한 결과 (원본 백업 파일 미리보기) */
export interface SmartviewFileInspectResult {
    /** true 면 info 알림, false 면 error 알림 */
    valid: boolean;
    /** 굵은 제목. 비우면 "File checked" / "Invalid file" */
    title?: string;
    /** 본문. 하나면 문단, 여럿이면 목록 */
    messages?: string[];
}
export interface SmartviewFileInspectProps {
    /** 라벨. 비우면 "File" / "파일" */
    label?: string;
    /** 도움말 */
    hint?: string;
    /** 고를 수 있는 파일 (네이티브 input accept, 예: "application/json,.json") */
    accept?: string;
    /** 비활성 */
    disabled?: boolean;
    /** 고른 파일 (프로퍼티). 사용자가 고르면 바뀐다. 호스트는 null 을 넣어 선택을 비운다 */
    file?: File | null;
    /** 검사 결과 (프로퍼티). 파일을 새로 고르면 요소가 null 로 비운다 */
    result?: SmartviewFileInspectResult | null;
}
export interface SmartviewFileInspectEvents {
    /** 파일을 고르거나(File) 비웠을 때(null). 호스트는 파일을 검사해 result 를 넣는다 */
    'file-select': [file: File | null];
}
export interface SmartviewSliderProps {
    /** 왼쪽 라벨 */
    label?: string;
    /** 아래 설명 */
    hint?: string;
    /** 비활성 */
    disabled?: boolean;
    /** 최솟값. 기본 0 */
    min?: number;
    /** 최댓값. 기본 100 */
    max?: number;
    /** 간격 (화살표 키 한 번). 기본 1 */
    step?: number;
    /** 값. 프로퍼티는 현재 값 */
    value?: number;
    /** 간격마다 눈금을 보인다 (원본 CSAT 1~5점) */
    ticks?: boolean;
}
export interface SmartviewSliderEvents {
    /** 값이 바뀔 때마다 (끄는 동안 포함) */
    input: [value: number];
    /** 끌기를 마쳤을 때, 키보드로 바꿨을 때 (네이티브 range 입력과 같다) */
    change: [value: number];
}
export interface SmartviewCronBuilderProps extends SmartviewInputCommonProps {
    /** 5필드 크론 식 (분 시 일 월 요일). 프로퍼티는 현재 값 */
    value?: string;
    /** 프리셋·필드 select 메뉴를 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewCronBuilderEvents {
    /** 식이 바뀔 때마다 (입력·프리셋·필드 선택) */
    input: [value: string];
    /** 프리셋·필드를 골랐을 때, 식 입력칸을 바꾸고 떠났을 때 */
    change: [value: string];
}
export type SmartviewCodeLanguage = 'sql' | 'javascript';
/** 자동 완성 항목 (원본 FormulaEditor: 함수·필드 이름) */
export interface SmartviewCodeCompletion {
    label: string;
    /** 아이콘 종류 (CodeMirror: function, variable, keyword, property, type, …) */
    type?: string;
    /** 항목 옆 작은 설명 */
    detail?: string;
    /** 고르면 넣을 글 (없으면 label). 함수는 'UPPER(' 처럼 여는 괄호까지 */
    apply?: string;
}
export interface SmartviewCodeEditorProps {
    /** 코드. 프로퍼티는 현재 값 */
    value?: string;
    /** 구문 강조·키워드 완성 언어. 기본 sql */
    language?: SmartviewCodeLanguage;
    /** 편집기 높이 (px). 기본 200 (원본 SQL 콘솔) */
    height?: number;
    /** 빈 편집기 안내 문구 */
    placeholder?: string;
    /** 편집 영역의 접근 가능한 이름. 비우면 "Code editor" / "코드 편집기" */
    label?: string;
    /** Ctrl/⌘+Enter 로 run 을 보내지 않는다 (기본은 보낸다. 기본값이 true 인 Boolean 을 두지 않는 규약이라 반대 이름) */
    noRunShortcut?: boolean;
    /** 있으면 실행 버튼을 보인다 (원본 SQL 콘솔 "실행") */
    runText?: string;
    /** 실행 중: 실행 버튼 로딩, run 을 보내지 않는다 */
    running?: boolean;
    /** 호스트 오류 문구 (편집기 테두리 오류색 + 아래 문구) */
    errorMessage?: string;
    /** 읽기 전용 */
    disabled?: boolean;
    /** 자동 완성에 더할 항목 (프로퍼티). 언어 기본 완성(SQL 키워드 등)과 함께 보인다 */
    completions?: SmartviewCodeCompletion[];
    /** 최근 실행 기록 (프로퍼티, 최신이 앞). 있으면 기록 메뉴를 보인다. 저장은 호스트가 한다 */
    history?: string[];
    /** 기록 메뉴를 열 위치. 기본 body (자동 완성 목록은 CodeMirror 가 편집기 안에 띄운다) */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewCodeEditorEvents {
    /** 코드가 바뀔 때마다 (입력, 기록 고르기) */
    input: [value: string];
    /** Ctrl/⌘+Enter 또는 실행 버튼 (실행 중이면 보내지 않는다) */
    run: [value: string];
}
export type SmartviewDotState = 'ok' | 'error' | 'unknown';
export interface SmartviewStatusDotProps {
    /** 상태. ok 초록, error 빨강, unknown 회색. 기본 unknown */
    state?: SmartviewDotState;
    /** 상태 문구. 비우면 상태별 기본 문구(Connected / Disconnected / Unknown) — 색만으로 구분하지 않도록 늘 글자가 있다 */
    label?: string;
    /** 툴팁 설명 (원본 채널 헬스 설명). 있으면 칩에 키보드 포커스가 간다 */
    hint?: string;
    /** tonal(기본, 원본 앱 바·목록) 또는 flat(원본 채팅 머리글처럼 진한 배경 위) */
    variant?: 'tonal' | 'flat';
    /** 둥근 알약 모양 (원본 앱 바 서버 상태). 기본은 모서리가 각진 label 칩 (원본 목록 헬스) */
    pill?: boolean;
    /** 상태가 바뀌면 보조 기술에 알린다 (role="status"). 앱 바 연결 상태처럼 하나뿐인 표시에 쓴다 */
    live?: boolean;
    /** 툴팁을 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export type SmartviewStatusDotEvents = Record<never, never>;
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
export interface SmartviewVerticalNavigationProps {
    /** 메뉴 항목 (프로퍼티) */
    items?: SmartviewNavItem[];
    /** 하단 추가 메뉴 (프로퍼티). 언어·테마·접기 다음에 온다. 누르면 footer-action */
    footerItems?: SmartviewNavFooterItem[];
    /** 제품 이름 (원본 PRODUCT_NAME) */
    brandName?: string;
    /** 제품 아이콘 (원본 PRODUCT_ICON) */
    brandIcon?: string;
    /** UI 버전. "Admin console v{version}" 로 보인다 */
    version?: string;
    /** 지금 화면의 항목 key. 호스트가 알려 준다 (요소는 URL 을 해석하지 않는다) */
    current?: string;
    /** 접힘(아이콘만). 프로퍼티는 현재 값 */
    rail?: boolean;
    /** rail 툴팁을 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewVerticalNavigationEvents {
    /**
     * 메뉴를 눌렀을 때 (Enter 포함). 취소 가능하다(`event.preventDefault()`): 취소하면 href 로 이동하지 않는다 (Q-05).
     * 라우터가 있는 앱은 취소하고 자기 라우터로 이동한 뒤 current 를 바꾼다.
     */
    navigate: [payload: {
        key: string;
        href: string;
    }];
    /** 접기 메뉴로 rail 을 바꿨을 때 [접힘 여부] */
    'rail-change': [rail: boolean];
    /** 하단 추가 메뉴를 눌렀을 때 [{ key }] */
    'footer-action': [item: {
        key: string;
    }];
}
/** 브레드크럼 항목 (원본 Home > 현재 메뉴) */
export interface SmartviewBreadcrumb {
    label: string;
    /** 링크 주소. 마지막 항목(지금 화면)은 링크로 그리지 않는다 */
    href?: string;
}
export interface SmartviewGlobalHeaderProps {
    /** 브레드크럼 (프로퍼티). 마지막 항목이 지금 화면 */
    breadcrumbs?: SmartviewBreadcrumb[];
    /** 서버 연결 상태. 비우면 칩을 숨긴다 */
    status?: '' | SmartviewDotState;
    /** 상태 문구. 비우면 상태별 기본 문구 */
    statusLabel?: string;
    /** 도움말 버튼을 보인다 */
    showHelp?: boolean;
    /** 드로어가 펼쳐져 있는지 (메뉴 버튼 aria-expanded). AppShell 이 넣는다 */
    menuExpanded?: boolean;
    /** 도움말 툴팁을 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewGlobalHeaderEvents {
    /** 브레드크럼 링크를 눌렀을 때. 취소 가능하다 (드로어 navigate 와 같은 규약, Q-05) */
    navigate: [payload: {
        href: string;
        label: string;
        index: number;
    }];
    /** 메뉴 버튼 (원본: 드로어 rail 토글) */
    'menu-toggle': [];
    /** 도움말 버튼 */
    help: [];
}
export interface SmartviewAppShellProps {
    /** 드로어 메뉴 (프로퍼티, <smartview-vertical-navigation> items) */
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
    /** 브레드크럼 (프로퍼티, <smartview-global-header> breadcrumbs) */
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
export interface SmartviewSecretDialogProps {
    open?: boolean;
    /** 제목. 비우면 "Key issued" / "키가 발급되었습니다" */
    heading?: string;
    /** 경고 문구. 비우면 "Copy it now. It will not be shown again." */
    warning?: string;
    /**
     * 한 번만 보여 줄 비밀값. 속성(attribute)으로 주면 DOM 에 드러나므로 프로퍼티로 넣는다.
     * 다이얼로그가 닫히면 요소가 프로퍼티와 속성을 모두 비운다.
     */
    secret?: string;
    /** 입력칸 라벨 (원본: 키 이름) */
    label?: string;
    /** 확인 버튼 문구. 비우면 "I have stored it" / "보관했습니다" */
    doneText?: string;
    overlayTarget?: OverlayTarget;
}
export interface SmartviewSecretDialogEvents {
    /** 복사 버튼. 권한 거부 등으로 실패해도 [false] 로 알린다 (실패하면 값을 선택해 직접 복사할 수 있게 한다) */
    copy: [result: {
        success: boolean;
    }];
    /** 확인 버튼. 호스트가 open 을 끈다 */
    done: [];
}
/** 도움말 본문 조각 (Q-07: HTML 문자열이 아니라 구조화 데이터). 모르는 모양은 그리지 않는다 */
export type SmartviewHelpBlock = {
    p: string;
} | {
    ul: string[];
} | {
    tip: string;
} | {
    warn: string;
};
export interface SmartviewHelpSection {
    /** 섹션 식별자. current 로 펼친다 (원본: 화면 key) */
    key: string;
    title: string;
    icon?: string;
    blocks: SmartviewHelpBlock[];
}
export interface SmartviewHelpAbout {
    productName: string;
    /** 로고 아이콘 (mdi) */
    icon?: string;
    tagline?: string;
    /** 정보 행 (원본: UI 버전, 서버 버전, 환경, 가동 시간). 서버 정보는 호스트가 읽어 넣는다 */
    rows?: {
        label: string;
        value: string;
        icon?: string;
    }[];
    /** 행 아래 경고 (원본: 서버 정보를 읽지 못함) */
    warning?: string;
    /** 맨 아래 저작권 문구 */
    copyright?: string;
}
export interface SmartviewHelpDialogProps {
    open?: boolean;
    /** 처음 펼칠 섹션 key (원본: 지금 화면) */
    current?: string;
    /** 사용 안내 섹션 (프로퍼티) */
    sections?: SmartviewHelpSection[];
    /** About 탭 내용 (프로퍼티). 없으면 About 탭을 숨긴다 */
    about?: SmartviewHelpAbout | null;
    overlayTarget?: OverlayTarget;
}
export interface SmartviewHelpDialogEvents {
    /** 닫기 버튼·Esc·바깥 클릭. 호스트가 open 을 끈다 */
    close: [];
}
/** 계정 정보 (원본 GW·CHAT /auth/me, ETL Setup) */
export interface SmartviewAccount {
    username?: string;
    /** 편집형: 이메일 */
    email?: string;
    /** 표시형: 사용자 ID */
    userId?: string;
    /** 표시형: 인증 방식 */
    authType?: string;
    /** 표시형: 역할 칩 */
    roles?: string[];
    /** 표시형: 권한 칩 */
    permissions?: string[];
}
/** 편집형 저장 내용. 비밀번호는 새 비밀번호를 넣었을 때만, CORS 는 corsOrigins 를 줬을 때만 있다 */
export interface SmartviewAccountSave {
    username: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    corsOrigins?: string[];
}
export interface SmartviewAccountDialogProps {
    open?: boolean;
    /** view(표시형, 원본 GW·CHAT 내 계정) 또는 edit(편집형, 원본 ETL Setup). 기본 view */
    mode?: 'view' | 'edit';
    /** 제목. 비우면 "My account" / "Setup" */
    heading?: string;
    /** 계정 (프로퍼티) */
    account?: SmartviewAccount | null;
    /** 편집형 CORS 허용 Origin (프로퍼티). null 이면 CORS 칸을 숨긴다 (원본 ETL 만 있다) */
    corsOrigins?: string[] | null;
    /** 편집형 저장 중: 입력·버튼 비활성, save 를 보내지 않는다 */
    loading?: boolean;
    /** 편집형 저장 실패 문구 (다이얼로그 안 알림) */
    errorMessage?: string;
    overlayTarget?: OverlayTarget;
}
export interface SmartviewAccountDialogEvents {
    /** 편집형 저장. 호스트가 저장하고 open 을 끈다 */
    save: [values: SmartviewAccountSave];
    /** 표시형 닫기·Esc·바깥 클릭, 편집형 취소. 호스트가 open 을 끈다 */
    close: [];
}
/** 백업에 든 항목 수 (원본: 채널·FAQ·상용구 개수 칩) */
export interface SmartviewBackupCount {
    label: string;
    value: number | string;
    icon?: string;
    /** 테마 색 이름 권장 (USAGE 4a) */
    color?: string;
}
/** 호스트가 백업 파일을 검사한 결과 */
export interface SmartviewBackupPreview {
    valid: boolean;
    /** 백업을 만든 시각 (ISO 문자열). 지역 형식으로 보인다 */
    timestamp?: string;
    /** 복원될 항목 수 */
    counts?: SmartviewBackupCount[];
    /** 형식 오류 (valid 가 false 일 때) */
    errors?: string[];
}
export interface SmartviewBackupRestoreProps {
    /** 지금 설정의 항목 수 (프로퍼티) */
    counts?: SmartviewBackupCount[];
    /** 고른 백업 파일 검사 결과 (프로퍼티). 파일을 새로 고르면 요소가 null 로 비운다 */
    preview?: SmartviewBackupPreview | null;
    /** 고른 파일 (프로퍼티). 호스트가 null 을 넣어 선택을 비운다 */
    file?: File | null;
    /** 백업 만드는 중: 다운로드 버튼 로딩 */
    exporting?: boolean;
    /** 복원 중: 확인 다이얼로그 버튼 로딩. 끝나면 호스트가 preview 를 비우면 다이얼로그가 닫힌다 */
    restoring?: boolean;
    /** 고를 수 있는 파일. 기본 application/json,.json */
    accept?: string;
    /** 백업 카드 안내 */
    backupHint?: string;
    /** 복원 카드 안내 */
    restoreHint?: string;
    /** 복원 확인 다이얼로그의 경고 (무엇을 덮어쓰는지) */
    restoreWarning?: string;
    overlayTarget?: OverlayTarget;
}
export interface SmartviewBackupRestoreEvents {
    /** 백업 다운로드 버튼. 호스트가 파일을 만들어 내려받게 한다 */
    export: [];
    /** 백업 파일을 고르거나(File) 비웠을 때(null). 호스트가 검사해 preview 를 넣는다 */
    'file-select': [file: File | null];
    /** 복원 확인 다이얼로그에서 복원을 눌렀을 때 */
    restore: [];
}
/** 진행 단계 상태: 통과·막힘(지금 손댈 곳)·판단 불가·켜 두었지만 앞이 막힘·해당 없음 */
export type ChannelStageState = 'done' | 'blocked' | 'pending' | 'waiting' | 'skipped';
export interface SmartviewChannelStage {
    /** 단계 식별자. available·loaded·auth·enabled 는 이름·막힘 문구·설명 기본값이 있다 */
    key: string;
    state: ChannelStageState;
    /** 단계 이름. 비우면 기본 문구(알려진 key) 또는 key */
    label?: string;
    /** 막혔을 때 이름 대신 보일 글자 (원본 "로드 안 됨"). 비우면 기본 문구 또는 label */
    blockedLabel?: string;
    /** 툴팁 설명. 비우면 기본 문구(알려진 key·상태) */
    hint?: string;
}
export interface SmartviewChannelStagesProps {
    /** 단계 목록 (프로퍼티). channelStages(adapter, config) 결과를 그대로 넣을 수 있다 */
    stages?: SmartviewChannelStage[];
    /** 툴팁을 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export type SmartviewChannelStagesEvents = Record<never, never>;
/** 채팅 메시지 (원본 ChatPanel messages) */
export interface SmartviewChatMessage {
    /** 고유 key (같은 메시지를 다시 그리지 않게) */
    key: string;
    /** 보낸 사람. self-id 와 같으면 내 메시지(오른쪽) */
    senderId?: string;
    content: string;
    /** notice 면 가운데 안내 줄 (입장·종료 등) */
    type?: 'message' | 'notice';
    /** 받은 시각 (Date·ISO 문자열·밀리초). HH:mm 으로 보인다 */
    at?: Date | string | number;
}
export interface SmartviewChatProps {
    /** 머리글 제목 */
    heading?: string;
    subtitle?: string;
    /** 머리글 아바타 아이콘. 기본 mdi-account-circle */
    icon?: string;
    /** 강조색 (#RRGGBB·#RGB). 머리글과 내 말풍선 배경. 잘못된 값이면 기본 #1565C0. 글자는 대비가 높은 흰색·검정 */
    accentColor?: string;
    /** 내 메시지를 가려내는 보낸 사람 ID */
    selfId?: string;
    /** 내 메시지의 보낸 사람 표시 (없으면 senderId) */
    selfLabel?: string;
    /** 상대 메시지의 보낸 사람 표시 (없으면 senderId) */
    peerLabel?: string;
    /** 연결됨. 끊기면 입력·보내기를 끈다 */
    connected?: boolean;
    /** 메시지 (프로퍼티) */
    messages?: SmartviewChatMessage[];
    overlayTarget?: OverlayTarget;
}
export interface SmartviewChatEvents {
    /** Enter·보내기 버튼 [앞뒤 공백을 뺀 글] (연결됐고 비어 있지 않을 때). 보내는 일은 호스트(WebSocket)가 한다 */
    send: [text: string];
}
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export interface SmartviewWidgetPreviewProps {
    /** 위젯 기본색 (#RRGGBB·#RGB). 잘못된 값이면 원본 기본 #0066FF. 그 위 글자는 대비가 높은 흰색·검정 */
    primaryColor?: string;
    /** 런처·말풍선 위치. 기본 bottom-right */
    position?: WidgetPosition;
    /** 인사말. 비우면 말풍선에 제품 이름만 */
    greeting?: string;
    /** 말풍선 첫 줄 (원본 PRODUCT_NAME) */
    productName?: string;
}
export type SmartviewWidgetPreviewEvents = Record<never, never>;
/** 데이터베이스 객체 (테이블·뷰·Salesforce 오브젝트) */
export interface SmartviewDbObject {
    name: string;
    /** 종류 (table, view …). 목록 부제 */
    type?: string;
}
export interface SmartviewObjectBrowserProps {
    /** 객체 목록 (프로퍼티) */
    objects?: SmartviewDbObject[];
    /** 고른 객체 이름. 프로퍼티는 현재 값 */
    selected?: string;
    /** 결과 열 이름 (프로퍼티, 원본 data.columns 의 name) */
    columns?: string[];
    /** 지금 페이지의 행 (프로퍼티) */
    rows?: Record<string, unknown>[];
    /** 지금 페이지 (1부터). 프로퍼티는 현재 값 */
    page?: number;
    /** 페이지 크기. 받은 행이 이보다 적으면 마지막 페이지로 본다 (원본 50) */
    pageSize?: number;
    /** 행을 불러오는 중: 표 로딩·페이지 이동 비활성 */
    loading?: boolean;
    /** 객체 목록을 불러오는 중: 목록 새로고침 버튼 로딩 */
    objectsLoading?: boolean;
}
export interface SmartviewObjectBrowserEvents {
    /** 목록에서 객체를 골랐을 때 [이름]. 페이지는 1 로 돌아간다 */
    'object-select': [name: string];
    /** 결과 페이지를 옮겼을 때 [새 페이지] */
    'page-change': [page: number];
    /** 새로고침 [{ target: 'objects' | 'rows' }] */
    refresh: [payload: {
        target: 'objects' | 'rows';
    }];
}
/** 매핑할 필드 (원본 필드 API 의 name·type) */
export interface SmartviewMappingField {
    name: string;
    /** 데이터 타입 문자열 (varchar(255), int, timestamp, picklist …). 타입 칩과 호환 판정에 쓴다 */
    type?: string;
}
/** 매핑 한 건. formula 가 문자열이면 수식 매핑(원본 transform_type 'formula'), 없으면 그대로 옮긴다 */
export interface SmartviewFieldMapping {
    source: string;
    target: string;
    /** 키 필드 (Upsert / Delete+Insert / Incremental) */
    isKey?: boolean;
    /** 수식 (원본 transform_expr). 소스 필드를 이름으로 참조한다 */
    formula?: string;
}
/** 수식 함수. 기본 함수(CONCAT 등 24개)는 이름만 주면 시그니처·설명·예시를 채운다 */
export interface SmartviewFormulaFunction {
    name: string;
    /** 사용법 첫 줄. 없으면 'NAME( … )' */
    signature?: string;
    description?: string;
    example?: string;
}
/** 수식 검사 결과 (호스트가 formula-validate 를 받아 넣는다, 원본 POST /formulas/validate) */
export interface SmartviewFormulaValidation {
    /** 검사 중 */
    loading?: boolean;
    valid?: boolean;
    errors?: string[];
    /** 결과 타입 (원본 inferred_type). 맞는 수식 칩에 보인다 */
    inferredType?: string;
}
export interface SmartviewMappingGridProps {
    /** 소스 필드 (프로퍼티). 한 줄에 하나씩 보인다 */
    sourceFields?: SmartviewMappingField[];
    /** 타깃 필드 (프로퍼티). 타깃 고르기 목록 */
    targetFields?: SmartviewMappingField[];
    /** 매핑 (프로퍼티). 프로퍼티는 현재 값 */
    mappings?: SmartviewFieldMapping[];
    /** 수식 함수 (프로퍼티, 원본 GET /formulas/functions). 문자열이면 이름. 비면 기본 24개 */
    functions?: (string | SmartviewFormulaFunction)[];
    /** 소스 필드 이름별 수식 검사 결과 (프로퍼티) */
    validation?: Record<string, SmartviewFormulaValidation>;
    /** 편집 막기 (저장 중 등) */
    disabled?: boolean;
    /** 타깃 목록·툴팁을 열 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewMappingGridEvents {
    /** 매핑이 바뀔 때마다 [새 매핑 배열] (타깃 고르기·해제, 키·수식 켜고 끄기, 수식 편집, 자동 매핑) */
    'mappings-change': [mappings: SmartviewFieldMapping[]];
    /** 자동 매핑 버튼으로 새로 매핑했을 때 [{ count }] (원본 "n개 컬럼 자동 매핑됨" 알림용). mappings-change 뒤에 보낸다 */
    'auto-map': [payload: {
        count: number;
    }];
    /** 수식 검사 요청 [{ source, formula }]. 수식을 켤 때 바로, 편집하면 400ms 뒤. 호스트가 validation 에 결과를 넣는다 */
    'formula-validate': [payload: {
        source: string;
        formula: string;
    }];
}
export interface SmartviewColorPickerProps extends SmartviewInputCommonProps {
    /** 색 (#RRGGBB·#RGB, 대소문자 무관). 프로퍼티는 현재 값. 요약 칸에 쓴 글자 그대로이며, 형식이 틀리면 제출을 막는다 */
    value?: string;
    /** 요약 칸을 읽기 전용으로, 팝오버를 열지 않는다 */
    readonly?: boolean;
    /** Default 탭 팔레트 (프로퍼티, #RRGGBB). 비우지 않으면 SLDS 기본 28색 대신 쓴다 */
    swatches?: string[];
    /** 팝오버를 연다. 프로퍼티는 현재 상태 (사용자가 열고 닫으면 바뀐다) */
    open?: boolean;
    /** 팝오버를 열 때 처음 보일 탭 */
    tab?: 'default' | 'custom';
    /** 팝오버를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewColorPickerEvents {
    /** 값이 바뀔 때마다 [값]: 요약 칸에 쓸 때, 팝오버에서 Done 을 눌렀을 때 */
    input: [value: string];
    /** 값을 확정했을 때 [값]: 요약 칸을 바꾸고 떠날 때, Done */
    change: [value: string];
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
export interface SmartviewChartProps {
    /** 데이터를 불러오는 중. 차트 대신 가운데 원형 진행 표시 */
    loading?: boolean;
    /** 차트 칸 높이(px, 범례 포함). 기본 300. 로딩·빈 상태도 같은 높이 */
    height?: number;
    /** 빈 데이터일 때 문구. 비우면 "No data"/"데이터가 없습니다" */
    emptyText?: string;
    /** 차트 명세 (프로퍼티). 없거나 항목·계열이 비면 빈 상태 */
    chart?: ChartSpec | null;
}
export type SmartviewChartEvents = Record<never, never>;
/** 아코디언 섹션 하나 (LightningAccordion 섹션: name·label) */
export interface AccordionSection {
    /** 섹션 식별자. active-section-name·이름 슬롯(section-<name>)·이벤트에 쓴다 */
    name: string;
    /** 제목 줄 글자 */
    label: string;
    /** 제목 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 비활성 섹션은 펼치거나 접을 수 없다 (호스트가 펼쳐도 접힌 채다) */
    disabled?: boolean;
    /** 이름 슬롯(section-<name>)이 없을 때 보일 본문 글자 */
    content?: string;
}
export interface SmartviewAccordionProps {
    /** 섹션 목록 (프로퍼티) */
    sections?: AccordionSection[];
    /**
     * 펼친 섹션 name. 속성은 하나, 프로퍼티는 하나 또는 배열(여러 개는 allow-multiple-sections-open 일 때).
     * 사용자가 펼치거나 접으면 프로퍼티가 지금 펼친 목록(배열)이 된다
     */
    activeSectionName?: string | string[];
    /** 여러 섹션을 함께 펼칠 수 있다. 기본은 하나를 펼치면 다른 섹션이 접힌다 */
    allowMultipleSectionsOpen?: boolean;
}
export interface SmartviewAccordionEvents {
    /** 사용자가 섹션을 펼치거나 접었을 때. name 은 누른 섹션, openSections 는 지금 펼친 섹션 목록 */
    'section-toggle': [payload: {
        name: string;
        openSections: string[];
    }];
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
/** 아바타 크기 (LightningAvatar size). x-small 24px, small 28px, medium 36px, large 48px, x-large 64px */
export type AvatarSize = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
export interface SmartviewAvatarProps {
    /** 기본 medium (36px, 원본 목록 이름 셀) */
    size?: AvatarSize;
    /** 모양. 기본 circle, square 는 모서리 8px */
    variant?: 'circle' | 'square';
    /** 이미지 주소. 읽지 못하면 이니셜·아이콘을 보인다 */
    src?: string;
    /** 이미지·이니셜이 뜻하는 것 (이미지 alt, 스크린 리더 이름) */
    alternativeText?: string;
    /** 이미지가 없을 때 글자 (1~2자) */
    initials?: string;
    /** 이미지·이니셜이 없을 때 아이콘 (MDI 이름). 기본 mdi-account */
    fallbackIconName?: string;
    /** 이니셜·아이콘 바탕(tonal) 테마 색. 기본 primary */
    color?: string;
}
export type SmartviewAvatarEvents = Record<never, never>;
export interface SmartviewPillProps {
    /** 글자 */
    label?: string;
    /** remove 이벤트로 돌려줄 식별자. 비우면 label */
    name?: string;
    /** 링크 주소. 있으면 필 전체가 링크다 */
    href?: string;
    /** 지우기(✕) 버튼. 누르면 remove 를 보낸다 (호스트가 필을 지운다) */
    removable?: boolean;
    /** 오류 표시: 오류 색과 앞 경고 아이콘 */
    hasError?: boolean;
    /** 앞 아이콘 (MDI 이름) */
    iconName?: string;
    /** 앞 아바타 이미지 주소 */
    avatar?: string;
    /** 앞 아바타 이니셜 (이미지가 없을 때) */
    avatarInitials?: string;
    /** 모양. 기본 outlined (smartview-pill-container 와 같다) */
    variant?: ChipListVariant;
    /** 크기. 기본 small */
    size?: StatusChipSize;
    /** 테마 색. 없으면 글자색을 따른다 */
    color?: string;
}
export interface SmartviewPillEvents {
    /** 지우기 버튼을 눌렀을 때. 값은 name (없으면 label) */
    remove: [name: string];
}
export interface SmartviewBreadcrumbsProps {
    /** 경로 항목 (프로퍼티). 마지막 항목이 지금 화면. href 가 없는 항목은 글자다 */
    items?: SmartviewBreadcrumb[];
}
export interface SmartviewBreadcrumbsEvents {
    /** 링크 항목을 눌렀을 때. 취소 가능하다 (global-header navigate 와 같은 규약, Q-05) */
    navigate: [payload: {
        href: string;
        label: string;
        index: number;
    }];
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
/** 버튼형 단일 선택 항목 */
export interface RadioButtonOption {
    label: string;
    value: string;
    /** 고를 수 없다 */
    disabled?: boolean;
    /** 글자 앞 아이콘 (MDI 이름) */
    icon?: string;
}
export interface SmartviewRadioButtonGroupProps extends SmartviewInputCommonProps {
    /** 고른 항목의 value. 프로퍼티는 현재 값 */
    value?: string;
    /** 항목 (프로퍼티) */
    options?: RadioButtonOption[];
    /** 고른 버튼 테마 색. 기본 primary (원본 보기 전환) */
    color?: string;
}
export interface SmartviewRadioButtonGroupEvents {
    /** 항목을 골랐을 때 (고르는 즉시 확정이라 change 와 같은 때) */
    input: [value: string];
    /** 항목을 골랐을 때 */
    change: [value: string];
}
export interface SmartviewFileSelectorProps {
    /** 영역 위 라벨 */
    label?: string;
    /** files(기본) | images: 단추·안내 글자와 아이콘 */
    variant?: 'files' | 'images';
    /** 단추 글자. 비우면 "Upload files"/"파일 올리기" (images: "Upload image"/"이미지 올리기") */
    buttonLabel?: string;
    /** 단추 옆 안내 글자. 비우면 "or drop files"/"또는 파일을 끌어 놓으세요" */
    dropText?: string;
    /** 받을 형식 (네이티브 accept: ".csv,.json", "image/*"). 끌어 놓은 파일에도 적용한다 */
    accept?: string;
    /** 여러 파일. 없으면 끌어 놓아도 첫 파일만 */
    multiple?: boolean;
    disabled?: boolean;
    /** 아래 도움말 */
    hint?: string;
    /** 호스트 오류 문구 (형식·크기 거절 등). 도움말 대신 보인다 */
    errorMessage?: string;
}
export interface SmartviewFileSelectorEvents {
    /** 파일을 고르거나 끌어 놓았을 때. accept 에 맞는 파일만 (하나도 없으면 보내지 않는다) */
    select: [files: File[]];
}
/** 단계 하나 (smartview-path, smartview-progress-indicator) */
export interface StepItem {
    value: string;
    label: string;
}
export interface SmartviewPathProps {
    /** 단계 (프로퍼티). 앞에서부터 순서대로 */
    steps?: StepItem[];
    /** 지금 단계 value. 앞 단계는 완료, 뒤 단계는 아직. 없거나 모르는 값이면 모두 아직 */
    currentStep?: string;
    /** 지금 단계를 실패로 표시한다 */
    hasError?: boolean;
}
export interface SmartviewPathEvents {
    /** 단계를 눌렀을 때. 지금 단계를 바꾸는 것은 호스트다 (current-step) */
    select: [value: string];
}
export interface SmartviewProgressIndicatorProps {
    /** 단계 (프로퍼티). 앞에서부터 순서대로 */
    steps?: StepItem[];
    /** 지금 단계 value. 앞 단계는 완료, 뒤 단계는 아직. 없거나 모르는 값이면 모두 아직 */
    currentStep?: string;
    /** 지금 단계를 실패로 표시한다 */
    hasError?: boolean;
    /** base: 선 위 점과 아래 라벨(기본) · path: smartview-path 와 같은 화살표 단계 */
    type?: 'base' | 'path';
}
export interface SmartviewProgressIndicatorEvents {
    /** 단계를 눌렀을 때. 지금 단계를 바꾸는 것은 호스트다 (current-step) */
    select: [value: string];
}
/** 타일 아래 라벨·값 한 줄 */
export interface TileField {
    label: string;
    value: string;
}
/** 타일 오른쪽 위 ⋮ 메뉴 항목 */
export interface TileAction {
    /** action 이벤트로 돌려줄 식별자 */
    name: string;
    label: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    disabled?: boolean;
}
export interface SmartviewTileProps {
    /** 제목 */
    label?: string;
    /** 제목 링크 주소. 있으면 제목이 링크이고 누르면 취소 가능한 navigate 를 보낸다 */
    href?: string;
    /** 앞 아이콘 (MDI 이름, tonal 원 36px) */
    iconName?: string;
    /** 앞 아바타 이미지 주소 (아이콘이 없을 때) */
    avatar?: string;
    /** 앞 아바타 이니셜 (이미지가 없을 때) */
    avatarInitials?: string;
    /** 앞 아이콘·아바타 테마 색. 기본 primary */
    color?: string;
    /** 아래 라벨·값 목록 (프로퍼티) */
    fields?: TileField[];
    /** 오른쪽 위 ⋮ 메뉴 항목 (프로퍼티). 없으면 메뉴를 숨긴다 */
    actions?: TileAction[];
    /** 테두리·모서리·안쪽 여백·바탕을 둔다 (혼자 카드처럼 놓일 때). 없으면 목록 안 타일 (틀 없음) */
    rounded?: boolean;
    /** ⋮ 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewTileEvents {
    /** 제목 링크를 눌렀을 때. 취소 가능하다 (global-header navigate 와 같은 규약, Q-05) */
    navigate: [payload: {
        href: string;
        label: string;
    }];
    /** ⋮ 메뉴 항목을 골랐을 때 */
    action: [payload: {
        name: string;
    }];
}
/** 관련 목록 제목 줄 오른쪽 단추 */
export interface RelatedListAction {
    /** action 이벤트로 돌려줄 식별자 */
    name: string;
    label: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    disabled?: boolean;
}
/** 관련 목록: 카드 제목 줄 + 데이터 표(같은 속성·이벤트) + 바닥 "모두 보기" */
export interface SmartviewRelatedListProps extends Omit<SmartviewDataTableProps, 'flat'> {
    /** 제목 (관련 개체 이름) */
    heading?: string;
    /** 제목 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 제목 옆 개수 칩. 비우면 items 개수 (서버 페이지 모드면 server-items-length) */
    count?: number;
    /** 제목 줄 오른쪽 단추 (프로퍼티) */
    actions?: RelatedListAction[];
    /** 바닥 "모두 보기" 글자. 비우면 바닥을 숨긴다 */
    viewAllText?: string;
    /** 있으면 "모두 보기"가 링크다. view-all 을 취소하지 않으면 이 주소로 이동한다 */
    viewAllHref?: string;
}
export interface SmartviewRelatedListEvents extends SmartviewDataTableEvents {
    /** 제목 줄 단추를 눌렀을 때 */
    action: [payload: {
        name: string;
    }];
    /** "모두 보기"를 눌렀을 때. 취소 가능하다: view-all-href 가 있으면 preventDefault()로 이동을 막는다 */
    'view-all': [payload: {
        href: string;
    }];
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
export interface SmartviewRadioGroupProps extends SmartviewInputCommonProps {
    /** 고른 항목의 value. 프로퍼티는 현재 값 */
    value?: string;
    /** 항목 (프로퍼티). icon 은 쓰지 않는다 */
    options?: RadioButtonOption[];
    /** 항목을 한 줄로 늘어놓는다. 기본은 세로 */
    inline?: boolean;
    /** 고른 동그라미 테마 색. 기본 primary */
    color?: string;
}
export interface SmartviewRadioGroupEvents {
    /** 항목을 골랐을 때 (고르는 즉시 확정이라 change 와 같은 때) */
    input: [value: string];
    /** 항목을 골랐을 때 */
    change: [value: string];
}
export interface SmartviewCounterProps extends SmartviewInputCommonProps {
    /** 값. 프로퍼티는 현재 값 (사용자가 비우면 null) */
    value?: number;
    min?: number;
    max?: number;
    /** − + 단추·화살표 키 한 번에 바뀌는 크기. 기본 1 */
    step?: number;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 기본 comfortable */
    density?: InputDensity;
}
export interface SmartviewCounterEvents {
    /** 값이 바뀔 때마다 (글자·단추·화살표) */
    input: [value: number | null];
    /** 값을 확정했을 때: − + 단추를 뗄 때, 입력칸을 떠날 때 */
    change: [value: number | null];
}
/** 원형 진행률 모양 (LightningProgressRing variant) */
export type ProgressRingVariant = 'base' | 'base-autocomplete' | 'active-step' | 'warning' | 'expired' | 'complete';
export interface SmartviewProgressRingProps {
    /** 진행률 0~100 (밖이면 맞춘다) */
    value?: number;
    /** base(success) · active-step(primary) · warning(경고 아이콘) · expired(error, 금지 아이콘) · complete(체크) · base-autocomplete(100 이면 complete). 기본 base */
    variant?: ProgressRingVariant;
    /** medium 24px · large 32px. 기본 medium */
    size?: 'medium' | 'large';
    /** fill: 시계 방향으로 찬다(기본) · drain: 반대 방향으로 줄어든다 */
    direction?: 'fill' | 'drain';
    /** 스크린 리더 이름 (예: "동기화 진행률") */
    alternativeText?: string;
}
export type SmartviewProgressRingEvents = Record<never, never>;
export interface SmartviewTooltipProps {
    /** 말풍선 글자 */
    content?: string;
    /** 말풍선 꼬리 방향 (LightningTooltip nubbin): bottom 이면 말풍선이 위에 뜬다. 기본 bottom (원본 툴팁 위치 top) */
    nubbin?: 'top' | 'bottom' | 'left' | 'right';
    /** 늘 보인다 (마우스·포커스와 상관없이) */
    open?: boolean;
    /** 슬롯이 없을 때 도움말 아이콘 (MDI 이름). 비우면 mdi-information-outline */
    iconName?: string;
    /** 도움말 아이콘 색: default(흐린 글자색)·warning·error·success */
    iconVariant?: 'default' | 'warning' | 'error' | 'success';
    /** 도움말 아이콘 단추의 스크린 리더 이름. 비우면 "Help"/"도움말" */
    alternativeText?: string;
    /** 말풍선을 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export type SmartviewTooltipEvents = Record<never, never>;
export interface SmartviewPopoverProps {
    /** 열림. 프로퍼티는 현재 상태 (사용자가 열고 닫으면 바뀐다) */
    open?: boolean;
    /** 머리 제목 */
    heading?: string;
    /** 꼬리 방향 (LightningPopover nubbin): left 면 트리거 오른쪽에 뜬다. 기본 left */
    nubbin?: 'top' | 'bottom' | 'left' | 'right';
    /** 머리 색: 없음(기본)·error·warning·success */
    theme?: '' | 'error' | 'warning' | 'success';
    /** 폭: small 240px·medium 320px·large 480px. 기본 medium */
    size?: 'small' | 'medium' | 'large';
    /** 폭(px). 주면 size 대신 */
    width?: number;
    /** 닫기(×) 단추 */
    showClose?: boolean;
    /** 제목이 없을 때 스크린 리더 이름 */
    alternativeText?: string;
    /** 팝오버를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewPopoverEvents {
    /** 사용자가 열었을 때 (트리거 누르기) */
    open: [];
    /** 사용자가 닫았을 때 (트리거 다시 누르기·닫기 단추·Esc·바깥 누르기) */
    close: [];
}
/** 메뉴 항목 (smartview-menu, smartview-dropdown-menu). divider·header 는 구분선·머리글이고 그 밖에는 value·label 이 있어야 한다 */
export interface MenuItemOption {
    value?: string;
    label?: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 오른쪽 작은 글자 (단축키 등) */
    meta?: string;
    /** 주면 체크 항목: 켜짐 여부 (누르면 toggle, 호스트가 items 를 바꾼다) */
    checked?: boolean;
    disabled?: boolean;
    /** 링크 항목: select 를 취소하지 않으면 이 주소로 간다 */
    href?: string;
    /** 구분선 */
    divider?: boolean;
    /** 머리글 글자 */
    header?: string;
    /** 하위 메뉴 (smartview-dropdown-menu 만) */
    children?: MenuItemOption[];
}
export interface SmartviewMenuProps {
    /** 메뉴 항목 (프로퍼티) */
    items?: MenuItemOption[];
    /** 트리거 단추 글자. 비우면 아이콘 단추 */
    label?: string;
    /** 트리거 아이콘 (MDI 이름). 글자 단추면 앞, 아이콘 단추면 그 아이콘 (비우면 mdi-chevron-down) */
    iconName?: string;
    /** 아이콘 단추의 스크린 리더 이름. 비우면 "Show menu"/"메뉴 보기" */
    alternativeText?: string;
    /** 메뉴를 트리거의 왼쪽(left, 기본)·오른쪽(right) 끝에 맞춘다 */
    menuAlignment?: 'left' | 'right';
    disabled?: boolean;
    /** 항목을 불러오는 중: 트리거에 원이 돈다 */
    isLoading?: boolean;
    /** 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewMenuEvents {
    /** 항목을 골랐을 때. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        value: string;
        href: string;
    }];
    /** 체크 항목을 눌렀을 때. checked 는 바뀔 상태 (요소는 바꾸지 않는다: 호스트가 items 를 바꾼다) */
    toggle: [payload: {
        value: string;
        checked: boolean;
    }];
    /** 메뉴가 열렸을 때 */
    open: [];
    /** 메뉴가 닫혔을 때 */
    close: [];
}
export interface SmartviewDropdownMenuProps {
    /** 메뉴 항목 (프로퍼티). children 이 있는 항목은 하위 메뉴를 연다 */
    items?: MenuItemOption[];
    /** 트리거 단추 글자. 비우면 아이콘 단추 */
    label?: string;
    /** 트리거 아이콘 (MDI 이름). 글자 단추면 앞, 아이콘 단추면 그 아이콘 (비우면 mdi-chevron-down) */
    iconName?: string;
    /** 아이콘 단추의 스크린 리더 이름. 비우면 "Show menu"/"메뉴 보기" */
    alternativeText?: string;
    /** 메뉴를 트리거의 왼쪽(left, 기본)·오른쪽(right) 끝에 맞춘다 */
    menuAlignment?: 'left' | 'right';
    disabled?: boolean;
    /** 항목을 불러오는 중: 트리거에 원이 돈다 */
    isLoading?: boolean;
    /** 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewDropdownMenuEvents {
    /** 항목(하위 메뉴 항목 포함)을 골랐을 때. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        value: string;
        href: string;
    }];
    /** 체크 항목을 눌렀을 때. checked 는 바뀔 상태 (요소는 바꾸지 않는다: 호스트가 items 를 바꾼다) */
    toggle: [payload: {
        value: string;
        checked: boolean;
    }];
    /** 메뉴가 열렸을 때 */
    open: [];
    /** 메뉴가 닫혔을 때 */
    close: [];
}
export interface SmartviewPanelProps {
    /** 머리 제목 (패널 영역의 이름) */
    heading?: string;
    /** 접힘(숨김). 프로퍼티는 현재 상태 (사용자가 닫으면 true 로 바뀐다) */
    collapsed?: boolean;
    /** 화면 옆에 붙인 패널: 높이를 채우고 안쪽 한 변에만 테두리. 비우면 둥근 카드 */
    docked?: '' | 'left' | 'right';
    /** 폭: x-small 192·small 240·medium 320·large 400px, full 은 100% */
    size?: 'x-small' | 'small' | 'medium' | 'large' | 'full';
    /** 폭(px). 주면 size 대신 */
    width?: number;
    /** 닫기 단추를 숨긴다 */
    hideClose?: boolean;
}
export interface SmartviewPanelEvents {
    /** 사용자가 닫기 단추로 닫았을 때 (collapsed 가 true 로 바뀐다) */
    close: [];
}
export interface SmartviewDatepickerProps extends SmartviewInputCommonProps {
    /** 값: ISO 날짜 (YYYY-MM-DD). 비면 ''. 프로퍼티는 현재 값 */
    value?: string;
    /** 고를 수 있는 첫 날 (YYYY-MM-DD) */
    min?: string;
    /** 고를 수 있는 마지막 날 (YYYY-MM-DD) */
    max?: string;
    /** 입력칸에 보이고 입력받는 형식: yyyy·mm·dd 를 같은 구분자(- / .)로. 기본 yyyy-mm-dd (값은 늘 ISO) */
    dateFormat?: string;
    /** 비었을 때 글자. 비우면 입력 형식 */
    placeholder?: string;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 값 지우기 단추 */
    clearable?: boolean;
    /** 기본 comfortable */
    density?: InputDensity;
    /** 달력을 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewDatepickerEvents {
    /** 날짜를 바꿨을 때 (달력에서 고르기, 입력 후 떠나기·Enter, 지우기). 값은 ISO 날짜 또는 '' */
    change: [value: string];
}
export interface SmartviewTimepickerProps extends SmartviewInputCommonProps {
    /** 값: 24시간 "HH:MM". 비면 ''. 프로퍼티는 현재 값 */
    value?: string;
    /** 목록 첫 시각·입력 하한 ("HH:MM", 비면 00:00) */
    min?: string;
    /** 목록 끝 시각·입력 상한 ("HH:MM", 비면 23:59) */
    max?: string;
    /** 목록 간격(분). 기본 15 */
    step?: number;
    /** 비었을 때 글자. 비우면 HH:MM */
    placeholder?: string;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 값 지우기 단추 */
    clearable?: boolean;
    /** 기본 comfortable */
    density?: InputDensity;
    /** 목록을 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewTimepickerEvents {
    /** 시각을 바꿨을 때 (목록에서 고르기, 입력 후 떠나기·Enter, 지우기). 값은 "HH:MM" 또는 '' */
    change: [value: string];
}
export interface SmartviewDatetimePickerProps extends SmartviewInputCommonProps {
    /** 값: 지역 날짜·시각 "YYYY-MM-DDTHH:MM" (시간대 없음). 비면 ''. 프로퍼티는 현재 값 */
    value?: string;
    /** 하한 ("YYYY-MM-DDTHH:MM", 날짜만 주면 그날 00:00) */
    min?: string;
    /** 상한 ("YYYY-MM-DDTHH:MM", 날짜만 주면 그날 23:59) */
    max?: string;
    /** 시각 목록 간격(분). 기본 30 */
    step?: number;
    /** 날짜 칸에 보이고 입력받는 형식 (smartview-datepicker 와 같다). 기본 yyyy-mm-dd */
    dateFormat?: string;
    /** 읽기 전용 (값은 제출된다) */
    readonly?: boolean;
    /** 기본 comfortable */
    density?: InputDensity;
    /** 달력·시각 목록을 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewDatetimePickerEvents {
    /** 값이 바뀌었을 때: 날짜·시각이 모두 있으면 "YYYY-MM-DDTHH:MM", 한쪽을 지우면 '' */
    change: [value: string];
}
/** 양쪽 목록 선택 항목 (LightningDuelingPicklist option) */
export interface DuelingPicklistOption {
    label: string;
    value: string;
    /** 잠금: 표시·이동할 수 없다 */
    disabled?: boolean;
}
export interface SmartviewDuelingPicklistProps extends SmartviewInputCommonProps {
    /** 고른 값 (프로퍼티). 순서가 오른쪽 목록 순서다. 프로퍼티는 현재 값 */
    value?: string[];
    /** 모든 항목 (프로퍼티) */
    options?: DuelingPicklistOption[];
    /** 왼쪽 목록 이름. 비우면 "Available"/"선택 가능" */
    sourceLabel?: string;
    /** 오른쪽 목록 이름. 비우면 "Selected"/"선택됨" */
    selectedLabel?: string;
    /** 오른쪽 목록에서 뺄 수 없는 값 (프로퍼티) */
    requiredOptions?: string[];
    /** 최소 개수: 이보다 적어지게 빼지 않고, 적으면 <form> 제출을 막는다 */
    min?: number;
    /** 최대 개수: 넘는 만큼은 옮기지 않는다 */
    max?: number;
    /** 위·아래 순서 단추를 숨긴다 */
    disableReordering?: boolean;
    /** 목록에 보이는 줄 수 (높이). 기본 6 */
    size?: number;
}
export interface SmartviewDuelingPicklistEvents {
    /** 고른 값이 바뀌었을 때 (옮기기·순서 바꾸기). 값은 오른쪽 목록 순서 */
    change: [value: string[]];
}
/** 트리 항목 (LightningTrees·lightning-tree items) */
export interface TreeItemOption {
    /** 고유 키 (선택·펼침 상태의 기준). 없거나 겹치면 그 항목은 빠진다 */
    name: string;
    label: string;
    /** 라벨 옆 보조 글자 */
    metatext?: string;
    /** 링크 항목: select 를 취소하지 않으면 이 주소로 간다 */
    href?: string;
    disabled?: boolean;
    /** 처음에 펼친다 */
    expanded?: boolean;
    /** 하위 항목 */
    items?: TreeItemOption[];
}
export interface SmartviewTreeProps {
    /** 항목 (프로퍼티) */
    items?: TreeItemOption[];
    /** 트리 위 머리글 (트리의 이름) */
    header?: string;
    /** 고른 항목의 name. 프로퍼티는 현재 값 (사용자가 고르면 바뀐다). 숨은 항목이면 조상을 펼친다 */
    selectedItem?: string;
}
export interface SmartviewTreeEvents {
    /** 항목을 골랐을 때. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        name: string;
        href: string;
    }];
}
/** 활동 종류 (LightningActivityTimeline type). 아이콘·점 색이 정해진다 */
export type ActivityType = 'task' | 'call' | 'email' | 'event';
/** 활동 타임라인 항목 */
export interface ActivityTimelineItem {
    /** 고유 키 (이벤트 payload) */
    name: string;
    title: string;
    /** 보이는 날짜·시각 글자 (예: "9:00 | 2026-10-02"). 요소는 형식을 바꾸지 않는다 */
    date?: string;
    /** 기본 task */
    type?: ActivityType;
    /** 아이콘 (MDI 이름). 비우면 종류의 아이콘 */
    icon?: string;
    /** 제목 아래 한 줄 */
    subtitle?: string;
    /** 제목을 링크로: select 를 취소하지 않으면 이 주소로 간다 */
    href?: string;
    /** 할 일 체크 상자를 보인다. 값은 completed (누르면 complete, 호스트가 바꾼다) */
    task?: boolean;
    completed?: boolean;
    /** 제목 옆 작은 아이콘들 (MDI 이름, 예: mdi-paperclip) */
    flags?: string[];
    /** 펼친 상세: 필드 */
    fields?: {
        label: string;
        value: string;
    }[];
    /** 펼친 상세: 설명 */
    description?: string;
    /** 처음에 펼친다 */
    expanded?: boolean;
}
export interface SmartviewActivityTimelineProps {
    /** 항목 (프로퍼티), 위에서부터 그린다 */
    items?: ActivityTimelineItem[];
}
export interface SmartviewActivityTimelineEvents {
    /** 제목을 눌렀을 때. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        name: string;
        href: string;
    }];
    /** 할 일 체크 상자를 눌렀을 때. completed 는 바뀔 상태 (요소는 바꾸지 않는다: 호스트가 items 를 바꾼다) */
    complete: [payload: {
        name: string;
        completed: boolean;
    }];
}
/** 빌더 머리의 단추·영역 이름 (LightningBuilderHeader show* 대응) */
export type BuilderHeaderAction = 'header' | 'back' | 'app-name' | 'dropdown' | 'page-type' | 'settings' | 'help' | 'toolbar' | 'canvas-settings' | 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'toggle-panel' | 'run' | 'save-as' | 'save';
export interface SmartviewBuilderHeaderProps {
    /** 앱 이름 */
    appName?: string;
    /** 드롭다운(페이지 고르기) 단추 글자 */
    dropdownLabel?: string;
    /** 드롭다운 메뉴 머리글 */
    menuHeader?: string;
    /** 드롭다운 메뉴 항목 (프로퍼티) */
    menuItems?: MenuItemOption[];
    /** 페이지 종류 (머리 가운데 제목) */
    pageType?: string;
    /** 툴바 오른쪽 상태 글자 (예: "Saved 2 minutes ago") */
    status?: string;
    /** 경고 아이콘 단추 */
    warning?: boolean;
    /** 오류 아이콘 단추 */
    error?: boolean;
    /** 숨길 단추·영역. 속성은 쉼표·공백으로 나눈 글자, 프로퍼티는 배열 (원본 show* 를 끈 것) */
    hiddenActions?: string | BuilderHeaderAction[];
    /** 비활성 단추 (예: "undo redo"). 형식은 hiddenActions 와 같다 */
    disabledActions?: string | BuilderHeaderAction[];
}
export interface SmartviewBuilderHeaderEvents {
    /** 단추를 눌렀을 때 (back·settings·help·canvas-settings·undo·redo·cut·copy·paste·toggle-panel·run·save-as·save·warning·error) */
    action: [payload: {
        action: BuilderHeaderAction | 'warning' | 'error';
    }];
    /** 드롭다운 메뉴 항목을 골랐을 때. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        value: string;
        href: string;
    }];
}
/** 풀다운 메뉴 항목 (LightningPulldownMenu PulldownItem). 메뉴 항목에 단축키를 더한다 */
export interface PulldownItemOption extends Omit<MenuItemOption, 'children' | 'meta'> {
    /** 단축키: "Mod+S"(맥 ⌘, 그 밖 Ctrl), "Ctrl+Shift+P", "Alt+F4", "F1". 오른쪽에 보이고, 누르면 그 항목을 고른 것과 같다 */
    shortcut?: string;
    /** 하위 메뉴 (여러 단계) */
    items?: PulldownItemOption[];
}
/** 풀다운 메뉴 하나 (메뉴 막대의 File, Edit …) */
export interface PulldownMenuOption {
    value: string;
    label: string;
    /** 라벨 앞 아이콘 (MDI 이름) */
    icon?: string;
    disabled?: boolean;
    items: PulldownItemOption[];
}
export interface SmartviewPulldownMenuProps {
    /** 메뉴 막대의 메뉴 (프로퍼티) */
    menus?: PulldownMenuOption[];
    /** 단축키를 듣지 않는다 (표기는 그대로 보인다). 한 화면에 메뉴 막대가 여럿이면 하나만 듣게 한다 */
    disableShortcuts?: boolean;
    /** 메뉴 막대의 스크린 리더 이름. 비우면 "Application menu"/"앱 메뉴" */
    alternativeText?: string;
    /** 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewPulldownMenuEvents {
    /** 항목을 골랐을 때 (누르기·단축키). path 는 메뉴부터 항목까지의 value. 취소 가능하다: 링크 항목(href)이면 preventDefault() 로 이동을 막는다 */
    select: [payload: {
        value: string;
        path: string[];
        href: string;
        viaShortcut: boolean;
    }];
    /** 체크 항목을 눌렀을 때 (누르기·단축키). checked 는 바뀔 상태 (요소는 바꾸지 않는다: 호스트가 menus 를 바꾼다) */
    toggle: [payload: {
        value: string;
        path: string[];
        checked: boolean;
    }];
    /** 메뉴를 열었을 때 */
    open: [payload: {
        menu: string;
    }];
    /** 메뉴를 닫았을 때 */
    close: [];
}
/** 상태 막대 항목의 상태 색 (LightningStatusBar variant). 아이콘·점·진행 막대의 색이다 (글자색은 바꾸지 않는다) */
export type StatusBarVariant = 'default' | 'info' | 'success' | 'warning' | 'error' | 'offline';
/** 상태 막대 항목 (LightningStatusBar StatusItem) */
export interface StatusBarItem {
    /** 고유 키 (이벤트 payload). 구분선·빈 칸은 없어도 된다 */
    value?: string;
    /** 놓일 자리. 기본 left */
    region?: 'left' | 'center' | 'right';
    label?: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    variant?: StatusBarVariant;
    /** 아이콘 대신 상태 색 점 */
    dot?: boolean;
    /** 라벨 뒤 작은 수·글자 */
    badge?: string | number;
    /** 마우스를 올렸을 때 설명 (비우면 없음) */
    tooltip?: string;
    /** 누를 수 있다 (누르면 select). menu·popover 가 있으면 저절로 누를 수 있다 */
    clickable?: boolean;
    disabled?: boolean;
    /** 세로 구분선 */
    divider?: boolean;
    /** 남는 폭을 밀어내는 빈 칸 */
    spacer?: boolean;
    /** 진행률 0~100: 라벨 옆 얇은 막대 */
    progress?: number;
    /** 위로 열리는 메뉴 (smartview-pulldown-menu 와 같은 항목, 단축키는 표기만) */
    menu?: PulldownItemOption[];
    /** 위로 열리는 팝오버 */
    popover?: {
        heading?: string;
        body?: string;
        /** 폭(px). 기본 280 */
        width?: number;
        /** 아래 단추. 누르면 select (path 는 [항목, 단추]) */
        actions?: {
            value: string;
            label: string;
        }[];
    };
}
export interface SmartviewStatusBarProps {
    /** 항목 (프로퍼티) */
    items?: StatusBarItem[];
    /** 화면 아래에 고정한다 (본문 아래 여백은 호스트가 비운다). 기본은 세로 flex 셸의 마지막 자식으로 바닥에 붙는다 */
    fixed?: boolean;
    /** 낮은 막대 (24px, 기본 28px) */
    compact?: boolean;
    /** 막대의 스크린 리더 이름. 비우면 "Status bar"/"상태 표시줄" */
    alternativeText?: string;
    /** 메뉴·팝오버를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewStatusBarEvents {
    /** 항목·메뉴 항목·팝오버 단추를 골랐을 때. path 는 항목부터 고른 것까지의 value */
    select: [payload: {
        value: string;
        path: string[];
        region: 'left' | 'center' | 'right';
    }];
    /** 메뉴의 체크 항목을 눌렀을 때. checked 는 바뀔 상태 (요소는 바꾸지 않는다: 호스트가 items 를 바꾼다) */
    toggle: [payload: {
        value: string;
        path: string[];
        checked: boolean;
    }];
}
/** 트리 표 열 (LightningTreeGridExtended column) */
export interface TreeGridColumn {
    /** 행 객체의 필드 이름 */
    fieldName: string;
    label: string;
    /** 값 모양. 기본 text */
    type?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'boolean' | 'badge';
    /** 처음 폭(px). 비우면 나머지 폭을 나눈다 */
    width?: number;
    /** currency 의 통화 (기본 USD) */
    currencyCode?: string;
}
/** 트리 표 행. 필드 값은 columns 의 fieldName 으로 읽는다 */
export interface TreeGridRow {
    /** 고유 키 */
    id: string;
    /** 하위 행 */
    children?: TreeGridRow[];
    /** 하위 행이 있지만 아직 불러오지 않았다: 펼치면 load-children 을 보낸다 (호스트가 children 을 채운다) */
    hasChildren?: boolean;
    /** 처음에 펼친다 */
    expanded?: boolean;
    [field: string]: unknown;
}
export interface SmartviewTreeGridProps {
    /** 열 (프로퍼티) */
    columns?: TreeGridColumn[];
    /** 행 (프로퍼티). 끌어 옮기면 요소가 바꾸고 프로퍼티에도 쓴다 */
    data?: TreeGridRow[];
    /** 펼침 단추가 붙는 열의 fieldName. 비우면 첫 열 */
    expandColumn?: string;
    /** 행 고르기: 없음(기본), 하나, 여러 개(체크 상자) */
    selectionMode?: 'none' | 'single' | 'multiple';
    /** 고른 행 id (프로퍼티). 프로퍼티는 현재 값 */
    selectedRows?: string[];
    /** 끌어서(또는 Alt+↑↓) 같은 부모 안에서 순서를 바꾼다 */
    reorderable?: boolean;
    /** 머리 칸 오른쪽 끝을 끌어 열 폭을 바꾼다 */
    resizableColumns?: boolean;
    /** 불러오는 중 (표 위 진행 막대) */
    loading?: boolean;
    /** 표의 스크린 리더 이름 */
    alternativeText?: string;
}
export interface SmartviewTreeGridEvents {
    /** 행을 펼치거나 접었을 때 */
    toggle: [payload: {
        id: string;
        expanded: boolean;
    }];
    /** 아직 불러오지 않은 하위 행(hasChildren)을 펼쳤을 때 */
    'load-children': [payload: {
        id: string;
    }];
    /** 고른 행이 바뀌었을 때 */
    'selection-change': [ids: string[]];
    /** 행을 누르거나 행에서 Enter 를 눌렀을 때 */
    'row-click': [payload: {
        id: string;
    }];
    /** 순서를 바꿨을 때 (data 가 바뀐 뒤). parentId 는 최상위면 '' */
    reorder: [payload: {
        id: string;
        parentId: string;
        from: number;
        to: number;
    }];
    /** 열 폭을 바꿨을 때 */
    resize: [payload: {
        fieldName: string;
        width: number;
    }];
}
/** 탐색기 노드 (LightningExplorer ExplorerNode) */
export interface ExplorerNodeOption {
    /** 고유 키 (파일 경로). 고르기·펼치기·끌기가 이 값을 기준으로 한다 */
    path: string;
    /** 보일 이름 */
    name: string;
    /** 비우면 children·hasChildren 이 있으면 folder */
    type?: 'file' | 'folder';
    children?: ExplorerNodeOption[];
    /** 하위 노드를 아직 읽지 않은 폴더: 펼치면 toggle 을 보낸다 (호스트가 children 을 채운다) */
    hasChildren?: boolean;
    /** 아이콘 (MDI 이름). 비우면 확장자로 고른다 */
    icon?: string;
    /** 이름 옆 짧은 표시 */
    badge?: string;
    badgeColor?: string;
    disabled?: boolean;
    /** 처음에 펼친다 */
    expanded?: boolean;
    /** 이 줄에만 붙일 줄 단추 value (비우면 rowActions 의 on 규칙대로) */
    actions?: string[];
    /** 켜져 있는 토글 줄 단추 value (강조되고 늘 보인다) */
    activeActions?: string[];
}
/** 탐색기 머리 단추 */
export interface ExplorerAction {
    value: string;
    /** MDI 이름 */
    icon: string;
    /** 툴팁·스크린 리더 이름 */
    label: string;
}
/** 탐색기 줄 단추 (줄에 마우스를 올리거나 포커스가 가면 보인다) */
export interface ExplorerRowAction extends ExplorerAction {
    /** 붙일 줄. 기본 all */
    on?: 'file' | 'folder' | 'all';
    /** 늘 보인다 */
    always?: boolean;
    /** 켜짐·꺼짐 단추 (노드의 activeActions 에 있으면 켜짐) */
    toggle?: boolean;
    /** 되돌리기 어려운 동작 (마우스를 올리면 error 색) */
    destructive?: boolean;
    /** 누르면 이름 바꾸기를 시작한다 (renamable 일 때) */
    rename?: boolean;
}
export interface SmartviewExplorerProps {
    /** 노드 (프로퍼티) */
    nodes?: ExplorerNodeOption[];
    /** 고른 노드 path. 프로퍼티는 현재 값 */
    selectedPath?: string;
    /** 머리 제목. 비우면 머리를 그리지 않는다 (단추가 있으면 단추만) */
    heading?: string;
    /** 머리 오른쪽 단추 (프로퍼티) */
    actions?: ExplorerAction[];
    /** 줄 오른쪽 단추 (프로퍼티) */
    rowActions?: ExplorerRowAction[];
    /** 오른쪽 누르기 메뉴 (smartview-pulldown-menu 와 같은 항목, 단축키는 표기만). rename 값 항목은 이름 바꾸기를 시작한다 */
    contextMenu?: PulldownItemOption[];
    /** 검색 칸 */
    showSearch?: boolean;
    /** 검색 칸 자리. 기본 bottom (원본과 같다) */
    searchPosition?: 'top' | 'bottom';
    searchPlaceholder?: string;
    /** 파일·폴더를 폴더 위로 끌어 옮긴다 (실제 이동은 호스트, move 이벤트). HTML draggable 과 겹쳐 이 이름이다 */
    movable?: boolean;
    /** F2·줄 단추·메뉴로 이름 바꾸기 */
    renamable?: boolean;
    /** 빈 트리 문구. 비우면 "No files"/"파일이 없습니다" */
    emptyText?: string;
    /** 높이(px). 비우면 호스트 높이를 채운다 */
    height?: number;
    /** 메뉴를 여는 위치. 기본 body */
    overlayTarget?: OverlayTarget;
}
export interface SmartviewExplorerEvents {
    /** 줄을 골랐을 때 */
    select: [payload: {
        path: string;
    }];
    /** 파일을 열었을 때 (두 번 누르기·Enter) */
    open: [payload: {
        path: string;
    }];
    /** 폴더를 펼치거나 접었을 때. 늦게 읽는 폴더면 이때 children 을 채운다 */
    toggle: [payload: {
        path: string;
        expanded: boolean;
    }];
    /** 끌어 놓았을 때 (target 은 폴더 path, 최상위면 ''). 실제 이동은 호스트가 한다 */
    move: [payload: {
        source: string;
        target: string;
    }];
    /** 이름 바꾸기를 확정했을 때 (실제 바꾸기는 호스트가 한다) */
    rename: [payload: {
        path: string;
        name: string;
        oldName: string;
    }];
    /** 머리 단추를 눌렀을 때 */
    action: [payload: {
        value: string;
    }];
    /** 줄 단추를 눌렀을 때. 토글이면 active 는 누르기 전 상태 */
    'row-action': [payload: {
        value: string;
        path: string;
        active: boolean;
    }];
    /** 오른쪽 누르기 메뉴 항목을 골랐을 때. menuPath 는 메뉴 항목까지의 value */
    'menu-select': [payload: {
        value: string;
        menuPath: string[];
        path: string;
    }];
}
export interface SmartviewRichTextEditorProps extends SmartviewInputCommonProps {
    /** 값: HTML. 넣을 때·바꿀 때 정화한다 (스크립트·이벤트 속성·javascript: 주소는 빠진다). 프로퍼티는 현재 값 */
    value?: string;
    /** 비었을 때 글자 */
    placeholder?: string;
    /** 편집 칸 높이(px). 기본 240 */
    height?: number;
    /** 읽기 전용: 편집·툴바를 막는다 (값은 제출된다) */
    readonly?: boolean;
}
export interface SmartviewRichTextEditorEvents {
    /** 내용이 바뀔 때마다 (정화한 HTML) */
    input: [value: string];
    /** 바꾸고 편집 칸을 떠났을 때 (정화한 HTML) */
    change: [value: string];
}
/** 격자 열 값 모양 */
export type GridColumnType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'boolean' | 'picklist' | 'badge' | 'email' | 'url';
/** 격자 열 (LightningGrid uibGrid column) */
export interface GridColumn {
    /** 행 객체의 필드 이름 */
    fieldName: string;
    label: string;
    /** 기본 text */
    type?: GridColumnType;
    /** 정렬. 기본 참 */
    sortable?: boolean;
    /** 거르기. 기본 참 */
    filterable?: boolean;
    /** 폭(px) */
    width?: number;
    /** currency 의 통화 (기본 USD) */
    currencyCode?: string;
    /** picklist·badge 거르기 항목. 비우면 데이터에 있는 값 */
    options?: string[];
    /** badge 값 → 테마 색 이름 */
    badgeColors?: Record<string, string>;
    /** 칸을 두 번 누르거나(또는 F2) 고칠 수 있다 (WI-6.048) */
    editable?: boolean;
    /** 수식 열: 같은 행의 다른 열로 계산한다 (고칠 수 없다). 종류가 없으면 number (WI-6.050) */
    formula?: GridFormula;
    /** 집계 (aggregate-position 이 있을 때). 배열이면 집계 줄마다 하나 (WI-6.050) */
    aggregate?: GridAggregate | GridAggregate[];
    /** 집계 이름 (배열이면 줄마다). 기본은 합계·평균 같은 함수 이름 */
    aggregateLabel?: string | string[];
    /** aggregate 'custom' 의 계산: 빈 값을 뺀 값들과 행들 */
    customAggregate?: GridAggregateFunction;
}
/** 집계 함수 (원본 sum·average·count·min·max·custom) */
export type GridAggregate = 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
export type GridAggregateFunction = (values: unknown[], rows: GridRow[]) => unknown;
/**
 * 수식 (원본 formula). sum·multiply 는 fields 모두, subtract·divide 는 fields 두 개(앞 − 뒤, 앞 ÷ 뒤, 0 으로 나누면 빈 값).
 * custom 은 expression: 숫자·열 이름·+ − × ÷ %·괄호만 쓰는 산술식 (예 `amount * probability / 100`). 빈 값은 0 으로 본다
 */
export interface GridFormula {
    type: 'sum' | 'multiply' | 'subtract' | 'divide' | 'custom';
    fields?: string[];
    expression?: string;
}
/** 행 묶음 (원본 config.rowGrouping, WI-6.050) */
export interface GridRowGrouping {
    /** 묶을 열 fieldName (앞이 바깥 묶음) */
    fields: string[];
    /** 묶음 줄·총계 줄의 집계: fieldName → 함수 */
    aggregates?: Record<string, GridAggregate | GridAggregateFunction>;
    /** 총계 줄. 기본 참 */
    showGrandTotal?: boolean;
    /** 총계 줄 이름. 기본 "Grand total" (i18n) */
    grandTotalLabel?: string;
    /** 처음에 펼친다. 기본 참 */
    defaultExpanded?: boolean;
}
/** 격자 열 묶음: 두 줄 머리의 위 칸 (WI-6.048) */
export interface GridColumnGroup {
    label: string;
    /** 묶을 열 fieldName (열 순서대로 이어져 있어야 한다) */
    fieldNames: string[];
}
/** 격자 행. id 가 고유 키이고 필드 값은 columns 의 fieldName 으로 읽는다 */
export interface GridRow {
    id: string;
    [field: string]: unknown;
}
export type GridFilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'isEmpty' | 'isNotEmpty' | 'in';
/** 열 하나의 거르기. in 은 values 중 하나 (boolean·picklist·badge) */
export interface GridFilter {
    fieldName: string;
    operator: GridFilterOperator;
    value?: string;
    values?: string[];
}
export interface GridSort {
    fieldName: string;
    direction: 'asc' | 'desc';
}
/** 격자 행 작업 (원본 config.rowActions). 행 끝 메뉴 단추로 연다 */
export interface GridRowAction {
    name: string;
    label: string;
    /** 앞 아이콘 (MDI 이름) */
    icon?: string;
    /** 지우기처럼 되돌릴 수 없는 작업: error 색 */
    destructive?: boolean;
    disabled?: boolean;
    /** 행마다 보일지. 없으면 항상 보인다 (원본 visibleWhen) */
    visible?: (row: GridRow) => boolean;
}
export interface SmartviewGridProps {
    /** 열 (프로퍼티) */
    columns?: GridColumn[];
    /** 행 (프로퍼티). server-side 면 지금 페이지의 행 */
    data?: GridRow[];
    /** 행 고르기: 없음(기본), 하나, 여러 개 (체크 상자) */
    selectionMode?: 'none' | 'single' | 'multiple';
    /** 고른 행 id (프로퍼티). 프로퍼티는 현재 값 */
    selectedRows?: string[];
    /** 정렬 (프로퍼티, 하나). 프로퍼티는 현재 값 */
    sortBy?: GridSort[];
    /** 거르기 (프로퍼티, 열마다 하나). 프로퍼티는 현재 값 */
    filters?: GridFilter[];
    /** 페이지 (1 부터). 프로퍼티는 현재 값 */
    page?: number;
    /** 페이지당 행. 기본 25. 프로퍼티는 현재 값 */
    pageSize?: number;
    /** 줄무늬 행 */
    stripe?: boolean;
    /** 행 번호 열 */
    rowNumbers?: boolean;
    /** 표 높이(px): 넘치면 머리를 고정하고 몸통만 스크롤 */
    height?: number;
    /** 서버 쪽 처리: 정렬·거르기·페이지를 요소가 하지 않고 data-request 로 알린다. data 는 지금 페이지 */
    serverSide?: boolean;
    /** server-side 의 전체 행 수 */
    totalRecords?: number;
    /** 지금 보고 있는 행 (마스터-디테일 표시, 고르기와 다르다) */
    activeRowId?: string;
    /** 불러오는 중 */
    loading?: boolean;
    /** 표의 스크린 리더 이름 */
    alternativeText?: string;
    /** 열 묶음 (프로퍼티): 두 줄 머리 */
    columnGroups?: GridColumnGroup[];
    /** 왼쪽에 고정할 열 수 (고르기·행 번호 열 다음부터, 가로 스크롤해도 남는다). 묶은 열은 고정하지 않는다 */
    fixedColumns?: number;
    /** 머리 칸 오른쪽 끝을 끌어 열 폭을 바꾼다 */
    resizableColumns?: boolean;
    /** 숨긴 열 fieldName (프로퍼티). 프로퍼티는 현재 값 */
    hiddenColumns?: string[];
    /** 표 위 도구 줄: 열 표시 메뉴, CSV 내보내기 */
    showToolbar?: boolean;
    /** 칸 오른쪽 누르기 메뉴 (프로퍼티, 하위 메뉴·링크 없음). value `copy`·`edit` 는 요소가 한다 (칸 복사, 편집 시작) */
    contextMenu?: MenuItemOption[];
    /** 행 작업 (프로퍼티): 행 끝 메뉴 단추 */
    rowActions?: GridRowAction[];
    /** CSV 내보내기 파일 이름. 기본 grid-export.csv */
    exportFileName?: string;
    /** 집계 줄 위치 (열의 aggregate). 기본 none. 행 묶음이 있으면 쓰지 않는다 */
    aggregatePosition?: 'none' | 'top' | 'bottom' | 'both';
    /** 행 묶음 (프로퍼티). 있으면 페이지를 나누지 않고 모든 행을 묶어 보인다 */
    rowGrouping?: GridRowGrouping;
    /** 상세 행에 보일 값 (프로퍼티): 있으면 행 앞에 펼치기 단추 */
    detailColumns?: GridColumn[];
    /** 펼친 행 id (프로퍼티). 프로퍼티는 현재 값 */
    expandedRows?: string[];
}
export interface SmartviewGridEvents {
    /** 정렬을 바꿨을 때 */
    'sort-change': [sortBy: GridSort[]];
    /** 거르기를 바꿨을 때 (적용·지우기) */
    'filter-change': [filters: GridFilter[]];
    /** 페이지·페이지당 행을 바꿨을 때 */
    'page-change': [payload: {
        page: number;
        pageSize: number;
    }];
    /** 고른 행이 바뀌었을 때 */
    'selection-change': [ids: string[]];
    /** 행을 누르거나 행에서 Enter */
    'row-click': [payload: {
        id: string;
    }];
    /** server-side 에서 정렬·거르기·페이지가 바뀌었을 때: 호스트가 그 페이지의 data·totalRecords 를 준다 */
    'data-request': [payload: {
        page: number;
        pageSize: number;
        sortBy: GridSort[];
        filters: GridFilter[];
    }];
    /** 칸을 고쳤을 때 (data 가 바뀐 뒤). 호스트가 저장하고 data 를 새로 주면 고친 표시가 사라진다 */
    'cell-value-change': [payload: {
        id: string;
        fieldName: string;
        value: unknown;
        oldValue: unknown;
    }];
    /** 열 폭을 바꿨을 때 */
    'column-resize': [payload: {
        fieldName: string;
        width: number;
    }];
    /** 열 표시를 바꿨을 때 */
    'column-visibility-change': [hiddenColumns: string[]];
    /** 칸 메뉴 항목을 골랐을 때 (copy·edit 는 요소가 하고 보내지 않는다) */
    'menu-select': [payload: {
        value: string;
        id: string;
        fieldName: string;
    }];
    /** 행 작업을 골랐을 때 */
    'row-action': [payload: {
        action: string;
        id: string;
        row: GridRow;
    }];
    /** 칸을 복사했을 때 (Ctrl+C·칸 메뉴 copy). 클립보드를 쓸 수 없으면 success 거짓 */
    'cell-copy': [payload: {
        id: string;
        fieldName: string;
        text: string;
        success: boolean;
    }];
    /** 상세 행을 펼쳤을 때 */
    'row-expand': [payload: {
        id: string;
        row: GridRow;
        expandedRows: string[];
    }];
    /** 상세 행을 접었을 때 */
    'row-collapse': [payload: {
        id: string;
        row: GridRow;
        expandedRows: string[];
    }];
    /** CSV 를 내보내기 전 (취소하면 내려받지 않는다: 호스트가 csv 로 직접 처리) */
    'csv-export': [payload: {
        csv: string;
        fileName: string;
    }];
}
