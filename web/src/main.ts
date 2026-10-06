import { createApp } from 'vue'
import { setLocale, setTheme } from 'vue-smartview'

import App from './App.vue'
// 요소 등록 (마운트 전에 끝나야 배열·객체가 프로퍼티로 들어간다, CONSUMING 3절). import 하는 순간 등록된다
import './elements'
import { setAppLocale } from './i18n'
import { saveLocale, saveTheme, storedLocale, storedTheme } from './preferences'
import './style.css'

function applyTheme(theme: string): void {
  document.body.dataset.theme = theme
}

function start(): void {
  // 내비게이션의 언어·테마 메뉴가 바꾸면 앱 문구·배경을 맞추고 저장한다
  document.addEventListener('smartview-locale-change', (event) => {
    const { locale } = (event as CustomEvent<{ locale: string }>).detail
    setAppLocale(locale)
    document.documentElement.lang = locale
    saveLocale(locale)
  })
  document.addEventListener('smartview-theme-change', (event) => {
    const { theme } = (event as CustomEvent<{ theme: string }>).detail
    applyTheme(theme)
    saveTheme(theme)
  })
  const locale = storedLocale()
  setAppLocale(locale)
  document.documentElement.lang = locale
  setLocale(locale)
  const theme = storedTheme()
  applyTheme(theme)
  setTheme(theme)
  createApp(App).mount('#app')
}

start()
