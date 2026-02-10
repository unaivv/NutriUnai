import { NextRequest, NextResponse } from 'next/server';
import { recipeDb } from '@/lib/database-simple';

// DELETE /api/recipes/[id] - Delete a recipe
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const recipeId = resolvedParams.id;

        if (!recipeId) {
            return NextResponse.json(
                { error: 'No recipe ID provided' },
                { status: 400 }
            );
        }

        // First check if recipe exists
        const recipe = await recipeDb.getById(recipeId);
        if (!recipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        const deleted = await recipeDb.delete(recipeId);

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
