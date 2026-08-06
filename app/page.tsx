import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { loadMoreFeed } from '@/lib/actions/feed'
import InfiniteFeed from '@/components/InfiniteFeed'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const me = await getProfile()
  const posts = await loadMoreFeed(0)

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">

      <div className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Хроника</p>
          <h1 className="font-[var(--font-cormorantsc)] text-3xl text-[var(--bone)]">
            Последние записи
          </h1>
        </div>
        {me && (
          <Link
            href="/new"
            className="border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]"
          >
            + Написать
          </Link>
        )}
      </div>

      {!posts?.length ? (
        <p className="text-sm italic text-[var(--bone-faint)]">
          Пока тихо. Ни одной записи.
        </p>
      ) : (
        <InfiniteFeed initialPosts={posts} />
      )}

    </main>
  )
}