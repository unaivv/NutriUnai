import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleCORS } from "@/lib/cors";
import { initMealsDatabase, mealsDb } from "@/lib/mealsDatabase";
import type { MicroKey } from "@/lib/microGoals";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Helper to get user ID from token
async function getUserIdFromToken(
  request: NextRequest,
): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  console.log("Meals API - Token exists:", !!token);
  console.log("Meals API - All cookies:", request.cookies.getAll());

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch (error) {
    console.log("Meals API - Token verification failed:", error);
    return null;
  }
}

// GET /api/meals?from=&to= - Listar entradas del usuario en un rango de fechas
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

    await initMealsDatabase();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || new Date(0).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();

    const entries = await mealsDb.getForUserInRange(userId, from, to);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching meal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal entries" },
      { status: 500 },
    );
  }
}

// POST /api/meals - Guardar una entrada confirmada (con foto opcional)
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

    const formData = await request.formData();
    const foodName = formData.get("foodName")?.toString();
    const quantityGrams = Number.parseFloat(
      formData.get("quantityGrams")?.toString() || "",
    );
    const caloriesPer100g = Number.parseFloat(
      formData.get("caloriesPer100g")?.toString() || "",
    );
    const proteinPer100g = Number.parseFloat(
      formData.get("proteinPer100g")?.toString() || "",
    );
    const carbsPer100g = Number.parseFloat(
      formData.get("carbsPer100g")?.toString() || "",
    );
    const fatPer100g = Number.parseFloat(
      formData.get("fatPer100g")?.toString() || "",
    );
    const source = formData.get("source")?.toString() || "manual";
    const loggedAt =
      formData.get("loggedAt")?.toString() || new Date().toISOString();
    const photo = formData.get("photo");

    let microsPer100g: Partial<Record<MicroKey, number>> | null = null;
    const microsPer100gRaw = formData.get("microsPer100g")?.toString();
    if (microsPer100gRaw) {
      try {
        microsPer100g = JSON.parse(microsPer100gRaw);
      } catch {
        microsPer100g = null;
      }
    }

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

    let photoPath: string | null = null;
    if (photo instanceof File) {
      const uploadsDir = join(process.cwd(), "uploads", "meals");
      await mkdir(uploadsDir, { recursive: true });
      const filename = `${userId}_${Date.now()}.jpg`;
      const buffer = Buffer.from(await photo.arrayBuffer());
      await writeFile(join(uploadsDir, filename), buffer);
      photoPath = filename;
    }

    const factor = quantityGrams / 100;

    let micros: Partial<Record<MicroKey, number>> | undefined;
    if (microsPer100g) {
      micros = {};
      for (const [key, valuePer100g] of Object.entries(microsPer100g)) {
        if (typeof valuePer100g === "number") {
          micros[key as MicroKey] = valuePer100g * factor;
        }
      }
    }

    const newEntry = await mealsDb.create({
      userId,
      photoPath,
      foodName,
      quantityGrams,
      calories: caloriesPer100g * factor,
      proteinG: proteinPer100g * factor,
      carbsG: carbsPer100g * factor,
      fatG: fatPer100g * factor,
      source,
      loggedAt,
      micros,
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating meal entry:", error);
    return NextResponse.json(
      { error: "Failed to create meal entry" },
      { status: 500 },
    );
  }
}
