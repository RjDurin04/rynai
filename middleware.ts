import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/api/auth",
    "/api/uploadthing",
]

function isPublicPath(pathname: string): boolean {
    return publicPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    )
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    console.log(`[Middleware] Running for path: "${pathname}"`)

    // Allow public paths
    if (isPublicPath(pathname)) {
        return NextResponse.next()
    }

    // Check for Better-Auth session cookie
    const sessionToken =
        request.cookies.get("better-auth.session_token")?.value

    if (!sessionToken) {
        // API routes → 401
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Page routes → redirect to login
        console.log(`[Middleware] Missing session, redirecting to login from: "${pathname}"`)
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, public assets
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}
