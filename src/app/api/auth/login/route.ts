import { NextRequest, NextResponse } from 'next/server';
import { initUsersDatabase, usersDb } from '@/lib/usersDatabase';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const COOKIE_NAME = 'auth-token';

export async function POST(request: NextRequest) {
    try {
        await initUsersDatabase();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await usersDb.findByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValid = await usersDb.validatePassword(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check user status
        if (user.status === 'pending') {
            return NextResponse.json(
                { error: 'Tu cuenta está pendiente de aprobación. Por favor, espera a que un administrador la active.' },
                { status: 403 }
            );
        }

        if (user.status === 'rejected') {
            return NextResponse.json(
                { error: 'Tu solicitud de registro ha sido rechazada.' },
                { status: 403 }
            );
        }

        const token = await new SignJWT({
            userId: user.id,
            email: user.email,
            name: user.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

        response.cookies.set({
            name: COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
