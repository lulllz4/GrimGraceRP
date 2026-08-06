import Link from 'next/link'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ELEMENTS, REGIONS, REGION_LIST, STATUS_LABEL, type RegionKey } from '@/lib/elements'

export const dynamic = 'force-dynamic'

export default async function AdminRoster() {
  await requireStaff()
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, status, profiles:current_player_id(username, display_name)')
    .order('sort_order')

  const data = (raw ?? []).map((c) => {
    const p = c.profiles as
      | { username: string; display_name: string | null }
      | { username: string; display_name: string | null }[]
      | null
    return { ...c, profiles: Array.isArray(p) ? p[0] ?? null : p }
  })

  const byRegion = new Map<RegionKey, any[]>()
  for (const c of data ?? []) {
    const r = c.region as RegionKey
    if (!byRegion.has(r)) byRegion.set(r, [])
    byRegion.get(r)!.push(c)
  }

  const taken = (data ?? []).filter((c: any) => c.status === 'active').length

  return (
    <div className="wrap-wide" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <p className="eyebrow">Админка</p>
      <h1 style={{ marginTop: '.3rem' }}>Ростер</h1>
      <p className="muted">
        Занято {taken} из {data?.length ?? 0}. ·{' '}
        <Link href="/admin/players" style={{ color: 'var(--crimson-lt)' }}>Игроки →</Link>
      </p>

      {REGION_LIST.filter(r => byRegion.has(r)).map(r => (
        <section key={r}>
          <div className="section-title">
            <h2>{REGIONS[r].label}</h2>
            <span className="count">{byRegion.get(r)!.length}</span>
          </div>

          <div className="rows">
            {byRegion.get(r)!.map((c: any) => (
              <Link key={c.id} href={`/admin/roster/${c.slug}`} className="row row-link" data-element={c.element}>
                <span className="dot" style={{ background: 'var(--accent)' }} />
                <strong style={{ flex: '1 1 9rem' }}>{c.name}</strong>
                <span className="char-meta" style={{ flex: '0 0 6rem' }}>{ELEMENTS[c.element as keyof typeof ELEMENTS].label}</span>
                <span className="char-meta" style={{ flex: '0 0 6rem' }}>{STATUS_LABEL[c.status]}</span>
                <span style={{ flex: '1 1 8rem', color: c.profiles ? 'var(--accent)' : 'var(--bone-faint)' }}>
                  {c.profiles ? (c.profiles.display_name || c.profiles.username) : '—'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}