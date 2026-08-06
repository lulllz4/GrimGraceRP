'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { cleanPostHtml, makeExcerpt } from '@/lib/sanitize'

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export type PostPayload = {
  id?: string
  characterId: string
  title: string
  kind: string
  status: 'draft' | 'published' | 'unlisted'
  isMature: boolean
  coverUrl: string
  html: string
  json: unknown
  plainText: string
  partnerIds: string[]
}

export async function savePost(p: PostPayload): Promise<SaveResult> {
  const me = await requireUser()
  const supabase = await createClient()

  const title = p.title.trim().slice(0, 200)
  if (!title) return { ok: false, error: 'Дайте посту название.' }
  if (!p.characterId) return { ok: false, error: 'Выберите, от чьего лица пост.' }

  /* --- персонаж действительно наш? --- */
  const { data: ch } = await supabase
    .from('characters')
    .select('id, current_player_id, owner_since')
    .eq('id', p.characterId)
    .single()

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (!ch || (ch.current_player_id !== me.id && !isStaff)) {
    return { ok: false, error: 'Этот персонаж вам не принадлежит.' }
  }

  const words = p.plainText.trim().split(/\s+/).filter(Boolean).length

  let postId = p.id

  /* дата публикации проставляется один раз */
  let publishedAt: string | null = null
  if (p.status === 'published') {
    if (postId) {
      const { data: prev } = await supabase
        .from('posts')
        .select('published_at')
        .eq('id', postId)
        .single()
      publishedAt = prev?.published_at ?? new Date().toISOString()
    } else {
      publishedAt = new Date().toISOString()
    }
  }

  const row = {
    author_id:    me.id,
    character_id: p.characterId,
    title,
    kind:         p.kind,
    status:       p.status,
    is_mature:    p.isMature,
    cover_url:    p.coverUrl.trim() || null,
    content_html: cleanPostHtml(p.html),
    content_json: p.json,
    excerpt:      makeExcerpt(p.plainText),
    word_count:   words,
    published_at: publishedAt,
  }

  if (postId) {
    /* --- правим существующий --- */
    const { data: old } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (!old || (old.author_id !== me.id && !isStaff)) {
      return { ok: false, error: 'Это не ваш пост.' }
    }

    const { error } = await supabase.from('posts').update(row).eq('id', postId)
    if (error) return { ok: false, error: error.message }
  } else {
    /* --- создаём новый --- */

    /* номер поста внутри текущего периода владения персонажем; считаем один раз, не пересчитываем при правках */
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('character_id', p.characterId)
      .gte('created_at', ch.owner_since ?? '1970-01-01T00:00:00Z')
    const postNumber = (count ?? 0) + 1

    let data: { id: string } | null = null
    let error: { message: string; code?: string } | null = null

    /* короткий id уникален — на случай коллизии пробуем ещё пару раз */
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await supabase
        .from('posts')
        .insert({ ...row, short_id: nanoid(10), post_number: postNumber })
        .select('id')
        .single()

      data = res.data
      error = res.error

      if (!error || error.code !== '23505') break
    }

    if (error || !data) return { ok: false, error: error?.message ?? 'Не удалось сохранить.' }
    postId = data.id
  }

  /* --- соигроки --- */
  await supabase.from('post_partners').delete().eq('post_id', postId)

  const partners = p.partnerIds
    .filter((x) => x && x !== p.characterId)
    .slice(0, 12)

  if (partners.length) {
    await supabase.from('post_partners').insert(
      partners.map((cid) => ({ post_id: postId, character_id: cid })),
    )
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/my')
  revalidatePath(`/p/${postId}`)

  return { ok: true, id: postId! }
}

export async function deletePost(id: string): Promise<SaveResult> {
  const me = await requireUser()
  const supabase = await createClient()

  const { data: old } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', id)
    .single()

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (!old || (old.author_id !== me.id && !isStaff)) {
    return { ok: false, error: 'Это не ваш пост.' }
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/my')
  return { ok: true, id }
}