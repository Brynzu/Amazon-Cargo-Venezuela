import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value, options }: any) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || user.email !== 'brynzulino@gmail.com') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Protect /receipt routes so users can only see them if logged in
  if (!user && request.nextUrl.pathname.startsWith('/receipt')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Optional: add a ?next=... parameter to redirect back after login
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
