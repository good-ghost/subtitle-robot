// 스낵바 알림. 요소가 준비될 때까지 기다리지 않아도 알림은 뜬다 (vue-smartview toast 문서)
import { notifyError, notifySuccess } from 'vue-smartview'

export function showSuccess(text: string): void {
  void notifySuccess(text)
}

export function showError(text: string): void {
  void notifyError(text)
}
