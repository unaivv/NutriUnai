import { NextRequest, NextResponse } from 'next/server';
import { initChatsDatabase, chatsDb } from '@/lib/chatsDatabase';

// GET /api/chats/[id] - Obtener un chat específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initChatsDatabase();

        const resolvedParams = await params;
        const chatId = resolvedParams.id;

        const chat = await chatsDb.getByChatId(chatId);

        if (!chat) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat' },
            { status: 500 }
        );
    }
}

// PUT /api/chats/[id] - Actualizar mensajes de un chat
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initChatsDatabase();

        const resolvedParams = await params;
        const chatId = resolvedParams.id;

        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        const success = await chatsDb.updateMessages(chatId, messages);

        if (!success) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating chat:', error);
        return NextResponse.json(
            { error: 'Failed to update chat' },
            { status: 500 }
        );
    }
}

// DELETE /api/chats/[id] - Eliminar un chat
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initChatsDatabase();

        const resolvedParams = await params;
        const chatId = resolvedParams.id;

        const success = await chatsDb.delete(chatId);

        if (!success) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json(
            { error: 'Failed to delete chat' },
            { status: 500 }
        );
    }
}
