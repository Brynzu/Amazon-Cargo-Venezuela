"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileText, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react'
import { translations } from '@/lib/translations'

const getStatusDisplay = (status: string, t: any) => {
  switch (status) {
    case 'awaiting_approval':
      return { text: t.status_awaiting_approval, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' }
    case 'rejected':
      return { text: t.status_rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
    case 'pending_payment':
      return { text: t.status_pending_payment, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
    case 'processing':
      return { text: t.status_processing, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
    case 'in_miami':
      return { text: t.status_in_miami, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' }
    case 'shipped_to_vzla':
      return { text: t.status_shipped_to_vzla, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
    case 'ready_for_pickup':
      return { text: t.status_ready_for_pickup, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
    default:
      return { text: status, icon: Package, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
  }
}

export function ClientOrderList({ initialOrders, user, lang = 'en' }: { initialOrders: any[], user: any, lang?: 'en' | 'es' }) {
  const t = translations[lang]
  const [orders, setOrders] = useState(initialOrders)
  const [payingOrder, setPayingOrder] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("Zelle")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('realtime_orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updatedOrder = payload.new;
        setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [supabase, user.id])

  const handlePaymentSubmit = async () => {
    if (!file || !payingOrder) {
      alert("Please upload a receipt.")
      return
    }

    setIsSubmitting(true)
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_receipts')
        .getPublicUrl(filePath);

      // Insert payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: payingOrder.id,
          method: paymentMethod,
          receipt_screenshot_url: publicUrl,
          amount_paid: payingOrder.total_price_usd,
        });

      if (paymentError) throw paymentError;

      // Securely update order's receipt_url via RPC
      const { error: rpcError } = await supabase.rpc('attach_payment_receipt', {
        p_order_id: payingOrder.id,
        p_receipt_url: publicUrl
      });

      if (rpcError) throw rpcError;

      alert("Payment submitted successfully!")

      // Update local state to reflect payment
      setOrders(orders.map(o => o.id === payingOrder.id ? { ...o, payment_receipt: publicUrl } : o))
      setPayingOrder(null)
      setFile(null)

    } catch (error) {
      console.error(error)
      alert("Failed to submit payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {orders.map((order) => {
          const statusData = getStatusDisplay(order.status, t)
          const StatusIcon = statusData.icon
          const needsPayment = order.status === 'pending_payment' && !order.payment_receipt

          return (
            <Card key={order.id} className="shadow-none border-gray-200 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/50 flex flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400">{t.order_hash}{order.id.split('-')[0].toUpperCase()}</p>
                  <CardTitle className="text-base font-bold mt-1">
                    {new Date(order.created_at).toLocaleDateString(lang === 'es' ? 'es-VE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                </div>
                <div className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${statusData.bg} ${statusData.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusData.text}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.destination}</p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">{order.office}</p>

                    {order.status === 'rejected' && order.rejection_reason && (
                      <div className="mt-3 bg-red-50 border border-red-100 text-red-800 text-sm p-3 rounded-md">
                        <strong>{t.reason_rejection}</strong> {order.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{t.total}</p>
                      <p className="font-bold text-lg leading-none mt-0.5">${order.total_price_usd.toFixed(2)}</p>
                    </div>

                    {needsPayment ? (
                      <Button size="sm" onClick={() => setPayingOrder(order)}>
                        {t.pay_now}
                      </Button>
                    ) : order.status !== 'awaiting_approval' && order.status !== 'rejected' ? (
                      <Link href={`/receipt/${order.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1.5">
                        <FileText className="w-4 h-4" />
                        {t.receipt}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!payingOrder} onOpenChange={(open) => !open && setPayingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {payingOrder && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
                <span>{t.amount_due}</span>
                <span>${payingOrder.total_price_usd.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <Label>{t.payment_method}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zelle">Zelle</SelectItem>
                    <SelectItem value="Binance">Binance</SelectItem>
                    <SelectItem value="PagoMovil">Pago Movil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'Zelle' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <strong>Send to:</strong> Brynzulino@gmail.com <br/>
                  <strong>Name:</strong> BRYAN KLUGE
                </div>
              )}

              {paymentMethod === 'PagoMovil' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <strong>Send to:</strong> <br/>
                  <strong>Cell:</strong> 04227167657 <br/>
                  <strong>Cedula:</strong> 30136044 <br/>
                  <strong>BANCO:</strong> Banco Venezuela

                  {payingOrder.exchange_rate && (
                    <p className="mt-2 pt-2 border-t border-blue-200">
                      <strong>Equivalente: </strong>
                      {(payingOrder.total_price_usd * payingOrder.exchange_rate).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>{t.upload_receipt}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button className="w-full mt-4" onClick={handlePaymentSubmit} disabled={isSubmitting || !file}>
                {isSubmitting ? t.submitting : t.confirm_payment}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
