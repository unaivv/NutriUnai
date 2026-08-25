export type MicroKey =
  | "fiber"
  | "vitaminA"
  | "vitaminC"
  | "vitaminD"
  | "vitaminE"
  | "vitaminB12"
  | "folate"
  | "calcium"
  | "iron"
  | "magnesium"
  | "potassium"
  | "zinc";

export interface MicroNutrientInfo {
  key: MicroKey;
  label: string;
  unit: string;
  rda: number;
}

// Valores de Nutrient Reference Values (NRV) estándar de etiquetado de la UE
// para un adulto. Son objetivos genéricos de referencia, no personalizados.
export const MICRO_NUTRIENTS: Record<MicroKey, MicroNutrientInfo> = {
  fiber: { key: "fiber", label: "Fibra", unit: "g", rda: 25 },
  vitaminA: { key: "vitaminA", label: "Vitamina A", unit: "µg", rda: 800 },
  vitaminC: { key: "vitaminC", label: "Vitamina C", unit: "mg", rda: 80 },
  vitaminD: { key: "vitaminD", label: "Vitamina D", unit: "µg", rda: 5 },
  vitaminE: { key: "vitaminE", label: "Vitamina E", unit: "mg", rda: 12 },
  vitaminB12: {
    key: "vitaminB12",
    label: "Vitamina B12",
    unit: "µg",
    rda: 2.5,
  },
  folate: { key: "folate", label: "Folato (B9)", unit: "µg", rda: 200 },
  calcium: { key: "calcium", label: "Calcio", unit: "mg", rda: 800 },
  iron: { key: "iron", label: "Hierro", unit: "mg", rda: 14 },
  magnesium: { key: "magnesium", label: "Magnesio", unit: "mg", rda: 375 },
  potassium: { key: "potassium", label: "Potasio", unit: "mg", rda: 2000 },
  zinc: { key: "zinc", label: "Zinc", unit: "mg", rda: 10 },
};
