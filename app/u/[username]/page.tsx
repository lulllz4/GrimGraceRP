import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ELEMENTS } from '@/lib/elements'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username} — Grim Grace` }
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, contact')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: characters } = await supabase
    .from('characters')
    .select('slug, name, element, avatar_url')
    .eq('current_player_id', profile.id)
    .order('sort_order')

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, post_number, published_at, characters:character_id ( name )')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-5 py-14">
      <p className="eyebrow">Игрок</p>
      <h1 className="mb-2 font-[var(--font-cormorantsc)] text-4xl text-[var(--bone)]">
        {profile.display_name || profile.username}
      </h1>
      <p className="mb-8 text-sm text-[var(--bone-faint)]">
        @{profile.username}
        {profile.role !== 'player' && ` · ${profile.role === 'admin' ? 'администратор' : 'модератор'}`}
        {profile.contact && ` · ${profile.contact}`}
      </p>

      {/* ---------- персонажи ---------- */}
      <section className="mb-14">
        <p className="eyebrow mb-4">
          {characters?.length ? `Персонажи · ${characters.length}` : 'Персонажи'}
        </p>
        {!characters?.length ? (
          <p className="text-sm text-[var(--bone-dim)]">Пока никого не играет.</p>
        ) : (
          <div className="roster-grid">
            {characters.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="char-card" data-element={c.element}>
                {c.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt="" className="char-card__avatar" />
                )}
                <div className="char-name">{c.name}</div>
                <div className="char-meta">{ELEMENTS[c.element as keyof typeof ELEMENTS]?.label}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- посты ---------- */}
      {posts && posts.length > 0 && (
        <section>
          <div className="fleuron mb-10">❦</div>
          <p className="eyebrow mb-4">Последние посты</p>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {posts.map((p) => {
              const ch = p.characters as { name: string } | { name: string }[] | null
              const character = Array.isArray(ch) ? ch[0] : ch
              return (
                <li key={p.id} className="py-3">
                  <Link
                    href={`/p/${p.id}`}
                    className="flex items-baseline gap-3 text-[var(--bone)] hover:text-[var(--crimson-lt)]"
                  >
                    <span className="truncate">{p.title || 'Без названия'}</span>
                    {character && (
                      <span className="shrink-0 text-xs text-[var(--bone-faint)]">
                        {character.name}{p.post_number ? ` · №${p.post_number}` : ''}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
