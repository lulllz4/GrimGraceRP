export type ElementKey =
  | 'anemo' | 'pyro' | 'electro' | 'cryo' | 'hydro'
  | 'geo' | 'dendro' | 'fatui' | 'beyond'

export type RegionKey =
  | 'mondstadt' | 'liyue' | 'inazuma' | 'sumeru' | 'fontaine'
  | 'natlan' | 'nodkrai' | 'snezhnaya' | 'beyond'

export const ELEMENTS: Record<ElementKey, {
  label: string
  accent: string
  glow: string
  ink: string
}> = {
  anemo:   { label: 'Анемо',    accent: '#6fc3a6', glow: '111,195,166', ink: '#0c1614' },
  pyro:    { label: 'Пиро',     accent: '#d2523f', glow: '210, 82, 63', ink: '#180b09' },
  electro: { label: 'Электро',  accent: '#a578d4', glow: '165,120,212', ink: '#120c18' },
  cryo:    { label: 'Крио',     accent: '#8fc9e0', glow: '143,201,224', ink: '#0a1216' },
  hydro:   { label: 'Гидро',    accent: '#4e8fd2', glow: '78,143,210',  ink: '#080f18' },
  geo:     { label: 'Гео',      accent: '#d5a748', glow: '213,167, 72', ink: '#161105' },
  dendro:  { label: 'Дендро',   accent: '#91c04c', glow: '145,192, 76', ink: '#0d1407' },
  fatui:   { label: 'Фатуи',    accent: '#4a6ea3', glow: '74,110,163',  ink: '#070b14' },
  beyond:  { label: 'Прочие',   accent: '#e0d3a0', glow: '224,211,160', ink: '#14120a' },
}

export const REGIONS: Record<RegionKey, { label: string; order: number }> = {
  mondstadt: { label: 'Мондштадт', order: 1 },
  liyue:     { label: 'Ли Юэ',     order: 2 },
  inazuma:   { label: 'Инадзума',  order: 3 },
  sumeru:    { label: 'Сумеру',    order: 4 },
  fontaine:  { label: 'Фонтейн',   order: 5 },
  natlan:    { label: 'Натлан',    order: 6 },
  nodkrai:   { label: 'Нод-Край',  order: 7 },
  snezhnaya: { label: 'Снежная',   order: 8 },
  beyond:    { label: 'Прочие',    order: 9 },
}

export const REGION_LIST = (Object.keys(REGIONS) as RegionKey[])
  .sort((a, b) => REGIONS[a].order - REGIONS[b].order)

export const STATUS_LABEL: Record<string, string> = {
  draft:    'черновик',
  vacant:   'свободен',
  reserved: 'бронь',
  active:   'занят',
  retired:  'выведен',
  archived: 'архив',
}

/* ═══════════════ СВОЯ АТМОСФЕРА ПЕРСОНАЖА ═══════════════ */

export type ThemeFontKey = 'cormorant' | 'marck' | 'doulaise' | 'gothcyr'

export const THEME_FONTS: Record<ThemeFontKey, { label: string; cssVar: string }> = {
  cormorant: { label: 'Кормарант (по умолчанию)',  cssVar: 'var(--font-cormorant-sc)' },
  marck:     { label: 'Рукописный (Marck Script)', cssVar: 'var(--font-marck)' },
  doulaise:  { label: 'Вычурный (Doulaise)',        cssVar: 'var(--font-doulaise)' },
  gothcyr:   { label: 'Готический (буквица)',       cssVar: 'var(--font-drop)' },
}

/** Валидный ли hex-цвет вида #rrggbb — используется и на клиенте, и на сервере при сохранении. */
export function isValidHexColor(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

/** #rrggbb → "r,g,b" — формат, в котором на сайте хранится --accent-glow. */
export function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

type CharacterTheme = {
  element: string
  theme_accent?: string | null
  theme_font?: string | null
}

/** Инлайн-стиль для узла с data-element: если у персонажа своя тема — переопределяет цвет/шрифт поверх элемента. */
export function characterThemeStyle(c: CharacterTheme): Record<string, string> {
  const style: Record<string, string> = {}
  if (c.theme_accent && isValidHexColor(c.theme_accent)) {
    style['--accent'] = c.theme_accent
    style['--accent-glow'] = hexToRgbTriplet(c.theme_accent)
  }
  const font = c.theme_font as ThemeFontKey | null | undefined
  if (font && THEME_FONTS[font]) {
    style['--font-display'] = THEME_FONTS[font].cssVar
  }
  return style
}