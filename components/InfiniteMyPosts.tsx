'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { loadMoreMyPosts, type MyPost } from '@/lib/actions/feed'
import { deletePost } from '@/lib/actions/posts'
import { PAGE_SIZE } from '@/lib/feed-constants'

const STATUS_LABEL: Record<string, string> = {
  draft: 'черновик',
  published: 'опубликован',
  unlisted: 'скрытый',
}

export default function InfiniteMyPosts({ initialPosts }: { initialPosts: MyPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [done, setDone] = useState(initialPosts.length < PAGE_SIZE)
  const [pending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  /* см. InfiniteFeed: замок в ref, потому что pending в обработчике устаревает */
  const loadingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRun = useRef(true)

  function handleDelete(id: string, title: string | null) {
    const label = title || 'без названия'
    if (!window.confirm(`Удалить пост «${label}» безвозвратно? Это нельзя отменить.`)) return

    setDeletingId(id)
    startTransition(async () => {
      const res = await deletePost(id)
      setDeletingId(null)
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
      } else {
        window.alert(res.error)
      }
    })
  }

  /* поиск/фильтр — начинаем список заново */
  const reload = useCallback((q: string, s: string) => {
    startTransition(async () => {
      const next = await loadMoreMyPosts(0, q, s)
      setPosts(next)
      setPage(1)
      setDone(next.length < PAGE_SIZE)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => reload(query, status), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status])

  /* довешиваем следующую страницу при прокрутке */
  useEffect(() => {
    if (done) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true
          startTransition(async () => {
            try {
              const next = await loadMoreMyPosts(page, query, status)
              setPosts((prev) => [...prev, ...next])
              setPage((p) => p + 1)
              if (next.length < PAGE_SIZE) setDone(true)
            } finally {
              loadingRef.current = false
            }
          })
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pending, done, query, status])

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по заголовку или номеру поста…"
          className="gg-input"
          style={{ flex: '1 1 240px' }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="gg-select"
        >
          <option value="all">Все статусы</option>
          <option value="published">Опубликованные</option>
          <option value="draft">Черновики</option>
          <option value="unlisted">Скрытые</option>
        </select>
      </div>

      {!posts.length && !pending ? (
        <p className="text-sm text-[var(--bone-dim)]">Ничего не найдено.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Link
                href={`/p/${p.id}`}
                className="min-w-0 flex-1 truncate text-[var(--bone)] hover:text-[var(--crimson-lt)]"
              >
                {p.title || <span className="italic text-[var(--bone-faint)]">Без названия</span>}
              </Link>
              {p.characters && (
                <span className="shrink-0 text-[11px] text-[var(--bone-faint)]">
                  {p.characters.name}
                  {p.post_number ? ` · №${p.post_number}` : ''}
                </span>
              )}
              <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--bone-faint)]">
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(p.id, p.title)}
                disabled={deletingId === p.id}
                className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--bone-faint)] hover:text-[var(--crimson-lt)]"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {deletingId === p.id ? 'Удаляю…' : 'Удалить'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!done && (
        <div
          ref={sentinelRef}
          className="py-10 text-center text-xs uppercase tracking-widest text-[var(--bone-faint)]"
        >
          {pending ? 'Загрузка…' : ''}
        </div>
      )}
    </div>
  )
}
