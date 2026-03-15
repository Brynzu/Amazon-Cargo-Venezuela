import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Box } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { LanguageToggle } from './LanguageToggle'
import { cookies } from 'next/headers'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'es' || 'en'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center text-primary group">
          <span className="font-black text-2xl tracking-tighter">D</span>
          <svg className="w-6 h-6 mx-0.5 text-orange-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14c3.5 3 9.5 3 13 0" />
            <path d="M17 14l3-1.5-1.5-3" />
          </svg>
          <span className="font-black text-2xl tracking-tighter">Fyo</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageToggle userId={user?.id} defaultLang={locale} />
          {user ? (
            <UserMenu email={user.email} userId={user.id} defaultLang={locale} />
          ) : (
            <Link href="/login">
              <Button variant="default">Log In / Sign Up</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
