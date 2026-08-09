import { createClient } from '@/lib/supabase/server'
import RosterView, { type Char } from '@/components/RosterView'

export const dynamic = 'force-dynamic'

export default async function RosterPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('characters')
    .select('slug, name, element, region, status, epithet, avatar_url, profiles:current_player_id(username, display_name)')
    .order('sort_order')

  const chars: Char[] = (data ?? []).map((c) => {
    const raw = c.profiles as
      | { username: string; display_name: string | null }
      | { username: string; display_name: string | null }[]
      | null
    const player = Array.isArray(raw) ? raw[0] ?? null : raw
    return {
      slug: c.slug,
      name: c.name,
      element: c.element,
      region: c.region,
      status: c.status,
      epithet: c.epithet,
      avatar_url: c.avatar_url,
      player: player ? player.display_name || player.username : null,
    }
  })

  return (
    <div className="wrap" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <p className="eyebrow">Лондон · 1852</p>
      <h1 style={{ marginTop: '.3rem' }}>Ростер</h1>
      <p className="muted" style={{ marginBottom: '1.6rem' }}>
        {chars.length} {chars.length === 1 ? 'персонаж' : 'персонажей'} в городе.
      </p>

      <RosterView chars={chars} />
    </div>
  )
}
