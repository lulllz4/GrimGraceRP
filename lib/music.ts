/**
 * Разбор ссылок на музыку и сборка адреса плеера.
 *
 * Правило безопасности: адрес плеера **никогда** не берётся из ссылки автора
 * целиком. Из неё вытаскивается только опознанный идентификатор — цифры и
 * буквы, — а сам адрес собирается здесь из своих кусков. Иначе через поле
 * «ссылка на песню» в страницу читателя можно было бы подсунуть что угодно.
 */

export type MusicService = 'youtube' | 'spotify' | 'yandex' | 'soundcloud' | 'other'

export const SERVICE_LABEL: Record<MusicService, string> = {
  youtube:    'YouTube',
  spotify:    'Spotify',
  yandex:     'Яндекс Музыка',
  soundcloud: 'SoundCloud',
  other:      'по ссылке',
}

/** Только то, из чего состоят идентификаторы у сервисов. */
const ID = /^[A-Za-z0-9_-]{1,64}$/
const NUM = /^\d{1,20}$/

export function detectService(url: string): MusicService {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'other'
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') return 'youtube'
  if (host === 'open.spotify.com') return 'spotify'
  if (host === 'music.yandex.ru' || host === 'music.yandex.com') return 'yandex'
  if (host === 'soundcloud.com') return 'soundcloud'
  return 'other'
}

/**
 * Адрес встраиваемого плеера — или null, если сервис незнаком или ссылка
 * не разобралась. Тогда карточка остаётся просто ссылкой.
 */
export function embedUrl(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }

  switch (detectService(url)) {
    case 'youtube': {
      const id = u.hostname.endsWith('youtu.be')
        ? u.pathname.slice(1)
        : (u.searchParams.get('v') ?? '')
      if (!ID.test(id)) return null
      /* nocookie — чтобы читателя не считали до того, как он нажал */
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    }

    case 'spotify': {
      const m = /^\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/.exec(u.pathname)
      if (!m || !ID.test(m[2])) return null
      return `https://open.spotify.com/embed/${m[1]}/${m[2]}`
    }

    case 'yandex': {
      /* .../album/123/track/456 или .../track/456 */
      const withAlbum = /^\/album\/(\d+)\/track\/(\d+)/.exec(u.pathname)
      if (withAlbum) {
        return `https://music.yandex.ru/iframe/track/${withAlbum[2]}/${withAlbum[1]}`
      }
      const solo = /^\/track\/(\d+)/.exec(u.pathname)
      if (solo && NUM.test(solo[1])) {
        return `https://music.yandex.ru/iframe/track/${solo[1]}`
      }
      const album = /^\/album\/(\d+)$/.exec(u.pathname)
      if (album) return `https://music.yandex.ru/iframe/album/${album[1]}`
      return null
    }

    case 'soundcloud': {
      /* здесь идентификатора в ссылке нет — сервис принимает саму ссылку,
         поэтому пропускаем только собственный путь вида /автор/трек */
      if (!/^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)) return null
      const clean = `https://soundcloud.com${u.pathname}`
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&auto_play=true`
    }

    default:
      return null
  }
}

/** Ссылка вообще похожа на ссылку и ведёт по http(s)? */
export function isPlayableLink(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
