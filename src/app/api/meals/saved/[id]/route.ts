import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { initMealsDatabase, savedMealsDb } from "@/lib/mealsDatabase";

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

// DELETE /api/meals/saved/[id] - Eliminar una comida guardada (solo si pertenece al usuario)
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
        { error: "No saved meal ID provided" },
        { status: 400 },
      );
    }

    const deleted = await savedMealsDb.delete(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Saved meal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved meal:", error);
    return NextResponse.json(
      { error: "Failed to delete saved meal" },
      { status: 500 },
    );
  }
}
