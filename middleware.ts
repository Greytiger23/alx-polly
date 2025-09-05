/**
 * Next.js middleware for handling authentication with Supabase.
 * 
 * This middleware runs on every request and ensures that:
 * 1. User sessions are properly maintained across requests
 * 2. Unauthenticated users are redirected to login page
 * 3. Authentication cookies are properly managed
 * 
 * The middleware creates a Supabase server client that can read and write
 * cookies, allowing it to maintain user sessions server-side.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware function that handles authentication for protected routes.
 * 
 * This function delegates to the updateSession utility which:
 * - Creates a Supabase server client with cookie management
 * - Checks if the user is authenticated
 * - Redirects unauthenticated users to login page (except for auth routes)
 * - Maintains session cookies across requests
 * 
 * @param request - The incoming Next.js request object
 * @returns NextResponse object with proper cookie handling
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Configuration object that defines which routes the middleware should run on.
 * 
 * The matcher pattern excludes:
 * - Static files (_next/static)
 * - Image optimization files (_next/image)
 * - Favicon and other image assets
 * - Login and register pages (to avoid redirect loops)
 * 
 * This ensures the middleware only runs on actual page routes that need
 * authentication checking, improving performance.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}