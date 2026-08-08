'use client'

import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggFormat: {
      indentMore: () => ReturnType
      indentLess: () => ReturnType
      toggleDropcap: () => ReturnType
    }
  }
}

/** Докуда можно отодвигать абзац — дальше на телефоне не останется строки. */
export const MAX_INDENT = 4

/**
 * Отступ абзаца и буквица — ставятся автором вручную на конкретный
 * абзац, кнопками в тулбаре, а не автоматически по всему посту.
 *
 * Отступ — это сдвиг всего абзаца от левого края (ступенями), а не красная
 * строка: так автор может отбивать реплики, вложенные мысли и цитаты.
 */
export const IndentDropcap = Extension.create({
  name: 'ggFormat',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const step = el.className.match(/gg-indent-(\d)/)
              if (step) return Math.min(Number(step[1]), MAX_INDENT)
              /* старая разметка: отступ был просто «есть/нет» */
              return el.classList.contains('gg-indent') ? 1 : 0
            },
            renderHTML: (attrs) =>
              attrs.indent ? { class: `gg-indent-${attrs.indent}` } : {},
          },
          dropcap: {
            default: false,
            parseHTML: (el) => el.classList.contains('gg-dropcap'),
            renderHTML: (attrs) => (attrs.dropcap ? { class: 'gg-dropcap' } : {}),
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indentMore:
        () =>
        ({ editor, commands }) => {
          const now = Number(editor.getAttributes('paragraph').indent ?? 0)
          if (now >= MAX_INDENT) return false
          return commands.updateAttributes('paragraph', { indent: now + 1 })
        },
      indentLess:
        () =>
        ({ editor, commands }) => {
          const now = Number(editor.getAttributes('paragraph').indent ?? 0)
          if (now <= 0) return false
          return commands.updateAttributes('paragraph', { indent: now - 1 })
        },
      toggleDropcap:
        () =>
        ({ editor, commands }) => {
          const isActive = editor.isActive('paragraph', { dropcap: true })
          return commands.updateAttributes('paragraph', { dropcap: !isActive })
        },
    }
  },

  /* Tab здесь занят списками, поэтому берём привычные по текстовым
     редакторам Ctrl+] и Ctrl+[ */
  addKeyboardShortcuts() {
    return {
      'Mod-]': () => this.editor.commands.indentMore(),
      'Mod-[': () => this.editor.commands.indentLess(),
    }
  },
})
