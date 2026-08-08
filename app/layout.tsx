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

/* Тему ставим ДО первой отрисовки, иначе светлая страница успевает мигнуть
   тёмным. Скрипт крошечный и синхронный — именно поэтому он инлайном в head,
   а не отдельным файлом. suppressHydrationWarning нужен потому, что атрибут
   на <html> появляется до гидратации и React о нём не знает. */
const THEME_BOOT = `try{var t=localStorage.getItem('gg-theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${cormorant.variable} ${cormorantSC.variable} ${doulaise.variable} ${marck.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}