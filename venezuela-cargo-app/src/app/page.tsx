import { createClient } from '@/utils/supabase/server'
import { Calculator } from '@/components/Calculator'
import { cookies } from 'next/headers'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'es' || 'en'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-12">
      <header className="mb-12 text-center w-full max-w-xl flex flex-col items-center">
        <div className="flex items-center text-primary group mb-2">
          <span className="font-black text-5xl md:text-6xl tracking-tighter">D</span>
          <svg className="w-12 h-12 md:w-14 md:h-14 mx-1 text-orange-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14c3.5 3 9.5 3 13 0" />
            <path d="M17 14l3-1.5-1.5-3" />
          </svg>
          <span className="font-black text-5xl md:text-6xl tracking-tighter">Fyo</span>
        </div>
        <h2 className="mt-2 text-xl md:text-2xl font-medium text-gray-600">
          {locale === 'en' ? 'Seamless shipping from the US to Venezuela.' : 'Envíos rápidos desde USA a Venezuela.'}
        </h2>
        <p className="mt-4 text-gray-500">
          {locale === 'en' ? 'Calculate your exact delivery cost instantly. No hidden fees.' : 'Calcula el costo exacto al instante. Sin comisiones ocultas.'}
        </p>
      </header>

      <main className="w-full">
        <Calculator user={user} defaultLang={locale} />
      </main>
    </div>
  )
}
