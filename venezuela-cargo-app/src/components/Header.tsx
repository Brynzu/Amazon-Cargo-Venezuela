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
          <svg className="w-6 h-6 mx-0.5 text-orange-500 group-hover:scale-110 transition-transform mt-2" viewBox="0 0 100 50" fill="none">
            <path d="M10,20 Q50,45 85,15" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M70,10 L88,12 L85,30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
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
