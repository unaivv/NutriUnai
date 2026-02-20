import { NextRequest, NextResponse } from 'next/server';
import { recipeDb, initDatabase } from '@/lib/database';
import { jwtVerify } from 'jose';
import { handleCORS } from '@/lib/cors';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper to get user ID from token
async function getUserIdFromToken(request: NextRequest): Promise<number | null> {
    const token = request.cookies.get('auth-token')?.value;
    console.log('Recipes API - Token exists:', !!token);
    console.log('Recipes API - All cookies:', request.cookies.getAll());
    
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.userId ? Number(payload.userId) : null;
    } catch (error) {
        console.log('Recipes API - Token verification failed:', error);
        return null;
    }
}

// GET /api/recipes - Get all recipes for current user
export async function GET(request: NextRequest) {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    try {
        await initDatabase();
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const recipes = await recipeDb.getAllForUser(userId);
        return NextResponse.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        );
    }
}

// POST /api/recipes - Create new recipe for current user
export async function POST(request: NextRequest) {
    try {
        await initDatabase();
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, plan } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // Check if recipe already exists for this user
        const exists = await recipeDb.existsByContent(content, userId);
        if (exists) {
            return NextResponse.json(
                { error: 'Recipe already exists' },
                { status: 409 }
            );
        }

        const newRecipe = await recipeDb.create(userId, title, content, plan);
        return NextResponse.json(newRecipe, { status: 201 });
    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create recipe' },
            { status: 500 }
        );
    }
}
