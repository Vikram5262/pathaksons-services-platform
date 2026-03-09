import { NextRequest, NextResponse } from 'next/server';

// Protected admin routes
const ADMIN_PATHS = ['/admin'];
// Protected customer routes  
const CUSTOMER_PATHS = ['/customer'];
// Protected provider routes
const PROVIDER_PATHS = ['/provider'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if it's a protected route
    const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
    const isCustomerPath = CUSTOMER_PATHS.some(p => pathname.startsWith(p));
    const isProviderPath = PROVIDER_PATHS.some(p => pathname.startsWith(p));

    if (!isAdminPath && !isCustomerPath && !isProviderPath) {
        return NextResponse.next();
    }

    // Try to read session from cookie (set during login for middleware access)
    const sessionCookie = request.cookies.get('qavra_session');

    if (!sessionCookie?.value) {
        // No session — redirect to login
        const loginUrl = new URL('/login', request.url);
        if (isAdminPath) loginUrl.searchParams.set('error', 'unauthorized');
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.value));

        // Admin path — only admin role allowed
        if (isAdminPath && session.role !== 'admin') {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('error', 'forbidden');
            return NextResponse.redirect(loginUrl);
        }

        // Customer path — only customer role allowed
        if (isCustomerPath && session.role !== 'customer') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Provider path — only provider role allowed
        if (isProviderPath && session.role !== 'provider') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch {
        // Malformed session — clear and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('qavra_session');
        return response;
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/customer/:path*',
        '/provider/:path*',
    ],
};
