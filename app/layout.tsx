import type { Metadata } from 'next'
import { Cormorant_Garamond, Cormorant_SC, Monsieur_La_Doulaise, Marck_Script } from 'next/font/google'
import Header from '@/components/Header'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
})

const cormorantSC = Cormorant_SC({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant-sc',
})

const doulaise = Monsieur_La_Doulaise({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-doulaise',
})

const marck = Marck_Script({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-marck',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Grim Grace',
  description: 'Лондон, XIX век. Хроники ночи.',
}

/**
 * Крошечный синхронный скрипт, который выполняется раньше всего остального —
 * до React, до стилей, до любой разметки. Делает три вещи.
 *
 * 1. Ставит тему, иначе светлая страница успевает мигнуть тёмным.
 *
 * 2. Аварийный сброс по ?reset в адресе. Нужен потому, что испорченное
 *    местное хранилище способно убить вкладку ДО того, как отрисуется хоть
 *    одна кнопка, — и тогда очистить его изнутри страницы уже нечем.
 *
 * 3. Выбрасывает раздувшиеся черновики. Редактор при открытии разбирает
 *    черновик целиком; если там оказалась огромная строка, разбор кладёт
 *    вкладку, браузер её поднимает — и так по кругу. Проверка длины строки
 *    ничего не разбирает и потому безопасна при любом размере.
 *
 * suppressHydrationWarning на <html> — потому что атрибут темы появляется
 * до гидратации и React о нём не знает.
 */
const BOOT = `try{
var t=localStorage.getItem('gg-theme');if(t==='light')document.documentElement.dataset.theme='light';
var reset=location.search.indexOf('reset')>-1,i,k,v;
for(i=localStorage.length-1;i>=0;i--){k=localStorage.key(i);
if(!k||k.indexOf('gg-')!==0||k==='gg-theme'||k==='gg-trace')continue;
if(reset){localStorage.removeItem(k);continue}
v=localStorage.getItem(k);if(v&&v.length>2000000)localStorage.removeItem(k)}
}catch(e){}`.replace(/\n/g, '')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${cormorant.variable} ${cormorantSC.variable} ${doulaise.variable} ${marck.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}