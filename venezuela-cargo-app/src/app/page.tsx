import { createClient } from '@/utils/supabase/server'
import { Calculator } from '@/components/Calculator'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="mb-12 text-center w-full max-w-xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Shop US, Ship to Venezuela
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Paste any Amazon link to instantly calculate the total cost delivered to you.
          Transparent pricing. Fast shipping.
        </p>
      </header>

      <main className="w-full">
        <Calculator user={user} />
      </main>
    </div>
  )
}
