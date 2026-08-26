"use client";

import type React from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import type { MicroKey, MicroNutrientInfo } from "@/lib/microGoals";

export interface MealEntry {
  id: number;
  user_id: number;
  photo_path: string | null;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: string;
  logged_at: string;
  created_at?: string;
  micros: Partial<Record<MicroKey, number>> | null;
}

export interface NutritionGoal {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  micros: Record<MicroKey, MicroNutrientInfo>;
}

export interface DetectedFood {
  foodName: string;
  estimatedGrams: number;
}

export interface NutritionCandidate {
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g?: Partial<Record<MicroKey, number>>;
  source: string;
}

export interface CreateMealEntryInput {
  photo?: File | null;
  foodName: string;
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g?: Partial<Record<MicroKey, number>>;
  source: string;
  loggedAt: string;
}

export interface SavedMealItem {
  foodName: string;
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g?: Partial<Record<MicroKey, number>>;
  source: string;
}

export interface SavedMeal {
  id: number;
  name: string;
  items: SavedMealItem[];
}

export interface CreateSavedMealInput {
  name: string;
  items: SavedMealItem[];
}

export interface IMealContext {
  entries: MealEntry[];
  goal: NutritionGoal | null;
  savedMeals: SavedMeal[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  version: number;
  analyzePhoto: (file: File, description?: string) => Promise<DetectedFood[]>;
  lookupNutrition: (query: string) => Promise<NutritionCandidate[]>;
  createEntry: (input: CreateMealEntryInput) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  refreshEntries: (from: string, to: string) => Promise<void>;
  fetchEntriesInRange: (from: string, to: string) => Promise<MealEntry[]>;
  refreshGoal: (plan?: "unai" | "marifeli" | "both") => Promise<void>;
  fetchSavedMeals: () => Promise<void>;
  saveMeal: (input: CreateSavedMealInput) => Promise<void>;
  deleteSavedMeal: (id: number) => Promise<void>;
}

const defaultValue: IMealContext = {
  entries: [],
  goal: null,
  savedMeals: [],
  loading: false,
  initialLoading: true,
  error: null,
  version: 0,
  analyzePhoto: async (_file: File, _description?: string) => [],
  lookupNutrition: async () => [],
  createEntry: async () => {},
  deleteEntry: async () => {},
  refreshEntries: async () => {},
  fetchEntriesInRange: async () => [],
  refreshGoal: async () => {},
  fetchSavedMeals: async () => {},
  saveMeal: async () => {},
  deleteSavedMeal: async () => {},
};

const mapSavedMeal = (row: any): SavedMeal => ({
  id: row.id,
  name: row.name,
  items: (row.items || []).map((item: any) => ({
    foodName: item.food_name,
    quantityGrams: item.quantity_grams,
    caloriesPer100g: item.calories_per_100g,
    proteinPer100g: item.protein_per_100g,
    carbsPer100g: item.carbs_per_100g,
    fatPer100g: item.fat_per_100g,
    microsPer100g: item.micros || undefined,
    source: item.source,
  })),
});

export const MealContext = createContext<IMealContext>(defaultValue);

export const MealContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Load entries from API for a date range
  const refreshEntries = useCallback(async (from: string, to: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch meal entries");
      }

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error("Error loading meal entries:", err);
      setError("Error al cargar las entradas de comida");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch entries for a date range without mutating global state
  const fetchEntriesInRange = useCallback(
    async (from: string, to: string): Promise<MealEntry[]> => {
      const response = await fetch(
        `/api/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch meal entries");
      }

      return response.json();
    },
    [],
  );

  // Load the nutrition goal for a given plan
  const refreshGoal = useCallback(
    async (plan: "unai" | "marifeli" | "both" = "unai") => {
      try {
        const response = await fetch(`/api/meals/goal?plan=${plan}`);
        if (!response.ok) {
          throw new Error("Failed to fetch nutrition goal");
        }

        const data = await response.json();
        setGoal(data);
      } catch (err) {
        console.error("Error loading nutrition goal:", err);
        setError("Error al cargar el objetivo nutricional");
      }
    },
    [],
  );

  const fetchSavedMeals = useCallback(async () => {
    try {
      const response = await fetch("/api/meals/saved");
      if (!response.ok) {
        throw new Error("Failed to fetch saved meals");
      }

      const data = await response.json();
      setSavedMeals(data.map(mapSavedMeal));
    } catch (err) {
      console.error("Error loading saved meals:", err);
    }
  }, []);

  const saveMeal = useCallback(async (input: CreateSavedMealInput) => {
    const response = await fetch("/api/meals/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save meal");
    }

    const newSavedMeal = await response.json();
    setSavedMeals((prev) => [...prev, mapSavedMeal(newSavedMeal)]);
  }, []);

  const deleteSavedMeal = useCallback(async (id: number) => {
    const response = await fetch(`/api/meals/saved/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete saved meal");
    }

    setSavedMeals((prev) => prev.filter((meal) => meal.id !== id));
  }, []);

  useEffect(() => {
    const today = new Date();
    const from = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6,
    ).toISOString();
    const to = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    ).toISOString();
    Promise.all([
      refreshEntries(from, to),
      refreshGoal(),
      fetchSavedMeals(),
    ]).finally(() => {
      setInitialLoading(false);
    });
  }, [refreshEntries, refreshGoal, fetchSavedMeals]);

  const analyzePhoto = useCallback(
    async (file: File, description?: string): Promise<DetectedFood[]> => {
      const formData = new FormData();
      formData.append("photo", file);
      if (description?.trim()) {
        formData.append("description", description.trim());
      }

      const response = await fetch("/api/meals/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze photo");
      }

      return response.json();
    },
    [],
  );

  const lookupNutrition = useCallback(
    async (query: string): Promise<NutritionCandidate[]> => {
      const response = await fetch(
        `/api/meals/nutrition?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to lookup nutrition data");
      }

      return response.json();
    },
    [],
  );

  const createEntry = useCallback(async (input: CreateMealEntryInput) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("foodName", input.foodName);
      formData.append("quantityGrams", input.quantityGrams.toString());
      formData.append("caloriesPer100g", input.caloriesPer100g.toString());
      formData.append("proteinPer100g", input.proteinPer100g.toString());
      formData.append("carbsPer100g", input.carbsPer100g.toString());
      formData.append("fatPer100g", input.fatPer100g.toString());
      if (input.microsPer100g) {
        formData.append("microsPer100g", JSON.stringify(input.microsPer100g));
      }
      formData.append("source", input.source);
      formData.append("loggedAt", input.loggedAt);
      if (input.photo) {
        formData.append("photo", input.photo);
      }

      const response = await fetch("/api/meals", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create meal entry");
      }

      const newEntry = await response.json();
      setEntries((prev) => [newEntry, ...prev]);
      setVersion((v) => v + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar la entrada";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/meals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal entry");
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setVersion((v) => v + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar la entrada";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MealContext.Provider
      value={{
        entries,
        goal,
        savedMeals,
        loading,
        initialLoading,
        error,
        version,
        analyzePhoto,
        lookupNutrition,
        createEntry,
        deleteEntry,
        refreshEntries,
        fetchEntriesInRange,
        refreshGoal,
        fetchSavedMeals,
        saveMeal,
        deleteSavedMeal,
      }}
    >
      {children}
    </MealContext.Provider>
  );
};

export default MealContext;
