// 좁은 화면(폰) 여부 (WI-7.011). 기준은 vue-smartview 셸이 좁은 화면으로 보는 폭과 같다.
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export const NARROW_QUERY = '(max-width: 839.98px)'

// 좁은 화면에서 긴 글자 열(이름·메시지)의 최대 폭. 넘치면 말줄임한다
export const NARROW_TEXT_WIDTH = '140px'

interface SizedHeader {
  key: string
  width?: number | string
  maxWidth?: number | string
}

/**
 * 표 열 중 좁은 화면에서도 남길 열만 거른다 (나머지 열은 행을 눌러 여는 상세 등에서 본다).
 * 넓은 화면용 고정 폭은 풀고, 긴 글자 열은 좁게 줄인다: 고정 폭의 합이 폰 폭보다 커 열이 잘렸다.
 */
export function narrowHeaders<T extends SizedHeader>(headers: T[], keep: readonly string[], narrow: boolean): T[] {
  if (!narrow) return headers
  return headers
    .filter((header) => keep.includes(header.key))
    .map((header) => ({
      ...header,
      width: undefined,
      maxWidth: header.maxWidth === undefined ? undefined : NARROW_TEXT_WIDTH,
    }))
}

export function useNarrow(): Ref<boolean> {
  const media = window.matchMedia(NARROW_QUERY)
  const narrow = ref(media.matches)
  const onChange = (event: MediaQueryListEvent): void => {
    narrow.value = event.matches
  }
  onMounted(() => media.addEventListener('change', onChange))
  onBeforeUnmount(() => media.removeEventListener('change', onChange))
  return narrow
}
