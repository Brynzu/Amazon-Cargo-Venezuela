import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Package, CheckCircle, Truck, Clock } from 'lucide-react'

// Helper to translate DB status to User-Friendly status with icons
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return { text: 'Pending Verification', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
    case 'processing':
      return { text: 'Processing', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
    case 'in_miami':
      return { text: 'Received in Miami', icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' }
    case 'shipped_to_vzla':
      return { text: 'In Transit to VZLA', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
    case 'ready_for_pickup':
      return { text: 'Ready for Pickup', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
    default:
      return { text: status, icon: Package, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
  }
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">My Orders</h1>
            <p className="text-gray-500 mt-1">Track and manage your shipments.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            New Order
          </Link>
        </div>

        {error && (
          <p className="text-red-500">Could not load orders: {error.message}</p>
        )}

        {orders?.length === 0 ? (
          <Card className="shadow-none border-dashed bg-transparent p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-700">No orders found</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Start an Order
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders?.map((order) => {
              const statusData = getStatusDisplay(order.status)
              const StatusIcon = statusData.icon

              return (
                <Card key={order.id} className="shadow-sm border-gray-200 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/50 flex flex-row items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-gray-400">ORDER #{order.id.split('-')[0].toUpperCase()}</p>
                      <CardTitle className="text-base font-bold mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </CardTitle>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusData.bg} ${statusData.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusData.text}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Destination</p>
                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">{order.office}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-lg leading-none mt-0.5">${order.total_price_usd.toFixed(2)}</p>
                        </div>
                        <Link href={`/receipt/${order.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1.5">
                          <FileText className="w-4 h-4" />
                          Receipt
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
