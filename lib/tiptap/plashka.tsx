'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { BLOCKS, type BlockKey } from '@/lib/blocks'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    plashka: {
      insertPlashka: (variant: BlockKey) => ReturnType
    }
  }
}

/* ---------------- вид в редакторе ---------------- */

function PlashkaView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode } = props
  const variant = (node.attrs.variant as BlockKey) || 'note'
  const def = BLOCKS[variant] ?? BLOCKS.note

  return (
    <NodeViewWrapper
      className="gg-plashka gg-plashka--edit"
      data-variant={variant}
    >
      <div className="gg-plashka__chrome" contentEditable={false}>
        <span className="gg-plashka__badge">
          <b>{def.icon}</b> {def.label}
        </span>
        <button
          type="button"
          className="gg-plashka__kill"
          onClick={() => deleteNode()}
          title="Удалить плашку"
        >
          ✕
        </button>
      </div>

      {def.title !== false && (
        <div contentEditable={false}>
          <input
            className="gg-plashka__field gg-plashka__field--title"
            value={(node.attrs.title as string) ?? ''}
            placeholder={def.title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
          />
        </div>
      )}

      <NodeViewContent className="gg-plashka__body" />

      {def.meta !== false && (
        <div contentEditable={false}>
          <input
            className="gg-plashka__field gg-plashka__field--meta"
            value={(node.attrs.meta as string) ?? ''}
            placeholder={def.meta}
            onChange={(e) => updateAttributes({ meta: e.target.value })}
          />
        </div>
      )}
    </NodeViewWrapper>
  )
}

/* ---------------- сама нода ---------------- */

export const Plashka = Node.create({
  name: 'plashka',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

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
        renderHTML: (attrs) =>
          attrs.title ? { 'data-title': attrs.title } : {},
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
      {
        tag: 'div.gg-plashka',
        contentElement: '.gg-plashka__body',
      },
      {
        tag: 'details.gg-plashka',
        contentElement: '.gg-plashka__body',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant = node.attrs.variant as BlockKey

    /* письмо рендерится как конверт: закрыт, пока читатель не кликнет */
    if (variant === 'letter') {
      const unfurlKids: unknown[] = [['div', { class: 'gg-plashka__body' }, 0]]
      if (node.attrs.meta) {
        unfurlKids.push(['div', { class: 'gg-plashka__meta' }, node.attrs.meta])
      }

      return [
        'details',
        mergeAttributes(HTMLAttributes, { class: 'gg-plashka gg-plashka--letter' }),
        [
          'summary',
          { class: 'gg-plashka__cover' },
          ['span', { class: 'gg-plashka__seal', 'aria-hidden': 'true' }],
          ['span', { class: 'gg-plashka__sender' }, (node.attrs.title as string) || 'Письмо'],
          ['span', { class: 'gg-plashka__hint' }, 'Надорвать сургуч…'],
        ],
        ['div', { class: 'gg-plashka__unfurl' }, ...unfurlKids],
      ] as never
    }

    const kids: unknown[] = []

    if (node.attrs.title) {
      kids.push(['div', { class: 'gg-plashka__title' }, node.attrs.title])
    }

    kids.push(['div', { class: 'gg-plashka__body' }, 0])

    if (node.attrs.meta) {
      kids.push(['div', { class: 'gg-plashka__meta' }, node.attrs.meta])
    }

    const extraAttrs = variant === 'spoiler' ? { tabindex: '0' } : {}

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'gg-plashka' }, extraAttrs),
      ...kids,
    ] as never
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlashkaView)
  },

  addCommands() {
    return {
      insertPlashka:
        (variant) =>
        ({ chain }) => {
          const def = BLOCKS[variant]
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { variant, title: '', meta: '' },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: def.body }],
                },
              ],
            })
            .run()
        },
    }
  },
})