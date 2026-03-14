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
  receipt_url: string | null
  created_at: string
}

export function AdminDashboard({ initialOrders, initialExchangeRate }: { initialOrders: Order[], initialExchangeRate: number }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [exchangeRate, setExchangeRate] = useState<string>(initialExchangeRate.toString())
  const [isSavingRate, setIsSavingRate] = useState(false)

  // Rejection State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>("")

  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [costSort, setCostSort] = useState("none")
  const [dateFilter, setDateFilter] = useState("all")

  const supabase = createClient()

  const handleSaveRate = async () => {
    setIsSavingRate(true)
    const newRate = parseFloat(exchangeRate)
    const { error } = await supabase
      .from('settings')
      .update({ exchange_rate: newRate, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      alert("Failed to update exchange rate.")
    } else {
      alert(`Exchange rate updated to ${newRate} Bs/USD`)
    }
    setIsSavingRate(false)
  }

  const handleStatusChange = async (orderId: string, newStatus: string, additionalPayload: any = {}) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    console.log(`Attempting to update order ${orderId} to status: ${newStatus}`, additionalPayload);

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, ...additionalPayload })
      .eq('id', orderId)
      .select()

    if (error) {
      alert(`Error updating order status: ${error.message}`)
      console.error('Supabase Update Error:', error)
    } else if (data && data.length > 0) {
      console.log('Update successful:', data[0]);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, ...additionalPayload } : o))

      // Trigger notifications for crucial status changes
      if (newStatus === 'pending_payment' && orderToUpdate) {
        await supabase.from('notifications').insert({
          user_id: orderToUpdate.user_id || data[0].user_id,
          order_id: orderId,
          title: "Order Approved!",
          message: "Your order has been approved. You can now proceed to payment.",
          type: "success"
        });
      }
    } else {
      alert("Update command executed but no rows were returned. RLS policy might be blocking the update.")
      console.warn("No rows returned from update.", data);
    }
  }

  const confirmRejection = async () => {
    if (!rejectOrderId) return;
    const orderToUpdate = orders.find(o => o.id === rejectOrderId);

    await handleStatusChange(rejectOrderId, 'rejected', { rejection_reason: rejectReason });

    if (orderToUpdate && orderToUpdate.user_id) {
      // Look up user_id either from local state or trust it was caught in handleStatusChange.
      // Doing it explicitly here to guarantee the message is tailored.
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: orderToUpdate.user_id, // ensure user_id exists on order object
        order_id: rejectOrderId,
        title: "Order Rejected",
        message: `Your order was rejected. Reason: ${rejectReason}`,
        type: "error"
      });
      if (notifError) {
        console.error("Notification failed", notifError);
        alert(`Notification could not be sent: ${notifError.message}`);
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
    const text = `Hola ${order.client_name || 'cliente'}! Te escribimos de *CargoBox*. Recibimos tu orden por $${order.total_price_usd}. Puedes ver tu comprobante aquí: ${pdfUrl}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  // Real-time stats
  const pendingApprovals = orders.filter(o => o.status === 'awaiting_approval').length;
  const unverifiedPayments = orders.filter(o => o.status === 'pending_payment' && o.receipt_url).length;

  // Compute Filtered & Sorted Orders
  let filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.client_name.toLowerCase().includes(searchQuery.toLowerCase());
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
              <TableRow key={order.id} className={order.status === 'pending_payment' && order.receipt_url ? 'bg-blue-50/40' : ''}>
                <TableCell>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 font-mono">#{order.id.split('-')[0].toUpperCase()}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.client_name}</p>
                  {order.status === 'pending_payment' && order.receipt_url && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></span>
                      Payment Uploaded
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">${order.total_price_usd.toFixed(2)}</TableCell>
                <TableCell>
                  {order.status === 'awaiting_approval' ? (
                    <div className="flex space-x-2">
                      <Button size="sm" className="h-8" onClick={() => handleStatusChange(order.id, 'pending_payment')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8" onClick={() => setRejectOrderId(order.id)}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="pending_payment">Pending Verification</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="in_miami">Received in Miami</SelectItem>
                        <SelectItem value="shipped_to_vzla">In Transit to VZLA</SelectItem>
                        <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                      </SelectContent>
                    </Select>
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
                          <a
                            href={item?.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-[80%]"
                            title={item?.url || "Link"}
                          >
                            Item {idx + 1}
                          </a>
                          <span className="font-semibold text-gray-700">${Number(item?.price || 0).toFixed(2)}</span>
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
                {selectedOrder.receipt_url ? (
                  <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center p-2">
                    <img
                      src={selectedOrder.receipt_url}
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
