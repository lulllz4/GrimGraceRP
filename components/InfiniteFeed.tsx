'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import PostCard, { type FeedPost } from './PostCard'
import { loadMoreFeed } from '@/lib/actions/feed'
import { PAGE_SIZE } from '@/lib/feed-constants'

export default function InfiniteFeed({ initialPosts }: { initialPosts: FeedPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [done, setDone] = useState(initialPosts.length < PAGE_SIZE)
  const [pending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  /* Замок именно в ref, а не в pending: обработчик наблюдателя видит
     значение состояния на момент подписки, и при быстрой прокрутке одна
     и та же страница успевала загрузиться дважды — карточки задваивались,
     а React ругался на одинаковые ключи. */
  const loadingRef = useRef(false)

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
              const next = await loadMoreFeed(page)
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
  }, [page, pending, done])

  return (
    <>
      <div className="grid gap-8">
        {posts.map((p) => (
          <PostCard key={p.id} p={p} />
        ))}
      </div>

      {!done && (
        <div
          ref={sentinelRef}
          className="py-12 text-center text-xs uppercase tracking-widest text-[var(--bone-faint)]"
        >
          {pending ? 'Загрузка…' : ''}
        </div>
      )}
    </>
  )
}
