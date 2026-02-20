import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout'];
const ADMIN_PATHS = ['/admin', '/api/admin'];

// Helper to check if user is admin (first user is admin)
async function isAdminUser(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.userId === 1;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth-token')?.value;
    
    // Add debug logging for production
    if (process.env.NODE_ENV === 'production') {
        console.log('Middleware - Path:', pathname);
        console.log('Middleware - Token exists:', !!token);
    }

    // Check admin paths
    if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
        if (!token) {
            return pathname.startsWith('/api/')
                ? NextResponse.json({ error: 'Authentication required' }, { status: 401 })
                : NextResponse.redirect(new URL('/login', request.url));
        }

        const isAdmin = await isAdminUser(token);
        if (!isAdmin) {
            return pathname.startsWith('/api/')
                ? NextResponse.json({ error: 'Admin access required' }, { status: 403 })
                : NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    }

    // Check API routes
    if (pathname.startsWith('/api/')) {
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        try {
            await jwtVerify(token, JWT_SECRET);
            return NextResponse.next();
        } catch {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    }

    // Check page routes
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
