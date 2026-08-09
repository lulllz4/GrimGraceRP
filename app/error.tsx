'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Страница на случай неожиданной ошибки.
 *
 * Без неё Next показывает служебный экран, а в бою — просто пустоту с
 * невнятной строкой. Игроку важнее знать, что делать: перезагрузить,
 * уйти на главную и что текст поста скорее всего цел в черновике браузера.
 *
 * Настоящую причину пишем в консоль: пользователю она ничего не скажет,
 * а нам пригодится, если он пришлёт снимок экрана.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[gg]', error)
  }, [error])

  return (
    <main className="wrap" style={{ paddingTop: '6rem', paddingBottom: '8rem', textAlign: 'center' }}>
      <p className="eyebrow">Что-то сломалось</p>

      <h1 style={{ marginTop: '.6rem' }}>Свеча погасла</h1>

      <div className="fleuron my-8">❦</div>

      <p className="lead" style={{ maxWidth: '32rem', margin: '0 auto 2rem' }}>
        Страница не открылась. Если вы писали пост — текст, скорее всего, цел:
        редактор сохраняет черновик в браузере и предложит его восстановить.
      </p>

      {error.digest && (
        <p className="faint" style={{ fontSize: '.78rem', marginBottom: '2.5rem' }}>
          Код ошибки: {error.digest}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="gg-btn" onClick={reset}>Попробовать снова</button>
        <Link href="/" className="gg-btn gg-btn--ghost">На главную</Link>
      </div>
    </main>
  )
}
