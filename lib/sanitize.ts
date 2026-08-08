import sanitizeHtml from 'sanitize-html'

const DATA_ATTRS = [
  'data-variant', 'data-title', 'data-meta',
  'data-place', 'data-time', 'data-weather',
  'data-symbol', 'data-formula', 'data-result', 'data-comment',
]

export function cleanPostHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'div', 'span',
      'h2', 'h3', 'h4',
      'strong', 'em', 'u', 's', 'code', 'sub', 'sup',
      'ul', 'ol', 'li',
      'blockquote', 'hr', 'pre',
      'a', 'img', 'figure', 'figcaption',
      'details', 'summary',
    ],
    allowedAttributes: {
      '*':       ['class', 'tabindex', ...DATA_ATTRS],
      a:         ['href', 'title', 'target', 'rel'],
      img:       ['src', 'alt', 'title', 'loading'],
      p:         ['class', 'style'],
      h2:        ['class', 'style'],
      h3:        ['class', 'style'],
      h4:        ['class', 'style'],
      details:   ['open'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$|^right$|^center$|^justify$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    /* картинка без ссылки — пустой узел нулевого размера: в редакторе в него
       невозможно ткнуть, чтобы удалить. Выбрасываем сразу. */
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: 'lazy' },
      }),
    },
  })
}

/** Короткая выжимка для карточки в ленте. */
export function makeExcerpt(text: string, limit = 220): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= limit) return flat
  return flat.slice(0, limit).replace(/[^\s]*$/, '').trim() + '…'
}