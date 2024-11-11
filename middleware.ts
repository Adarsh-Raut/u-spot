import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  console.log(`Middleware: Path: ${pathname}, Token exists: ${!!token}`)

  // Allow requests to /api/auth/* to pass through
  if (pathname.startsWith('/api/auth')) {
    console.log('Middleware: Allowing /api/auth/* request to pass through')
    return NextResponse.next()
  }

  // Redirect to /spotify-input if logged in and trying to access home page
  if (pathname === '/' && token) {
    console.log('Middleware: Redirecting logged-in user from / to /spotify-input')
    return NextResponse.redirect(new URL('/spotify-input', request.url))
  }

  // Redirect to home page if not logged in and trying to access protected routes
  if (pathname.startsWith('/spotify-input') && !token) {
    console.log('Middleware: Redirecting non-logged-in user from /spotify-input to /')
    return NextResponse.redirect(new URL('/', request.url))
  }

  console.log('Middleware: Allowing request to pass through')
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}