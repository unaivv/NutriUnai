import { NextRequest, NextResponse } from 'next/server';
import { initUsersDatabase, usersDb } from '@/lib/usersDatabase';

export async function POST(request: NextRequest) {
    try {
        await initUsersDatabase();
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password and name are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const existingUser = await usersDb.findByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        const newUser = await usersDb.createUser(email, password, name);

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
