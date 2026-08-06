'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from '@/lib/auth'

const DOMAIN = process.env.EMAIL_DOMAIN || 'users.grimgrace.local'

/* ---------- создать игрока ---------- */
export async function createPlayer(formData: FormData) {
  await requireStaff()

  const username = String(formData.get('username') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const display  = String(formData.get('display_name') || '').trim()
  const contact  = String(formData.get('contact') || '').trim()

  if (!/^[a-z0-9_]{3,24}$/.test(username)) redirect('/admin/players?e=badnick')
  if (password.length < 8) redirect('/admin/players?e=badpass')

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@${DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: display || username,
    },
  })

  if (error) redirect(`/admin/players?e=${encodeURIComponent(error.message)}`)

  if (contact && data.user) {
    await admin.from('profiles').update({ contact }).eq('id', data.user.id)
  }

  revalidatePath('/admin/players')
  redirect('/admin/players?ok=1')
}

/* ---------- сбросить пароль ---------- */
export async function resetPassword(formData: FormData) {
  await requireStaff()
  const id = String(formData.get('id'))
  const password = String(formData.get('password') || '')
  if (password.length < 8) redirect('/admin/players?e=badpass')

  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(id, { password })
  await admin.from('profiles').update({ must_change_password: true }).eq('id', id)

  revalidatePath('/admin/players')
  redirect('/admin/players?ok=pw')
}

/* ---------- бан ---------- */
export async function toggleBan(formData: FormData) {
  await requireStaff()
  const id = String(formData.get('id'))
  const value = String(formData.get('value')) === 'true'

  const admin = createAdminClient()
  await admin.from('profiles').update({ is_banned: value }).eq('id', id)

  revalidatePath('/admin/players')
}

/* ---------- назначить персонажа ---------- */
export async function assignCharacter(formData: FormData) {
  await requireStaff()
  const slug = String(formData.get('slug'))
  const characterId = String(formData.get('character_id'))
  const playerId = String(formData.get('player_id'))
  const note = String(formData.get('note') || '')

  if (!playerId) redirect(`/admin/roster/${slug}?e=noplayer`)

  const supabase = await createClient()
  const { error } = await supabase.rpc('assign_character', {
    p_character: characterId,
    p_player: playerId,
    p_note: note || null,
  })

  if (error) redirect(`/admin/roster/${slug}?e=${encodeURIComponent(error.message)}`)

  revalidatePath(`/admin/roster/${slug}`)
  revalidatePath('/roster')
  redirect(`/admin/roster/${slug}?ok=1`)
}

/* ---------- снять персонажа ---------- */
export async function revokeCharacter(formData: FormData) {
  await requireStaff()
  const slug = String(formData.get('slug'))
  const characterId = String(formData.get('character_id'))
  const reason = String(formData.get('reason') || 'removed')
  const status = String(formData.get('new_status') || 'vacant')

  const supabase = await createClient()
  const { error } = await supabase.rpc('revoke_character', {
    p_character: characterId,
    p_reason: reason,
    p_new_status: status,
  })

  if (error) redirect(`/admin/roster/${slug}?e=${encodeURIComponent(error.message)}`)

  revalidatePath(`/admin/roster/${slug}`)
  revalidatePath('/roster')
  redirect(`/admin/roster/${slug}?ok=revoked`)
}

/* ---------- канон персонажа ---------- */
export async function updateCanon(formData: FormData) {
  await requireStaff()
  const slug = String(formData.get('slug'))
  const characterId = String(formData.get('character_id'))

  const supabase = await createClient()
  await supabase.from('characters').update({
    name:       String(formData.get('name') || ''),
    element:    String(formData.get('element')),
    region:     String(formData.get('region')),
    status:     String(formData.get('status')),
    sort_order: Number(formData.get('sort_order') || 100),
    gm_note:    String(formData.get('gm_note') || '') || null,
  }).eq('id', characterId)

  revalidatePath(`/admin/roster/${slug}`)
  revalidatePath('/roster')
  redirect(`/admin/roster/${slug}?ok=canon`)
}