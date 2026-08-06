import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ELEMENTS, REGIONS, REGION_LIST } from '@/lib/elements'
import { assignCharacter, revokeCharacter, updateCanon } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function AdminChar({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ e?: string; ok?: string }>
}) {
  await requireStaff()
  const { slug } = await params
  const { e, ok } = await searchParams
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('characters')
    .select('*, profiles:current_player_id(username, display_name)')
    .eq('slug', slug)
    .single()

  if (!c) notFound()

  const { data: players } = await supabase
    .from('profiles').select('id, username, display_name')
    .eq('is_banned', false).order('username')

  const { data: tenures } = await supabase
    .from('character_tenures')
    .select('*')
    .eq('character_id', c.id)
    .order('started_at', { ascending: false })

  return (
    <div className="wrap" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: '48rem' }}
         data-element={c.element}>
      <Link href="/admin/roster" className="faint" style={{ fontSize: '.85rem' }}>← к ростеру</Link>

      <h1 style={{ margin: '.6rem 0 .2rem' }}>{c.name}</h1>
      <p className="char-meta">
        {ELEMENTS[c.element as keyof typeof ELEMENTS].label} · {REGIONS[c.region as keyof typeof REGIONS].label} · /{c.slug}
      </p>

      {e && <div className="note note-warning">Ошибка: {e}</div>}
      {ok && <div className="note">Сохранено.</div>}

      {/* ── выдача роли ── */}
      <div className="panel" style={{ marginTop: '1.8rem' }}>
        <h3 style={{ marginTop: 0 }}>Игрок</h3>

        {c.profiles ? (
          <>
            <p>Сейчас играет: <strong style={{ color: 'var(--accent)' }}>
              {c.profiles.display_name || c.profiles.username}
            </strong></p>

            <form action={revokeCharacter} className="form-row">
              <input type="hidden" name="slug" value={c.slug} />
              <input type="hidden" name="character_id" value={c.id} />
              <div>
                <label className="label">Причина</label>
                <select name="reason" className="field">
                  <option value="left">ушёл сам</option>
                  <option value="removed">снят</option>
                  <option value="retired">выведен из игры</option>
                  <option value="reassigned">передан другому</option>
                </select>
              </div>
              <div>
                <label className="label">Новый статус</label>
                <select name="new_status" className="field">
                  <option value="vacant">свободен</option>
                  <option value="retired">выведен</option>
                  <option value="archived">архив</option>
                </select>
              </div>
              <button className="btn">Снять роль</button>
            </form>
            <div className="fleuron">❦</div>
          </>
        ) : (
          <p className="faint">Роль свободна.</p>
        )}

        <form action={assignCharacter} className="form-row">
          <input type="hidden" name="slug" value={c.slug} />
          <input type="hidden" name="character_id" value={c.id} />
          <div style={{ flex: '1 1 14rem' }}>
            <label className="label">Назначить игрока</label>
            <select name="player_id" className="field" required defaultValue="">
              <option value="" disabled>— выбери —</option>
              {players?.map(p => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.username} (@{p.username})
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 12rem' }}>
            <label className="label">Заметка</label>
            <input name="note" className="field" placeholder="необязательно" />
          </div>
          <button className="btn btn-primary">Назначить</button>
        </form>
      </div>

      {/* ── канон ── */}
      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Канон <span className="faint" style={{ fontSize: '.8rem' }}>— игрок не может это менять</span></h3>

        <form action={updateCanon} className="form-row">
          <input type="hidden" name="slug" value={c.slug} />
          <input type="hidden" name="character_id" value={c.id} />

          <div style={{ flex: '1 1 11rem' }}>
            <label className="label">Имя</label>
            <input name="name" className="field" defaultValue={c.name} />
          </div>
          <div style={{ flex: '0 1 9rem' }}>
            <label className="label">Элемент</label>
            <select name="element" className="field" defaultValue={c.element}>
              {Object.entries(ELEMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 1 9rem' }}>
            <label className="label">Регион</label>
            <select name="region" className="field" defaultValue={c.region}>
              {REGION_LIST.map(k => <option key={k} value={k}>{REGIONS[k].label}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 1 9rem' }}>
            <label className="label">Статус</label>
            <select name="status" className="field" defaultValue={c.status}>
              <option value="draft">черновик</option>
              <option value="vacant">свободен</option>
              <option value="reserved">бронь</option>
              <option value="active">занят</option>
              <option value="retired">выведен</option>
              <option value="archived">архив</option>
            </select>
          </div>
          <div style={{ flex: '0 1 6rem' }}>
            <label className="label">Порядок</label>
            <input name="sort_order" className="field" type="number" defaultValue={c.sort_order} />
          </div>
          <div style={{ flex: '1 1 100%' }}>
            <label className="label">Заметка ГМа</label>
            <input name="gm_note" className="field" defaultValue={c.gm_note ?? ''} />
          </div>
          <button className="btn">Сохранить канон</button>
        </form>
      </div>

      {/* ── история ── */}
      {!!tenures?.length && (
        <>
          <div className="section-title"><h2>Эпохи</h2></div>
          <div className="rows">
            {tenures.map(t => (
              <div key={t.id} className="row">
                <strong style={{ flex: '1 1 10rem' }}>{t.player_name_snapshot ?? '—'}</strong>
                <span className="char-meta" style={{ flex: '1 1 12rem' }}>
                  {new Date(t.started_at).toLocaleDateString('ru')} —{' '}
                  {t.ended_at ? new Date(t.ended_at).toLocaleDateString('ru') : 'сейчас'}
                </span>
                <span className="faint">{t.end_reason ?? ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}