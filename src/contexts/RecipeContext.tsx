import React, { createContext, useCallback, useState, useEffect } from 'react';

export interface Recipe {
    id: string;
    title: string;
    content: string;
    savedAt: string;
}

export interface IRecipeContext {
    recipes: Recipe[];
    saveRecipe: (title: string, content: string) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;
    isRecipeSaved: (content: string) => boolean;
    loading: boolean;
    error: string | null;
}

const defaultValue: IRecipeContext = {
    recipes: [],
    saveRecipe: async () => { },
    deleteRecipe: async () => { },
    isRecipeSaved: () => false,
    loading: false,
    error: null
};

export const RecipeContext = createContext<IRecipeContext>(defaultValue);

export const RecipeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            setLoading(true);
            setError(null);

            // Solo cargar en el cliente
            if (typeof window !== 'undefined') {
                const savedRecipes = localStorage.getItem('savedRecipes');
                if (savedRecipes) {
                    const parsedRecipes = JSON.parse(savedRecipes);
                    setRecipes(parsedRecipes);
                }
            }
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError('Error al cargar las recetas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && recipes.length > 0) {
            localStorage.setItem('savedRecipes', JSON.stringify(recipes));
        }
    }, [recipes]);

    const saveRecipe = useCallback(async (title: string, content: string) => {
        try {
            setLoading(true);
            setError(null);

            const newRecipe: Recipe = {
                id: Date.now().toString(),
                title,
                content,
                savedAt: new Date().toISOString()
            };

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

            // Remove from state immediately
            setRecipes(prev => {
                const filtered = prev.filter(recipe => recipe.id !== id);
                return filtered;
            });

            // Update localStorage immediately
            if (typeof window !== 'undefined') {
                const currentRecipes = localStorage.getItem('savedRecipes');
                if (currentRecipes) {
                    const parsed = JSON.parse(currentRecipes);
                    const filtered = parsed.filter((recipe: Recipe) => recipe.id !== id);
                    localStorage.setItem('savedRecipes', JSON.stringify(filtered));
                }
            }
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
            error
        }}>
            {children}
        </RecipeContext.Provider>
    );
};

export default RecipeContext;
