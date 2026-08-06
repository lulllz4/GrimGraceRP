import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>
}) {
  const { e } = await searchParams

  return (
    <div className="wrap" style={{ paddingTop: '5rem', paddingBottom: '5rem', maxWidth: '26rem' }}>
      <p className="eyebrow">Grim Grace</p>
      <h1 style={{ marginTop: '.4rem' }}>Вход</h1>
      <div className="fleuron">❦</div>

      {e && (
        <div className="note note-warning">
          {e === 'bad'
            ? 'Ник может содержать только латиницу, цифры и подчёркивание.'
            : 'Неверный ник или пароль.'}
        </div>
      )}

      <form action={login}>
        <div style={{ marginBottom: '1.1rem' }}>
          <label className="label" htmlFor="username">Ник</label>
          <input
            id="username"
            name="username"
            className="field"
            placeholder="luz"
            autoComplete="username"
            required
          />
        </div>

        <div style={{ marginBottom: '1.6rem' }}>
          <label className="label" htmlFor="password">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }}>Войти</button>
      </form>

      <p className="faint" style={{ marginTop: '2rem', fontSize: '.85rem' }}>
        Регистрация закрыта. Доступ выдаёт ведущий.
      </p>
    </div>
  )
}