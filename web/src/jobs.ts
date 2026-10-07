import type { Job } from './api/types'
import { t } from './i18n'

/**
 * 다시 시도할 수 있는 작업: 실패했거나, 실패한 적이 있어 백오프 시각까지 재시도를 기다리는 대기 작업.
 * 설정을 고친 뒤 기다리지 않고 바로 다시 처리하게 한다 (서버 `queue.retry` 와 같은 조건, WI-10.004c).
 */
export function canRetry(job: Pick<Job, 'status' | 'attempts'>): boolean {
  return job.status === 'failed' || (job.status === 'queued' && job.attempts > 0)
}

/**
 * 상태 열의 값: 번역 중이고 진행을 알면 `번역 중 (2222/3333)` 문구, 아니면 상태 값 그대로 (WI-7.004c).
 * 문구는 상태 표(statusMap)에 없으므로 표의 statusFallback 이 색·아이콘을 정한다.
 */
export function statusValue(job: Pick<Job, 'status' | 'progress'>): string {
  const progress = job.progress
  if (job.status !== 'translating' || !progress) return job.status
  return t('status.translatingProgress', { done: progress.done, total: progress.total })
}
