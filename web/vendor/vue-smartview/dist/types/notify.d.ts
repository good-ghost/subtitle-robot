export interface NotifyOptions {
    text: string;
    /** 테마 색 (success, error, info, warning, primary …). 기본 success */
    color?: string;
    /** 밀리초. 기본 3000. -1 이면 닫기 버튼을 누를 때까지 둔다 */
    timeout?: number;
}
/**
 * 스낵바 알림을 띄운다. 이어서 부르면 이전 알림은 닫히고 마지막 알림이 보인다.
 * 요소를 불러오는 동안 부른 알림도 요소가 뜨면 보인다 (마지막 것).
 */
export declare function notify({ text, color, timeout }: NotifyOptions): Promise<void>;
export declare function notifySuccess(text: string): Promise<void>;
export declare function notifyError(text: string): Promise<void>;
export declare function notifyInfo(text: string): Promise<void>;
