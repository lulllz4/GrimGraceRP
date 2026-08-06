'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

/* ---------- смена пароля ---------- */
export async function changePassword(formData: FormData) {
  const profile = await requireUser()

  const pass1 = String(formData.get('password') || '')
  const pass2 = String(formData.get('password2') || '')

  if (pass1.length < 8) redirect('/dashboard?e=short')
  if (pass1 !== pass2)  redirect('/dashboard?e=mismatch')

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: pass1 })
  if (error) redirect(`/dashboard?e=${encodeURIComponent(error.message)}`)

  await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', profile.id)

  revalidatePath('/dashboard')
  redirect('/dashboard?ok=pw')
}

/* ---------- контакты и почта для восстановления ---------- */
export async function updateContacts(formData: FormData) {
  const profile = await requireUser()

  const display  = String(formData.get('display_name') || '').trim()
  const contact  = String(formData.get('contact') || '').trim()
  const recovery = String(formData.get('recovery_email') || '').trim()

  const supabase = await createClient()
  await supabase.from('profiles').update({
    display_name:   display || profile.username,
    contact:        contact || null,
    recovery_email: recovery || null,
  }).eq('id', profile.id)

  revalidatePath('/dashboard')
  redirect('/dashboard?ok=info')
}