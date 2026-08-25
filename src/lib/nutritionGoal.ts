import { readFileSync } from "node:fs";
import { join } from "node:path";

export type NutritionPlan = "unai" | "marifeli" | "both";

export interface NutritionGoalResult {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function loadPlanFile(plan: "unai" | "marifeli"): string {
  const planPath = join(process.cwd(), "src", "files", `${plan}.md`);
  return readFileSync(planPath, "utf-8");
}

function parseGoalFromContent(content: string): NutritionGoalResult {
  const weightMatch = content.match(/Peso inicial:\s*([\d,.]+)\s*kg/i);
  if (!weightMatch) {
    throw new Error("No se pudo encontrar el peso inicial en el plan");
  }
  const weightKg = Number.parseFloat(weightMatch[1].replace(",", "."));

  const tableMatch = content.match(
    /###\s*Objetivo nutricional[\s\S]*?\|[^\n]*\n\|[-\s|]+\n\|\s*([\d,.]+)\s*\|[^|]*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|/,
  );
  if (!tableMatch) {
    throw new Error(
      "No se pudo encontrar la tabla de objetivo nutricional en el plan",
    );
  }

  const kcal = Number.parseFloat(tableMatch[1].replace(",", "."));
  const carbsMultiplier = Number.parseFloat(tableMatch[2].replace(",", "."));
  const fatMultiplier = Number.parseFloat(tableMatch[3].replace(",", "."));

  const carbsG = weightKg * carbsMultiplier;
  const fatG = weightKg * fatMultiplier;
  const proteinG = (kcal - carbsG * 4 - fatG * 9) / 4;

  return { kcal, proteinG, carbsG, fatG };
}

export function getNutritionGoal(plan: NutritionPlan): NutritionGoalResult {
  if (plan === "both") {
    const unaiGoal = parseGoalFromContent(loadPlanFile("unai"));
    const marifeliGoal = parseGoalFromContent(loadPlanFile("marifeli"));

    return {
      kcal: (unaiGoal.kcal + marifeliGoal.kcal) / 2,
      proteinG: (unaiGoal.proteinG + marifeliGoal.proteinG) / 2,
      carbsG: (unaiGoal.carbsG + marifeliGoal.carbsG) / 2,
      fatG: (unaiGoal.fatG + marifeliGoal.fatG) / 2,
    };
  }

  return parseGoalFromContent(loadPlanFile(plan));
}
