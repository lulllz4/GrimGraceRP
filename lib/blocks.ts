/** Все плашки, которые игрок может вставить в пост. */

export type BlockKey =
  | 'letter' | 'scroll' | 'note' | 'telegram' | 'newspaper'
  | 'diary' | 'dossier' | 'invitation' | 'poster' | 'obituary'
  | 'epigraph' | 'chronicle' | 'dialogue' | 'appearance'
  | 'system' | 'ooc' | 'spoiler'

export type BlockDef = {
  label: string
  icon: string
  hint: string
  title: false | string   // false = у плашки нет заголовка
  meta: false | string    // false = нет подписи
  body: string            // подсказка внутри
}

export const BLOCKS: Record<BlockKey, BlockDef> = {
  /* ---------- документы ---------- */
  letter: {
    label: 'Письмо', icon: '✉',
    hint: 'Личная корреспонденция',
    title: 'Кому', meta: 'Подпись и дата',
    body: 'Милостивая государыня…',
  },
  scroll: {
    label: 'Свиток', icon: '📜',
    hint: 'Старинный документ, указ, пророчество',
    title: 'Заголовок', meta: false,
    body: 'Да будет ведомо всякому…',
  },
  note: {
    label: 'Записка', icon: '🗒',
    hint: 'Пара строк наспех',
    title: false, meta: false,
    body: 'Приходи в полночь. Одна.',
  },
  telegram: {
    label: 'Телеграмма', icon: '⚡',
    hint: 'Срочно, обрывисто, заглавными',
    title: 'Адресат', meta: 'Откуда, время',
    body: 'ВЫЕЗЖАЮ НЕМЕДЛЕННО ТЧК',
  },
  newspaper: {
    label: 'Газета', icon: '📰',
    hint: 'Вырезка из утреннего выпуска',
    title: 'Заголовок статьи', meta: 'Издание, число',
    body: 'Вчера, около одиннадцати вечера…',
  },
  diary: {
    label: 'Дневник', icon: '📓',
    hint: 'Запись от первого лица',
    title: false, meta: 'Дата записи',
    body: 'Не могу уснуть третью ночь…',
  },
  dossier: {
    label: 'Досье', icon: '🗂',
    hint: 'Сухая сводка, протокол, справка',
    title: 'Предмет дела', meta: 'Номер, ведомство',
    body: 'Установлено следующее.',
  },
  invitation: {
    label: 'Приглашение', icon: '🎟',
    hint: 'Бал, приём, званый ужин',
    title: 'Повод', meta: 'Место и час',
    body: 'Имеем честь просить вас…',
  },
  poster: {
    label: 'Афиша', icon: '🎭',
    hint: 'Объявление на столбе',
    title: 'Крупно', meta: 'Мелким шрифтом',
    body: 'Единственное представление!',
  },
  obituary: {
    label: 'Некролог', icon: '✝',
    hint: 'Скорбное извещение',
    title: 'Имя усопшего', meta: 'Годы жизни',
    body: 'Скончался тихо, в кругу семьи.',
  },

  /* ---------- сцена ---------- */
  epigraph: {
    label: 'Эпиграф', icon: '❦',
    hint: 'Цитата перед сценой',
    title: false, meta: 'Кто сказал',
    body: 'Кто сражается с чудовищами…',
  },
  chronicle: {
    label: 'Хроника', icon: '⏳',
    hint: 'Череда событий по времени',
    title: 'Заголовок', meta: false,
    body: 'Девять вечера — экипаж у ворот.',
  },
  dialogue: {
    label: 'Диалог', icon: '💬',
    hint: 'Обмен репликами вне текста',
    title: false, meta: false,
    body: '— И что вы намерены делать?',
  },
  appearance: {
    label: 'Внешность', icon: '👁',
    hint: 'Описание облика отдельным блоком',
    title: 'Кто', meta: false,
    body: 'Высок, сутул, в перчатках даже в помещении.',
  },

  /* ---------- механика ---------- */
  system: {
    label: 'Системное', icon: '⚙',
    hint: 'Голос Мастера, правило, уточнение',
    title: false, meta: false,
    body: 'Сцена закрыта. Переход к утру.',
  },
  ooc: {
    label: 'Вне игры', icon: '🎲',
    hint: 'Реплика игрока, не персонажа',
    title: false, meta: false,
    body: 'Извините за задержку, была неделя ада.',
  },
  spoiler: {
    label: 'Спойлер', icon: '🔒',
    hint: 'Скрыто до наведения мыши',
    title: 'Что внутри', meta: false,
    body: 'Он всё-таки её узнал.',
  },
}

export const BLOCK_GROUPS: Array<{ label: string; items: BlockKey[] }> = [
  { label: 'Документы', items: ['letter', 'scroll', 'note', 'telegram', 'newspaper', 'diary', 'dossier', 'invitation', 'poster', 'obituary'] },
  { label: 'Сцена',     items: ['epigraph', 'chronicle', 'dialogue', 'appearance'] },
  { label: 'Механика',  items: ['system', 'ooc', 'spoiler'] },
]

export const BLOCK_KEYS = Object.keys(BLOCKS) as BlockKey[]

/** Разделители сцен: символ в разрыве полосы. */
export const DIVIDERS: Record<string, string> = {
  fleuron: '❦',
  star:    '✦',
  cross:   '✝',
  diamond: '◈',
  line:    '—',
  bat:     '🦇',
  rose:    '❧',
}

/** Виды разделителя: чистая полоса, полоса с символом, полоса с орнаментом. */
export const DIVIDER_KINDS = {
  line:     { label: 'Полоса',   icon: '─────' },
  symbol:   { label: 'Символ',   icon: '❦' },
  ornament: { label: 'Орнамент', icon: '◈ ◈ ◈' },
} as const

export type DividerVariant = keyof typeof DIVIDER_KINDS

/** Глифы орнамента — рисуются в разрыве полосы. */
export const ORNAMENT = '◈ ◈ ◈'

/** Виды постов. */
export const POST_KINDS: Record<string, string> = {
  solo:      'Саморол',
  roleplay:  'Отыгрыш с соролом',
}