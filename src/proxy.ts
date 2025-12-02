import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Retrieve the value of a required environment variable.
 *
 * @param name - The environment variable name to read from process.env
 * @returns The environment variable value
 * @throws Error if the environment variable is not defined; message suggests adding it to `.env.local` or the deployment environment
 */
function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Please add it to your .env.local file or deployment environment.'
    )
  }
  return value
}

const SUPABASE_URL = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_ANON_KEY = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

/**
 * Proxy middleware that attaches a Supabase server client (using request cookies) and enforces authentication-based redirects.
 *
 * Creates a Supabase server client tied to the incoming request's cookies, checks the authenticated user, and:
 * - redirects unauthenticated requests to `/login` (except requests already targeting `/login`),
 * - redirects authenticated requests away from `/login` to `/`.
 *
 * @param request - The incoming NextRequest; used for cookie management and request path inspection.
 * @returns A NextResponse that either continues processing the original request or is a redirect to `/login` or `/` based on authentication state.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect all routes except /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in users away from login page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - favicon.ico (favicon file)
     * - Files with static extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|api|favicon\\.ico)(?!.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}