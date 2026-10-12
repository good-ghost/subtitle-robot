// 자막 검수 표시 규칙 (WI-7.009): 검수 상태의 모양, 표에 넣을 줄, 걸러 보기
import type { ReviewRow } from './api/types'

// 블록 하나의 최대 글자 수 (서버 web/review.py MAX_TEXT_LENGTH 와 같다)
export const MAX_SUBTITLE_LENGTH = 500
// 표의 한 칸에서 줄바꿈을 보이는 표시 (칸은 한 줄로 그린다)
export const LINE_BREAK_MARK = ' ↵ '

// 검수 상태: 저장해 검수를 마쳤다(reviewed), 번역할 때 검토 필요로 표시됐는데 아직 저장하지 않았다(pending),
// 아직 보지 않았다(open). 표의 status 열은 빈 값에도 빈 칩을 그리므로 모든 줄에 상태를 준다
export type ReviewStatus = 'reviewed' | 'pending' | 'open'

export const REVIEW_STATUS_LOOKS: Record<ReviewStatus, { color: string; icon: string }> = {
  reviewed: { color: 'success', icon: 'mdi-check-circle' },
  pending: { color: 'warning', icon: 'mdi-alert-circle-outline' },
  open: { color: 'grey', icon: 'mdi-circle-outline' },
}

/** 줄의 검수 상태. 검수를 마친 것이 먼저다 (검토 필요여도 저장했으면 완료). */
export function rowStatus(row: Pick<ReviewRow, 'needs_review' | 'reviewed'>): ReviewStatus {
  if (row.reviewed) return 'reviewed'
  return row.needs_review ? 'pending' : 'open'
}

/** 걸러 볼 블록: flaggedOnly 면 검토 필요로 표시된 블록만. */
export function filterRows(rows: readonly ReviewRow[], flaggedOnly: boolean): ReviewRow[] {
  return flaggedOnly ? rows.filter((row) => row.needs_review) : [...rows]
}

/** 표의 자막 칸: 줄바꿈을 표시로 바꾼 한 줄. */
export function oneLine(text: string): string {
  return text.split('\n').join(LINE_BREAK_MARK)
}
