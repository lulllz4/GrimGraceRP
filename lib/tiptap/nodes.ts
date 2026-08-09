'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ORNAMENT, type DividerVariant } from '@/lib/blocks'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggNodes: {
      insertSceneHeader: () => ReturnType
      insertDivider: (variant: DividerVariant, symbol?: string) => ReturnType
      insertDice: () => ReturnType
    }
  }
}

/**
 * Шапка сцены, разделитель и бросок — простые узлы без React-вида.
 *
 * Все три раньше рисовались через ReactNodeViewRenderer и держали внутри
 * редактируемой области поля ввода на `contentEditable={false}`. Это и есть
 * та конструкция, из-за которой телефон вешал браузер. Теперь они рисуются
 * обычной разметкой из своих атрибутов, а правятся в панели редактора —
 * снаружи холста, крупными полями, в которые удобно попадать пальцем.
 *
 * Пустой узел не должен пропадать из виду, поэтому при незаполненных полях
 * добавляется класс с подсказкой: её рисует CSS, разметки она не стоит.
 */

/* ==================== ШАПКА СЦЕНЫ ==================== */

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
    const { place, time, weather } = node.attrs as Record<string, string>
    const kids: unknown[] = []

    if (place)   kids.push(['div', { class: 'gg-scene__place' }, place])
    if (time)    kids.push(['div', { class: 'gg-scene__time' }, time])
    if (weather) kids.push(['div', { class: 'gg-scene__weather' }, weather])

    const empty = !place && !time && !weather

    return [
      'div',
      mergeAttributes({
        class: empty ? 'gg-scene gg-scene--empty' : 'gg-scene',
        'data-place': place || null,
        'data-time': time || null,
        'data-weather': weather || null,
      }),
      ...kids,
    ] as never
  },

  addCommands() {
    return {
      insertSceneHeader:
        () =>
        ({ chain }) =>
          chain()
            .focus()
            /* абзац следом — иначе курсор остаётся выделением на самом блоке,
               и следующая вставка не добавится, а заменит его собой */
            .insertContent([
              { type: this.name, attrs: { place: '', time: '', weather: '' } },
              { type: 'paragraph' },
            ])
            .run(),
    }
  },
})

/* ==================== РАЗДЕЛИТЕЛЬ ==================== */

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

    if (variant === 'line') return ['div', attrs] as never

    if (variant === 'symbol') attrs['data-symbol'] = symbol

    return [
      'div',
      attrs,
      ['span', { class: 'gg-div__mark' }, variant === 'ornament' ? ORNAMENT : symbol],
    ] as never
  },

  addCommands() {
    return {
      insertDivider:
        (variant, symbol = '❦') =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              { type: this.name, attrs: { variant, symbol } },
              { type: 'paragraph' },
            ])
            .run(),
    }
  },
})

/* ==================== БРОСОК ==================== */

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
    const { formula, result, comment } = node.attrs as Record<string, string>

    const kids: unknown[] = [
      ['span', { class: 'gg-dice__icon' }, '🎲'],
      ['span', { class: 'gg-dice__formula' }, formula || '—'],
      ['span', { class: 'gg-dice__result' }, result || '?'],
    ]
    if (comment) kids.push(['span', { class: 'gg-dice__comment' }, comment])

    return [
      'div',
      mergeAttributes({
        class: !formula && !result ? 'gg-dice gg-dice--empty' : 'gg-dice',
        'data-formula': formula || null,
        'data-result': result || null,
        'data-comment': comment || null,
      }),
      ...kids,
    ] as never
  },

  addCommands() {
    return {
      insertDice:
        () =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              { type: this.name, attrs: { formula: '', result: '', comment: '' } },
              { type: 'paragraph' },
            ])
            .run(),
    }
  },
})

/** Узлы, у которых есть что править в панели. */
export const EDITABLE_NODES = ['plashka', 'sceneHeader', 'sceneDivider', 'diceRoll'] as const
export type EditableNode = (typeof EDITABLE_NODES)[number]
