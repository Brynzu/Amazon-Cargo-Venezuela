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
import { ExternalLink } from "lucide-react"

type Order = {
  id: string
  client_name: string
  whatsapp: string
  amazon_url: string
  product_name: string
  total_price_usd: number
  status: string
  office: string
  office_map_url: string | null
  receipt_url: string | null
  created_at: string
}

export function AdminDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const supabase = createClient()

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert("Error updating order status.")
      console.error(error)
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Total ($)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{order.client_name}</TableCell>
                <TableCell>${order.total_price_usd.toFixed(2)}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(val) => handleStatusChange(order.id, val)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">Pending Payment</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="in_miami">In Miami</SelectItem>
                      <SelectItem value="shipped_to_vzla">Shipped to Vzla</SelectItem>
                      <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                    View Details
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
                <p className="text-sm font-semibold text-gray-500">Product URL</p>
                <a
                  href={selectedOrder.amazon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center mt-1 break-all"
                >
                  <ExternalLink className="h-4 w-4 mr-1 inline shrink-0" />
                  View Item on Amazon
                </a>
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
