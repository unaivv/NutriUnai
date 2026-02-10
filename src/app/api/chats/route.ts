import { NextRequest, NextResponse } from 'next/server';
import { initChatsDatabase, chatsDb } from '@/lib/chatsDatabase';

export interface ChatSaveRequest {
    title: string;
    messages: Array<{
        sender: 'User' | 'System';
        text: string;
    }>;
}

// GET /api/chats - Obtener todos los chats
export async function GET() {
    try {
        await initChatsDatabase();
        const chats = await chatsDb.getAll();
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
        await initChatsDatabase();

        const body: ChatSaveRequest = await request.json();
        const { title, messages } = body;

        if (!title || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'Title and messages are required' },
                { status: 400 }
            );
        }

        const newChat = await chatsDb.create(Date.now().toString(), title, messages);

        return NextResponse.json(newChat, { status: 201 });
    } catch (error) {
        console.error('Error saving chat:', error);
        return NextResponse.json(
            { error: 'Failed to save chat' },
            { status: 500 }
        );
    }
}

