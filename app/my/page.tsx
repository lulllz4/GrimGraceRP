import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { loadMoreMyPosts } from '@/lib/actions/feed'
import InfiniteMyPosts from '@/components/InfiniteMyPosts'

export const dynamic = 'force-dynamic'

export default async function MyPostsPage() {
  await requireUser()
  const posts = await loadMoreMyPosts(0, '', 'all')

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-5 py-14">
      <div className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Кабинет</p>
          <h1 className="font-[var(--font-cormorantsc)] text-3xl text-[var(--bone)]">
            Мои посты
          </h1>
        </div>
        <Link
          href="/new"
          className="border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]"
        >
          + Написать
        </Link>
      </div>

      {!posts.length ? (
        <p className="text-sm text-[var(--bone-dim)]">Постов пока нет.</p>
      ) : (
        <InfiniteMyPosts initialPosts={posts} />
      )}
    </main>
  )
}
