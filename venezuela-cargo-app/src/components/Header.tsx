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
        <Link href="/" className="flex items-center space-x-2 text-primary">
          <Box className="h-7 w-7 stroke-[1.5]" />
          <span className="font-bold text-xl tracking-tight">CargoBox</span>
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
