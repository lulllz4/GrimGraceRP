import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { ELEMENTS, REGIONS, STATUS_LABEL, characterThemeStyle } from '@/lib/elements'
import { DIVIDERS } from '@/lib/blocks'
import { SHEET, SHEET_FIELDS, SHEET_RULE } from '@/lib/sheet'

export const dynamic = 'force-dynamic'

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const me = await getProfile()

  const { data: c } = await supabase
    .from('characters')
    .select('*, profiles:current_player_id(username, display_name)')
    .eq('slug', slug)
    .single()

  if (!c) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, excerpt, post_number, published_at, created_at')
    .eq('character_id', c.id)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(60)

  const isStaff = me?.role === 'admin' || me?.role === 'moderator'
  const isOwner = me?.id && me.id === c.current_player_id
  const canEdit = isOwner || isStaff

  const player = c.profiles as { username: string; display_name: string | null } | null
  const element = ELEMENTS[c.element as keyof typeof ELEMENTS]
  const region = REGIONS[c.region as keyof typeof REGIONS]

  const dividerSym = DIVIDERS[c.theme_divider as string] ?? DIVIDERS.fleuron
  const themeStyle = characterThemeStyle(c)

  return (
    <main
      data-element={c.element}
      style={themeStyle as React.CSSProperties}
      className="mx-auto max-w-[var(--wrap)] px-5 py-14"
    >

      {/* ---------- шапка ---------- */}
      <p className="eyebrow">
        <Link href="/roster" className="hover:text-[var(--bone)]">Ростер</Link>
        {' · '}{region?.label}
      </p>

      <div className="mt-2 flex items-center gap-5">
        {c.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.avatar_url}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full border border-[var(--line)] object-cover"
            style={{ borderColor: 'var(--accent, var(--line))' }}
          />
        )}
        <h1
          className="font-[var(--font-cormorantsc)] text-5xl leading-tight"
          style={{ color: 'var(--accent, var(--bone))' }}
        >
          {c.name}
        </h1>
      </div>

      {c.epithet && (
        <p className="mt-1 text-lg italic text-[var(--bone-dim)]">{c.epithet}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-[var(--bone-faint)]">
        <span>{element?.label}</span>
        <span className="text-[var(--line)]">❦</span>
        <span>{STATUS_LABEL[c.status as keyof typeof STATUS_LABEL]}</span>
        {player && (
          <>
            <span className="text-[var(--line)]">❦</span>
            <span>
              отыгрывает{' '}
              <Link href={`/u/${player.username}`} className="text-[var(--bone-dim)] hover:text-[var(--bone)]">
                {player.display_name || player.username}
              </Link>
            </span>
          </>
        )}
      </div>

      {canEdit && (
        <div className="mt-6 flex gap-4">
          <Link
            href={`/c/${c.slug}/edit`}
            className="border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]"
          >
            Править анкету
          </Link>
          {isStaff && (
            <Link
              href={`/admin/roster/${c.slug}`}
              className="border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--crimson-lt)] hover:border-[var(--crimson-lt)]"
            >
              Мастерское
            </Link>
          )}
        </div>
      )}

      <div className="fleuron my-10">{dividerSym}</div>

      {/* ---------- цитата ---------- */}
      {c.quote && (
        <blockquote
          className="mb-10 border-l-2 pl-5 font-[var(--font-cormorant)] text-2xl italic leading-relaxed text-[var(--bone)]"
          style={{ borderColor: 'var(--accent, var(--line))' }}
        >
          «{c.quote}»
        </blockquote>
      )}

      {/* ---------- анкета: три части по шаблону ---------- */}
      {SHEET.map((part, i) => {
        const filled = part.fields.filter(
          (f) => String((c as Record<string, string | null>)[f.key] ?? '').trim(),
        )
        if (!filled.length) return null

        return (
          <section key={part.part} className="gg-sheet">
            {i > 0 && <div className="gg-sheet__rule" aria-hidden="true">{SHEET_RULE}</div>}

            {filled.map((f) => {
              const value = String((c as Record<string, string | null>)[f.key])
              return (
                <div key={f.key} className={`gg-sheet__item gg-sheet__item--${f.kind}`}>
                  <h2 className="gg-sheet__head">
                    <span className="gg-sheet__no">{f.no}.</span> {f.label}
                  </h2>
                  <div className="gg-sheet__text">{value}</div>
                </div>
              )
            })}
          </section>
        )
      })}

      {!SHEET_FIELDS.some((f) => String((c as Record<string, string | null>)[f.key] ?? '').trim()) && (
        <p className="text-sm italic text-[var(--bone-faint)]">
          Анкета ещё не заполнена.
        </p>
      )}

      {/* старое единое описание: показываем, пока автор не разнёс его по разделам */}
      {c.brief && (
        <section className="gg-sheet">
          <div className="gg-sheet__rule" aria-hidden="true">{SHEET_RULE}</div>
          <div className="gg-sheet__item gg-sheet__item--long">
            <h2 className="gg-sheet__head">Из прежней анкеты</h2>
            <div className="gg-sheet__text">{c.brief}</div>
          </div>
        </section>
      )}

      {/* ---------- мастерская пометка ---------- */}
      {isStaff && c.gm_note && (
        <div className="note note-warning mt-12">
          <strong className="mr-2">Мастеру:</strong>{c.gm_note}
        </div>
      )}

      {/* ---------- посты ---------- */}
      {posts && posts.length > 0 && (
        <section className="mt-14">
          <div className="fleuron mb-10">{dividerSym}</div>
          <p className="eyebrow mb-4">Летопись · {posts.length} {posts.length === 1 ? 'запись' : 'записей'}</p>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {posts.map((p) => (
              <li key={p.id} className="py-3">
                <Link
                  href={`/p/${p.id}`}
                  className="flex items-baseline gap-3 text-[var(--bone)] hover:text-[var(--crimson-lt)]"
                >
                  {p.post_number && (
                    <span className="shrink-0 text-xs text-[var(--bone-faint)]">№{p.post_number}</span>
                  )}
                  <span className="truncate">{p.title || 'Без названия'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </main>
  )
}