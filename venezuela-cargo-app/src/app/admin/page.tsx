import { createClient } from '@/utils/supabase/server'
import { AdminDashboard } from '@/components/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  // Middleware already guarantees the user is admin. Fetching all orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-destructive font-bold text-2xl">Error loading orders</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard initialOrders={orders || []} />
    </div>
  )
}
