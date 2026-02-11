'use client';

import React, { createContext, useCallback, useState, useEffect } from 'react';

export interface Recipe {
    id: string;
    title: string;
    content: string;
    savedAt: string;
    plan?: 'unai' | 'marifeli' | 'both';
}

export interface IRecipeContext {
    recipes: Recipe[];
    saveRecipe: (title: string, content: string, plan?: 'unai' | 'marifeli' | 'both') => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;
    isRecipeSaved: (content: string) => boolean;
    loading: boolean;
    error: string | null;
    refreshRecipes: () => Promise<void>;
}

const defaultValue: IRecipeContext = {
    recipes: [],
    saveRecipe: async () => { },
    deleteRecipe: async () => { },
    isRecipeSaved: () => false,
    loading: false,
    error: null,
    refreshRecipes: async () => { }
};

export const RecipeContext = createContext<IRecipeContext>(defaultValue);

export const RecipeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load recipes from API
    const refreshRecipes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/recipes');
            if (!response.ok) {
                throw new Error('Failed to fetch recipes');
            }

            const data = await response.json();
            setRecipes(data);
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError('Error al cargar las recetas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshRecipes();
    }, [refreshRecipes]);

    const saveRecipe = useCallback(async (title: string, content: string, plan?: 'unai' | 'marifeli' | 'both') => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, plan })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save recipe');
            }

            const newRecipe = await response.json();
            setRecipes(prev => [newRecipe, ...prev]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al guardar la receta';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRecipe = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/recipes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete recipe');
            }

            setRecipes(prev => prev.filter(recipe => recipe.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la receta';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const isRecipeSaved = useCallback((content: string) => {
        return recipes.some(recipe => recipe.content === content);
    }, [recipes]);

    return (
        <RecipeContext.Provider value={{
            recipes,
            saveRecipe,
            deleteRecipe,
            isRecipeSaved,
            loading,
            error,
            refreshRecipes
        }}>
            {children}
        </RecipeContext.Provider>
    );
};

export default RecipeContext;
