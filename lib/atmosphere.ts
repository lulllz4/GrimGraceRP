import {
  THEME_FONTS,
  isValidHexColor,
  hexToRgbTriplet,
  type ThemeFontKey,
} from '@/lib/elements'

/**
 * Атмосфера поста — фон сцены, цвет акцента, шрифт заголовков и виньетка.
 * Настраивается автором в редакторе, живёт в колонке posts.atmosphere (jsonb).
 *
 * Всё сделано на градиентах и переменных: ни картинок, ни размытий, ни
 * фильтров — иначе телефон снова начнёт лагать (см. работу над мобильной
 * производительностью). Свободу автору даём в рамках проверенного набора:
 * произвольный CSS из браузера в базу не попадает.
 */

export type BackdropKey =
  | 'none' | 'fog' | 'candle' | 'blood' | 'frost' | 'crypt' | 'ball'

export const BACKDROPS: Record<BackdropKey, {
  label: string
  /** основной фон полотна */
  bg: string
  /** световая дымка поверх фона */
  haze: string
  /** цвет акцента, который предлагается вместе с фоном */
  accent: string
}> = {
  none: {
    label: 'Без атмосферы',
    bg: 'transparent',
    haze: 'transparent',
    accent: '#b8323d',
  },
  fog: {
    label: 'Туман',
    bg: 'linear-gradient(180deg, #12161b 0%, #0d1013 55%, #0b0b0d 100%)',
    haze: 'radial-gradient(90% 55% at 50% 12%, rgba(150,170,190,.13), transparent 70%)',
    accent: '#7c8ea3',
  },
  candle: {
    label: 'Свечи',
    bg: 'linear-gradient(0deg, #1a1108 0%, #0f0c09 45%, #0b0b0d 100%)',
    haze: 'radial-gradient(70% 45% at 50% 100%, rgba(220,150,60,.16), transparent 72%)',
    accent: '#c98a3c',
  },
  blood: {
    label: 'Кровь',
    bg: 'linear-gradient(180deg, #16090c 0%, #0d0709 50%, #0b0b0d 100%)',
    haze: 'radial-gradient(100% 60% at 50% 0%, rgba(160,30,45,.16), transparent 68%)',
    accent: '#b8323d',
  },
  frost: {
    label: 'Снег',
    bg: 'linear-gradient(180deg, #141a1e 0%, #0e1215 55%, #0b0b0d 100%)',
    haze: 'radial-gradient(80% 50% at 50% 8%, rgba(180,215,235,.12), transparent 70%)',
    accent: '#8fb6c9',
  },
  crypt: {
    label: 'Склеп',
    bg: 'linear-gradient(180deg, #0f1110 0%, #0a0b0a 60%, #08080a 100%)',
    haze: 'radial-gradient(100% 70% at 50% 100%, rgba(90,110,80,.10), transparent 65%)',
    accent: '#6f7a63',
  },
  ball: {
    label: 'Бал',
    bg: 'linear-gradient(180deg, #171017 0%, #100c11 55%, #0b0b0d 100%)',
    haze: 'radial-gradient(85% 50% at 50% 0%, rgba(190,150,80,.13), transparent 70%)',
    accent: '#a8863f',
  },
}

export const BACKDROP_LIST = Object.keys(BACKDROPS) as BackdropKey[]

export type Atmosphere = {
  backdrop: BackdropKey
  /** свой цвет страницы, #rrggbb — перебивает готовый фон */
  bgColor: string | null
  /** картинка фоном, ссылка из нашего хранилища — перебивает и цвет, и фон */
  bgImage: string | null
  /** #rrggbb — перебивает и элемент персонажа, и его личную тему */
  accent: string | null
  /** шрифт заголовков поста */
  font: ThemeFontKey | null
  vignette: boolean
  /** светлая гамма: тёмный текст по светлой странице */
  light: boolean
  /** книжная красная строка во всём посте */
  indentAll: boolean
}

export const EMPTY_ATMOSPHERE: Atmosphere = {
  backdrop: 'none',
  bgColor: null,
  bgImage: null,
  accent: null,
  font: null,
  vignette: false,
  light: false,
  indentAll: false,
}

/** Светлая гамма — те же переменные, что и у тёмной, только наоборот. */
const LIGHT_INK: Record<string, string> = {
  '--bone': '#2b2620',
  '--bone-dim': '#5c554a',
  '--bone-faint': '#847c6e',
  '--line': '#cec6b6',
  '--panel': '#efe9dd',
  '--ink': '#f5f0e6',
  '--ink-2': '#efe9dd',
}

/** Страница по умолчанию для светлой гаммы, если фон не выбран отдельно. */
const LIGHT_PAGE = 'linear-gradient(180deg, #f7f3ea 0%, #efe8db 100%)'

/**
 * Ссылка на картинку годится, только если она из нашего хранилища и не
 * содержит символов, которыми можно выскочить из url(...) в инлайн-стиле.
 * Проверяется и на клиенте, и на сервере.
 */
export function isSafeImageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  if (!url.startsWith(`${base}/storage/v1/object/public/`)) return false
  return !/["'()\\\s]/.test(url)
}

/**
 * Приводит что угодно к безопасной атмосфере — или к null, если настраивать
 * нечего. Вызывается на сервере перед записью в базу: из браузера может
 * прийти всё что угодно, а уезжает это в инлайн-стиль страницы.
 */
export function normalizeAtmosphere(raw: unknown): Atmosphere | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<Record<keyof Atmosphere, unknown>>

  const backdrop: BackdropKey =
    typeof r.backdrop === 'string' && r.backdrop in BACKDROPS
      ? (r.backdrop as BackdropKey)
      : 'none'

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

  const vignette = r.vignette === true
  const light = r.light === true
  const indentAll = r.indentAll === true

  /* ничего не выбрано — не занимаем колонку пустышкой */
  if (
    backdrop === 'none' && !accent && !bgColor && !bgImage &&
    !font && !vignette && !light && !indentAll
  ) {
    return null
  }

  return { backdrop, bgColor, bgImage, accent, font, vignette, light, indentAll }
}

/** Инлайн-стиль: переменные, которые разбирает CSS класса .gg-atmo. */
export function atmosphereStyle(a: Atmosphere | null | undefined): Record<string, string> {
  if (!a) return {}
  const style: Record<string, string> = {}

  if (a.light) Object.assign(style, LIGHT_INK)

  const backdrop = BACKDROPS[a.backdrop] ?? BACKDROPS.none

  /* что сильнее: картинка → свой цвет → готовый фон */
  if (a.bgImage && isSafeImageUrl(a.bgImage)) {
    /* поверх картинки кладём вуаль, иначе текст на ней не прочесть.
       Никакого background-attachment: fixed — на телефоне это убийца. */
    const veil = a.light ? 'rgba(245,240,230,.72)' : 'rgba(8,8,10,.62)'
    style['--post-bg'] =
      `linear-gradient(${veil}, ${veil}), url("${a.bgImage}") center / cover no-repeat`
    style['--post-haze'] = 'transparent'
  } else if (a.bgColor && isValidHexColor(a.bgColor)) {
    style['--post-bg'] = a.bgColor
    style['--post-haze'] = a.backdrop !== 'none' ? backdrop.haze : 'transparent'
  } else if (a.backdrop !== 'none') {
    style['--post-bg'] = backdrop.bg
    style['--post-haze'] = backdrop.haze
  } else if (a.light) {
    style['--post-bg'] = LIGHT_PAGE
  }

  if (a.accent && isValidHexColor(a.accent)) {
    style['--accent'] = a.accent
    style['--accent-glow'] = hexToRgbTriplet(a.accent)
  }

  if (a.font && THEME_FONTS[a.font]) {
    style['--font-display'] = THEME_FONTS[a.font].cssVar
  }

  return style
}
