// 해시 라우팅 (#/queue). 데몬이 정적 파일만 내므로 서버 폴백이 필요 없다 (PROJECT-PLAN §25.4).
import { readonly, ref } from 'vue'

export const ROUTES = ['dashboard', 'queue', 'completed', 'logs', 'settings'] as const
export type RouteName = (typeof ROUTES)[number]
export const DEFAULT_ROUTE: RouteName = 'dashboard'

export function parseRoute(hash: string): RouteName {
  const name = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTES as readonly string[]).includes(name) ? (name as RouteName) : DEFAULT_ROUTE
}

export function routeHref(name: RouteName): string {
  return `#/${name}`
}

const current = ref<RouteName>(parseRoute(window.location.hash))
window.addEventListener('hashchange', () => {
  current.value = parseRoute(window.location.hash)
})

export const route = readonly(current)

export function navigate(name: RouteName): void {
  window.location.hash = routeHref(name)
}
