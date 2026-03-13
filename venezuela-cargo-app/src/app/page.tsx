import { createClient } from '@/utils/supabase/server'
import { Calculator } from '@/components/Calculator'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="mb-12 text-center w-full max-w-xl">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
          CargoBox
        </h1>
        <h2 className="mt-2 text-xl md:text-2xl font-medium text-gray-600">
          Seamless shipping from the US to Venezuela.
        </h2>
        <p className="mt-4 text-gray-500">
          Calculate your exact delivery cost instantly. No hidden fees.
        </p>
      </header>

      <main className="w-full">
        <Calculator user={user} />
      </main>
    </div>
  )
}
