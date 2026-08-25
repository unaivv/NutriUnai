import { NextRequest, NextResponse } from 'next/server';
import { initChatsDatabase, chatsDb } from '@/lib/chatsDatabase';
import { jwtVerify } from 'jose';
import { handleCORS } from '@/lib/cors';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number | null> {
    const token = request.cookies.get('auth-token')?.value;
    console.log('Chats API - Token exists:', !!token);
    console.log('Chats API - All cookies:', request.cookies.getAll());
    
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.userId as number;
    } catch (error) {
        console.log('Chats API - Token verification failed:', error);
        return null;
    }
}

export interface ChatSaveRequest {
    title: string;
    messages: Array<{
        sender: 'User' | 'System';
        text: string;
    }>;
}

// GET /api/chats - Obtener chats del usuario actual
export async function GET(request: NextRequest) {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    try {
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        await initChatsDatabase();
        const chats = await chatsDb.getAllForUser(userId);
        return NextResponse.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chats' },
            { status: 500 }
        );
    }
}

// POST /api/chats - Guardar un nuevo chat
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        await initChatsDatabase();

        const body: ChatSaveRequest = await request.json();
        const { title, messages } = body;

        if (!title || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'Title and messages are required' },
                { status: 400 }
            );
        }

        const newChat = await chatsDb.create(Date.now().toString(), userId, title, messages);

        return NextResponse.json(newChat, { status: 201 });
    } catch (error) {
        console.error('Error saving chat:', error);
        return NextResponse.json(
            { error: 'Failed to save chat' },
            { status: 500 }
        );
    }
}

