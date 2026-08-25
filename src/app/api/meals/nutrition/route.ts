import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleCORS } from "@/lib/cors";
import { MICRO_NUTRIENTS, type MicroKey } from "@/lib/microGoals";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Helper to get user ID from token
async function getUserIdFromToken(
  request: NextRequest,
): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  console.log("Meals Nutrition API - Token exists:", !!token);
  console.log("Meals Nutrition API - All cookies:", request.cookies.getAll());

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch (error) {
    console.log("Meals Nutrition API - Token verification failed:", error);
    return null;
  }
}

export interface NutritionCandidate {
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g?: Partial<Record<MicroKey, number>>;
  source: "openfoodfacts" | "usda";
}

// Campos de micronutrientes de Open Food Facts: siguen el patrón `<slug>_100g`.
const OFF_MICRO_FIELDS: Record<MicroKey, string> = {
  fiber: "fiber_100g",
  vitaminA: "vitamin-a_100g",
  vitaminC: "vitamin-c_100g",
  vitaminD: "vitamin-d_100g",
  vitaminE: "vitamin-e_100g",
  vitaminB12: "vitamin-b12_100g",
  folate: "vitamin-b9_100g",
  calcium: "calcium_100g",
  iron: "iron_100g",
  magnesium: "magnesium_100g",
  potassium: "potassium_100g",
  zinc: "zinc_100g",
};

interface OpenFoodFactsProduct {
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    [key: string]: number | undefined;
  };
}

// Cobertura de micros en OFF es irregular: solo incluir las claves presentes,
// nunca rellenar con 0 (un ausente no es lo mismo que un 0 real).
function extractOffMicros(
  nutriments: OpenFoodFactsProduct["nutriments"],
): Partial<Record<MicroKey, number>> | undefined {
  const micros: Partial<Record<MicroKey, number>> = {};

  for (const key of Object.keys(MICRO_NUTRIENTS) as MicroKey[]) {
    const value = nutriments?.[OFF_MICRO_FIELDS[key]];
    if (value !== undefined) {
      micros[key] = value;
    }
  }

  return Object.keys(micros).length > 0 ? micros : undefined;
}

async function searchOpenFoodFacts(
  query: string,
  brand?: string,
): Promise<NutritionCandidate[]> {
  const brandParams = brand
    ? `&tagtype_0=brands&tag_contains_0=contains&tag_0=${encodeURIComponent(brand)}`
    : "";
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5${brandParams}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as { products?: OpenFoodFactsProduct[] };

  return (data.products || [])
    .filter(
      (product) =>
        product.product_name &&
        product.nutriments?.["energy-kcal_100g"] !== undefined,
    )
    .map((product) => ({
      foodName: product.product_name as string,
      caloriesPer100g: product.nutriments?.["energy-kcal_100g"] ?? 0,
      proteinPer100g: product.nutriments?.proteins_100g ?? 0,
      carbsPer100g: product.nutriments?.carbohydrates_100g ?? 0,
      fatPer100g: product.nutriments?.fat_100g ?? 0,
      microsPer100g: extractOffMicros(product.nutriments),
      source: "openfoodfacts" as const,
    }));
}

interface UsdaFoodNutrient {
  nutrientName: string;
  value: number;
}

interface UsdaFood {
  description: string;
  foodNutrients?: UsdaFoodNutrient[];
}

function findNutrientValue(
  nutrients: UsdaFoodNutrient[] | undefined,
  name: string,
): number {
  return (
    nutrients?.find((nutrient) => nutrient.nutrientName === name)?.value ?? 0
  );
}

// Nombre de `nutrientName` en FoodData Central para cada micronutriente.
const USDA_MICRO_NUTRIENT_NAMES: Record<MicroKey, string> = {
  fiber: "Fiber, total dietary",
  vitaminA: "Vitamin A, RAE",
  vitaminC: "Vitamin C, total ascorbic acid",
  vitaminD: "Vitamin D (D2 + D3)",
  vitaminE: "Vitamin E (alpha-tocopherol)",
  vitaminB12: "Vitamin B-12",
  folate: "Folate, total",
  calcium: "Calcium, Ca",
  iron: "Iron, Fe",
  magnesium: "Magnesium, Mg",
  potassium: "Potassium, K",
  zinc: "Zinc, Zn",
};

// A diferencia de findNutrientValue, no rellena con 0: un nutriente ausente
// en FoodData Central debe tratarse como "sin dato".
function findMicroValue(
  nutrients: UsdaFoodNutrient[] | undefined,
  name: string,
): number | undefined {
  return nutrients?.find((nutrient) => nutrient.nutrientName === name)?.value;
}

function extractUsdaMicros(
  nutrients: UsdaFoodNutrient[] | undefined,
): Partial<Record<MicroKey, number>> | undefined {
  const micros: Partial<Record<MicroKey, number>> = {};

  for (const key of Object.keys(MICRO_NUTRIENTS) as MicroKey[]) {
    const value = findMicroValue(nutrients, USDA_MICRO_NUTRIENT_NAMES[key]);
    if (value !== undefined) {
      micros[key] = value;
    }
  }

  return Object.keys(micros).length > 0 ? micros : undefined;
}

async function searchUsda(query: string): Promise<NutritionCandidate[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=5`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as { foods?: UsdaFood[] };

  return (data.foods || []).map((food) => ({
    foodName: food.description,
    caloriesPer100g: findNutrientValue(food.foodNutrients, "Energy"),
    proteinPer100g: findNutrientValue(food.foodNutrients, "Protein"),
    carbsPer100g: findNutrientValue(
      food.foodNutrients,
      "Carbohydrate, by difference",
    ),
    fatPer100g: findNutrientValue(food.foodNutrients, "Total lipid (fat)"),
    microsPer100g: extractUsdaMicros(food.foodNutrients),
    source: "usda" as const,
  }));
}

// GET /api/meals/nutrition?query= - Busca macros/micros por 100g: primero
// marca Mercadona en Open Food Facts, luego Open Food Facts sin filtrar,
// con fallback final a USDA FoodData Central.
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Se requiere un query" },
        { status: 400 },
      );
    }

    // Priorizamos marca Mercadona (Hacendado, Deliplus, Bosque Verde...) ya
    // que es de donde suele venir la mayoría de la comida real del usuario.
    let candidates = await searchOpenFoodFacts(query, "mercadona");
    if (candidates.length === 0) {
      candidates = await searchOpenFoodFacts(query);
    }
    if (candidates.length === 0) {
      candidates = await searchUsda(query);
    }

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Error searching nutrition data:", error);
    return NextResponse.json(
      { error: "Failed to search nutrition data" },
      { status: 500 },
    );
  }
}
