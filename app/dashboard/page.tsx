import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ELEMENTS, REGIONS, STATUS_LABEL } from '@/lib/elements'
import { loadMoreMyPosts } from '@/lib/actions/feed'
import { changePassword, updateContacts } from './actions'

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  pw:       { text: 'Пароль изменён.' },
  info:     { text: 'Данные сохранены.' },
  short:    { text: 'Пароль должен быть не короче 8 символов.', bad: true },
  mismatch: { text: 'Пароли не совпадают.', bad: true },
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>
}) {
  const sp = await searchParams
  const profile = await requireUser()
  const supabase = await createClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, status, epithet, avatar_url')
    .eq('current_player_id', profile.id)
    .order('sort_order')

  const posts = await loadMoreMyPosts(0, '', 'all')
  const previewPosts = posts.slice(0, 5)

  const notice = sp.ok ? MESSAGES[sp.ok] : sp.e ? (MESSAGES[sp.e] ?? { text: sp.e, bad: true }) : null

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-5 py-12">

      <p className="eyebrow">Кабинет</p>
      <h1 className="mb-2 font-[var(--font-cormorantsc)] text-4xl text-[var(--bone)]">
        {profile.display_name || profile.username}
      </h1>
      <p className="mb-8 text-sm text-[var(--bone-faint)]">
        @{profile.username}
        {profile.role !== 'player' && ` · ${profile.role === 'admin' ? 'администратор' : 'модератор'}`}
      </p>

      {notice && (
        <div className={notice.bad ? 'note note-warning mb-8' : 'note mb-8'}>
          {notice.text}
        </div>
      )}

      {profile.must_change_password && (
        <div className="note note-warning mb-8">
          Пароль выдан Мастером. Смените его в разделе «Безопасность» ниже.
        </div>
      )}

      {/* ---------- ПЕРСОНАЖИ ---------- */}
      <section className="mb-14">
        <h2 className="mb-4 font-[var(--font-cormorantsc)] text-2xl text-[var(--bone)]">
          Мои персонажи
        </h2>

        {!characters?.length ? (
          <p className="text-sm text-[var(--bone-dim)]">
            За вами пока не закреплён ни один персонаж. Обратитесь к Мастеру.
          </p>
        ) : (
          <div className="grid gap-3">
            {characters.map((c) => (
              <div
                key={c.id}
                data-element={c.element}
                className="char-card flex items-center gap-4 rounded-sm border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                {c.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.avatar_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full border border-[var(--line)] object-cover"
                    style={{ borderColor: 'var(--accent, var(--line))' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-[var(--font-cormorantsc)] text-xl text-[var(--bone)]">
                    {c.name}
                  </div>
                  <div className="truncate text-xs text-[var(--bone-faint)]">
                    {ELEMENTS[c.element as keyof typeof ELEMENTS]?.label}
                    {' · '}
                    {REGIONS[c.region as keyof typeof REGIONS]?.label}
                    {' · '}
                    {STATUS_LABEL[c.status as keyof typeof STATUS_LABEL]}
                  </div>
                </div>
                <Link
                  href={`/c/${c.slug}`}
                  className="shrink-0 text-xs uppercase tracking-widest text-[var(--bone-dim)] hover:text-[var(--bone)]"
                >
                  Анкета →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- ПОСТЫ ---------- */}
      <section className="mb-14">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-[var(--font-cormorantsc)] text-2xl text-[var(--bone)]">
            Мои посты
          </h2>
          <Link href="/new" className="text-xs uppercase tracking-widest text-[var(--crimson-lt)] hover:text-[var(--bone)]">
            + Написать
          </Link>
        </div>

        {!previewPosts.length ? (
          <p className="text-sm text-[var(--bone-dim)]">Постов пока нет.</p>
        ) : (
          <>
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {previewPosts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <Link href={`/p/${p.id}`} className="min-w-0 flex-1 truncate text-[var(--bone)] hover:text-[var(--crimson-lt)]">
                    {p.title || <span className="italic text-[var(--bone-faint)]">Без названия</span>}
                  </Link>
                  <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--bone-faint)]">
                    {p.status === 'published' ? 'опубликован' : p.status === 'draft' ? 'черновик' : 'скрытый'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <Link href="/my" className="text-xs uppercase tracking-widest text-[var(--crimson-lt)] hover:text-[var(--bone)]">
                Все посты →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ---------- ДАННЫЕ ---------- */}
      <section className="mb-14">
        <h2 className="mb-4 font-[var(--font-cormorantsc)] text-2xl text-[var(--bone)]">
          Обо мне
        </h2>
        <form action={updateContacts} className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-widest text-[var(--bone-faint)]">Как вас показывать</span>
            <input
              name="display_name"
              defaultValue={profile.display_name ?? ''}
              maxLength={40}
              className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-[var(--bone)]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-widest text-[var(--bone-faint)]">Связь (телеграм и т.п.)</span>
            <input
              name="contact"
              defaultValue={profile.contact ?? ''}
              maxLength={80}
              className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-[var(--bone)]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-widest text-[var(--bone-faint)]">Почта для восстановления</span>
            <input
              name="recovery_email"
              type="email"
              defaultValue={profile.recovery_email ?? ''}
              className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-[var(--bone)]"
            />
            <span className="text-xs text-[var(--bone-faint)]">
              Необязательно. Без неё пароль сможет сбросить только Мастер.
            </span>
          </label>

          <button className="justify-self-start border border-[var(--line)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]">
            Сохранить
          </button>
        </form>
      </section>

      {/* ---------- ПАРОЛЬ ---------- */}
      <section>
        <h2 className="mb-4 font-[var(--font-cormorantsc)] text-2xl text-[var(--bone)]">
          Безопасность
        </h2>
        <form action={changePassword} className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-widest text-[var(--bone-faint)]">Новый пароль</span>
            <input
              name="password" type="password" required minLength={8}
              className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-[var(--bone)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-widest text-[var(--bone-faint)]">Ещё раз</span>
            <input
              name="password2" type="password" required minLength={8}
              className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-[var(--bone)]"
            />
          </label>
          <button className="justify-self-start border border-[var(--line)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]">
            Сменить пароль
          </button>
        </form>
      </section>

    </main>
  )
}