'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/actions/posts'

export default function DeletePostButton({
  id,
  redirectTo,
  className,
  onDeleted,
}: {
  id: string
  redirectTo?: string
  className?: string
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState('')

  function handleClick() {
    if (!window.confirm('Удалить пост безвозвратно? Это нельзя отменить.')) return

    setErr('')
    startTransition(async () => {
      const res = await deletePost(id)
      if (!res.ok) {
        setErr(res.error)
        return
      }
      if (onDeleted) onDeleted()
      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <span>
      <button
        type="button"
        className={className ?? 'gg-btn gg-btn--danger'}
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? 'Удаляю…' : 'Удалить'}
      </button>
      {err && <span className="note note-warning" style={{ marginLeft: '0.6rem' }}>{err}</span>}
    </span>
  )
}
