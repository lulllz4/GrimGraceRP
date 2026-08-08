'use client'

import { useEffect, useState } from 'react'

/**
 * ВРЕМЕННОЕ: показывает ошибки и зависания прямо на странице.
 *
 * На телефоне консоли нет, а ловить «всё крашится» вслепую мы уже пробовали —
 * выходит долго и мимо. Этот сторож пишет три вещи: необработанные ошибки,
 * упавшие обещания и замирания основного потока (по дрейфу таймера — именно
 * так выглядит «зависает»). Текст можно выделить и прислать.
 *
 * Убрать, когда поймаем причину.
 */
export default function CrashCatcher() {
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    const add = (s: string) =>
      setLines((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString('ru-RU')} · ${s}`])

    const onError = (e: ErrorEvent) =>
      add(`Ошибка: ${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})`)

    const onReject = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string } | string
      add(`Обещание: ${typeof r === 'string' ? r : r?.message ?? 'без текста'}`)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onReject)

    /* сторож зависаний: таймер на 250 мс; если он проснулся сильно позже —
       значит основной поток всё это время был занят и страница не отвечала */
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const stall = now - last - 250
      if (stall > 800) add(`Страница не отвечала ${(stall / 1000).toFixed(1)} с`)
      last = now
    }, 250)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onReject)
      clearInterval(id)
    }
  }, [])

  if (!lines.length) return null

  return (
    <div className="gg-crash">
      {lines.map((l, i) => <div key={i}>{l}</div>)}
      <button type="button" onClick={() => setLines([])}>скрыть</button>
    </div>
  )
}
