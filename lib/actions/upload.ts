'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024 // 5 МБ
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function uploadPostImage(formData: FormData): Promise<UploadResult> {
  const me = await requireUser()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'Файл не найден.' }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: 'Можно загружать только изображения (jpg, png, webp, gif).' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Файл больше 5 МБ — сожми его или возьми другой.' }
  }

  const supabase = await createClient()
  const ext = EXT_BY_TYPE[file.type]
  const path = `${me.id}/${nanoid(16)}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: 'Не удалось загрузить файл: ' + error.message }

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

/* ---------------- аватар персонажа ---------------- */

/** Тот же бакет, что и у картинок в постах — просто отдельная папка. */
export async function uploadCharacterAvatar(formData: FormData): Promise<UploadResult> {
  const me = await requireUser()

  const characterId = String(formData.get('characterId') ?? '')
  if (!characterId) return { ok: false, error: 'Не указан персонаж.' }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'Файл не найден.' }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: 'Можно загружать только изображения (jpg, png, webp, gif).' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Файл больше 5 МБ — сожми его или возьми другой.' }
  }

  const supabase = await createClient()

  const { data: c } = await supabase
    .from('characters')
    .select('id, slug, current_player_id')
    .eq('id', characterId)
    .single()

  if (!c) return { ok: false, error: 'Персонаж не найден.' }

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (c.current_player_id !== me.id && !isStaff) {
    return { ok: false, error: 'Это не ваш персонаж.' }
  }

  const ext = EXT_BY_TYPE[file.type]
  const path = `${me.id}/avatars/${characterId}-${nanoid(10)}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (upErr) return { ok: false, error: 'Не удалось загрузить файл: ' + upErr.message }

  const { data: pub } = supabase.storage.from('post-images').getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('characters')
    .update({ avatar_url: pub.publicUrl })
    .eq('id', characterId)

  if (dbErr) return { ok: false, error: 'Файл загружен, но не сохранился в анкете: ' + dbErr.message }

  revalidatePath(`/c/${c.slug}`)
  revalidatePath(`/c/${c.slug}/edit`)
  revalidatePath('/roster')

  return { ok: true, url: pub.publicUrl }
}

export async function removeCharacterAvatar(characterId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUser()
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('characters')
    .select('id, slug, current_player_id')
    .eq('id', characterId)
    .single()

  if (!c) return { ok: false, error: 'Персонаж не найден.' }

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (c.current_player_id !== me.id && !isStaff) {
    return { ok: false, error: 'Это не ваш персонаж.' }
  }

  const { error } = await supabase
    .from('characters')
    .update({ avatar_url: null })
    .eq('id', characterId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/c/${c.slug}`)
  revalidatePath(`/c/${c.slug}/edit`)
  revalidatePath('/roster')

  return { ok: true }
}
