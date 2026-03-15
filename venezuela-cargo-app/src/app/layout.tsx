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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="ws6t5DhLN0GNd09VNsZ-RssROSNvyr5HJ" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="w-full border-t py-6 bg-white text-center">
          <Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">
            Terms & Conditions / Términos y Condiciones
          </Link>
        </footer>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
