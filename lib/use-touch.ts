'use client'

import { useSyncExternalStore } from 'react'

/**
 * Пальцевое ли устройство.
 *
 * Смотрим на `pointer: coarse` — это про способ ввода, а не про ширину экрана:
 * планшет в альбомной ориентации широкий, но пальцем по нему всё равно
 * промахиваешься, а узкое окно на ноутбуке остаётся мышиным.
 *
 * Через useSyncExternalStore, потому что на сервере ответа нет: серверный
 * снимок — «мышь», после гидратации React перечитает настоящее значение.
 */

const QUERY = '(pointer: coarse)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function useIsTouch(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
