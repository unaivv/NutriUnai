import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleCORS } from "@/lib/cors";
import { initMealsDatabase, savedMealsDb } from "@/lib/mealsDatabase";
import type { MicroKey } from "@/lib/microGoals";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Helper to get user ID from token
async function getUserIdFromToken(
  request: NextRequest,
): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch (error) {
    console.log("Saved meals API - Token verification failed:", error);
    return null;
  }
}

// GET /api/meals/saved - Listar comidas guardadas del usuario
export async function GET(request: NextRequest) {
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

    await initMealsDatabase();

    const savedMeals = await savedMealsDb.listForUser(userId);
    return NextResponse.json(savedMeals);
  } catch (error) {
    console.error("Error fetching saved meals:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved meals" },
      { status: 500 },
    );
  }
}

// POST /api/meals/saved - Guardar una comida como plantilla reutilizable
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    await initMealsDatabase();

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!name || rawItems.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const items = [];
    for (const rawItem of rawItems) {
      const foodName =
        typeof rawItem.foodName === "string" ? rawItem.foodName.trim() : "";
      const quantityGrams = Number(rawItem.quantityGrams);
      const caloriesPer100g = Number(rawItem.caloriesPer100g);
      const proteinPer100g = Number(rawItem.proteinPer100g);
      const carbsPer100g = Number(rawItem.carbsPer100g);
      const fatPer100g = Number(rawItem.fatPer100g);
      const source =
        typeof rawItem.source === "string" ? rawItem.source : "manual";
      const microsPer100g: Partial<Record<MicroKey, number>> | undefined =
        rawItem.microsPer100g && typeof rawItem.microsPer100g === "object"
          ? rawItem.microsPer100g
          : undefined;

      if (
        !foodName ||
        Number.isNaN(quantityGrams) ||
        Number.isNaN(caloriesPer100g) ||
        Number.isNaN(proteinPer100g) ||
        Number.isNaN(carbsPer100g) ||
        Number.isNaN(fatPer100g)
      ) {
        return NextResponse.json(
          { error: "Faltan datos requeridos" },
          { status: 400 },
        );
      }

      items.push({
        foodName,
        quantityGrams,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        source,
        micros: microsPer100g,
      });
    }

    const savedMeal = await savedMealsDb.create({
      userId,
      name,
      items,
    });

    return NextResponse.json(savedMeal, { status: 201 });
  } catch (error) {
    console.error("Error creating saved meal:", error);
    return NextResponse.json(
      { error: "Failed to create saved meal" },
      { status: 500 },
    );
  }
}
