import { NextRequest, NextResponse } from 'next/server';
import { recipeDb } from '@/lib/database-simple';

// GET /api/recipes - Get all recipes
export async function GET() {
    try {
        const recipes = await recipeDb.getAll();
        return NextResponse.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        );
    }
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // Check if recipe already exists
        const exists = await recipeDb.existsByContent(content);
        if (exists) {
            return NextResponse.json(
                { error: 'Recipe already exists' },
                { status: 409 }
            );
        }

        const newRecipe = await recipeDb.create(title, content);
        return NextResponse.json(newRecipe, { status: 201 });
    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create recipe' },
            { status: 500 }
        );
    }
}
