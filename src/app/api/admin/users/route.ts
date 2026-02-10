import { NextRequest, NextResponse } from 'next/server';
import { initUsersDatabase, usersDb, UserStatus } from '@/lib/usersDatabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper to verify admin access
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: number }> {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
        return { isAdmin: false };
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // For simplicity, we'll consider the first user (ID 1) as admin
        // In production, you'd have a proper admin flag
        const userId = payload.userId as number;
        return { isAdmin: userId === 1, userId };
    } catch {
        return { isAdmin: false };
    }
}

// GET /api/admin/users - Get all users or pending users
export async function GET(request: NextRequest) {
    const { isAdmin } = await verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await initUsersDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let users;
        if (status === 'pending') {
            users = await usersDb.getPendingUsers();
        } else {
            users = await usersDb.getAllUsers();
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/users - Update user status
export async function PUT(request: NextRequest) {
    const { isAdmin } = await verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await initUsersDatabase();
        const { userId, status } = await request.json();

        if (!userId || !status || !['pending', 'active', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const success = await usersDb.updateStatus(userId, status as UserStatus);
        if (!success) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
    const { isAdmin } = await verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await initUsersDatabase();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const success = await usersDb.deleteUser(parseInt(userId));
        if (!success) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
