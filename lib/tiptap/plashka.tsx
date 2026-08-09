'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { BLOCKS, type BlockKey } from '@/lib/blocks'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    plashka: {
      insertPlashka: (variant: BlockKey) => ReturnType
    }
  }
}

/**
 * Плашка — обычный узел, без React-вида.
 *
 * Раньше здесь жил ReactNodeViewRenderer: внутрь редактируемой области
 * подмешивалось React-дерево с полями ввода и накладкой на `contentEditable`.
 * Это самая хрупкая конструкция в TipTap, и на телефонах она вешала браузер.
 * Теперь узел устроен как цитата: div с редактируемым телом внутри — то есть
 * ровно тот механизм, который работает везде.
 *
 * Заголовок и подпись живут в атрибутах и правятся в панели редактора,
 * снаружи холста. Название вида показывается через CSS из data-атрибута,
 * так что и на него не тратится ни одного узла разметки.
 *
 * Письмо в готовом посте превращается в запечатанный конверт (`details`)
 * уже на сервере, в cleanPostHtml: редактору незачем знать про конверты,
 * а автору незачем открывать конверт, чтобы дописать строку.
 */
export const Plashka = Node.create({
  name: 'plashka',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'note',
        parseHTML: (el) => el.getAttribute('data-variant') || 'note',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') || '',
        renderHTML: (attrs) => (attrs.title ? { 'data-title': attrs.title } : {}),
      },
      meta: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-meta') || '',
        renderHTML: (attrs) => (attrs.meta ? { 'data-meta': attrs.meta } : {}),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div.gg-plashka', contentElement: '.gg-plashka__body' },
      { tag: 'details.gg-plashka', contentElement: '.gg-plashka__body' },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant = node.attrs.variant as BlockKey

    /* Письмо — запечатанный конверт: читатель нажимает и разворачивает.
       В редакторе конверт всегда раскрыт (`open`), иначе автор не увидит,
       что пишет; при сохранении этот атрибут снимает cleanPostHtml. */
    if (variant === 'letter') {
      const unfurl: unknown[] = [['div', { class: 'gg-plashka__body' }, 0]]
      if (node.attrs.meta) {
        unfurl.push(['div', { class: 'gg-plashka__meta' }, node.attrs.meta])
      }

      return [
        'details',
        mergeAttributes(
          HTMLAttributes,
          { class: 'gg-plashka gg-plashka--letter' },
          this.editor ? { open: 'open' } : {},
        ),
        [
          'summary',
          { class: 'gg-plashka__cover' },
          ['span', { class: 'gg-plashka__seal', 'aria-hidden': 'true' }],
          ['span', { class: 'gg-plashka__sender' }, (node.attrs.title as string) || 'Письмо'],
          ['span', { class: 'gg-plashka__hint' }, 'Надорвать сургуч…'],
        ],
        ['div', { class: 'gg-plashka__unfurl' }, ...unfurl],
      ] as never
    }

    const kids: unknown[] = []

    if (node.attrs.title) {
      kids.push(['div', { class: 'gg-plashka__title' }, node.attrs.title])
    }

    /* 0 — дыра под редактируемое тело: ProseMirror сам подставит сюда
       содержимое узла и сделает этот div contentDOM */
    kids.push(['div', { class: 'gg-plashka__body' }, 0])

    if (node.attrs.meta) {
      kids.push(['div', { class: 'gg-plashka__meta' }, node.attrs.meta])
    }

    const extra = variant === 'spoiler' ? { tabindex: '0' } : {}

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'gg-plashka' }, extra),
      ...kids,
    ] as never
  },

  addCommands() {
    return {
      insertPlashka:
        (variant) =>
        ({ chain }) => {
          const def = BLOCKS[variant] ?? BLOCKS.note
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { variant, title: '', meta: '' },
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: def.body }] },
              ],
            })
            .run()
        },
    }
  },
})
