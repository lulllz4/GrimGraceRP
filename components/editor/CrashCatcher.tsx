'use client'

import { useEffect, useState } from 'react'
import { readTrace, clearTrace } from '@/lib/trace'

/**
 * ВРЕМЕННОЕ: показывает ошибки, зависания и хлебные крошки прямо на странице.
 *
 * На телефоне консоли нет, а при настоящем зависании до неё и не дойдёт
 * очередь. Поэтому здесь два источника: живые ошибки текущей сессии и
 * список шагов, записанный в localStorage — он переживает смерть вкладки
 * и перезапуск браузера. Последняя строка списка и есть место, где всё встало.
 *
 * Убрать, когда поймаем причину.
 */
export default function CrashCatcher() {
  const [lines, setLines] = useState<string[]>([])
  const [steps, setSteps] = useState<string[]>([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSteps(readTrace())

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
       значит основной поток всё это время был занят */
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

  if (!lines.length && !steps.length) return null

  return (
    <div className="gg-crash">
      {steps.length > 0 && (
        <>
          <b>Последние шаги:</b>
          {steps.map((s, i) => <div key={i}>{s}</div>)}
        </>
      )}
      {lines.map((l, i) => <div key={`e${i}`}>{l}</div>)}
      <button
        type="button"
        onClick={() => { clearTrace(); setSteps([]); setLines([]) }}
      >
        очистить
      </button>
    </div>
  )
}
