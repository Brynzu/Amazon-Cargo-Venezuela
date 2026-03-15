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
          <svg className="w-12 h-12 md:w-16 md:h-16 mx-1 text-primary group-hover:scale-110 transition-transform mt-4 md:mt-6" viewBox="0 0 100 50" fill="none">
            <path d="M10,20 Q50,45 85,15" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M70,10 L88,12 L85,30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
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
