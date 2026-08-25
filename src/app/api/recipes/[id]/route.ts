import { NextRequest, NextResponse } from 'next/server';
import { recipeDb, initDatabase } from '@/lib/database';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number | null> {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.userId ? Number(payload.userId) : null;
    } catch {
        return null;
    }
}

// DELETE /api/recipes/[id] - Delete a recipe (only if belongs to user)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initDatabase();
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const recipeId = Number(resolvedParams.id);

        if (!recipeId) {
            return NextResponse.json(
                { error: 'No recipe ID provided' },
                { status: 400 }
            );
        }

        // First check if recipe exists and belongs to user
        const recipe = await recipeDb.getById(recipeId, userId);
        if (!recipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        const deleted = await recipeDb.delete(recipeId, userId);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete recipe' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return NextResponse.json(
            { error: 'Failed to delete recipe' },
            { status: 500 }
        );
    }
}
