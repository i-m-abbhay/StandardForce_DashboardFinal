import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const token = request.cookies.get('token')?.value || ''

    const isPublicPath = path === '/' || path === '/signup'

    if(isPublicPath && token)
    return NextResponse.redirect(new URL('/dashboard', request.url))
    console.log("middleware called")
    if(!isPublicPath && !token)
    return NextResponse.redirect(new URL('/', request.url))
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/signup',
    '/dashboard'
  ]
}