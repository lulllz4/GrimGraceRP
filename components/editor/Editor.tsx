'use client'

import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Props = {
  value?: string
  onChange?: (html: string) => void
}

/* Кнопка панели */
function Btn({
  label,
  title,
  on,
  disabled,
  onClick,
}: {
  label: string
  title: string
  on?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="gg-ed__btn"
      data-on={on ? '1' : undefined}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function Editor({ value = '', onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'gg-ed__body' },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

 const s = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null
      const text = editor.getText().trim()
      return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        strike: editor.isActive('strike'),
        h2: editor.isActive('heading', { level: 2 }),
        h3: editor.isActive('heading', { level: 3 }),
        quote: editor.isActive('blockquote'),
        bullet: editor.isActive('bulletList'),
        ordered: editor.isActive('orderedList'),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        words: text ? text.split(/\s+/).length : 0,
      }
    },
  })

  if (!editor) {
    return <div className="gg-ed gg-ed--loading">Редактор загружается…</div>
  }

  const c = () => editor.chain().focus()

  return (
    <div className="gg-ed">
      <div className="gg-ed__bar">
        <Btn label="B" title="Жирный" on={s?.bold} onClick={() => c().toggleBold().run()} />
        <Btn label="I" title="Курсив" on={s?.italic} onClick={() => c().toggleItalic().run()} />
        <Btn label="S" title="Зачёркнутый" on={s?.strike} onClick={() => c().toggleStrike().run()} />

        <span className="gg-ed__sep" />

        <Btn label="H2" title="Заголовок" on={s?.h2} onClick={() => c().toggleHeading({ level: 2 }).run()} />
        <Btn label="H3" title="Подзаголовок" on={s?.h3} onClick={() => c().toggleHeading({ level: 3 }).run()} />

        <span className="gg-ed__sep" />

        <Btn label="❝" title="Цитата" on={s?.quote} onClick={() => c().toggleBlockquote().run()} />
        <Btn label="•" title="Список" on={s?.bullet} onClick={() => c().toggleBulletList().run()} />
        <Btn label="1." title="Нумерованный список" on={s?.ordered} onClick={() => c().toggleOrderedList().run()} />
        <Btn label="❦" title="Разделитель" onClick={() => c().setHorizontalRule().run()} />

        <span className="gg-ed__sep" />

        <Btn label="↶" title="Отменить" disabled={!s?.canUndo} onClick={() => c().undo().run()} />
        <Btn label="↷" title="Повторить" disabled={!s?.canRedo} onClick={() => c().redo().run()} />

        <span className="gg-ed__count">{s?.words ?? 0} сл.</span>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}