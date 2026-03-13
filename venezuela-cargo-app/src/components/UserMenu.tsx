"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, LogOut, Box, Menu, PlusCircle, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserMenu({ email }: { email: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuRef])

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5 text-primary" />
      </Button>

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
              href="#"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>

            <Link
              href="/orders"
              className="flex w-full items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Box className="mr-2 h-4 w-4" />
              <span>Notifications</span>
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
