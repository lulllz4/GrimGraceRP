'use client'

import { useEffect } from 'react'
import { embedUrl } from '@/lib/music'

/**
 * Превращает карточку песни в настоящий плеер — по нажатию и только её одну.
 *
 * Пост приходит с сервера готовой разметкой, поэтому здесь не рендеринг, а
 * дополнение: вешаем один обработчик на весь пост и ждём нажатия. До этого
 * момента не грузится ничего — в этом весь смысл затеи, чужой плеер весит
 * полтора-два мегабайта.
 *
 * Адрес плеера собирается из ссылки нашим разбором (lib/music), а не берётся
 * из разметки: в сохранённом HTML никаких iframe нет и быть не должно.
 */
export default function TrackPlayers({ target }: { target: string }) {
  useEffect(() => {
    const root = document.getElementById(target)
    if (!root) return

    function onClick(e: MouseEvent) {
      const card = (e.target as HTMLElement).closest('.gg-track')
      if (!card || card.classList.contains('gg-track--playing')) return

      const url = card.getAttribute('href') || card.getAttribute('data-url') || ''
      const src = embedUrl(url)
      /* незнакомый сервис — пусть ссылка работает как ссылка */
      if (!src) return

      e.preventDefault()

      const frame = document.createElement('iframe')
      frame.src = src
      frame.className = 'gg-track__frame'
      frame.loading = 'lazy'
      frame.allow = 'autoplay; encrypted-media; clipboard-write; picture-in-picture'
      frame.setAttribute('referrerpolicy', 'no-referrer')
      frame.setAttribute('title', 'Проигрыватель')

      card.classList.add('gg-track--playing')
      card.after(frame)
    }

    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [target])

  return null
}
