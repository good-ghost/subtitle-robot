import type { ChannelStageState } from '../types';
export declare const CHANNEL_STAGES: readonly ["available", "loaded", "auth", "enabled"];
export type ChannelStageKey = (typeof CHANNEL_STAGES)[number];
/** /channels/status 의 adapters 항목 */
export interface ChannelAdapterInfo {
    available?: boolean;
    loaded?: boolean;
    requires_credentials?: boolean;
    /** 어댑터가 선언한 자격 증명 칸. required 가 false 가 아니면 필수 */
    credential_fields?: {
        name: string;
        required?: boolean;
    }[];
}
/** 채널 설정 */
export interface ChannelConfig {
    api_key?: string;
    enabled?: boolean;
    credentials?: Record<string, unknown>;
}
export interface ChannelStage {
    key: ChannelStageKey;
    state: ChannelStageState;
}
/** 채널의 단계별 진행 상태 (CHANNEL_STAGES 순서) */
export declare function channelStages(info: ChannelAdapterInfo | null | undefined, config: ChannelConfig | null | undefined): ChannelStage[];
/** 지금 막혀 있는 단계의 키. 모두 통과했으면 null */
export declare function blockedStage(info: ChannelAdapterInfo | null | undefined, config: ChannelConfig | null | undefined): ChannelStageKey | null;
/** 채널이 실제로 메시지를 주고받을 수 있는 상태인지 */
export declare function isChannelLive(info: ChannelAdapterInfo | null | undefined, config: ChannelConfig | null | undefined): boolean;
