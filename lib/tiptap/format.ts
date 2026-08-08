'use client'

import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggFormat: {
      toggleIndent: () => ReturnType
      toggleDropcap: () => ReturnType
    }
  }
}

/**
 * Красная строка и буквица.
 *
 * Отступ — книжный: сдвигается только первая строка абзаца, чтобы абзацы
 * не сливались в сплошное полотно. Кнопка ставит его на текущий абзац;
 * на весь пост сразу включается в «Оформлении» (atmosphere.indentAll).
 */
export const IndentDropcap = Extension.create({
  name: 'ggFormat',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: false,
            /* gg-indent-N — короткоживущая разметка ступенчатого отступа,
               читаем её как обычную красную строку */
            parseHTML: (el) =>
              el.classList.contains('gg-indent') || /gg-indent-\d/.test(el.className),
            renderHTML: (attrs) => (attrs.indent ? { class: 'gg-indent' } : {}),
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
      toggleIndent:
        () =>
        ({ editor, commands }) => {
          const isActive = editor.isActive('paragraph', { indent: true })
          return commands.updateAttributes('paragraph', { indent: !isActive })
        },
      toggleDropcap:
        () =>
        ({ editor, commands }) => {
          const isActive = editor.isActive('paragraph', { dropcap: true })
          return commands.updateAttributes('paragraph', { dropcap: !isActive })
        },
    }
  },

  /* Tab здесь занят списками, поэтому берём Ctrl+] */
  addKeyboardShortcuts() {
    return {
      'Mod-]': () => this.editor.commands.toggleIndent(),
    }
  },
})
