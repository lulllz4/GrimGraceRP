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
 * Отступ первой строки и буквица — ставятся автором вручную на конкретный
 * абзац, кнопками в тулбаре, а не автоматически по всему посту.
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
            parseHTML: (el) => el.classList.contains('gg-indent'),
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
})
