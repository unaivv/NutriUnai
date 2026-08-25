import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { initMealsDatabase, mealsDb } from "@/lib/mealsDatabase";

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
  } catch {
    return null;
  }
}

// DELETE /api/meals/[id] - Eliminar una entrada (solo si pertenece al usuario)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    await initMealsDatabase();

    const resolvedParams = await params;
    const id = Number.parseInt(resolvedParams.id, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: "No meal entry ID provided" },
        { status: 400 },
      );
    }

    const deleted = await mealsDb.delete(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Meal entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal entry:", error);
    return NextResponse.json(
      { error: "Failed to delete meal entry" },
      { status: 500 },
    );
  }
}
