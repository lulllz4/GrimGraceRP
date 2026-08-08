/**
 * ВРЕМЕННОЕ: отметка сборки для диагностики деплоя.
 *
 * Показывается в подвале редактора, чтобы не гадать, какой код реально
 * приехал на сайт: короткий хэш коммита должен совпадать с последним пушем.
 * Убрать вместе с `ggEditor`, когда разберёмся с картинками.
 */
export function buildStamp(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  return sha ? sha.slice(0, 7) : 'локально'
}
