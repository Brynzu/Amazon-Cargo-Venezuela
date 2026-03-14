"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, XCircle, Info } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: any;

    async function loadAndClearNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setNotifications(data)

          // Automatically mark all as read upon viewing the page
          const hasUnread = data.some(n => !n.read)
          if (hasUnread) {
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('user_id', user.id)
              .eq('read', false)

            // Give the user a brief moment to see what was "new" before graying them out
            // Reduce timeout for snappier UI response
            setTimeout(() => {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }, 1000)
          }
        }

        // Subscribe to real-time inserts
        channel = supabase.channel(`public:notifications:page`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            const newNotif = payload.new;
            // Prepend the new notification. It arrives as unread.
            setNotifications(prev => {
              if (prev.find(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });

            // Optimistically mark it as read shortly after receiving it while on this page
            supabase.from('notifications').update({ read: true }).eq('id', newNotif.id).then(() => {
              setTimeout(() => {
                setNotifications(prev => prev.map(n => n.id === newNotif.id ? { ...n, read: true } : n));
              }, 2000);
            });
          })
          .subscribe()
      }
      setLoading(false)
    }

    loadAndClearNotifications()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary">Notifications</h1>
              <p className="text-gray-500 mt-1">Updates on your orders and payments.</p>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <Card className="shadow-none border-dashed bg-transparent p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-700">You're all caught up!</h2>
            <p className="text-gray-500">No new notifications right now.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border flex gap-4 ${notif.read ? 'bg-white border-gray-200' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>

                  {notif.order_id && (
                    <div className="mt-3">
                      <Link href="/orders" className="text-sm text-primary font-medium hover:underline">
                        View Order Details →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
