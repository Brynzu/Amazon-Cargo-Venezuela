import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PrintButton } from '@/components/PrintButton'

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4 print:hidden">
          <PrintButton />
        </div>

        <Card className="p-8 bg-white shadow-xl" id="receipt-card">
          <div className="text-center border-b pb-6 mb-6">
            <div className="w-12 h-12 bg-primary rounded flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-black text-2xl">C</span>
            </div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-wider">Cargo<span className="text-secondary">Box</span></h1>
            <p className="text-gray-500 text-sm tracking-widest uppercase mt-1">Order Ticket</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm">Order ID</span>
              <span className="font-mono text-sm">{order.id.split('-')[0].toUpperCase()}</span>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm">Date</span>
              <span className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm">Client Name</span>
              <span className="text-sm font-medium">{order.client_name}</span>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Destination</p>
            <p className="text-sm font-medium">{order.office}</p>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center bg-blue-50 text-blue-900 p-3 rounded font-bold">
              <span>Total (USD)</span>
              <span>${order.total_price_usd.toFixed(2)}</span>
            </div>
            {order.exchange_rate && (
              <div className="flex justify-between items-center text-gray-600 p-2 text-sm border border-gray-200 rounded">
                <span>Total (VES)</span>
                <span>{(order.total_price_usd * order.exchange_rate).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.</span>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
            <p>Thank you for choosing CargoBox.</p>
            <p>Keep this ticket for your records.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
