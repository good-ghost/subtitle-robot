import type { Job } from './api/types'

/**
 * 다시 시도할 수 있는 작업: 실패했거나, 실패한 적이 있어 백오프 시각까지 재시도를 기다리는 대기 작업.
 * 설정을 고친 뒤 기다리지 않고 바로 다시 처리하게 한다 (서버 `queue.retry` 와 같은 조건, WI-10.004c).
 */
export function canRetry(job: Pick<Job, 'status' | 'attempts'>): boolean {
  return job.status === 'failed' || (job.status === 'queued' && job.attempts > 0)
}
