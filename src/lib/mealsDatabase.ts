import { join } from "node:path";
import sqlite3 from "sqlite3";
import type { MicroKey } from "@/lib/microGoals";

const DB_PATH = join(process.cwd(), "meals.db");

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface MealEntryRow {
  id?: number;
  user_id: number;
  photo_path: string | null;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: string;
  logged_at: string;
  created_at?: string;
  micros: Partial<Record<MicroKey, number>> | null;
}

export interface CreateMealEntryInput {
  userId: number;
  photoPath: string | null;
  foodName: string;
  quantityGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: string;
  loggedAt: string;
  micros?: Partial<Record<MicroKey, number>> | null;
}

export interface SavedMealItemRow {
  id?: number;
  saved_meal_id?: number;
  food_name: string;
  quantity_grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: string;
  micros: Partial<Record<MicroKey, number>> | null;
}

export interface SavedMealRow {
  id?: number;
  user_id: number;
  name: string;
  created_at?: string;
  items: SavedMealItemRow[];
}

export interface CreateSavedMealItemInput {
  foodName: string;
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: string;
  micros?: Partial<Record<MicroKey, number>> | null;
}

export interface CreateSavedMealInput {
  userId: number;
  name: string;
  items: CreateSavedMealItemInput[];
}

export const initMealsDatabase = (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    if (dbInitialized) {
      resolve();
      return;
    }

    console.log("Initializing meals database at:", DB_PATH);

    db = new sqlite3.Database(
      DB_PATH,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Error opening meals database:", err);
          reject(err);
          return;
        }
        console.log("Connected to SQLite meals database");

        db.run(
          `
                CREATE TABLE IF NOT EXISTS meal_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    photo_path TEXT,
                    food_name TEXT NOT NULL,
                    quantity_grams REAL NOT NULL,
                    calories REAL NOT NULL,
                    protein_g REAL NOT NULL,
                    carbs_g REAL NOT NULL,
                    fat_g REAL NOT NULL,
                    source TEXT NOT NULL,
                    logged_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `,
          (err) => {
            if (err) {
              console.error("Error creating meal_entries table:", err);
              reject(err);
              return;
            }
            console.log("Meal entries table ready");

            // La tabla puede ya existir en disco con el esquema anterior
            // (sin micros_json): CREATE TABLE IF NOT EXISTS no añade
            // columnas nuevas, así que migramos con ALTER TABLE si falta.
            db.run(
              "ALTER TABLE meal_entries ADD COLUMN micros_json TEXT",
              (alterErr) => {
                if (
                  alterErr &&
                  !/duplicate column name/i.test(alterErr.message)
                ) {
                  console.error("Error adding micros_json column:", alterErr);
                  reject(alterErr);
                  return;
                }

                db.run(
                  `
                        CREATE TABLE IF NOT EXISTS saved_meals (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            name TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        )
                    `,
                  (savedMealsErr) => {
                    if (savedMealsErr) {
                      console.error(
                        "Error creating saved_meals table:",
                        savedMealsErr,
                      );
                      reject(savedMealsErr);
                      return;
                    }
                    console.log("Saved meals table ready");

                    db.run(
                      `
                            CREATE TABLE IF NOT EXISTS saved_meal_items (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                saved_meal_id INTEGER NOT NULL,
                                food_name TEXT NOT NULL,
                                quantity_grams REAL NOT NULL,
                                calories_per_100g REAL NOT NULL,
                                protein_per_100g REAL NOT NULL,
                                carbs_per_100g REAL NOT NULL,
                                fat_per_100g REAL NOT NULL,
                                source TEXT NOT NULL,
                                micros_json TEXT,
                                FOREIGN KEY (saved_meal_id) REFERENCES saved_meals(id)
                            )
                        `,
                      (savedMealItemsErr) => {
                        if (savedMealItemsErr) {
                          console.error(
                            "Error creating saved_meal_items table:",
                            savedMealItemsErr,
                          );
                          reject(savedMealItemsErr);
                          return;
                        }
                        console.log("Saved meal items table ready");
                        dbInitialized = true;
                        resolve();
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  });

  return initPromise;
};

export const closeMealsDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Meals database connection closed");
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

// Helper functions
const run = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const get = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const all = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Parses the raw micros_json TEXT column back into a micros object, mirroring
// the JSON-in-TEXT-column pattern used for `messages` in chatsDatabase.ts.
const mapRow = (row: any): MealEntryRow => {
  const { micros_json, ...rest } = row;
  return {
    ...rest,
    micros: micros_json ? JSON.parse(micros_json) : null,
  };
};

// Meal entries CRUD operations
export const mealsDb = {
  // Get all entries for a user within a date range (inclusive)
  getForUserInRange: async (
    userId: number,
    from: string,
    to: string,
  ): Promise<MealEntryRow[]> => {
    const rows = await all(
      "SELECT * FROM meal_entries WHERE user_id = ? AND logged_at >= ? AND logged_at <= ? ORDER BY logged_at DESC",
      [userId, from, to],
    );
    return rows.map(mapRow);
  },

  // Create a new meal entry
  create: async (input: CreateMealEntryInput): Promise<MealEntryRow> => {
    const microsJson =
      input.micros && Object.keys(input.micros).length > 0
        ? JSON.stringify(input.micros)
        : null;

    const result = await run(
      `INSERT INTO meal_entries
                (user_id, photo_path, food_name, quantity_grams, calories, protein_g, carbs_g, fat_g, source, logged_at, micros_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.photoPath,
        input.foodName,
        input.quantityGrams,
        input.calories,
        input.proteinG,
        input.carbsG,
        input.fatG,
        input.source,
        input.loggedAt,
        microsJson,
      ],
    );

    const row = await get("SELECT * FROM meal_entries WHERE id = ?", [
      result.lastID,
    ]);
    return mapRow(row);
  },

  // Delete an entry by id (only if it belongs to the user)
  delete: async (id: number, userId: number): Promise<boolean> => {
    const result = await run(
      "DELETE FROM meal_entries WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    return result.changes > 0;
  },

  // Look up an entry by its photo path (used to authorize photo access)
  getByPhotoPath: async (photoPath: string): Promise<MealEntryRow | null> => {
    const row = await get("SELECT * FROM meal_entries WHERE photo_path = ?", [
      photoPath,
    ]);
    return row ? mapRow(row) : null;
  },
};

const mapSavedMealItemRow = (row: any): SavedMealItemRow => {
  const { micros_json, ...rest } = row;
  return {
    ...rest,
    micros: micros_json ? JSON.parse(micros_json) : null,
  };
};

// Saved meals (reusable templates) CRUD operations
export const savedMealsDb = {
  // Get all saved meals for a user (with their items), alphabetically by name
  listForUser: async (userId: number): Promise<SavedMealRow[]> => {
    const mealRows = await all(
      "SELECT * FROM saved_meals WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC",
      [userId],
    );

    const itemRows = await all(
      `SELECT smi.* FROM saved_meal_items smi
       JOIN saved_meals sm ON sm.id = smi.saved_meal_id
       WHERE sm.user_id = ?
       ORDER BY smi.saved_meal_id, smi.id ASC`,
      [userId],
    );

    const itemsByMealId = new Map<number, SavedMealItemRow[]>();
    for (const itemRow of itemRows) {
      const item = mapSavedMealItemRow(itemRow);
      const mealId = itemRow.saved_meal_id as number;
      const items = itemsByMealId.get(mealId) || [];
      items.push(item);
      itemsByMealId.set(mealId, items);
    }

    return mealRows.map((mealRow) => ({
      ...mealRow,
      items: itemsByMealId.get(mealRow.id) || [],
    }));
  },

  // Create a new saved meal with its items
  create: async (input: CreateSavedMealInput): Promise<SavedMealRow> => {
    const result = await run(
      "INSERT INTO saved_meals (user_id, name) VALUES (?, ?)",
      [input.userId, input.name],
    );
    const savedMealId = result.lastID;

    for (const item of input.items) {
      const microsJson =
        item.micros && Object.keys(item.micros).length > 0
          ? JSON.stringify(item.micros)
          : null;

      await run(
        `INSERT INTO saved_meal_items
                    (saved_meal_id, food_name, quantity_grams, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source, micros_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          savedMealId,
          item.foodName,
          item.quantityGrams,
          item.caloriesPer100g,
          item.proteinPer100g,
          item.carbsPer100g,
          item.fatPer100g,
          item.source,
          microsJson,
        ],
      );
    }

    const mealRow = await get("SELECT * FROM saved_meals WHERE id = ?", [
      savedMealId,
    ]);
    const itemRows = await all(
      "SELECT * FROM saved_meal_items WHERE saved_meal_id = ? ORDER BY id ASC",
      [savedMealId],
    );

    return {
      ...mealRow,
      items: itemRows.map(mapSavedMealItemRow),
    };
  },

  // Delete a saved meal (and its items) by id, only if it belongs to the user
  delete: async (id: number, userId: number): Promise<boolean> => {
    const mealRow = await get(
      "SELECT id FROM saved_meals WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    if (!mealRow) return false;

    await run("DELETE FROM saved_meal_items WHERE saved_meal_id = ?", [id]);
    await run("DELETE FROM saved_meals WHERE id = ?", [id]);
    return true;
  },
};
