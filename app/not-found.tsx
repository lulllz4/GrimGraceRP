import Link from 'next/link'

export const metadata = {
  title: 'Страница не найдена — Grim Grace',
}

/**
 * Своя страница на месте ненайденной.
 *
 * Без неё Next показывает служебную заглушку в чужом оформлении — белый фон,
 * системный шрифт. Для сайта, куда приходят по ссылке на удалённый пост или
 * на персонажа, которого сняли с игры, это первое впечатление.
 */
export default function NotFound() {
  return (
    <main className="wrap" style={{ paddingTop: '6rem', paddingBottom: '8rem', textAlign: 'center' }}>
      <p className="eyebrow">Ошибка 404</p>

      <h1 style={{ marginTop: '.6rem' }}>Здесь никого нет</h1>

      <div className="fleuron my-8">❦</div>

      <p className="lead" style={{ maxWidth: '30rem', margin: '0 auto 2.5rem' }}>
        Страница не найдена. Возможно, запись удалили, персонажа сняли с игры,
        или в ссылке потерялась буква.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="gg-btn">Ко всем записям</Link>
        <Link href="/roster" className="gg-btn gg-btn--ghost">В ростер</Link>
      </div>
    </main>
  )
}
