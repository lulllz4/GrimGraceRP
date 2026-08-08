'use client'

/**
 * ВРЕМЕННОЕ: хлебные крошки для отладки зависания на телефоне.
 *
 * Когда основной поток встаёт намертво, ни консоль, ни ловец ошибок, ни
 * отправка на сервер уже не работают — до них просто не доходит очередь.
 * А запись в localStorage синхронна: она успевает лечь на диск до того,
 * как страница перестанет отвечать, и переживает перезапуск браузера.
 *
 * Поэтому каждый шаг вставки плашки отмечается здесь, а после возвращения
 * на страницу список показывается целиком. Последняя запись и есть место,
 * где всё остановилось.
 */

const KEY = 'gg-trace'
const LIMIT = 14

export function trace(step: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || '[]') as string[]
    prev.push(`${new Date().toLocaleTimeString('ru-RU')} · ${step}`)
    localStorage.setItem(KEY, JSON.stringify(prev.slice(-LIMIT)))
  } catch { /* приватный режим или переполнение — молча пропускаем */ }
}

export function readTrace(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as string[]
  } catch {
    return []
  }
}

export function clearTrace() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
