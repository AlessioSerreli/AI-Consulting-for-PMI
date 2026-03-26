import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // La pagina di login è sempre accessibile
  if (pathname === '/admin/login') return NextResponse.next()

  const adminSecret = process.env.ADMIN_SECRET
  const token = request.cookies.get('admin_token')?.value

  if (!adminSecret || token !== adminSecret) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
