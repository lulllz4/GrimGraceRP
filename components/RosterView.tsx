'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ELEMENTS, REGIONS, REGION_LIST, type ElementKey, type RegionKey } from '@/lib/elements'

export type Char = {
  slug: string
  name: string
  element: ElementKey
  region: RegionKey
  status: string
  epithet: string | null
  player: string | null
  avatar_url?: string | null
}

export default function RosterView({ chars }: { chars: Char[] }) {
  const [region, setRegion] = useState<RegionKey | 'all'>('all')
  const [free, setFree] = useState(false)
  const [q, setQ] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return chars.filter(c => {
      if (region !== 'all' && c.region !== region) return false
      if (free && c.status !== 'vacant') return false
      if (needle && !c.name.toLowerCase().includes(needle)) return false
      return true
    })
  }, [chars, region, free, q])

  const groups = useMemo(() => {
    const map = new Map<RegionKey, Char[]>()
    for (const c of shown) {
      if (!map.has(c.region)) map.set(c.region, [])
      map.get(c.region)!.push(c)
    }
    return REGION_LIST.filter(r => map.has(r)).map(r => [r, map.get(r)!] as const)
  }, [shown])

  return (
    <>
      <div className="tabs">
        <button className="tab" data-on={region === 'all'} onClick={() => setRegion('all')}>
          Все
        </button>
        {REGION_LIST.map(r => (
          <button key={r} className="tab" data-on={region === r} onClick={() => setRegion(r)}>
            {REGIONS[r].label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="field"
          style={{ maxWidth: '17rem' }}
          placeholder="Поиск по имени…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="tab" data-on={free} onClick={() => setFree(v => !v)}>
          Только свободные
        </button>
        <span className="faint" style={{ fontSize: '.85rem', marginLeft: 'auto' }}>
          {shown.length} из {chars.length}
        </span>
      </div>

      {groups.map(([r, list]) => (
        <section key={r}>
          <div className="section-title">
            <h2>{REGIONS[r].label}</h2>
            <span className="count">{list.length}</span>
          </div>

          <div className="roster-grid">
            {list.map(c => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="char-card"
                data-element={c.element}
              >
                {c.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt="" className="char-card__avatar" />
                )}
                <div className="char-name">{c.name}</div>
                <div className="char-meta">{ELEMENTS[c.element].label}</div>
                {c.player ? (
                  <div className="char-player">
                    <span className="dot" />{c.player}
                  </div>
                ) : (
                  <div className="char-player faint" style={{ color: 'var(--bone-faint)' }}>
                    <span className="dot dot-free" />свободен
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      {shown.length === 0 && (
        <p className="faint" style={{ marginTop: '2.5rem' }}>Никого не нашлось.</p>
      )}
    </>
  )
}