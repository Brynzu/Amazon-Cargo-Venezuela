"use client"

import Link from 'next/link'
import { User, LogOut, Box, Menu, PlusCircle, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu({ email }: { email: string | undefined }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-gray-200">
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/" className="flex w-full items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Order</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/orders" className="flex w-full items-center">
            <ListOrdered className="mr-2 h-4 w-4" />
            <span>My Orders</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="#" className="flex w-full items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/orders" className="flex w-full items-center">
            <Box className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer text-destructive focus:text-destructive">
          <form action="/auth/signout" method="post" className="w-full">
            <button type="submit" className="flex w-full items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
