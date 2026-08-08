import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import PostEditor, { type MiniChar } from '@/components/editor/PostEditor'
import { editorContent } from '@/lib/tiptap/content'
import { buildStamp } from '@/lib/build'
import { normalizeAtmosphere } from '@/lib/atmosphere'

export const dynamic = 'force-dynamic'

export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await requireUser()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (post.author_id !== me.id && !isStaff) redirect(`/p/${id}`)

  const { data: mine } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, theme_accent, theme_font')
    .eq('current_player_id', me.id)
    .order('sort_order')

  const { data: all } = await supabase
    .from('characters')
    .select('id, slug, name, element, region, theme_accent, theme_font')
    .order('name')

  const { data: partners } = await supabase
    .from('post_partners')
    .select('character_id')
    .eq('post_id', id)

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="eyebrow mb-6">Правка записи</p>
      <PostEditor
        mine={(mine ?? []) as MiniChar[]}
        all={(all ?? []) as MiniChar[]}
        build={buildStamp()}
        initial={{
          id: post.id,
          title: post.title ?? '',
          kind: post.kind,
          status: post.status,
          isMature: post.is_mature,
          coverUrl: post.cover_url ?? '',
          characterId: post.character_id,
          json: editorContent(post.content_json, post.content_html),
          partnerIds: (partners ?? []).map((p) => p.character_id as string),
          atmosphere: normalizeAtmosphere(post.atmosphere),
        }}
      />
    </main>
  )
}