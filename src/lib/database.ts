import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'recipes.db');

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface RecipeRow {
    id?: number;
    title: string;
    content: string;
    saved_at: string;
}

export const initDatabase = (): Promise<void> => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise((resolve, reject) => {
        if (dbInitialized) {
            resolve();
            return;
        }

        console.log('Initializing database at:', DB_PATH);

        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');

            // Create recipes table if it doesnt exist
            db.run(`
                CREATE TABLE IF NOT EXISTS recipes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    reject(err);
                } else {
                    console.log('Recipes table ready');
                    dbInitialized = true;
                    resolve();
                }
            });
        });
    });

    return initPromise;
};

export const closeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

// Helper function to run queries with promises
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

// Recipe CRUD operations
export const recipeDb = {
    // Get all recipes
    getAll: async (): Promise<RecipeRow[]> => {
        const rows = await all('SELECT * FROM recipes ORDER BY saved_at DESC');
        return rows.map(row => ({
            ...row,
            saved_at: row.saved_at
        }));
    },

    // Get recipe by ID
    getById: async (id: number): Promise<RecipeRow | null> => {
        return await get('SELECT * FROM recipes WHERE id = ?', [id]);
    },

    // Create new recipe
    create: async (title: string, content: string): Promise<RecipeRow> => {
        const result = await run(
            'INSERT INTO recipes (title, content) VALUES (?, ?)',
            [title, content]
        );

        const newRecipe = await get('SELECT * FROM recipes WHERE id = ?', [result.lastID]);
        return newRecipe;
    },

    // Delete recipe by ID
    delete: async (id: number): Promise<boolean> => {
        const result = await run('DELETE FROM recipes WHERE id = ?', [id]);
        return result.changes > 0;
    },

    // Check if recipe content already exists
    existsByContent: async (content: string): Promise<boolean> => {
        const recipe = await get('SELECT id FROM recipes WHERE content = ?', [content]);
        return !!recipe;
    }
};
