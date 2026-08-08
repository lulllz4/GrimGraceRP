import {
  THEME_FONTS,
  isValidHexColor,
  hexToRgbTriplet,
  type ThemeFontKey,
} from '@/lib/elements'

/**
 * Оформление поста — три слоя.
 *
 *   материал — бумага: фон, цвет чернил, линий и зерно;
 *   свет     — источник и направление подсветки;
 *   набор    — типографика: заголовки, ритм абзаца, линейки.
 *
 * Слои перемножаются: пять материалов на пять источников света на четыре
 * набора — восемьдесят внешностей вместо одного списка пресетов. Готовые
 * сочетания (READY) — просто ярлыки к тройке значений.
 *
 * Всё на градиентах и переменных: ни картинок, ни размытий, ни фильтров,
 * иначе телефон снова начнёт лагать. Цвет чернил приезжает ВМЕСТЕ с
 * материалом — поэтому светлую страницу нельзя случайно получить со светлым
 * текстом.
 */

/* ═══════════════ слой 1: материал ═══════════════ */

export type MaterialKey = 'night' | 'velvet' | 'stone' | 'parchment' | 'paper'

export const MATERIALS: Record<MaterialKey, {
  label: string
  bg: string
  /** цвет чернил и всего, что от него зависит */
  ink: Record<string, string>
  grain: string
  /** тёмная ли бумага — от этого зависит вуаль под картинкой и виньетка */
  dark: boolean
}> = {
  night: {
    label: 'Ночь',
    bg: 'linear-gradient(180deg, #101015 0%, #0b0b0d 100%)',
    ink: {},
    grain: 'none',
    dark: true,
  },
  velvet: {
    label: 'Бархат',
    bg: 'linear-gradient(180deg, #1a1017 0%, #0d090f 100%)',
    ink: { '--bone': '#e6dccd', '--bone-dim': '#a3948c', '--bone-faint': '#7a6d69', '--line': '#33232f', '--panel': '#1b1119', '--ink-2': '#150e14' },
    grain: 'none',
    dark: true,
  },
  stone: {
    label: 'Камень',
    bg: 'linear-gradient(180deg, #121413 0%, #0a0b0a 100%)',
    ink: { '--bone': '#cfd0c6', '--bone-dim': '#8d8f84', '--bone-faint': '#6b6d63', '--line': '#242a26', '--panel': '#141715', '--ink-2': '#0f110f' },
    grain: 'none',
    dark: true,
  },
  parchment: {
    label: 'Пергамент',
    bg: 'linear-gradient(180deg, #e8dcc0 0%, #dccfae 100%)',
    ink: { '--bone': '#33291b', '--bone-dim': '#6b5d45', '--bone-faint': '#8a7a5c', '--line': '#c2b18a', '--panel': '#e3d6b8', '--ink-2': '#e3d6b8' },
    grain: 'repeating-linear-gradient(0deg, rgba(120,95,55,.055) 0 1px, transparent 1px 4px)',
    dark: false,
  },
  paper: {
    label: 'Бумага',
    bg: 'linear-gradient(180deg, #f7f4ec 0%, #efeade 100%)',
    ink: { '--bone': '#241f1a', '--bone-dim': '#5d564c', '--bone-faint': '#7d766a', '--line': '#d3ccbd', '--panel': '#f2ede2', '--ink-2': '#f2ede2' },
    grain: 'repeating-linear-gradient(0deg, rgba(0,0,0,.022) 0 1px, transparent 1px 3px)',
    dark: false,
  },
}

/* ═══════════════ слой 2: свет ═══════════════ */

export type LightKey = 'none' | 'gas' | 'moon' | 'window' | 'hearth'

export const LIGHTS: Record<LightKey, { label: string; glow: string }> = {
  none:   { label: 'Нет',           glow: 'transparent' },
  gas:    { label: 'Рожок снизу',   glow: 'radial-gradient(60% 42% at 50% 100%, rgba(226,158,72,.20), transparent 72%)' },
  moon:   { label: 'Луна сверху',   glow: 'radial-gradient(70% 45% at 50% 0%, rgba(178,205,230,.17), transparent 70%)' },
  window: { label: 'Окно сбоку',    glow: 'linear-gradient(105deg, rgba(190,205,225,.16) 0%, transparent 42%)' },
  hearth: { label: 'Камин в углу',  glow: 'radial-gradient(42% 38% at 12% 96%, rgba(220,110,50,.22), transparent 70%)' },
}

/* ═══════════════ слой 3: набор ═══════════════ */

export type SetKey = 'novel' | 'chronicle' | 'letter' | 'gazette'

export const SETS: Record<SetKey, {
  label: string
  font: ThemeFontKey
  size: string
  track: string
  transform: string
  weight: string
  bodySize: string
  bodyLine: string
  /** линейки над и под шапкой поста */
  rule: string
  /** красная строка по умолчанию для этого набора */
  indent: boolean
}> = {
  novel: {
    label: 'Роман',
    font: 'cormorant', size: '2.5rem', track: '.02em', transform: 'none', weight: '400',
    bodySize: '1.16rem', bodyLine: '1.85', rule: '0px', indent: true,
  },
  chronicle: {
    label: 'Хроника',
    font: 'cormorant', size: '1.9rem', track: '.26em', transform: 'uppercase', weight: '400',
    bodySize: '1.1rem', bodyLine: '1.75', rule: '1px', indent: false,
  },
  letter: {
    label: 'Письмо',
    font: 'marck', size: '2.3rem', track: '.01em', transform: 'none', weight: '400',
    bodySize: '1.18rem', bodyLine: '1.95', rule: '0px', indent: true,
  },
  gazette: {
    /* готическая GothCyr — шрифт буквицы, одна начертанием и без гарантии
       полного набора глифов; для целого заголовка берём жирную капитель */
    label: 'Газета',
    font: 'cormorant', size: '2.9rem', track: '-.01em', transform: 'none', weight: '700',
    bodySize: '1.06rem', bodyLine: '1.6', rule: '3px', indent: true,
  },
}

/* ═══════════════ готовые сочетания ═══════════════ */

export const READY: Record<string, {
  label: string
  material: MaterialKey
  light: LightKey
  set: SetKey
}> = {
  gaslight: { label: 'Газовый рожок', material: 'night',     light: 'gas',    set: 'novel' },
  moon:     { label: 'Полнолуние',    material: 'stone',     light: 'moon',   set: 'novel' },
  ink:      { label: 'Бумага и чернила', material: 'paper',  light: 'none',   set: 'chronicle' },
  crypt:    { label: 'Склеп',         material: 'stone',     light: 'hearth', set: 'chronicle' },
  ball:     { label: 'Бальная зала',  material: 'velvet',    light: 'window', set: 'gazette' },
  letter:   { label: 'Письмо',        material: 'parchment', light: 'none',   set: 'letter' },
}

export const MATERIAL_LIST = Object.keys(MATERIALS) as MaterialKey[]
export const LIGHT_LIST = Object.keys(LIGHTS) as LightKey[]
export const SET_LIST = Object.keys(SETS) as SetKey[]
export const READY_LIST = Object.keys(READY)

/* ═══════════════ сама атмосфера ═══════════════ */

export type Atmosphere = {
  material: MaterialKey
  light: LightKey
  set: SetKey
  /** null — цвет персонажа; иначе перебивает его под сцену */
  accent: string | null
  /** свой цвет страницы вместо материала */
  bgColor: string | null
  /** картинка фоном — сильнее и материала, и своего цвета */
  bgImage: string | null
  /** шрифт заголовков вместо того, что даёт набор */
  font: ThemeFontKey | null
  vignette: boolean
  /** красная строка во всём посте; по умолчанию берётся из набора */
  indentAll: boolean
}

export const EMPTY_ATMOSPHERE: Atmosphere = {
  material: 'night',
  light: 'none',
  set: 'novel',
  accent: null,
  bgColor: null,
  bgImage: null,
  font: null,
  vignette: false,
  indentAll: true,
}

/** Пустая ли атмосфера — такую не храним, чтобы не занимать колонку. */
function isBlank(a: Atmosphere): boolean {
  return (
    a.material === 'night' && a.light === 'none' && a.set === 'novel' &&
    !a.accent && !a.bgColor && !a.bgImage && !a.font && !a.vignette &&
    a.indentAll === SETS.novel.indent
  )
}

/**
 * Яркость цвета по формуле относительной светимости. Нужна, чтобы по своему
 * цвету страницы самим подобрать цвет чернил: автор не должен получить
 * белое по белому, даже если очень постарается.
 */
export function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35
}

/**
 * Ссылка на картинку годится, только если она из нашего хранилища и не
 * содержит символов, которыми можно выскочить из url(...) в инлайн-стиле.
 */
export function isSafeImageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  if (!url.startsWith(`${base}/storage/v1/object/public/`)) return false
  return !/["'()\\\s]/.test(url)
}

/** Старые ключи фона — до разделения на материал и свет. */
const LEGACY_BACKDROP: Record<string, { material: MaterialKey; light: LightKey }> = {
  none:   { material: 'night',  light: 'none' },
  fog:    { material: 'night',  light: 'moon' },
  candle: { material: 'night',  light: 'gas' },
  blood:  { material: 'velvet', light: 'hearth' },
  frost:  { material: 'stone',  light: 'moon' },
  crypt:  { material: 'stone',  light: 'hearth' },
  ball:   { material: 'velvet', light: 'window' },
}

/**
 * Приводит что угодно к безопасной атмосфере — или к null, если настраивать
 * нечего. Вызывается на сервере перед записью: из браузера может прийти всё
 * что угодно, а уезжает это в инлайн-стиль страницы.
 */
export function normalizeAtmosphere(raw: unknown): Atmosphere | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  /* записи, сохранённые до трёхслойного оформления */
  const legacy =
    typeof r.backdrop === 'string' ? LEGACY_BACKDROP[r.backdrop] : undefined
  const legacyLight = r.light === true ? 'paper' : undefined

  const material: MaterialKey =
    typeof r.material === 'string' && r.material in MATERIALS
      ? (r.material as MaterialKey)
      : (legacyLight ?? legacy?.material ?? 'night')

  const light: LightKey =
    typeof r.light === 'string' && r.light in LIGHTS
      ? (r.light as LightKey)
      : (legacy?.light ?? 'none')

  const set: SetKey =
    typeof r.set === 'string' && r.set in SETS ? (r.set as SetKey) : 'novel'

  const accent =
    typeof r.accent === 'string' && isValidHexColor(r.accent) ? r.accent : null
  const bgColor =
    typeof r.bgColor === 'string' && isValidHexColor(r.bgColor) ? r.bgColor : null
  const bgImage =
    typeof r.bgImage === 'string' && isSafeImageUrl(r.bgImage) ? r.bgImage : null
  const font =
    typeof r.font === 'string' && r.font in THEME_FONTS
      ? (r.font as ThemeFontKey)
      : null

  const atmo: Atmosphere = {
    material,
    light,
    set,
    accent,
    bgColor,
    bgImage,
    font,
    vignette: r.vignette === true,
    indentAll: typeof r.indentAll === 'boolean' ? r.indentAll : SETS[set].indent,
  }

  return isBlank(atmo) ? null : atmo
}

/** Инлайн-стиль: переменные, которые разбирает CSS класса .gg-atmo. */
export function atmosphereStyle(a: Atmosphere | null | undefined): Record<string, string> {
  if (!a) return {}

  const material = MATERIALS[a.material] ?? MATERIALS.night
  const set = SETS[a.set] ?? SETS.novel
  const style: Record<string, string> = { ...material.ink }

  /* — бумага: картинка сильнее своего цвета, свой цвет сильнее материала — */
  let dark = material.dark

  if (a.bgImage && isSafeImageUrl(a.bgImage)) {
    const veil = dark ? 'rgba(8,8,10,.62)' : 'rgba(245,240,230,.72)'
    style['--post-bg'] =
      `linear-gradient(${veil}, ${veil}), url("${a.bgImage}") center / cover no-repeat`
  } else if (a.bgColor && isValidHexColor(a.bgColor)) {
    /* чернила подбираем по яркости выбранного цвета, а не по материалу:
       так автор не получит белое по белому, даже если очень постарается */
    dark = !isLightColor(a.bgColor)
    Object.assign(style, dark ? MATERIALS.night.ink : MATERIALS.paper.ink)
    style['--post-bg'] = a.bgColor
  } else {
    style['--post-bg'] = material.bg
  }

  style['--post-grain'] = a.bgImage ? 'none' : material.grain
  style['--post-light'] = LIGHTS[a.light]?.glow ?? 'transparent'
  style['--post-veil'] = dark ? 'rgba(0,0,0,.55)' : 'rgba(70,55,35,.26)'

  /* — акцент: по умолчанию персонажа, автор может перебить — */
  if (a.accent && isValidHexColor(a.accent)) {
    style['--accent'] = a.accent
    style['--accent-glow'] = hexToRgbTriplet(a.accent)
  }

  /* — набор — */
  const fontKey = a.font ?? set.font
  if (THEME_FONTS[fontKey]) style['--font-display'] = THEME_FONTS[fontKey].cssVar
  style['--post-h-size'] = set.size
  style['--post-h-track'] = set.track
  style['--post-h-case'] = set.transform
  style['--post-h-weight'] = set.weight
  style['--post-size'] = set.bodySize
  style['--post-line'] = set.bodyLine
  style['--post-rule'] = set.rule

  return style
}
