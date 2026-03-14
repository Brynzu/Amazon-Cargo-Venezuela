import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PrintButton } from '@/components/PrintButton'
import { Box } from 'lucide-react'

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
    <div className="min-h-screen bg-white flex flex-col items-center p-8 print:p-0">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-8 print:hidden border-b pb-4">
          <PrintButton />
        </div>

        <div id="receipt-card" className="print:w-full">
          <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
            <div className="flex items-center space-x-3 text-primary">
              <Box className="h-10 w-10 stroke-[1.5]" />
              <h1 className="text-3xl font-black tracking-tight">CargoBox</h1>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Invoice / Ticket</p>
              <p className="text-2xl font-mono font-bold mt-1">#{order.id.split('-')[0].toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
              <p className="text-lg font-medium">{order.client_name}</p>
              <p className="text-gray-600">{order.whatsapp}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Destination</p>
              <p className="text-md font-medium">{order.office}</p>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Items Included</p>
            <div className="space-y-3">
              {(() => {
                let parsedItems = order.items;
                if (typeof parsedItems === 'string') {
                  try { parsedItems = JSON.parse(parsedItems); } catch(e) { parsedItems = []; }
                }

                if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                  return parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[80%] pr-4">{item?.url || 'Item'}</span>
                      <span className="font-medium whitespace-nowrap">${Number(item?.price || 0).toFixed(2)}</span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[80%] pr-4">{order.amazon_url || 'Amazon Item'}</span>
                      <span className="font-medium whitespace-nowrap">${Number(order.amazon_price || order.total_price_usd || 0).toFixed(2)}</span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-6 mb-8 bg-gray-50/50 px-4 -mx-4 rounded-lg">
            <div className="flex justify-between items-center text-2xl font-black text-primary">
              <span>Total USD</span>
              <span>${order.total_price_usd.toFixed(2)}</span>
            </div>
            {order.exchange_rate && (
              <div className="flex justify-between items-center text-lg text-gray-500 mt-2">
                <span>Total VES (Rate: {order.exchange_rate})</span>
                <span>{(order.total_price_usd * order.exchange_rate).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.</span>
              </div>
            )}
          </div>

          {order.payment_receipt && (
            <div className="mb-8 print:hidden">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Payment Capture</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center p-4">
                <img
                  src={order.payment_receipt}
                  alt="Uploaded Payment Receipt"
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-400 mt-16 pt-8 border-t border-gray-100">
            <p className="font-medium text-gray-900 mb-1">Thank you for shipping with CargoBox.</p>
            <p>Please keep this invoice for your records.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
