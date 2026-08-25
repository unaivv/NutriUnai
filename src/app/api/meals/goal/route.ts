import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleCORS } from "@/lib/cors";
import { MICRO_NUTRIENTS } from "@/lib/microGoals";
import { getNutritionGoal, type NutritionPlan } from "@/lib/nutritionGoal";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Helper to get user ID from token
async function getUserIdFromToken(
  request: NextRequest,
): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  console.log("Meals Goal API - Token exists:", !!token);
  console.log("Meals Goal API - All cookies:", request.cookies.getAll());

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch (error) {
    console.log("Meals Goal API - Token verification failed:", error);
    return null;
  }
}

// GET /api/meals/goal?plan=unai|marifeli|both - Objetivo nutricional diario
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
    const plan = searchParams.get("plan") || "unai";

    if (plan !== "unai" && plan !== "marifeli" && plan !== "both") {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const goal = getNutritionGoal(plan as NutritionPlan);
    return NextResponse.json({ ...goal, micros: MICRO_NUTRIENTS });
  } catch (error) {
    console.error("Error computing nutrition goal:", error);
    return NextResponse.json(
      { error: "Failed to compute nutrition goal" },
      { status: 500 },
    );
  }
}
