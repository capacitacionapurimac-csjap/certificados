// middleware.ts (en la raíz del proyecto)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Si está intentando acceder al dashboard sin token
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si está en login y tiene token, redirigir al dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}