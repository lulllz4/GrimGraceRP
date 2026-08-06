import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  username: string
  display_name: string | null
  role: 'admin' | 'moderator' | 'player'
  contact: string | null
  recovery_email: string | null
  must_change_password: boolean
  is_banned: boolean
}

/** Профиль текущего пользователя или null, если не вошёл. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (data as Profile) ?? null
}

/** Пускает только вошедших. Иначе — на страницу входа. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.is_banned) redirect('/login?e=banned')
  return profile
}

/** Пускает только админов и модераторов. */
export async function requireStaff(): Promise<Profile> {
  const profile = await requireUser()
  if (profile.role !== 'admin' && profile.role !== 'moderator') {
    redirect('/?e=forbidden')
  }
  return profile
}

/** Пускает только админов. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser()
  if (profile.role !== 'admin') redirect('/?e=forbidden')
  return profile
}

export const getMe = getProfile
export const requireAuth = requireUser
export const getSession = getProfile
export const requireMod = requireStaff