import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CargoBox - Envíos de Amazon a Venezuela (San Antonio de los Altos)',
  description: 'Calcula tu envío desde USA a Venezuela de forma transparente y segura. Manejo mínimo de $5 por orden.',
}

import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="w-full border-t py-6 bg-white text-center">
          <Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">
            Terms & Conditions
          </Link>
        </footer>
      </body>
    </html>
  )
}
