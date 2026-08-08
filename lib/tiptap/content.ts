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
 * Картинка без `src` — узел нулевого размера: в редакторе в него не попасть
 * ни курсором, ни выделением, а удалить нечем. Информации в нём тоже ноль,
 * так что выбрасываем и из HTML, и из JSON.
 */
const EMPTY_IMG = /<img\b(?![^>]*\ssrc\s*=)[^>]*>/gi

function dropEmptyImages(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  const n = node as MaybeNode

  if (Array.isArray(n.content)) {
    const kept = n.content
      .filter((child) => {
        const c = child as MaybeNode
        if (c?.type !== 'image') return true
        const src = (c.attrs as { src?: unknown } | undefined)?.src
        return typeof src === 'string' && src.length > 0
      })
      .map(dropEmptyImages)
    return { ...n, content: kept }
  }

  return node
}

/**
 * Что отдать редактору: JSON, если он целый, иначе — сохранённый HTML.
 * TipTap принимает и то, и другое.
 */
export function editorContent(json: unknown, html: string | null | undefined): unknown {
  if (json && !isStrippedDoc(json)) return dropEmptyImages(json)
  if (html?.trim()) return html.replace(EMPTY_IMG, '')
  return json ? dropEmptyImages(json) : ''
}
