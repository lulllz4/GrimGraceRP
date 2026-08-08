'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { DIVIDERS, DIVIDER_KINDS, ORNAMENT, type DividerVariant } from '@/lib/blocks'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggNodes: {
      insertSceneHeader: () => ReturnType
      insertDivider: (variant: DividerVariant, symbol?: string) => ReturnType
      insertDice: () => ReturnType
    }
  }
}

/* ==================== ШАПКА СЦЕНЫ ==================== */

function SceneView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="gg-scene gg-scene--edit" contentEditable={false}>
      <button
        type="button"
        className="gg-plashka__kill"
        onClick={() => deleteNode()}
        title="Удалить"
      >
        ✕
      </button>
      <input
        className="gg-scene__in gg-scene__in--place"
        value={(node.attrs.place as string) ?? ''}
        placeholder="Уайтчепел, Дорсет-стрит"
        onChange={(e) => updateAttributes({ place: e.target.value })}
      />
      <input
        className="gg-scene__in gg-scene__in--time"
        value={(node.attrs.time as string) ?? ''}
        placeholder="9 ноября 1888, за полночь"
        onChange={(e) => updateAttributes({ time: e.target.value })}
      />
      <input
        className="gg-scene__in gg-scene__in--weather"
        value={(node.attrs.weather as string) ?? ''}
        placeholder="туман, мелкий дождь"
        onChange={(e) => updateAttributes({ weather: e.target.value })}
      />
    </NodeViewWrapper>
  )
}

export const SceneHeader = Node.create({
  name: 'sceneHeader',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      place:   { default: '', parseHTML: (el) => el.getAttribute('data-place') || '' },
      time:    { default: '', parseHTML: (el) => el.getAttribute('data-time') || '' },
      weather: { default: '', parseHTML: (el) => el.getAttribute('data-weather') || '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div.gg-scene' }]
  },

  renderHTML({ node }) {
    const kids: unknown[] = []
    if (node.attrs.place) {
      kids.push(['div', { class: 'gg-scene__place' }, node.attrs.place])
    }
    if (node.attrs.time) {
      kids.push(['div', { class: 'gg-scene__time' }, node.attrs.time])
    }
    if (node.attrs.weather) {
      kids.push(['div', { class: 'gg-scene__weather' }, node.attrs.weather])
    }
    return [
      'div',
      mergeAttributes({
        class: 'gg-scene',
        'data-place': node.attrs.place || null,
        'data-time': node.attrs.time || null,
        'data-weather': node.attrs.weather || null,
      }),
      ...kids,
    ] as never
  },

  addNodeView() {
    return ReactNodeViewRenderer(SceneView)
  },

  addCommands() {
    return {
      insertSceneHeader:
        () =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({ type: this.name, attrs: { place: '', time: '', weather: '' } })
            .run(),
    }
  },
})

/* ==================== РАЗДЕЛИТЕЛЬ ==================== */

function DividerView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const variant = (node.attrs.variant as DividerVariant) || 'symbol'
  const current = (node.attrs.symbol as string) || '❦'

  return (
    <NodeViewWrapper
      className="gg-div gg-div--edit"
      data-variant={variant}
      contentEditable={false}
    >
      <span className="gg-div__line" />
      <span className="gg-div__pick">
        {/* сперва вид разделителя */}
        {(Object.entries(DIVIDER_KINDS) as [DividerVariant, { label: string; icon: string }][])
          .map(([key, def]) => (
            <button
              key={key}
              type="button"
              className="gg-div__kind"
              title={def.label}
              data-on={key === variant ? '' : undefined}
              onClick={() => updateAttributes({ variant: key })}
            >
              {def.icon}
            </button>
          ))}

        {/* символ выбирается только у соответствующего вида */}
        {variant === 'symbol' && (
          <>
            <span className="gg-div__sep" />
            {Object.entries(DIVIDERS).map(([key, sym]) => (
              <button
                key={key}
                type="button"
                data-on={sym === current ? '' : undefined}
                onClick={() => updateAttributes({ symbol: sym })}
              >
                {sym}
              </button>
            ))}
          </>
        )}

        <button type="button" className="gg-div__kill" onClick={() => deleteNode()}>
          ✕
        </button>
      </span>
      <span className="gg-div__line" />
    </NodeViewWrapper>
  )
}

export const SceneDivider = Node.create({
  name: 'sceneDivider',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      /* старые разделители сохранялись без вида — они все были «символом» */
      variant: {
        default: 'symbol',
        parseHTML: (el) => el.getAttribute('data-variant') || 'symbol',
      },
      symbol: { default: '❦', parseHTML: (el) => el.getAttribute('data-symbol') || '❦' },
    }
  },

  parseHTML() {
    return [{ tag: 'div.gg-div' }]
  },

  renderHTML({ node }) {
    const variant = (node.attrs.variant as DividerVariant) || 'symbol'
    const symbol = (node.attrs.symbol as string) || '❦'

    const attrs: Record<string, string> = {
      class: `gg-div gg-div--${variant}`,
      'data-variant': variant,
    }

    /* чистая полоса — пустой узел, линию рисует CSS */
    if (variant === 'line') return ['div', attrs] as never

    if (variant === 'symbol') attrs['data-symbol'] = symbol

    return [
      'div',
      attrs,
      ['span', { class: 'gg-div__mark' }, variant === 'ornament' ? ORNAMENT : symbol],
    ] as never
  },

  addNodeView() {
    return ReactNodeViewRenderer(DividerView)
  },

  addCommands() {
    return {
      insertDivider:
        (variant, symbol = '❦') =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: { variant, symbol } }).run(),
    }
  },
})

/* ==================== БРОСОК ==================== */

function DiceView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="gg-dice gg-dice--edit" contentEditable={false}>
      <span className="gg-dice__icon">🎲</span>
      <input
        className="gg-dice__in gg-dice__in--f"
        value={(node.attrs.formula as string) ?? ''}
        placeholder="2d6 + 3"
        onChange={(e) => updateAttributes({ formula: e.target.value })}
      />
      <span className="gg-dice__eq">=</span>
      <input
        className="gg-dice__in gg-dice__in--r"
        value={(node.attrs.result as string) ?? ''}
        placeholder="11"
        onChange={(e) => updateAttributes({ result: e.target.value })}
      />
      <input
        className="gg-dice__in gg-dice__in--c"
        value={(node.attrs.comment as string) ?? ''}
        placeholder="проверка выдержки — успех"
        onChange={(e) => updateAttributes({ comment: e.target.value })}
      />
      <button type="button" className="gg-plashka__kill" onClick={() => deleteNode()}>
        ✕
      </button>
    </NodeViewWrapper>
  )
}

export const DiceRoll = Node.create({
  name: 'diceRoll',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      formula: { default: '', parseHTML: (el) => el.getAttribute('data-formula') || '' },
      result:  { default: '', parseHTML: (el) => el.getAttribute('data-result') || '' },
      comment: { default: '', parseHTML: (el) => el.getAttribute('data-comment') || '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div.gg-dice' }]
  },

  renderHTML({ node }) {
    const kids: unknown[] = [
      ['span', { class: 'gg-dice__icon' }, '🎲'],
      ['span', { class: 'gg-dice__formula' }, node.attrs.formula || '—'],
      ['span', { class: 'gg-dice__result' }, node.attrs.result || '?'],
    ]
    if (node.attrs.comment) {
      kids.push(['span', { class: 'gg-dice__comment' }, node.attrs.comment])
    }
    return [
      'div',
      mergeAttributes({
        class: 'gg-dice',
        'data-formula': node.attrs.formula || null,
        'data-result': node.attrs.result || null,
        'data-comment': node.attrs.comment || null,
      }),
      ...kids,
    ] as never
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiceView)
  },

  addCommands() {
    return {
      insertDice:
        () =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({ type: this.name, attrs: { formula: '', result: '', comment: '' } })
            .run(),
    }
  },
})