'use client'

import { useEffect, useState } from 'react'

/**
 * Переключатель светлой и тёмной темы.
 *
 * Тема хранится в localStorage и ставится атрибутом data-theme на <html>.
 * Чтобы страница не мигала тёмным при загрузке светлой, атрибут выставляет
 * крошечный скрипт в <head> ещё до первой отрисовки (см. layout.tsx) —
 * компонент только показывает текущее состояние и переключает его.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  /* на сервере темы не знаем — читаем уже проставленный скриптом атрибут */
  useEffect(() => {
    const now = document.documentElement.dataset.theme
    setTheme(now === 'light' ? 'light' : 'dark')
  }, [])

  function flip() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('gg-theme', next) } catch { /* приватный режим */ }
  }

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
