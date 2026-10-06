// 녹화 오버레이(director.ts)가 window 에 두는 값. page.evaluate 콜백은 브라우저에서 실행되므로 이 선언으로 타입을 맞춘다.

interface E2eCaption {
  step?: string
  text: string
}

interface E2eTitleCard {
  badge?: string
  title: string
  subtitle?: string
}

interface E2eCoverage {
  total: number
  touched: number
  untouched: string[]
  disabled: string[]
  // 판정에 쓴 식별자 전체와 조작한 식별자 (Node 쪽에서 장면 전체로 모은다)
  seenKeys: string[]
  touchedKeys: string[]
}

interface Window {
  __e2eCaption?: (caption: E2eCaption | null) => void
  __e2eTitle?: (card: E2eTitleCard | null) => void
  __e2eCoverage?: () => E2eCoverage
}
