import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

// GET /api/meals/photo/[filename] - Sirve la foto solo si pertenece al usuario autenticado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
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
    const filename = resolvedParams.filename;

    const entry = await mealsDb.getByPhotoPath(filename);
    if (!entry || entry.user_id !== userId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "uploads", "meals", filename);
    const buffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (error) {
    console.error("Error serving meal photo:", error);
    return NextResponse.json(
      { error: "Failed to load photo" },
      { status: 500 },
    );
  }
}
