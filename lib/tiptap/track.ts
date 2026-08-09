'use client'

import { Node, mergeAttributes, type CommandProps } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { detectService, SERVICE_LABEL } from '@/lib/music'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggTrack: {
      insertTrack: () => ReturnType
    }
  }
}

/**
 * Песня в посте — карточка-пластинка.
 *
 * В сохранённом посте это обычная ссылка: работает без единой строки
 * скрипта, открывается в сервисе автора. Плеер подставляется уже в браузере
 * читателя и только если он нажал (см. TrackPlayers) — до нажатия не
 * загружается ничего, потому что чужой плеер весит полтора-два мегабайта.
 *
 * В редакторе карточка рисуется как `div`, а не ссылка: иначе нажатие
 * уводило бы автора с страницы вместо выделения блока.
 */
export const Track = Node.create({
  name: 'track',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      url:    { default: '', parseHTML: (el) => el.getAttribute('href') || el.getAttribute('data-url') || '' },
      artist: { default: '', parseHTML: (el) => el.getAttribute('data-artist') || '' },
      title:  { default: '', parseHTML: (el) => el.getAttribute('data-title') || '' },
    }
  },

  parseHTML() {
    return [{ tag: 'a.gg-track' }, { tag: 'div.gg-track' }]
  },

  renderHTML({ node }) {
    const { url, artist, title } = node.attrs as Record<string, string>
    const service = url ? detectService(url) : 'other'
    const empty = !url && !artist && !title

    const inner: unknown[] = [
      ['span', { class: 'gg-track__disc', 'aria-hidden': 'true' }],
      [
        'span',
        { class: 'gg-track__body' },
        ['span', { class: 'gg-track__artist' }, artist || 'Исполнитель'],
        ['span', { class: 'gg-track__title' }, title || (empty ? 'Песня не выбрана' : 'Без названия')],
        ['span', { class: 'gg-track__where' }, url ? SERVICE_LABEL[service] : 'ссылка не указана'],
      ],
      ['span', { class: 'gg-track__play' }, 'Поставить'],
    ]

    const attrs = {
      class: empty ? 'gg-track gg-track--empty' : 'gg-track',
      'data-service': service,
      'data-artist': artist || null,
      'data-title': title || null,
    }

    /* в редакторе — блок, у читателя — ссылка */
    if (this.editor) {
      return ['div', mergeAttributes(attrs, { 'data-url': url || null }), ...inner] as never
    }

    if (!url) return ['div', mergeAttributes(attrs), ...inner] as never

    return [
      'a',
      mergeAttributes(attrs, { href: url, target: '_blank', rel: 'noopener noreferrer' }),
      ...inner,
    ] as never
  },

  addCommands() {
    return {
      insertTrack:
        () =>
        ({ chain, state }) => {
          const at = state.selection.to
          return chain()
            .focus()
            .insertContentAt(at, { type: this.name, attrs: { url: '', artist: '', title: '' } })
            .command(({ tr, dispatch }: CommandProps) => {
              if (!dispatch) return true
              for (const pos of [at, at - 1, at + 1, at - 2]) {
                if (pos < 0 || pos > tr.doc.content.size) continue
                if (tr.doc.nodeAt(pos)?.type.name === this.name) {
                  tr.setSelection(NodeSelection.create(tr.doc, pos))
                  return true
                }
              }
              return true
            })
            .run()
        },
    }
  },
})
