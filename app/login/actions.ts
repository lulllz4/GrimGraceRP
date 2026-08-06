'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const DOMAIN = process.env.EMAIL_DOMAIN || 'users.grimgrace.local'

export async function login(formData: FormData) {
  const username = String(formData.get('username') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    redirect('/login?e=bad')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: `${username}@${DOMAIN}`,
    password,
  })

  if (error) redirect('/login?e=fail')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}