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
  /** #rrggbb — перебивает и элемент персонажа, и его личную тему */
  accent: string | null
  /** шрифт заголовков поста */
  font: ThemeFontKey | null
  vignette: boolean
}

export const EMPTY_ATMOSPHERE: Atmosphere = {
  backdrop: 'none',
  accent: null,
  font: null,
  vignette: false,
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

  const font =
    typeof r.font === 'string' && r.font in THEME_FONTS
      ? (r.font as ThemeFontKey)
      : null

  const vignette = r.vignette === true

  /* ничего не выбрано — не занимаем колонку пустышкой */
  if (backdrop === 'none' && !accent && !font && !vignette) return null

  return { backdrop, accent, font, vignette }
}

/** Инлайн-стиль: переменные, которые разбирает CSS класса .gg-atmo. */
export function atmosphereStyle(a: Atmosphere | null | undefined): Record<string, string> {
  if (!a) return {}
  const style: Record<string, string> = {}

  const backdrop = BACKDROPS[a.backdrop] ?? BACKDROPS.none
  if (a.backdrop !== 'none') {
    style['--post-bg'] = backdrop.bg
    style['--post-haze'] = backdrop.haze
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
