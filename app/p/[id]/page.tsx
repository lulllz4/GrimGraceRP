import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { DIVIDERS, POST_KINDS } from '@/lib/blocks'
import { ELEMENTS, characterThemeStyle } from '@/lib/elements'
import { atmosphereStyle, normalizeAtmosphere } from '@/lib/atmosphere'
import DeletePostButton from '@/components/DeletePostButton'

export const dynamic = 'force-dynamic'

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function ruDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* один и тот же запрос переиспользуется и в generateMetadata, и в самой странице */
const getPost = cache(async (id: string) => {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      characters:character_id ( slug, name, element, epithet, theme_accent, theme_font, theme_divider ),
      profiles:author_id ( username, display_name )
    `)
    .eq('id', id)
    .single()
  return post
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return {}

  const ch = post.characters as { name: string } | { name: string }[] | null
  const character = Array.isArray(ch) ? ch[0] : ch

  const title = post.title || 'Без названия'
  const description = post.excerpt || (character ? `Пост от лица ${character.name}` : 'Grim Grace')
  const showCover = Boolean(post.cover_url) && !post.is_mature

  return {
    title: `${title} — Grim Grace`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: showCover ? [post.cover_url as string] : undefined,
    },
    twitter: {
      card: showCover ? 'summary_large_image' : 'summary',
      title,
      description,
      images: showCover ? [post.cover_url as string] : undefined,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getProfile()
  const supabase = await createClient()

  const post = await getPost(id)

  if (!post) notFound()

  const isStaff = me?.role === 'admin' || me?.role === 'moderator'
  const isOwner = me?.id === post.author_id

  if (post.status === 'draft' && !isOwner && !isStaff) notFound()

  const { data: partners } = await supabase
    .from('post_partners')
    .select('characters:character_id ( slug, name, element )')
    .eq('post_id', id)

  const ch = post.characters as {
    slug: string
    name: string
    element: string
    epithet: string | null
    theme_accent: string | null
    theme_font: string | null
    theme_divider: string | null
  } | null
  const author = post.profiles as { username: string; display_name: string | null } | null
  const element = ch?.element ?? 'beyond'
  const themeStyle = ch ? characterThemeStyle(ch) : {}
  const dividerSym = (ch?.theme_divider && DIVIDERS[ch.theme_divider]) || DIVIDERS.fleuron

  /* атмосфера поста перебивает тему персонажа — она выбрана под конкретную сцену */
  const atmo = normalizeAtmosphere(post.atmosphere)

  return (
    <main
      data-element={element}
      data-vignette={atmo?.vignette ? '' : undefined}
      style={{ ...themeStyle, ...atmosphereStyle(atmo) } as React.CSSProperties}
      className={`gg-post gg-atmo${atmo?.indentAll ? ' gg-indent-all' : ''}`}
    >

      {post.cover_url && (
        <div className="gg-post__cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_url} alt="" decoding="async" />
        </div>
      )}

      <div className="gg-post__inner">

        <p className="eyebrow">
          {POST_KINDS[post.kind] ?? post.kind}
          {post.status === 'draft' && ' · черновик'}
          {post.is_mature && ' · 18+'}
        </p>

        <h1 className="gg-post__title">{post.title}</h1>

        <div className="gg-post__byline">
          {ch && (
            <Link href={`/c/${ch.slug}`} className="gg-post__who">
              {ch.name}
            </Link>
          )}
          {author && (
            <>
              <span className="gg-post__dot">❦</span>
              <Link href={`/u/${author.username}`} className="gg-post__player">
                {author.display_name || author.username}
              </Link>
            </>
          )}
          <span className="gg-post__dot">❦</span>
          <span>{ruDate(post.published_at ?? post.created_at)}</span>
          <span className="gg-post__dot">❦</span>
          <span>{post.word_count} слов</span>
        </div>

        {partners && partners.length > 0 && (
          <div className="gg-post__partners">
            <span className="gg-post__partners-label">В сцене:</span>
            {partners.map((p, i) => {
              const raw = p.characters as
                | { slug: string; name: string; element: string }
                | { slug: string; name: string; element: string }[]
                | null
              const c = Array.isArray(raw) ? raw[0] ?? null : raw
              if (!c) return null
              return (
                <Link
                  key={c.slug + i}
                  href={`/c/${c.slug}`}
                  data-element={c.element}
                  className="gg-post__partner"
                >
                  {c.name}
                </Link>
              )
            })}
          </div>
        )}

        {(isOwner || isStaff) && (
          <div className="gg-post__admin">
            <Link href={`/p/${post.id}/edit`}>Править</Link>
            <DeletePostButton id={post.id} redirectTo="/my" className="" />
          </div>
        )}

        <div className="fleuron my-8">{dividerSym}</div>

        <article
          className="gg-prose gg-prose--read"
          dangerouslySetInnerHTML={{ __html: post.content_html ?? '' }}
        />

        <div className="fleuron my-12">{dividerSym}</div>

        <div className="gg-post__end">
          <Link href="/">← Ко всем записям</Link>
          {ch && <Link href={`/c/${ch.slug}`}>{ch.name} →</Link>}
        </div>

      </div>
    </main>
  )
}