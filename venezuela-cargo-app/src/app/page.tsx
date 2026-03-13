import { createClient } from '@/utils/supabase/server'
import { Calculator } from '@/components/Calculator'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="mb-12 text-center w-full max-w-xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          Cargo<span className="text-secondary">Box</span>
        </h1>
        <h2 className="mt-2 text-2xl font-bold text-gray-800">
          Shop US, Ship to Venezuela
        </h2>
        <p className="mt-4 text-lg text-gray-600">
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
