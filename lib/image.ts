'use client'

/**
 * Уменьшение картинки прямо в браузере, до отправки на сервер.
 *
 * Снимок с телефона — это 4000×3000: около 12 мегапикселей, то есть ~48 МБ
 * распакованного растра в памяти. Показываем мы его максимум на 700 точек
 * ширины, а декодировать телефон обязан целиком — отсюда и тормоза в ленте
 * и в посте. Ужимаем до разумной стороны и переводим в webp: файл падает
 * обычно в 5–15 раз, на глаз разницы нет.
 *
 * Если что-то пошло не так — молча отдаём оригинал: загрузка важнее сжатия.
 */

const MAX_SIDE = 1600
const QUALITY = 0.82

/** Мельче этого перекодировать незачем. */
const SMALL_ENOUGH = 600 * 1024

export async function shrinkImage(
  file: File,
  maxSide: number = MAX_SIDE,
  quality: number = QUALITY,
): Promise<File> {
  /* гифки не трогаем — канвас оставит от анимации один кадр */
  if (file.type === 'image/gif') return file

  try {
    /* imageOrientation обязателен: иначе фотографии с телефона,
       у которых поворот записан в EXIF, лягут набок */
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SMALL_ENOUGH) {
      bitmap.close()
      return file
    }

    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    )

    /* бывает, что webp вышел тяжелее оригинала — тогда он не нужен */
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
      type: 'image/webp',
    })
  } catch {
    return file
  }
}
