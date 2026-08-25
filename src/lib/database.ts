import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'recipes.db');

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface RecipeRow {
    id?: number;
    user_id: number;
    title: string;
    content: string;
    saved_at: string;
    plan?: 'unai' | 'marifeli' | 'both';
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
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    plan TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
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
    // Get all recipes for a user
    getAllForUser: async (userId: number): Promise<RecipeRow[]> => {
        const rows = await all('SELECT * FROM recipes WHERE user_id = ? ORDER BY saved_at DESC', [userId]);
        return rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            content: row.content,
            saved_at: row.saved_at,
            plan: row.plan
        }));
    },

    // Get recipe by ID (only if belongs to user)
    getById: async (id: number, userId?: number): Promise<RecipeRow | null> => {
        let query = 'SELECT * FROM recipes WHERE id = ?';
        const params: any[] = [id];

        if (userId !== undefined) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        return await get(query, params);
    },

    // Create new recipe for user
    create: async (userId: number, title: string, content: string, plan?: 'unai' | 'marifeli' | 'both'): Promise<RecipeRow> => {
        const result = await run(
            'INSERT INTO recipes (user_id, title, content, plan) VALUES (?, ?, ?, ?)',
            [userId, title, content, plan || null]
        );

        const newRecipe = await get('SELECT * FROM recipes WHERE id = ?', [result.lastID]);
        return newRecipe;
    },

    // Delete recipe by ID (only if belongs to user)
    delete: async (id: number, userId: number): Promise<boolean> => {
        const result = await run('DELETE FROM recipes WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    },

    // Check if recipe content already exists for user
    existsByContent: async (content: string, userId: number): Promise<boolean> => {
        const recipe = await get('SELECT id FROM recipes WHERE content = ? AND user_id = ?', [content, userId]);
        return !!recipe;
    }
};
