/**
 * Разбор и бросок кубиков: «2d6+3», «d20», «1d8-1», «3d4+2d6+1».
 *
 * Смысл броска в том, что число берётся не из головы автора. Поэтому здесь
 * не только сумма, но и расклад по костям — читатель видит, что именно
 * выпало, а не только итог.
 */

type Term =
  | { kind: 'dice'; count: number; sides: number; sign: 1 | -1 }
  | { kind: 'flat'; value: number; sign: 1 | -1 }

/** Разумные пределы: сотня кубиков по тысяче граней — уже не игра, а перебор. */
const MAX_COUNT = 100
const MAX_SIDES = 1000

export function parseFormula(input: string): Term[] | null {
  const src = input.replace(/\s+/g, '').toLowerCase()
  if (!src) return null

  const parts = src.match(/[+-]?[^+-]+/g)
  if (!parts) return null

  const terms: Term[] = []
  for (const raw of parts) {
    const sign: 1 | -1 = raw.startsWith('-') ? -1 : 1
    const body = raw.replace(/^[+-]/, '')

    const dice = /^(\d*)d(\d+)$/.exec(body)
    if (dice) {
      const count = dice[1] === '' ? 1 : Number(dice[1])
      const sides = Number(dice[2])
      if (count < 1 || count > MAX_COUNT || sides < 2 || sides > MAX_SIDES) return null
      terms.push({ kind: 'dice', count, sides, sign })
      continue
    }

    if (/^\d+$/.test(body)) {
      terms.push({ kind: 'flat', value: Number(body), sign })
      continue
    }

    return null
  }

  return terms.length ? terms : null
}

/** Честное число от 1 до sides — через криптографический источник, если он есть. */
function die(sides: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    /* отбрасываем хвост диапазона, иначе мелкие грани выпадали бы чаще */
    const limit = Math.floor(0xffffffff / sides) * sides
    let v = 0
    do {
      crypto.getRandomValues(buf)
      v = buf[0]
    } while (v >= limit)
    return (v % sides) + 1
  }
  return Math.floor(Math.random() * sides) + 1
}

export type RollResult = { total: number; breakdown: string }

/** Бросок по формуле. null — формула не разобралась. */
export function roll(formula: string): RollResult | null {
  const terms = parseFormula(formula)
  if (!terms) return null

  let total = 0
  const pieces: string[] = []

  for (const t of terms) {
    if (t.kind === 'flat') {
      total += t.sign * t.value
      pieces.push(`${t.sign < 0 ? '−' : '+'} ${t.value}`)
      continue
    }
    const values: number[] = []
    for (let i = 0; i < t.count; i++) values.push(die(t.sides))
    const sum = values.reduce((a, b) => a + b, 0)
    total += t.sign * sum
    pieces.push(`${t.sign < 0 ? '−' : '+'} ${values.join(' + ')}`)
  }

  /* у первого слагаемого знак «плюс» не нужен */
  const breakdown = pieces.join(' ').replace(/^\+\s*/, '')
  return { total, breakdown }
}
