import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import PostEditor, { type MiniChar } from '@/components/editor/PostEditor'
import { buildStamp } from '@/lib/build'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const me = await requireUser()
  const supabase = await createClient()

  const { data: mine } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, theme_accent, theme_font')
    .eq('current_player_id', me.id)
    .order('sort_order')

  const { data: all } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, theme_accent, theme_font')
    .order('name')

  return (
    <div className="wrap" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <p className="eyebrow">Черновик</p>
      <h1 style={{ marginBottom: '1.4rem' }}>Новая запись</h1>

      <PostEditor
        mine={(mine ?? []) as MiniChar[]}
        all={(all ?? []) as MiniChar[]}
        build={buildStamp()}
      />
    </div>
  )
}
