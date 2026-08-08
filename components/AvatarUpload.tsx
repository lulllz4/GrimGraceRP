'use client'

import { useRef, useState } from 'react'
import { uploadCharacterAvatar, removeCharacterAvatar } from '@/lib/actions/upload'
import { shrinkImage } from '@/lib/image'

type Props = {
  characterId: string
  initialUrl: string | null
}

export default function AvatarUpload({ characterId, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file || busy) return
    setErr('')
    setBusy(true)

    const fd = new FormData()
    /* аватарка показывается маленькой — оригинал с камеры тут совсем не нужен */
    fd.append('file', await shrinkImage(file, 512))
    fd.append('characterId', characterId)
    const res = await uploadCharacterAvatar(fd)

    setBusy(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!res.ok) {
      setErr(res.error)
      return
    }
    setUrl(res.url)
  }

  async function handleRemove() {
    if (busy) return
    setErr('')
    setBusy(true)
    const res = await removeCharacterAvatar(characterId)
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setUrl(null)
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--ink-2)]"
        style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {!url && (
          <span className="flex h-full w-full items-center justify-center text-xs text-[var(--bone-faint)]">
            нет фото
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="border border-[var(--line)] px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? 'Загружаю…' : url ? 'Сменить фото' : 'Загрузить фото'}
          </button>
          {url && (
            <button
              type="button"
              className="border border-[var(--line)] px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--crimson-lt)] hover:border-[var(--crimson-lt)]"
              disabled={busy}
              onClick={handleRemove}
            >
              Убрать
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {err && <div className="note note-warning text-xs">{err}</div>}
        <small className="text-[var(--bone-faint)]">Сохраняется сразу, отдельно от остальной анкеты.</small>
      </div>
    </div>
  )
}
