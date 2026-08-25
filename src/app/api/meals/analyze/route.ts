import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Helper to get user ID from token
async function getUserIdFromToken(
  request: NextRequest,
): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  console.log("Meals Analyze API - Token exists:", !!token);
  console.log("Meals Analyze API - All cookies:", request.cookies.getAll());

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch (error) {
    console.log("Meals Analyze API - Token verification failed:", error);
    return null;
  }
}

export interface DetectedFood {
  foodName: string;
  estimatedGrams: number;
}

const ANALYZE_PROMPT =
  "Identifica cada alimento visible en esta foto de un plato de comida y estima su peso en gramos. " +
  "Responde UNICAMENTE con un array JSON, sin texto adicional ni markdown, con este formato exacto: " +
  '[{"foodName": "nombre del alimento en español", "estimatedGrams": 150}]';

function buildPrompt(description: string | null): string {
  if (!description) return ANALYZE_PROMPT;

  return (
    `${ANALYZE_PROMPT} ` +
    "El usuario ha añadido esta nota sobre la foto, trátala como información " +
    "verídica que prevalece sobre tu propia estimación visual cuando entren en conflicto " +
    "(por ejemplo, si el usuario dice que solo se ha comido la mitad, o que un alimento es " +
    "integral en vez de blanco, o que lleva un ingrediente extra, ajusta la identificación " +
    `y/o el peso estimado en consecuencia). Nota del usuario: "${description}"`
  );
}

// POST /api/meals/analyze - Identifica alimentos en una foto vía Gemini (no guarda nada)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no configurada" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    const descriptionRaw = formData.get("description");
    const description =
      typeof descriptionRaw === "string" && descriptionRaw.trim()
        ? descriptionRaw.trim()
        : null;

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Se requiere una foto" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = photo.type || "image/jpeg";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: buildPrompt(description) },
                { inline_data: { mime_type: mimeType, data: base64Image } },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            (err as { error?: { message?: string } })?.error?.message ||
            res.statusText,
        },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini no devolvió resultados" },
        { status: 502 },
      );
    }

    let foods: DetectedFood[];
    try {
      foods = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "No se pudo interpretar la respuesta de Gemini" },
        { status: 502 },
      );
    }

    return NextResponse.json(foods);
  } catch (error) {
    console.error("Error analyzing meal photo:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 },
    );
  }
}
