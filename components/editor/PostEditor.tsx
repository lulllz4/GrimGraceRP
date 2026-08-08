'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { IndentDropcap } from '@/lib/tiptap/format'
import { uploadPostImage } from '@/lib/actions/upload'
import { shrinkImage } from '@/lib/image'

import { Plashka } from '@/lib/tiptap/plashka'
import { SceneHeader, SceneDivider, DiceRoll } from '@/lib/tiptap/nodes'
import { Speech, Thought, Whisper, Shout } from '@/lib/tiptap/marks'
import { BLOCK_GROUPS, BLOCKS, DIVIDERS, DIVIDER_KINDS, POST_KINDS, type BlockKey } from '@/lib/blocks'
import { savePost } from '@/lib/actions/posts'
import { ELEMENTS, THEME_FONTS, characterThemeStyle, type ThemeFontKey } from '@/lib/elements'
import {
  MATERIALS, MATERIAL_LIST,
  LIGHTS, LIGHT_LIST,
  SETS, SET_LIST,
  READY, READY_LIST,
  EMPTY_ATMOSPHERE,
  atmosphereStyle,
  type Atmosphere,
  type SetKey,
} from '@/lib/atmosphere'

/* ---------------- типы ---------------- */

export type MiniChar = {
  id: string
  slug: string
  name: string
  element: string
  region: string
  theme_accent?: string | null
  theme_font?: string | null
}

type Props = {
  mine: MiniChar[]
  all: MiniChar[]
  /** ВРЕМЕННОЕ: короткий хэш коммита, из которого собран сайт. */
  build?: string
  initial?: {
    id: string
    title: string
    kind: string
    status: string
    isMature: boolean
    coverUrl: string
    characterId: string
    json: unknown
    partnerIds: string[]
    atmosphere: Atmosphere | null
  }
}

/* ---------------- кнопка панели ---------------- */

function Tool({
  on, onClick, title, children,
}: {
  on?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      data-on={on ? '' : undefined}
      className="gg-tool"
    >
      {children}
    </button>
  )
}

/* ---------------- редактор ---------------- */

export default function PostEditor({ mine, all, initial, build }: Props) {
  const router = useRouter()

  const [title, setTitle]         = useState(initial?.title ?? '')
  const [kind, setKind]           = useState(initial?.kind ?? 'roleplay')
  const [charId, setCharId]       = useState(initial?.characterId ?? mine[0]?.id ?? '')
  const [mature, setMature]       = useState(initial?.isMature ?? false)
  const [cover, setCover]         = useState(initial?.coverUrl ?? '')
  const [partners, setPartners]   = useState<string[]>(initial?.partnerIds ?? [])
  const [atmo, setAtmo]           = useState<Atmosphere>(initial?.atmosphere ?? EMPTY_ATMOSPHERE)
  /* по умолчанию не открыто ничего: страница должна встречать чистым листом */
  const [panel, setPanel]         = useState<'blocks' | 'post' | 'atmo' | null>(null)
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')
  const [search, setSearch]       = useState('')
  const [imgBusy, setImgBusy]     = useState(false)
  const [imgErr, setImgErr]       = useState('')
  const [bgBusy, setBgBusy]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  /* ---------- автосохранение в браузере ---------- */
  const DRAFT_KEY = `gg-draft:${initial?.id ?? 'new'}`
  const [draftFound, setDraftFound] = useState<string | null>(null) // время найденного черновика
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleAutosave(editorForSave?: typeof editor) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const ed = editorForSave ?? editor
      if (!ed) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          title, kind, charId, mature, cover, partners, atmo,
          json: ed.getJSON(),
        }))
      } catch { /* localStorage может быть недоступен — просто не сохраняем */ }
    }, 1200)
  }

  function restoreDraft() {
    if (!editor) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      setTitle(d.title ?? '')
      setKind(d.kind ?? 'roleplay')
      setCharId(d.charId ?? mine[0]?.id ?? '')
      setMature(Boolean(d.mature))
      setCover(d.cover ?? '')
      setPartners(Array.isArray(d.partners) ? d.partners : [])
      setAtmo(d.atmo && typeof d.atmo === 'object' ? d.atmo : EMPTY_ATMOSPHERE)
      if (d.json) editor.commands.setContent(d.json)
    } catch { /* битый черновик — просто игнорируем */ }
    setDraftFound(null)
  }

  function dismissDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setDraftFound(null)
  }

  /* один раз при открытии редактора смотрим, нет ли забытого черновика */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d?.savedAt) setDraftFound(d.savedAt)
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* меняются поля формы — переносим в черновик с небольшой задержкой */
  useEffect(() => {
    scheduleAutosave()
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, kind, charId, mature, cover, partners, atmo])

  const element = useMemo(
    () => all.find((c) => c.id === charId)?.element ?? 'beyond',
    [charId, all],
  )
  const themeStyle = useMemo(() => {
    const c = all.find((c) => c.id === charId)
    return c ? characterThemeStyle(c) : {}
  }, [charId, all])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      IndentDropcap,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: 'Туман лёг на мостовую…',
      }),
      Plashka,
      SceneHeader,
      SceneDivider,
      DiceRoll,
      Speech,
      Thought,
      Whisper,
      Shout,
    ],
    content: initial?.json ?? '',
    enableContentCheck: true,
    onContentError: ({ error }) => {
      // eslint-disable-next-line no-console
      console.error('[gg-editor] контент поста не прошёл проверку схемы:', error)
    },
    onUpdate: ({ editor: ed }) => scheduleAutosave(ed),
    editorProps: {
      attributes: { class: 'gg-prose' },
    },
  })

  /* ВРЕМЕННОЕ: даёт заглянуть в живой редактор из консоли браузера.
     Заодно служит меткой сборки: если `ggEditor` в консоли есть — на сайте
     свежий код. Убрать, когда разберёмся с картинками. */
  useEffect(() => {
    if (!editor) return
    const w = window as unknown as { ggEditor?: unknown }
    w.ggEditor = editor
    return () => { delete w.ggEditor }
  }, [editor])

  const wordCount = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all.slice(0, 40)
    return all.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 40)
  }, [search, all])

  async function submit(status: 'draft' | 'published') {
    if (!editor) return
    setBusy(true)
    setErr('')

    const res = await savePost({
      id: initial?.id,
      characterId: charId,
      title,
      kind,
      status,
      isMature: mature,
      coverUrl: cover,
      html: editor.getHTML(),
      /* строкой, иначе React вырежет все attrs по пути — см. PostPayload.json */
      json: JSON.stringify(editor.getJSON()),
      plainText: editor.getText(),
      partnerIds: partners,
      atmosphere: atmo,
    })

    setBusy(false)

    if (!res.ok) {
      setErr(res.error)
      return
    }
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    router.push(status === 'published' ? `/p/${res.id}` : '/dashboard')
    router.refresh()
  }

  async function handleImageFile(file: File | undefined) {
    if (!file || !editor || imgBusy) return
    setImgErr('')
    setImgBusy(true)

    const fd = new FormData()
    fd.append('file', await shrinkImage(file))
    const res = await uploadPostImage(fd)

    setImgBusy(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!res.ok) {
      setImgErr(res.error)
      return
    }
    editor.chain().focus().setImage({ src: res.url }).run()
  }

  async function handleBackgroundFile(file: File | undefined) {
    if (!file || bgBusy) return
    setImgErr('')
    setBgBusy(true)

    const fd = new FormData()
    /* фон растягивается на всю страницу — ему нужна сторона побольше */
    fd.append('file', await shrinkImage(file, 2000))
    const res = await uploadPostImage(fd)

    setBgBusy(false)
    if (bgInputRef.current) bgInputRef.current.value = ''

    if (!res.ok) {
      setImgErr(res.error)
      return
    }
    setAtmo({ ...atmo, bgImage: res.url })
  }

  function handleCancel() {
    const hasText = editor ? editor.getText().trim().length > 0 : false
    const hasChanges = title.trim().length > 0 || hasText
    if (hasChanges && !window.confirm('Несохранённые изменения будут потеряны. Уйти со страницы?')) {
      return
    }
    router.push(initial?.id ? `/p/${initial.id}` : '/my')
  }

  if (!mine.length) {
    return (
      <div className="note note-warning">
        За вами не закреплён ни один персонаж — писать пока не от чьего лица.
        Обратитесь к Мастеру.
      </div>
    )
  }

  return (
    <div data-element={element} style={themeStyle as React.CSSProperties} className="gg-editor">

      {draftFound && (
        <div className="note mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <span>Есть несохранённый черновик от {new Date(draftFound).toLocaleString('ru-RU')}.</span>
          <button type="button" className="gg-btn" onClick={restoreDraft}>Восстановить</button>
          <button type="button" className="gg-btn gg-btn--ghost" onClick={dismissDraft}>Не нужно</button>
        </div>
      )}

      {/* ============ заголовок ============ */}
      <input
        className="gg-editor__title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название поста"
        maxLength={200}
      />

      {/* ====== одна тихая строка вместо трёх полос интерфейса ======
          Слева — кто и что пишет, справа — оформление. Обе половины
          открывают свою панель; больше между автором и текстом ничего нет. */}
      <div className="gg-editor__line">
        <button
          type="button"
          className="gg-editor__who"
          data-on={panel === 'post' ? '' : undefined}
          onClick={() => setPanel(panel === 'post' ? null : 'post')}
        >
          {mine.find((c) => c.id === charId)?.name ?? 'Выберите персонажа'}
          <i>·</i>{POST_KINDS[kind] ?? kind}
          {partners.length > 0 && <><i>·</i>с соигроками ({partners.length})</>}
          {mature && <><i>·</i>18+</>}
        </button>

        <button
          type="button"
          className="gg-editor__who"
          data-on={panel === 'atmo' ? '' : undefined}
          onClick={() => setPanel(panel === 'atmo' ? null : 'atmo')}
        >
          {MATERIALS[atmo.material].label}<i>·</i>{SETS[atmo.set].label}
        </button>
      </div>

      {/* ====== панель по выделению: появляется там, где работает рука ====== */}
      {editor && (
        <BubbleMenu editor={editor} className="gg-pop gg-pop--bubble">
          <Tool title="Жирный" on={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}>
            <b>Ж</b>
          </Tool>
          <Tool title="Курсив" on={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <i>К</i>
          </Tool>
          <Tool title="Подчёркнутый" on={editor?.isActive('underline')}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <u>Ч</u>
          </Tool>
          <Tool title="Зачёркнутый" on={editor?.isActive('strike')}
                onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <s>З</s>
          </Tool>

          <span className="gg-pop__sep" />

          <Tool title="Заголовок" on={editor?.isActive('heading', { level: 2 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </Tool>
          <Tool title="Подзаголовок" on={editor?.isActive('heading', { level: 3 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </Tool>
          <Tool title="Цитата" on={editor?.isActive('blockquote')}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            ❝
          </Tool>
          <Tool title="Список" on={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            •
          </Tool>

          <span className="gg-pop__sep" />

          <Tool title="Речь вслух" on={editor?.isActive('speech')}
                onClick={() => editor?.chain().focus().toggleSpeech().run()}>
            «»
          </Tool>
          <Tool title="Мысль" on={editor?.isActive('thought')}
                onClick={() => editor?.chain().focus().toggleThought().run()}>
            ◌
          </Tool>
          <Tool title="Шёпот" on={editor?.isActive('whisper')}
                onClick={() => editor?.chain().focus().toggleWhisper().run()}>
            ˜
          </Tool>
          <Tool title="Крик" on={editor?.isActive('shout')}
                onClick={() => editor?.chain().focus().toggleShout().run()}>
            !
          </Tool>

          <span className="gg-pop__sep" />

          <Tool title="По левому краю" on={editor?.isActive({ textAlign: 'left' })}
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
            ⇤
          </Tool>
          <Tool title="По центру" on={editor?.isActive({ textAlign: 'center' })}
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
            ⇹
          </Tool>
          <Tool title="По правому краю" on={editor?.isActive({ textAlign: 'right' })}
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
            ⇥
          </Tool>

          <span className="gg-pop__sep" />

          <Tool title="Красная строка (Ctrl+])"
                on={editor?.isActive('paragraph', { indent: true })}
                onClick={() => editor?.chain().focus().toggleIndent().run()}>
            ⇥
          </Tool>
          <Tool title="Буквица" on={editor?.isActive('paragraph', { dropcap: true })}
                onClick={() => editor?.chain().focus().toggleDropcap().run()}>
            А
          </Tool>

        </BubbleMenu>
      )}

      {/* ====== пустая строка: «+» и быстрые вставки, как в teletype ====== */}
      {editor && (
        <FloatingMenu editor={editor} className="gg-pop gg-pop--float">
          <Tool
            title="Плашки и разделители"
            on={panel === 'blocks'}
            onClick={() => setPanel(panel === 'blocks' ? null : 'blocks')}
          >
            +
          </Tool>
          <Tool title="Шапка сцены"
                onClick={() => editor.chain().focus().insertSceneHeader().run()}>
            🌙
          </Tool>
          <Tool title="Бросок"
                onClick={() => editor.chain().focus().insertDice().run()}>
            🎲
          </Tool>
          <Tool
            title={imgBusy ? 'Загружаю…' : 'Вставить картинку'}
            onClick={() => fileInputRef.current?.click()}
          >
            {imgBusy ? '…' : '🖼'}
          </Tool>
        </FloatingMenu>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => handleImageFile(e.target.files?.[0])}
      />
      {imgErr && <div className="note note-warning mt-2">{imgErr}</div>}

      {/* ============ ящик с плашками ============ */}
      {panel === 'blocks' && (
        <div className="gg-drawer">
          {BLOCK_GROUPS.map((g) => (
            <div key={g.label} className="gg-drawer__group">
              <div className="gg-drawer__label">{g.label}</div>
              <div className="gg-drawer__grid">
                {g.items.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="gg-chip"
                    title={BLOCKS[k].hint}
                    onClick={() => editor?.chain().focus().insertPlashka(k as BlockKey).run()}
                  >
                    <span className="gg-chip__icon">{BLOCKS[k].icon}</span>
                    <span className="gg-chip__name">{BLOCKS[k].label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Разделители</div>
            <div className="gg-drawer__grid">
              <button
                type="button"
                className="gg-chip gg-chip--sym gg-chip--wide"
                title="Чистая полоса"
                onClick={() => editor?.chain().focus().insertDivider('line').run()}
              >
                {DIVIDER_KINDS.line.icon}
              </button>
              <button
                type="button"
                className="gg-chip gg-chip--sym gg-chip--wide"
                title="Полоса с орнаментом"
                onClick={() => editor?.chain().focus().insertDivider('ornament').run()}
              >
                {DIVIDER_KINDS.ornament.icon}
              </button>
              {Object.entries(DIVIDERS).map(([key, sym]) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip gg-chip--sym"
                  title="Полоса с символом"
                  onClick={() => editor?.chain().focus().insertDivider('symbol', sym).run()}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ о записи: кто, что, с кем, обложка ============ */}
      {panel === 'post' && (
        <div className="gg-drawer">
          <div className="gg-drawer__group">
            <div className="gg-drawer__label">От чьего лица</div>
            <div className="gg-drawer__grid gg-drawer__grid--mid">
              <select
                value={charId}
                onChange={(e) => setCharId(e.target.value)}
                className="gg-select"
              >
                {mine.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="gg-select"
              >
                {Object.entries(POST_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <span className="gg-editor__elem">
                {ELEMENTS[element as keyof typeof ELEMENTS]?.label}
              </span>
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Соигроки</div>
            <input
              className="gg-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Искать персонажа…"
            />
          </div>
          <div className="gg-drawer__grid gg-drawer__grid--wide">
            {filtered.map((c) => {
              const on = partners.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  data-element={c.element}
                  data-on={on ? '' : undefined}
                  className="gg-chip gg-chip--char"
                  onClick={() =>
                    setPartners(on
                      ? partners.filter((x) => x !== c.id)
                      : [...partners, c.id])
                  }
                >
                  {c.name}
                </button>
              )
            })}
          </div>

          <label className="gg-field">
            <span>Ссылка на обложку</span>
            <input
              className="gg-input"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://…"
            />
            <small>Необязательно. Пока — прямая ссылка на картинку.</small>
          </label>

          <label className="gg-check">
            <input
              type="checkbox"
              checked={mature}
              onChange={(e) => setMature(e.target.checked)}
            />
            <span>Содержимое 18+ — размывать в ленте</span>
          </label>
        </div>
      )}

      {/* ============ атмосфера ============ */}
      {panel === 'atmo' && (
        <div className="gg-drawer">
          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Готовые</div>
            <div className="gg-drawer__grid">
              {READY_LIST.map((key) => {
                const r = READY[key]
                const on =
                  atmo.material === r.material && atmo.light === r.light && atmo.set === r.set
                return (
                  <button
                    key={key}
                    type="button"
                    className="gg-chip gg-chip--atmo"
                    data-on={on ? '' : undefined}
                    style={{ background: MATERIALS[r.material].bg }}
                    onClick={() =>
                      setAtmo({
                        ...atmo,
                        material: r.material,
                        light: r.light,
                        set: r.set,
                        indentAll: SETS[r.set].indent,
                      })
                    }
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Материал страницы</div>
            <div className="gg-drawer__grid">
              {MATERIAL_LIST.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip gg-chip--atmo"
                  data-on={atmo.material === key ? '' : undefined}
                  style={{ background: MATERIALS[key].bg }}
                  onClick={() => setAtmo({ ...atmo, material: key })}
                >
                  {MATERIALS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Свет</div>
            <div className="gg-drawer__grid">
              {LIGHT_LIST.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip"
                  data-on={atmo.light === key ? '' : undefined}
                  onClick={() => setAtmo({ ...atmo, light: key })}
                >
                  {LIGHTS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Набор</div>
            <div className="gg-drawer__grid">
              {SET_LIST.map((key: SetKey) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip"
                  data-on={atmo.set === key ? '' : undefined}
                  /* набор задаёт и красную строку — но её можно снять ниже */
                  onClick={() => setAtmo({ ...atmo, set: key, indentAll: SETS[key].indent })}
                >
                  {SETS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Своя страница</div>
            <div className="gg-drawer__grid gg-drawer__grid--mid">
              <input
                type="color"
                className="gg-color"
                value={atmo.bgColor ?? (MATERIALS[atmo.material].dark ? '#0b0b0d' : '#f5f0e6')}
                onChange={(e) => setAtmo({ ...atmo, bgColor: e.target.value })}
                title="Свой цвет страницы"
              />
              {atmo.bgColor && (
                <button
                  type="button"
                  className="gg-chip"
                  onClick={() => setAtmo({ ...atmo, bgColor: null })}
                >
                  Убрать цвет
                </button>
              )}

              <button
                type="button"
                className="gg-chip"
                disabled={bgBusy}
                onClick={() => bgInputRef.current?.click()}
              >
                {bgBusy ? 'Загружаю…' : atmo.bgImage ? 'Заменить картинку' : 'Картинка фоном'}
              </button>
              {atmo.bgImage && (
                <button
                  type="button"
                  className="gg-chip"
                  onClick={() => setAtmo({ ...atmo, bgImage: null })}
                >
                  Убрать картинку
                </button>
              )}
              <input
                ref={bgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
              />

              <small className="gg-hint">
                Что сильнее: картинка, потом свой цвет, потом материал. Цвет
                текста подбирается по яркости страницы сам — светлого по
                светлому не получится. Поверх картинки ложится вуаль, иначе
                по ней не прочесть.
              </small>
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Цвет акцента</div>
            <div className="gg-drawer__grid gg-drawer__grid--mid">
              <input
                type="color"
                className="gg-color"
                value={atmo.accent ?? ELEMENTS[element as keyof typeof ELEMENTS]?.accent ?? '#b8323d'}
                onChange={(e) => setAtmo({ ...atmo, accent: e.target.value })}
                title="Цвет буквицы, разделителей, плашек и имени"
              />
              <button
                type="button"
                className="gg-chip"
                onClick={() => setAtmo({ ...atmo, accent: null })}
              >
                {atmo.accent ? 'Вернуть цвет персонажа' : 'Цвет персонажа'}
              </button>
              <small className="gg-hint">
                Красит буквицу, разделители, плашки и имя. Пусто — берётся цвет персонажа.
              </small>
            </div>
          </div>

          <div className="gg-drawer__group">
            <div className="gg-drawer__label">Шрифт заголовков</div>
            <div className="gg-drawer__grid">
              <button
                type="button"
                className="gg-chip"
                data-on={!atmo.font ? '' : undefined}
                onClick={() => setAtmo({ ...atmo, font: null })}
              >
                Как у персонажа
              </button>
              {(Object.keys(THEME_FONTS) as ThemeFontKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className="gg-chip"
                  data-on={atmo.font === key ? '' : undefined}
                  style={{ fontFamily: THEME_FONTS[key].cssVar }}
                  onClick={() => setAtmo({ ...atmo, font: key })}
                >
                  {THEME_FONTS[key].label}
                </button>
              ))}
            </div>
          </div>

          <label className="gg-check">
            <input
              type="checkbox"
              checked={atmo.vignette}
              onChange={(e) => setAtmo({ ...atmo, vignette: e.target.checked })}
            />
            <span>Затемнить края — как свет лампы посреди комнаты</span>
          </label>

          <label className="gg-check">
            <input
              type="checkbox"
              checked={atmo.indentAll}
              onChange={(e) => setAtmo({ ...atmo, indentAll: e.target.checked })}
            />
            <span>Красная строка во всём посте — как в книге</span>
          </label>
        </div>
      )}

      {/* ============ холст ============ */}
      {/* атмосфера видна прямо во время письма, а не только у читателя */}
      <div
        className={`gg-canvas gg-atmo${atmo.indentAll ? ' gg-indent-all' : ''}`}
        data-vignette={atmo.vignette ? '' : undefined}
        style={atmosphereStyle(atmo) as React.CSSProperties}
      >
        <EditorContent editor={editor} />
      </div>

      {/* ============ подвал ============ */}
      {err && <div className="note note-warning mt-6">{err}</div>}

      <div className="gg-editor__foot">
        <button
          type="button"
          className="gg-btn gg-btn--ghost"
          disabled={busy}
          onClick={handleCancel}
        >
          Отменить
        </button>
        <button
          type="button"
          className="gg-btn"
          disabled={busy}
          onClick={() => submit('draft')}
        >
          {busy ? 'Сохраняю…' : 'В черновики'}
        </button>
        <button
          type="button"
          className="gg-btn gg-btn--main"
          disabled={busy}
          onClick={() => submit('published')}
        >
          {busy ? 'Сохраняю…' : 'Опубликовать'}
        </button>
        <span className="gg-editor__count">
          {wordCount} слов
          {/* ВРЕМЕННОЕ: видно, какой код реально приехал на сайт */}
          {build && <span className="faint"> · сборка {build}</span>}
        </span>
      </div>

    </div>
  )
}