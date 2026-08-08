'use client'

import Link from 'next/link'
import { useState } from 'react'
import { POST_KINDS } from '@/lib/blocks'
import { characterThemeStyle } from '@/lib/elements'
import { atmosphereStyle, normalizeAtmosphere } from '@/lib/atmosphere'

export type FeedPost = {
  id: string
  title: string | null
  excerpt: string | null
  kind: string
  is_mature: boolean
  cover_url: string | null
  word_count: number
  published_at: string | null
  created_at: string
  characters: { slug: string; name: string; element: string; theme_accent?: string | null; theme_font?: string | null } | null
  profiles: { username: string; display_name: string | null } | null
  atmosphere?: unknown
}

const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

function short(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function PostCard({ p }: { p: FeedPost }) {
  const [open, setOpen] = useState(!p.is_mature)
  const ch = p.characters
  const element = ch?.element ?? 'beyond'
  const themeStyle = ch ? characterThemeStyle(ch) : {}

  /* на карточке — только намёк: фон и цвет, без дымки и виньетки (см. CSS) */
  const atmo = normalizeAtmosphere(p.atmosphere)

  return (
    <article
      data-element={element}
      style={{ ...themeStyle, ...atmosphereStyle(atmo) } as React.CSSProperties}
      className={atmo ? 'gg-card gg-atmo' : 'gg-card'}
    >
      {p.cover_url && (
        <Link href={`/p/${p.id}`} className="gg-card__cover" data-veiled={!open ? '' : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.cover_url} alt="" loading="lazy" decoding="async" />
        </Link>
      )}

      <div className="gg-card__body">
        <div className="gg-card__top">
          <span className="gg-card__kind">{POST_KINDS[p.kind] ?? p.kind}</span>
          {ch && (
            <>
              <span className="gg-card__dot">·</span>
              <Link href={`/c/${ch.slug}`} className="gg-card__who">{ch.name}</Link>
            </>
          )}
          <span className="gg-card__dot">·</span>
          <span>{short(p.published_at ?? p.created_at)}</span>
          {p.is_mature && <span className="gg-card__mature">18+</span>}
        </div>

        <h2 className="gg-card__title">
          <Link href={`/p/${p.id}`}>{p.title || 'Без названия'}</Link>
        </h2>

        <p className="gg-card__excerpt" data-veiled={!open ? '' : undefined}>
          {p.excerpt || '…'}
        </p>

        {!open && (
          <button type="button" className="gg-card__reveal" onClick={() => setOpen(true)}>
            Показать содержимое 18+
          </button>
        )}

        <div className="gg-card__foot">
          {p.profiles && (
            <Link href={`/u/${p.profiles.username}`}>
              {p.profiles.display_name || p.profiles.username}
            </Link>
          )}
          <span>{p.word_count} слов</span>
        </div>
      </div>
    </article>
  )
}