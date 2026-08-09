'use client'

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { trace } from '@/lib/trace'

/**
 * Предохранитель на размер документа.
 *
 * Проверка стоит на `filterTransaction` — то есть ДО того, как изменение
 * будет принято. Это важно: если правку пропустить, редактор успеет
 * перерисовать чудовищный документ, а на телефоне такая отрисовка кладёт
 * вкладку целиком, вместе с браузером. Здесь же изменение просто не
 * применяется, редактор остаётся в прежнем, рабочем состоянии.
 *
 * Порог заведомо велик: самый длинный пост в проекте — десятки тысяч узлов.
 * За этой границей документ уже не текст, а поломка.
 */

const MAX_DOC = 500_000

export const SizeGuard = Extension.create({
  name: 'ggSizeGuard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('ggSizeGuard'),
        filterTransaction: (tr) => {
          if (!tr.docChanged) return true
          const size = tr.doc.nodeSize
          if (size > MAX_DOC) {
            trace(`ПРЕДОХРАНИТЕЛЬ: документ вырос до ${size} узлов, правка отклонена`)
            return false
          }
          return true
        },
      }),
    ]
  },
})
