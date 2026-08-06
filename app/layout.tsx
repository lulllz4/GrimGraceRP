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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${cormorantSC.variable} ${doulaise.variable} ${marck.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}