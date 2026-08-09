'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { BLOCKS, BLOCK_GROUPS, DIVIDERS, DIVIDER_KINDS, type BlockKey } from '@/lib/blocks'
import { EDITABLE_NODES, type EditableNode } from '@/lib/tiptap/nodes'

/**
 * Настройки выбранного блока — заголовок плашки, место сцены, формула броска.
 *
 * Раньше всё это правилось полями ввода прямо внутри холста, через React-вид
 * узла. На телефоне такая конструкция вешала браузер, да и попасть пальцем
 * в поле шириной с подпись было мучением. Теперь панель живёт снаружи
 * редактируемой области: обычные поля, обычные размеры, никакого спора
 * за фокус с самим редактором.
 *
 * Показывается, только когда курсор стоит на таком блоке.
 */

type Props = { editor: Editor | null }

/**
 * Поле панели со своим состоянием.
 *
 * Значение хранится локально и уходит в документ на каждое нажатие, но
 * обратно из документа подхватывается, только пока поле не в фокусе. Иначе
 * каждая буква гоняла бы значение по кругу через ProseMirror, а курсор
 * прыгал бы в конец строки при правке середины.
 */
function AttrField({
  label, value, placeholder, onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  const [local, setLocal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    /* перешли на другой блок — показываем его значение; но пока автор печатает,
       поле себе не мешаем */
    if (document.activeElement !== ref.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocal(value)
    }
  }, [value])

  return (
    <label className="gg-field">
      <span>{label}</span>
      <input
        ref={ref}
        className="gg-input"
        value={local}
        placeholder={placeholder}
        onChange={(e) => { setLocal(e.target.value); onChange(e.target.value) }}
      />
    </label>
  )
}

const LABEL: Record<EditableNode, string> = {
  plashka:      'Плашка',
  sceneHeader:  'Шапка сцены',
  sceneDivider: 'Разделитель',
  diceRoll:     'Бросок',
}

export default function NodeSettings({ editor }: Props) {
  /* какой из наших блоков сейчас под курсором и с какими атрибутами */
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null
      for (const name of EDITABLE_NODES) {
        if (ed.isActive(name)) {
          return { name, attrs: ed.getAttributes(name) as Record<string, string> }
        }
      }
      return null
    },
  })

  if (!editor || !state) return null

  const { name, attrs } = state

  /* БЕЗ .focus(): панель живёт снаружи холста, и если вернуть фокус в
     редактор, поле ввода потеряет его на первой же букве, а следующий
     символ уйдёт мимо. Выделение в документе никуда не девается и без
     фокуса, так что updateAttributes попадает куда надо. */
  const set = (patch: Record<string, string>) =>
    editor.chain().updateAttributes(name, patch).run()

  const field = (key: string, label: string, placeholder = '') => (
    <AttrField
      key={`${name}:${key}`}
      label={label}
      value={attrs[key] ?? ''}
      placeholder={placeholder}
      onChange={(v) => set({ [key]: v })}
    />
  )

  return (
    <div className="gg-drawer gg-drawer--node">
      <div className="gg-drawer__label">
        {LABEL[name]}
        {name === 'plashka' && attrs.variant && ` · ${BLOCKS[attrs.variant as BlockKey]?.label ?? ''}`}
      </div>

      {name === 'plashka' && (
        <>
          <div className="gg-drawer__grid">
            {BLOCK_GROUPS.flatMap((g) => g.items).map((k) => (
              <button
                key={k}
                type="button"
                className="gg-chip"
                data-on={attrs.variant === k ? '' : undefined}
                onClick={() => set({ variant: k })}
              >
                <span className="gg-chip__icon">{BLOCKS[k].icon}</span>
                <span className="gg-chip__name">{BLOCKS[k].label}</span>
              </button>
            ))}
          </div>
          {BLOCKS[attrs.variant as BlockKey]?.title !== false &&
            field('title', 'Заголовок', String(BLOCKS[attrs.variant as BlockKey]?.title ?? ''))}
          {BLOCKS[attrs.variant as BlockKey]?.meta !== false &&
            field('meta', 'Подпись', String(BLOCKS[attrs.variant as BlockKey]?.meta ?? ''))}
        </>
      )}

      {name === 'sceneHeader' && (
        <>
          {field('place', 'Место', 'Уайтчепел, Дорсет-стрит')}
          {field('time', 'Время', '9 ноября 1888, за полночь')}
          {field('weather', 'Погода', 'туман, мелкий дождь')}
        </>
      )}

      {name === 'diceRoll' && (
        <>
          {field('formula', 'Формула', '2d6 + 3')}
          {field('result', 'Результат', '11')}
          {field('comment', 'Комментарий', 'проверка выдержки — успех')}
        </>
      )}

      {name === 'sceneDivider' && (
        <>
          <div className="gg-drawer__grid">
            {(Object.keys(DIVIDER_KINDS) as (keyof typeof DIVIDER_KINDS)[]).map((k) => (
              <button
                key={k}
                type="button"
                className="gg-chip gg-chip--wide"
                data-on={attrs.variant === k ? '' : undefined}
                onClick={() => set({ variant: k })}
              >
                {DIVIDER_KINDS[k].icon}
              </button>
            ))}
          </div>
          {attrs.variant === 'symbol' && (
            <div className="gg-drawer__grid">
              {Object.entries(DIVIDERS).map(([key, sym]) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip gg-chip--sym"
                  data-on={attrs.symbol === sym ? '' : undefined}
                  onClick={() => set({ symbol: sym })}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="gg-btn gg-btn--danger"
        onClick={() => editor.chain().focus().deleteNode(name).run()}
      >
        Удалить блок
      </button>
    </div>
  )
}
