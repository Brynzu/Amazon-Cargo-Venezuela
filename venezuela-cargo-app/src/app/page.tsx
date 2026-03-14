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
      <header className="mb-12 text-center w-full max-w-xl">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
          CargoBox
        </h1>
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
