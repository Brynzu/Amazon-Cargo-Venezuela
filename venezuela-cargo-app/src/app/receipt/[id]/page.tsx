import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PrintButton } from '@/components/PrintButton'
import { Box } from 'lucide-react'
import { translations } from '@/lib/translations'

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

  // Fetch user language or default to 'en'
  const { data: userData } = await supabase.from('users').select('preferred_language').eq('id', order.user_id).single()
  const lang = (userData?.preferred_language as 'en' | 'es') || 'en'
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8 print:p-0">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-8 print:hidden border-b pb-4">
          <PrintButton />
        </div>

        <div id="receipt-card" className="print:w-full">
          <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
            <div className="flex items-center text-primary group">
              <span className="font-black text-3xl tracking-tighter">D</span>
              <svg className="w-8 h-8 mx-0.5 text-[#00CED1] mt-2" viewBox="0 0 100 50" fill="none">
                <path d="M10,20 Q50,45 85,15" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <path d="M70,10 L88,12 L85,30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-black text-3xl tracking-tighter">Fyo</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{t.invoice_ticket}</p>
              <p className="text-2xl font-mono font-bold mt-1">#{order.id.split('-')[0].toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString(lang === 'es' ? 'es-VE' : 'en-US')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.billed_to}</p>
              <p className="text-lg font-medium">{order.client_name}</p>
              <p className="text-gray-600">{order.whatsapp}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.destination}</p>
              <p className="text-md font-medium">{order.office}</p>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">{t.items_included}</p>
            <div className="space-y-3">
              {(() => {
                let parsedItems = order.items;
                if (typeof parsedItems === 'string') {
                  try { parsedItems = JSON.parse(parsedItems); } catch(e) { parsedItems = []; }
                }

                if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                  return parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 overflow-hidden pr-4">
                        {item?.image && (
                          <img src={item.image} alt="Item" className="w-8 h-8 object-cover rounded bg-white border shrink-0 mt-0.5" />
                        )}
                        <span className="text-gray-700 line-clamp-3 font-medium break-words leading-tight">
                          {item?.name || item?.url || 'Item'}
                        </span>
                      </div>
                      <span className="font-bold whitespace-nowrap shrink-0">${Number(item?.price || 0).toFixed(2)}</span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 line-clamp-2 max-w-[80%] pr-4 break-words">{order.amazon_url || t.amazon_item}</span>
                      <span className="font-medium whitespace-nowrap shrink-0">${Number(order.amazon_price || order.total_price_usd || 0).toFixed(2)}</span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-6 mb-8 bg-gray-50/50 px-4 -mx-4 rounded-lg">
            <div className="flex justify-between items-center text-2xl font-black text-primary">
              <span>{t.total_usd}</span>
              <span>${order.total_price_usd.toFixed(2)}</span>
            </div>
            {order.exchange_rate && (
              <div className="flex justify-between items-center text-lg text-gray-500 mt-2">
                <span>{t.total_ves} ({t.rate}: {order.exchange_rate})</span>
                <span>{(order.total_price_usd * order.exchange_rate).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.</span>
              </div>
            )}
          </div>

          {order.payment_receipt && (
            <div className="mb-8 print:hidden">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">{t.payment_capture}</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center p-4 max-h-[400px]">
                <img
                  src={order.payment_receipt}
                  alt="Uploaded Payment Receipt"
                  className="max-w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-400 mt-16 pt-8 border-t border-gray-100">
            <p className="font-medium text-gray-900 mb-1">{t.thank_you}</p>
            <p>{t.keep_invoice}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
