import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get('studez_session')?.value

  // If user enters '/':
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = sessionToken ? '/dashboard' : '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If unauthenticated and trying to access protected routes, redirect to login
  if (!sessionToken && !pathname.startsWith('/login')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
