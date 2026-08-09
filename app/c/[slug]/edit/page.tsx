import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { ELEMENTS, REGIONS, THEME_FONTS, type ThemeFontKey } from '@/lib/elements'
import { DIVIDERS } from '@/lib/blocks'
import AvatarUpload from '@/components/AvatarUpload'
import { SHEET, SHEET_RULE } from '@/lib/sheet'
import { saveSheet } from './actions'

const DIVIDER_LABELS: Record<string, string> = {
  fleuron: 'Флёрон (по умолчанию)',
  star: 'Звезда',
  cross: 'Крест',
  diamond: 'Ромб',
  line: 'Тире',
  bat: 'Летучая мышь',
  rose: 'Роза',
}

export const dynamic = 'force-dynamic'

const input =
  'w-full rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 ' +
  'text-[var(--bone)] outline-none focus:border-[var(--crimson-lt)]'

export default async function EditSheet({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ e?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const me = await requireUser()
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('characters')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!c) notFound()

  const isStaff = me.role === 'admin' || me.role === 'moderator'
  if (c.current_player_id !== me.id && !isStaff) redirect(`/c/${slug}`)

  return (
    <main data-element={c.element} className="mx-auto max-w-[var(--wrap)] px-5 py-14">

      <p className="eyebrow">
        <Link href={`/c/${c.slug}`} className="hover:text-[var(--bone)]">← {c.name}</Link>
      </p>

      <h1 className="mt-2 mb-1 font-[var(--font-cormorantsc)] text-4xl text-[var(--bone)]">
        Анкета
      </h1>
      <p className="mb-8 text-xs uppercase tracking-widest text-[var(--bone-faint)]">
        {ELEMENTS[c.element as keyof typeof ELEMENTS]?.label}
        {' · '}
        {REGIONS[c.region as keyof typeof REGIONS]?.label}
      </p>

      {sp.e && <div className="note note-warning mb-8">{sp.e}</div>}

      <div className="mb-10">
        <AvatarUpload characterId={c.id} initialUrl={c.avatar_url ?? null} />
      </div>

      <div className="note mb-10">
        Имя, элемент и регион задаёт Мастер — их здесь нет. Всё остальное ваше.
      </div>

      <form action={saveSheet} className="grid gap-6">
        <input type="hidden" name="slug" value={c.slug} />

        <div className="rounded-sm border border-[var(--line)] p-5">
          <label className="mb-4 flex items-center gap-2 text-sm text-[var(--bone)]">
            <input
              type="checkbox"
              name="use_theme"
              defaultChecked={Boolean(c.theme_accent)}
            />
            Своя атмосфера постов — вместо цвета элемента
          </label>

          <div className="grid gap-6 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--bone-faint)]">
                Цвет
              </span>
              <input
                type="color"
                name="theme_accent"
                defaultValue={c.theme_accent || ELEMENTS[c.element as keyof typeof ELEMENTS]?.accent || '#b8323d'}
                className="h-11 w-full cursor-pointer rounded-sm border border-[var(--line)] bg-[var(--ink-2)]"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--bone-faint)]">
                Шрифт-акцент
              </span>
              <select name="theme_font" defaultValue={c.theme_font ?? 'cormorant'} className={input}>
                {(Object.entries(THEME_FONTS) as Array<[ThemeFontKey, typeof THEME_FONTS[ThemeFontKey]]>).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--bone-faint)]">
                Разделитель
              </span>
              <select name="theme_divider" defaultValue={c.theme_divider ?? 'fleuron'} className={input}>
                {Object.entries(DIVIDERS).map(([k, sym]) => (
                  <option key={k} value={k}>{sym} — {DIVIDER_LABELS[k]}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs text-[var(--bone-faint)]">
            Если галочка снята — посты и страница персонажа выглядят как обычно, по цвету элемента.
          </p>
        </div>

        <label className="grid gap-1">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--bone-faint)]">
            Эпитет
          </span>
          <input
            name="epithet"
            defaultValue={c.epithet ?? ''}
            maxLength={100}
            placeholder="Собиратель тишины"
            className={input}
          />
          <span className="text-xs text-[var(--bone-faint)]">
            Короткая строка под именем.
          </span>
        </label>

        {/* ============ анкета: три части по шаблону ============ */}
        {SHEET.map((part, i) => (
          <div key={part.part} className="gg-sheet__part">
            {i > 0 && <div className="gg-sheet__rule" aria-hidden="true">{SHEET_RULE}</div>}

            {part.fields.map((f) => (
              <label key={f.key} className="gg-field gg-sheet__field">
                <span>
                  <b className="gg-sheet__no">{f.no}.</b> {f.label}
                  {f.optional && <i className="gg-sheet__opt"> — по желанию</i>}
                </span>

                {f.kind === 'short' ? (
                  <input
                    name={f.key}
                    defaultValue={(c as Record<string, string | null>)[f.key] ?? ''}
                    maxLength={f.max}
                    className="gg-input"
                  />
                ) : (
                  <textarea
                    name={f.key}
                    defaultValue={(c as Record<string, string | null>)[f.key] ?? ''}
                    maxLength={f.max}
                    rows={10}
                    className="gg-input gg-sheet__area"
                  />
                )}

                {f.hint && <small>{f.hint}</small>}
              </label>
            ))}
          </div>
        ))}

        {/* ============ мелочи оформления ============ */}
        <div className="gg-sheet__part">
          <div className="gg-sheet__rule" aria-hidden="true">{SHEET_RULE}</div>

          <label className="gg-field gg-sheet__field">
            <span>Эпитет</span>
            <input name="epithet" defaultValue={c.epithet ?? ''} maxLength={100}
                   placeholder="Собиратель тишины" className="gg-input" />
            <small>Короткая строка под именем — видна и в постах.</small>
          </label>

          <label className="gg-field gg-sheet__field">
            <span>Цитата</span>
            <input name="quote" defaultValue={c.quote ?? ''} maxLength={300} className="gg-input" />
            <small>Одна фраза. Кавычки поставятся сами.</small>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button className="border border-[var(--line)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--bone)] hover:border-[var(--crimson-lt)]">
            Сохранить
          </button>
          <Link
            href={`/c/${c.slug}`}
            className="text-xs uppercase tracking-widest text-[var(--bone-faint)] hover:text-[var(--bone)]"
          >
            Отмена
          </Link>
        </div>
      </form>

    </main>
  )
}