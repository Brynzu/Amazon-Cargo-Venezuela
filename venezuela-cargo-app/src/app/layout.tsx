import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'D-Fyo - Tu Concierge de Compras en USA',
  description: 'Servicio de courier premium y concierge de compras desde Estados Unidos a Venezuela. Obtén cotizaciones exactas y en tiempo real para tus productos de Amazon y más, sin comisiones ocultas.',
}

import Link from 'next/link'
import { SupportModal } from '@/components/SupportModal'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="llrOSRzO12V5FSF65-11btmB0mS43LtgfmI5-3E0fKk" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="w-full border-t py-6 bg-white text-center flex flex-col items-center justify-center space-y-4 sm:space-y-0 sm:flex-row sm:space-x-4">
          <Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">
            Terms & Conditions / Términos y Condiciones
          </Link>
          <span className="hidden sm:inline text-gray-300">|</span>
          <SupportModal lang="en" />
        </footer>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
