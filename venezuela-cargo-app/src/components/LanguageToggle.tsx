"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function LanguageToggle({ userId, defaultLang = 'en' }: { userId?: string, defaultLang?: 'en' | 'es' }) {
  const [lang, setLang] = useState<'en' | 'es'>(defaultLang)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Read from cookie first
    const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/)
    if (match) {
      setLang(match[2] as 'en' | 'es')
    }
  }, [])

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'es' : 'en'
    setLang(newLang)

    // Set cookie so Next.js server components can read it
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`

    // Save to DB if authenticated
    if (userId) {
      await supabase.from('users').update({ preferred_language: newLang }).eq('id', userId)
    }

    // Refresh the router to re-run server components and re-render client components
    router.refresh()
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      title="Toggle Language"
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold text-xs">{lang.toUpperCase()}</span>
    </button>
  )
}
