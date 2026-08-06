'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import type { FeedPost } from '@/components/PostCard'
import { PAGE_SIZE } from '@/lib/feed-constants'

/** Следующая порция публичной ленты (только опубликованные посты). */
export async function loadMoreFeed(page: number): Promise<FeedPost[]> {
  const supabase = await createClient()
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data } = await supabase
    .from('posts')
    .select(`
      id, title, excerpt, kind, is_mature, cover_url, word_count,
      published_at, created_at,
      characters:character_id ( slug, name, element, theme_accent, theme_font ),
      profiles:author_id ( username, display_name )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  return (data ?? []) as unknown as FeedPost[]
}

export type MyPost = {
  id: string
  title: string | null
  status: 'draft' | 'published' | 'unlisted'
  kind: string
  created_at: string
  post_number: number | null
  characters: { slug: string; name: string } | null
}

/** Следующая порция «моих постов» с поиском по заголовку/номеру и фильтром по статусу. */
export async function loadMoreMyPosts(
  page: number,
  query: string,
  status: string,
): Promise<MyPost[]> {
  const me = await requireUser()
  const supabase = await createClient()
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let q = supabase
    .from('posts')
    .select('id, title, status, kind, created_at, post_number, characters:character_id ( slug, name )')
    .eq('author_id', me.id)

  if (status === 'draft' || status === 'published' || status === 'unlisted') {
    q = q.eq('status', status)
  }

  const trimmed = query.trim().slice(0, 100)
  if (trimmed) {
    const escaped = trimmed.replace(/[%_]/g, (c) => `\\${c}`)
    if (/^\d+$/.test(trimmed)) {
      q = q.or(`title.ilike.%${escaped}%,post_number.eq.${Number(trimmed)}`)
    } else {
      q = q.ilike('title', `%${escaped}%`)
    }
  }

  const { data } = await q
    .order('created_at', { ascending: false })
    .range(from, to)

  return (data ?? []) as unknown as MyPost[]
}
