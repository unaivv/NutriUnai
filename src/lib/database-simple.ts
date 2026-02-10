import { promises as fs } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'recipes.json');

export interface Recipe {
    id: string;
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
    // Get all recipes
    getAll: async (): Promise<Recipe[]> => {
        const allRecipes = await loadRecipes();
        return allRecipes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    },

    // Get recipe by ID
    getById: async (id: string): Promise<Recipe | null> => {
        const allRecipes = await loadRecipes();
        return allRecipes.find(recipe => recipe.id === id) || null;
    },

    // Create new recipe
    create: async (title: string, content: string): Promise<Recipe> => {
        const allRecipes = await loadRecipes();
        const newRecipe: Recipe = {
            id: Date.now().toString(),
            title,
            content,
            savedAt: new Date().toISOString()
        };
        
        const updatedRecipes = [newRecipe, ...allRecipes];
        await saveRecipes(updatedRecipes);
        
        return newRecipe;
    },

    // Delete recipe by ID
    delete: async (id: string): Promise<boolean> => {
        const allRecipes = await loadRecipes();
        const initialLength = allRecipes.length;
        const filteredRecipes = allRecipes.filter(recipe => recipe.id !== id);
        
        if (filteredRecipes.length < initialLength) {
            await saveRecipes(filteredRecipes);
            return true;
        }
        
        return false;
    },

    // Check if recipe content already exists
    existsByContent: async (content: string): Promise<boolean> => {
        const allRecipes = await loadRecipes();
        return allRecipes.some(recipe => recipe.content === content);
    }
};
