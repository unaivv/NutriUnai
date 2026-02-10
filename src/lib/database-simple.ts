import { promises as fs } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'recipes.json');

export interface Recipe {
    id: string;
    userId: string;
    title: string;
    content: string;
    savedAt: string;
}

let recipes: Recipe[] = [];
let loaded = false;

const loadRecipes = async (): Promise<Recipe[]> => {
    if (loaded) {
        return recipes;
    }

    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        recipes = JSON.parse(data);
        loaded = true;
        console.log('Recipes loaded from file:', recipes.length);
    } catch (error) {
        // File doesn't exist or is empty
        recipes = [];
        loaded = true;
        console.log('No existing recipes file, starting fresh');
    }

    return recipes;
};

const saveRecipes = async (recipesList: Recipe[]): Promise<void> => {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(recipesList, null, 2), 'utf-8');
        recipes = recipesList;
        console.log('Recipes saved to file:', recipesList.length);
    } catch (error) {
        console.error('Error saving recipes:', error);
        throw error;
    }
};

export const recipeDb = {
    // Get all recipes for a user
    getAllForUser: async (userId: string): Promise<Recipe[]> => {
        const allRecipes = await loadRecipes();
        return allRecipes
            .filter(recipe => recipe.userId === userId)
            .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    },

    // Get recipe by ID (only if belongs to user)
    getById: async (id: string, userId?: string): Promise<Recipe | null> => {
        const allRecipes = await loadRecipes();
        const recipe = allRecipes.find(recipe => recipe.id === id);
        if (!recipe) return null;
        if (userId && recipe.userId !== userId) return null;
        return recipe;
    },

    // Create new recipe for user
    create: async (userId: string, title: string, content: string): Promise<Recipe> => {
        const allRecipes = await loadRecipes();
        const newRecipe: Recipe = {
            id: Date.now().toString(),
            userId,
            title,
            content,
            savedAt: new Date().toISOString()
        };

        const updatedRecipes = [newRecipe, ...allRecipes];
        await saveRecipes(updatedRecipes);

        return newRecipe;
    },

    // Delete recipe by ID (only if belongs to user)
    delete: async (id: string, userId: string): Promise<boolean> => {
        const allRecipes = await loadRecipes();
        const recipe = allRecipes.find(r => r.id === id);
        if (!recipe || recipe.userId !== userId) return false;

        const filteredRecipes = allRecipes.filter(recipe => recipe.id !== id);
        await saveRecipes(filteredRecipes);
        return true;
    },

    // Check if recipe content already exists for user
    existsByContent: async (content: string, userId: string): Promise<boolean> => {
        const allRecipes = await loadRecipes();
        return allRecipes.some(recipe => recipe.content === content && recipe.userId === userId);
    }
};
