"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"
import Link from 'next/link'
import toast from 'react-hot-toast'

type Order = {
  id: string
  user_id?: string
  client_name: string
  whatsapp: string
  amazon_url?: string
  product_name?: string
  items?: {url: string; price: number}[]
  total_price_usd: number
  exchange_rate: number | null
  status: string
  rejection_reason: string | null
  office: string
  office_map_url: string | null
  payment_receipt: string | null
  created_at: string
}

import { useEffect } from 'react'

export function AdminDashboard({ initialOrders, initialExchangeRate }: { initialOrders: Order[], initialExchangeRate: number }) {
  const [isMounted, setIsMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [exchangeRate, setExchangeRate] = useState<string>(initialExchangeRate.toString())
  const [isSavingRate, setIsSavingRate] = useState(false)

  // Approval State
  const [approveOrder, setApproveOrder] = useState<Order | null>(null)
  const [finalTotal, setFinalTotal] = useState<string>("")

  // General Status Update State
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [adminNote, setAdminNote] = useState<string>("")

  // Rejection State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>("")

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [costSort, setCostSort] = useState("none")
  const [dateFilter, setDateFilter] = useState("all")

  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)

    const channel = supabase.channel('public:orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          setOrders(prev => {
            // Check if it already exists to prevent duplicates
            if (prev.find(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new as Order;
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        } else if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old;
          setOrders(prev => prev.filter(o => o.id !== oldRecord.id));
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleSaveRate = async () => {
    setIsSavingRate(true)
    const newRate = parseFloat(exchangeRate)
    const { error } = await supabase
      .from('settings')
      .update({ exchange_rate: newRate, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      toast.error("Failed to update exchange rate.")
    } else {
      toast.success(`Exchange rate updated to ${newRate} Bs/USD`)
    }
    setIsSavingRate(false)
  }

  const handleStatusChange = async (orderId: string, newStatusUpdate: string, additionalPayload: any = {}) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    console.log(`Attempting to update order ${orderId} to status: ${newStatusUpdate}`, additionalPayload);

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatusUpdate, ...additionalPayload })
      .eq('id', orderId)
      .select()

    if (error) {
      toast.error(`Error updating order status: ${error.message}`)
      console.error('Supabase Update Error:', error)
    } else if (data && data.length > 0) {
      console.log('Update successful:', data[0]);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, ...additionalPayload } : o))

      // Trigger notifications for ALL status changes
      if (orderToUpdate && newStatusUpdate !== 'rejected') { // Rejections are handled separately

        // Check user's preferred language to send the notification in their language
        const { data: userData } = await supabase.from('users').select('preferred_language').eq('id', orderToUpdate.user_id).single();
        const lang = userData?.preferred_language === 'es' ? 'es' : 'en';

        let title = lang === 'es' ? "Actualización de Orden" : "Order Update";

        // Friendly mapping for common statuses
        const statusMap: Record<string, {en: string, es: string}> = {
          'awaiting_approval': {en: 'Awaiting Approval', es: 'Esperando Aprobación'},
          'pending_payment': {en: 'Pending Verification (Please Upload Payment)', es: 'Verificación Pendiente (Por favor sube tu pago)'},
          'processing': {en: 'Processing', es: 'Procesando'},
          'in_miami': {en: 'Received in Miami', es: 'Recibido en Miami'},
          'shipped_to_vzla': {en: 'In Transit to Venezuela', es: 'En Tránsito a Venezuela'},
          'ready_for_pickup': {en: 'Ready for Pickup', es: 'Listo para Retirar'}
        };

        const readableStatus = statusMap[newStatusUpdate] ? statusMap[newStatusUpdate][lang] : newStatusUpdate;
        let message = "";

        if (newStatusUpdate === 'pending_payment') {
          title = lang === 'es' ? "¡Orden Aprobada!" : "Order Approved!";
          message = lang === 'es'
            ? "Tu orden ha sido aprobada. Ahora puedes proceder con el pago."
            : "Your order has been approved. You can now proceed to payment.";
        } else {
          message = lang === 'es'
            ? `Tu orden fue actualizada a: ${readableStatus}`
            : `Your order status is now: ${readableStatus}`;
        }

        if (additionalPayload.admin_note) {
          title = lang === 'es' ? "Actualización de Orden" : "Order Update";
          message = lang === 'es'
            ? `Tu orden fue actualizada. Nota: ${additionalPayload.admin_note}`
            : `Your order was updated. Note: ${additionalPayload.admin_note}`;
        }

        await supabase.from('notifications').insert({
          user_id: orderToUpdate.user_id || data[0].user_id,
          order_id: orderId,
          title: title,
          message: message,
          type: newStatusUpdate === 'pending_payment' ? "success" : "info"
        });

        // --- SEND EMAIL NOTIFICATION HERE ---
        // Fire and forget email via API
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            userId: orderToUpdate.user_id || data[0].user_id,
            status: readableStatus,
            adminNote: additionalPayload.admin_note || "",
            lang: lang,
          })
        }).catch(err => console.error("Email API failed:", err));
      }
    } else {
      toast.error("Update command executed but no rows were returned. RLS policy might be blocking the update.")
      console.warn("No rows returned from update.", data);
    }
  }

  const confirmApproval = async () => {
    if (!approveOrder) return;

    const parsedTotal = parseFloat(finalTotal);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      toast.error("Please enter a valid final total.");
      return;
    }

    await handleStatusChange(approveOrder.id, 'pending_payment', {
      total_price_usd: parsedTotal,
      admin_note: adminNote || null
    });

    setApproveOrder(null);
    setFinalTotal("");
    setAdminNote("");
  }

  const confirmStatusUpdate = async () => {
    if (!updateOrder || !newStatus) return;

    await handleStatusChange(updateOrder.id, newStatus, {
      admin_note: adminNote || null
    });

    setUpdateOrder(null);
    setNewStatus("");
    setAdminNote("");
  }

  const confirmRejection = async () => {
    if (!rejectOrderId) return;
    const orderToUpdate = orders.find(o => o.id === rejectOrderId);

    await handleStatusChange(rejectOrderId, 'rejected', { rejection_reason: rejectReason });

    if (orderToUpdate && orderToUpdate.user_id) {
      // Fetch user's preferred language
      const { data: userData } = await supabase.from('users').select('preferred_language').eq('id', orderToUpdate.user_id).single();
      const lang = userData?.preferred_language === 'es' ? 'es' : 'en';

      const title = lang === 'es' ? "Orden Rechazada" : "Order Rejected";
      const message = lang === 'es'
        ? `Tu orden fue rechazada. Motivo: ${rejectReason}`
        : `Your order was rejected. Reason: ${rejectReason}`;

      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: orderToUpdate.user_id,
        order_id: rejectOrderId,
        title: title,
        message: message,
        type: "error"
      });
      if (notifError) {
        console.error("Notification failed", notifError);
        toast.error(`Notification could not be sent: ${notifError.message}`);
      }
    } else {
       console.warn("Could not send notification: user_id is missing from order data.");
    }

    setRejectOrderId(null);
    setRejectReason("");
  }

  const getWhatsAppLink = (order: Order) => {
    if (!order.whatsapp) return "#";
    const phone = order.whatsapp.replace(/\D/g, '')
    const pdfUrl = typeof window !== 'undefined' ? `${window.location.origin}/receipt/${order.id}` : ''
    const text = `Hola ${order.client_name || 'cliente'}! Te escribimos de *D-Fyo*. Recibimos tu orden por $${order.total_price_usd}. Puedes ver tu comprobante aquí: ${pdfUrl}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  // Real-time stats
  const pendingApprovals = orders.filter(o => o.status === 'awaiting_approval').length;
  const unverifiedPayments = orders.filter(o => o.payment_receipt !== null).length;

  // Compute Filtered & Sorted Orders
  let filteredOrders = orders.filter(o => {
    const matchesSearch = (o.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.client_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === "today") matchesDate = diffDays <= 1;
      if (dateFilter === "week") matchesDate = diffDays <= 7;
      if (dateFilter === "month") matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (costSort === 'high') {
    filteredOrders.sort((a, b) => b.total_price_usd - a.total_price_usd);
  } else if (costSort === 'low') {
    filteredOrders.sort((a, b) => a.total_price_usd - b.total_price_usd);
  } else {
    // Default chronological
    filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!isMounted) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-6">

      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-4 mt-2">
            <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-medium border border-amber-200">
              {pendingApprovals} Pending Approvals
            </span>
            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium border border-blue-200">
              {unverifiedPayments} Unverified Payments
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-3 rounded-md border shadow-none">
          <Label htmlFor="rate" className="whitespace-nowrap font-medium">Tasa del día (Bs/USD):</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            className="w-24 h-8"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
          />
          <Button size="sm" onClick={handleSaveRate} disabled={isSavingRate}>
            {isSavingRate ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-md border">
        <div className="space-y-1">
          <Label>Search Orders</Label>
          <Input
            placeholder="Search by ID or Client Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
              <SelectItem value="pending_payment">Pending Verification</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="in_miami">Received in Miami</SelectItem>
              <SelectItem value="shipped_to_vzla">Shipped to Vzla</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date Range</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past 7 Days</SelectItem>
              <SelectItem value="month">Past 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Sort by Cost</Label>
          <Select value={costSort} onValueChange={setCostSort}>
            <SelectTrigger>
              <SelectValue placeholder="Chronological (Default)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Chronological (Default)</SelectItem>
              <SelectItem value="high">Highest Cost First</SelectItem>
              <SelectItem value="low">Lowest Cost First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Total ($)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className={order.payment_receipt ? 'bg-blue-50/40' : ''}>
                <TableCell>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 font-mono">#{order.id.split('-')[0].toUpperCase()}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.client_name}</p>
                  {order.payment_receipt && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></span>
                      Payment Uploaded / Pago Enviado
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">${order.total_price_usd.toFixed(2)}</TableCell>
                <TableCell>
                  {order.status === 'awaiting_approval' ? (
                    <div className="flex space-x-2">
                      <Button size="sm" className="h-8" onClick={() => {
                        setApproveOrder(order);
                        setFinalTotal(order.total_price_usd.toString());
                        setAdminNote("");
                      }}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8" onClick={() => setRejectOrderId(order.id)}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-[160px] justify-between font-normal"
                      onClick={() => {
                        setUpdateOrder(order);
                        setNewStatus(order.status);
                        setAdminNote("");
                      }}
                    >
                      <span className="truncate">
                        {order.status === 'pending_payment' ? 'Pending Verification' :
                         order.status === 'processing' ? 'Processing' :
                         order.status === 'in_miami' ? 'Received in Miami' :
                         order.status === 'shipped_to_vzla' ? 'In Transit to VZLA' :
                         order.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                         order.status === 'rejected' ? 'Rejected' : order.status}
                      </span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819L7.43179 8.56819C7.60753 8.74392 7.89245 8.74392 8.06819 8.56819L10.5682 6.06819C10.7439 5.89245 10.7439 5.60753 10.5682 5.43179C10.3924 5.25605 10.1075 5.25605 9.93179 5.43179L7.75 7.61358L5.56819 5.43179C5.39245 5.25605 5.10753 5.25605 4.93179 5.43179Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {order.whatsapp ? (
                    <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-green-600 bg-background shadow-sm hover:bg-green-50 hover:text-green-700 h-8 px-3 text-green-600">
                      WhatsApp
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-400 h-8 px-3 cursor-not-allowed">
                      No WA
                    </span>
                  )}
                  <Link href={`/receipt/${order.id}`} target="_blank" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                    Ticket
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!approveOrder} onOpenChange={(open) => !open && setApproveOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Order & Finalize Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Final Total ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={finalTotal}
                onChange={(e) => setFinalTotal(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">Originally estimated at ${approveOrder?.total_price_usd.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>Admin Note (Optional, visible to client)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g., Adjusted total due to overweight items..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setApproveOrder(null)}>Cancel</Button>
              <Button onClick={confirmApproval}>Confirm Approval</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!updateOrder} onOpenChange={(open) => !open && setUpdateOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">Pending Verification</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="in_miami">Received in Miami</SelectItem>
                  <SelectItem value="shipped_to_vzla">In Transit to VZLA</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Note (Optional, visible to client)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g., Order packaged and left facility..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setUpdateOrder(null)}>Cancel</Button>
              <Button onClick={confirmStatusUpdate} disabled={!newStatus}>Update Status</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectOrderId} onOpenChange={(open) => !open && setRejectOrderId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Reason for rejection (Visible to client)</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Links are invalid, prohibited item..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRejectOrderId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmRejection} disabled={!rejectReason}>Confirm Rejection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Client Name</p>
                  <p className="text-md">{selectedOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">WhatsApp</p>
                  <p className="text-md">{selectedOrder.whatsapp}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Requested Items</p>
                <div className="space-y-2 bg-gray-50 p-3 rounded border">
                  {(() => {
                    let parsedItems = selectedOrder.items;
                    if (typeof parsedItems === 'string') {
                      try {
                        parsedItems = JSON.parse(parsedItems);
                      } catch (e) {
                        parsedItems = [];
                      }
                    }

                    if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                      return parsedItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-3 overflow-hidden pr-4">
                            {item?.image ? (
                              <img src={item.image} alt="Product" className="w-10 h-10 object-cover rounded bg-white border" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                            )}
                            <a
                              href={item?.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              title={item?.name || item?.url || "Link"}
                            >
                              {item?.name || `Item ${idx + 1}`}
                            </a>
                          </div>
                          <span className="font-semibold text-gray-700 whitespace-nowrap">${Number(item?.price || 0).toFixed(2)}</span>
                        </div>
                      ));
                    } else {
                      return (
                        <div className="flex justify-between items-center text-sm">
                          <a
                            href={selectedOrder.amazon_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-[80%]"
                          >
                            {selectedOrder.amazon_url || "Link missing"}
                          </a>
                          <span className="font-semibold text-gray-700">Legacy Item</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-gray-500">Destination Office</p>
                <p className="text-md font-medium">{selectedOrder.office}</p>
                {selectedOrder.office_map_url && (
                  <a
                    href={selectedOrder.office_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center mt-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-1 inline shrink-0" />
                    View on Google Maps
                  </a>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-gray-500 mb-2">Payment Receipt</p>
                {selectedOrder.payment_receipt ? (
                  <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center p-2">
                    <img
                      src={selectedOrder.payment_receipt}
                      alt="Receipt Preview"
                      className="max-w-full max-h-[300px] object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-400">No receipt uploaded.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
