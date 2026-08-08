/**
 * Выбор источника содержимого для редактора.
 *
 * Исторически посты сохранялись с обрезанными `attrs` у всех узлов (см.
 * длинный комментарий в `lib/actions/posts.ts`). В таком `content_json` у
 * картинки нет `src`, у абзаца — выравнивания и буквицы, у плашки — вида.
 * Для таких записей содержимое лучше поднимать из `content_html`: у всех
 * наших узлов и меток есть `parseHTML`, а `cleanPostHtml` пропускает нужные
 * `data-*` и классы, так что HTML разбирается обратно почти без потерь.
 */

type MaybeNode = {
  type?: unknown
  attrs?: unknown
  marks?: unknown
  content?: unknown
}

/** Узлы и метки, у которых в нашей схеме атрибуты есть всегда. */
const ALWAYS_HAS_ATTRS = new Set([
  'paragraph',      // textAlign + indent + dropcap
  'heading',        // level + textAlign
  'image',          // src + alt + title
  'plashka',        // variant + title + meta
  'sceneHeader',
  'sceneDivider',
  'diceRoll',
  'link',
])

function looksStripped(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as MaybeNode

  if (typeof n.type === 'string' && ALWAYS_HAS_ATTRS.has(n.type)) {
    if (!n.attrs || typeof n.attrs !== 'object') return true
  }

  if (Array.isArray(n.marks) && n.marks.some(looksStripped)) return true
  if (Array.isArray(n.content) && n.content.some(looksStripped)) return true

  return false
}

/** Пострадал ли документ от обрезки атрибутов. */
export function isStrippedDoc(json: unknown): boolean {
  return looksStripped(json)
}

/**
 * Что отдать редактору: JSON, если он целый, иначе — сохранённый HTML.
 * TipTap принимает и то, и другое.
 */
export function editorContent(json: unknown, html: string | null | undefined): unknown {
  if (json && !isStrippedDoc(json)) return json
  return html?.trim() ? html : (json ?? '')
}
