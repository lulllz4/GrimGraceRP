/**
 * Анкета персонажа: девять пунктов в трёх частях.
 *
 * Один список на всё — по нему строится и форма правки, и страница
 * персонажа. Раньше поля были перечислены в двух местах, и они разъезжались:
 * в форме «Природа», на странице «Природа», а в базе species.
 *
 * Части разделяются орнаментом — так анкета читается как документ, а не как
 * простыня полей.
 */

export type SheetField = {
  /** колонка в таблице characters */
  key: string
  /** римский номер по шаблону */
  no: string
  label: string
  hint?: string
  /** short — строка, long — большой текст (его может быть очень много) */
  kind: 'short' | 'long'
  max: number
  /** необязательный пункт */
  optional?: boolean
}

export const SHEET: Array<{ part: number; fields: SheetField[] }> = [
  {
    part: 1,
    fields: [
      {
        key: 'full_name', no: 'I', label: 'Имя, фамилия', kind: 'short', max: 120,
        hint: 'Фамилия обязательна — можно выдуманную.',
      },
      {
        key: 'age_note', no: 'II', label: 'Возраст', kind: 'short', max: 60,
        hint: 'Можно «на вид двадцать».',
      },
      {
        key: 'species', no: 'III', label: 'Сущность', kind: 'short', max: 80,
        hint: 'Человек, вампир, полукровка…',
      },
      {
        key: 'status_note', no: 'IV', label: 'Статус', kind: 'short', max: 120,
        hint: 'Положение в обществе или при дворе.',
      },
    ],
  },
  {
    part: 2,
    fields: [
      { key: 'appearance',  no: 'V',   label: 'Внешность',   kind: 'long', max: 20000 },
      { key: 'personality', no: 'VI',  label: 'Характер',    kind: 'long', max: 20000 },
      { key: 'backstory',   no: 'VII', label: 'Предыстория', kind: 'long', max: 60000 },
    ],
  },
  {
    part: 3,
    fields: [
      {
        key: 'headcanon', no: 'VIII', label: 'Хэдканоны', kind: 'long', max: 20000,
        optional: true, hint: 'По желанию.',
      },
      {
        key: 'telegram', no: 'IX', label: 'Ваш юз в тг', kind: 'short', max: 64,
        hint: 'Чтобы Мастер и соигроки могли написать.',
      },
    ],
  },
]

export const SHEET_FIELDS: SheetField[] = SHEET.flatMap((p) => p.fields)

/** Орнамент между частями анкеты — тот же, что в шаблоне. */
export const SHEET_RULE = '᭺'
