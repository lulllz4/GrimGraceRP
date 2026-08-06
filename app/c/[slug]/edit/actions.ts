'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { isValidHexColor, THEME_FONTS, type ThemeFontKey } from '@/lib/elements'
import { DIVIDERS } from '@/lib/blocks'

const cut = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '').trim().slice(0, max) || null

export async function saveSheet(formData: FormData) {
  const me = await requireUser()
  const slug = String(formData.get('slug'))
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('characters')
    .select('id, current_player_id')
    .eq('slug', slug)
    .single()

  if (!c) redirect('/roster')

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (c.current_player_id !== me.id && !isStaff) {
    redirect(`/c/${slug}?e=forbidden`)
  }

  const useTheme = formData.get('use_theme') === 'on'

  const rawAccent = String(formData.get('theme_accent') ?? '')
  const rawFont = String(formData.get('theme_font') ?? '')
  const rawDivider = String(formData.get('theme_divider') ?? '')

  const themeAccent = useTheme && isValidHexColor(rawAccent) ? rawAccent : null
  const themeFont = useTheme && rawFont in THEME_FONTS ? (rawFont as ThemeFontKey) : null
  const themeDivider = useTheme && rawDivider in DIVIDERS ? rawDivider : null

  const { error } = await supabase.from('characters').update({
    full_name:  cut(formData.get('full_name'), 120),
    age_note:   cut(formData.get('age_note'), 60),
    species:    cut(formData.get('species'), 60),
    faction:    cut(formData.get('faction'), 80),
    rank_title: cut(formData.get('rank_title'), 80),
    occupation: cut(formData.get('occupation'), 80),
    epithet:    cut(formData.get('epithet'), 100),
    quote:      cut(formData.get('quote'), 300),
    brief:      cut(formData.get('brief'), 20000),
    theme_accent:  themeAccent,
    theme_font:    themeFont,
    theme_divider: themeDivider,
  }).eq('id', c.id)

  if (error) redirect(`/c/${slug}/edit?e=${encodeURIComponent(error.message)}`)

  revalidatePath(`/c/${slug}`)
  revalidatePath('/roster')
  redirect(`/c/${slug}`)
}