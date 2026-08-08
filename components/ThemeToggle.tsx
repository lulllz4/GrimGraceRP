'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Переключатель светлой и тёмной темы.
 *
 * Тема хранится в localStorage и ставится атрибутом data-theme на <html>
 * ещё до первой отрисовки — крошечным скриптом в <head> (см. layout.tsx),
 * иначе светлая страница успевала бы мигнуть чёрным.
 *
 * Компонент читает тему из самого DOM через useSyncExternalStore: на сервере
 * темы не знаем, поэтому серверный снимок всегда «тёмная», а после гидратации
 * React сам перечитает настоящее значение. Так обходимся без setState в
 * эффекте и без лишней перерисовки.
 */

const EVENT = 'gg-theme'

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

function readTheme(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as const)

  const flip = useCallback(() => {
    const next = readTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('gg-theme', next) } catch { /* приватный режим */ }
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return (
    <button
      type="button"
      className="gg-theme-toggle"
      onClick={flip}
      title={theme === 'dark' ? 'Зажечь свет' : 'Погасить свет'}
      aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}
