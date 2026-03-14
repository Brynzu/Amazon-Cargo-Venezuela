"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, LogOut, Box, Menu, PlusCircle, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export function UserMenu({ email, userId }: { email: string | undefined, userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNotifications, setHasNotifications] = useState(false)
  const [showOuterBadge, setShowOuterBadge] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Realtime Notifications Listener & Outside Click
  useEffect(() => {
    // 1. Fetch initial unread count
    async function fetchUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      const hasUnread = !!count && count > 0;
      setHasNotifications(hasUnread)
      setShowOuterBadge(hasUnread)
    }
    fetchUnread()

    // 2. Subscribe to realtime inserts/updates
    const channel = supabase.channel('public:notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Optimistically update based on the event
        if (payload.eventType === 'INSERT') {
          setHasNotifications(true)
          setShowOuterBadge(true)
        } else {
          fetchUnread() // Fallback to fetching for UPDATE/DELETE
        }
      })
      .subscribe()

    // 3. Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [supabase, userId, menuRef])

  return (
    <div className="relative" ref={menuRef}>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-gray-200"
          onClick={() => {
            setIsOpen(!isOpen)
            setShowOuterBadge(false) // Optimistically clear outer badge when menu is opened
          }}
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
        {showOuterBadge && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-[100] overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 leading-none">Account</p>
            <p className="text-xs text-gray-500 truncate mt-1">
              {email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>New Order</span>
            </Link>

            <Link
              href="/orders"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/profile"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>

            <Link
              href="/notifications"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors justify-between"
              onClick={() => {
                setIsOpen(false)
                setHasNotifications(false) // Optimistically clear inner badge when navigating
              }}
            >
              <div className="flex items-center">
                <Box className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </div>
              {hasNotifications && (
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>
          </div>

          <div className="border-t border-gray-100 p-1">
            <form action="/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="flex w-full items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
