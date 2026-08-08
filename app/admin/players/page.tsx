import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createPlayer, resetPassword, toggleBan } from '../actions'

export const dynamic = 'force-dynamic'

type PlayerRow = {
  id: string
  username: string
  display_name: string | null
  role: string
  is_banned: boolean
  contact: string | null
  characters: { name: string; slug: string }[] | null
}

export default async function PlayersPage({
  searchParams,
}: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  await requireStaff()
  const { e, ok } = await searchParams
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, is_banned, contact, characters:characters!characters_current_player_id_fkey(name, slug)')
    .order('username')

  return (
    <div className="wrap-wide" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <p className="eyebrow">Админка</p>
      <h1 style={{ marginTop: '.3rem' }}>Игроки</h1>

      {e && <div className="note note-warning">Ошибка: {e}</div>}
      {ok && <div className="note">Готово.</div>}

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Новый игрок</h3>
        <form action={createPlayer} className="form-row">
          <div>
            <label className="label">Ник</label>
            <input name="username" className="field" placeholder="kaeya_p" required />
          </div>
          <div>
            <label className="label">Имя</label>
            <input name="display_name" className="field" placeholder="необязательно" />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input name="password" className="field" placeholder="минимум 8 символов" required />
          </div>
          <div>
            <label className="label">Контакт</label>
            <input name="contact" className="field" placeholder="@telegram" />
          </div>
          <button className="btn btn-primary">Создать</button>
        </form>
      </div>

      <div className="section-title"><h2>Все</h2><span className="count">{players?.length ?? 0}</span></div>

      <div className="rows">
        {(players as PlayerRow[] | null)?.map((p) => (
          <div key={p.id} className="row">
            <div style={{ flex: '1 1 12rem' }}>
              <strong>{p.display_name || p.username}</strong>
              <div className="char-meta">@{p.username} · {p.role}{p.is_banned && ' · БАН'}</div>
              {p.contact && <div className="faint" style={{ fontSize: '.85rem' }}>{p.contact}</div>}
            </div>

            <div style={{ flex: '1 1 12rem', fontSize: '.9rem' }}>
              {p.characters?.length
                ? p.characters.map((c) => c.name).join(', ')
                : <span className="faint">нет ролей</span>}
            </div>

            <form action={resetPassword} className="inline-form">
              <input type="hidden" name="id" value={p.id} />
              <input name="password" className="field" style={{ width: '11rem' }} placeholder="новый пароль" />
              <button className="btn">Сброс</button>
            </form>

            <form action={toggleBan}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="value" value={String(!p.is_banned)} />
              <button className="btn">{p.is_banned ? 'Разбанить' : 'Бан'}</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}