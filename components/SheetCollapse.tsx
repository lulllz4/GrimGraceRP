'use client'

import { useState } from 'react'

/**
 * Свернуть или развернуть все разделы анкеты разом.
 *
 * Сами разделы — обычные `details`: они открываются и закрываются браузером
 * без единой строки скрипта, и работают, даже если скрипт не загрузился.
 * Здесь только групповое переключение — ради него держать всю анкету
 * клиентским компонентом не стоит.
 *
 * Свёрнутая анкета и есть оглавление: девять заголовков на один экран,
 * по которым сразу видно, где что, и не нужно листать полотно текста.
 */
export default function SheetCollapse({ target }: { target: string }) {
  const [collapsed, setCollapsed] = useState(false)

  function toggle() {
    const root = document.getElementById(target)
    if (!root) return
    const next = !collapsed
    root.querySelectorAll('details').forEach((d) => { d.open = !next })
    setCollapsed(next)
  }

  return (
    <button type="button" className="gg-sheet__collapse" onClick={toggle}>
      {collapsed ? 'Развернуть всё' : 'Свернуть всё'}
    </button>
  )
}
