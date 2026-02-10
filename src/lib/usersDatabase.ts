import sqlite3 from 'sqlite3';
import { join } from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = join(process.cwd(), 'users.db');

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface UserRow {
    id: number;
    email: string;
    password_hash: string;
    name: string;
    created_at: string;
}

export const initUsersDatabase = (): Promise<void> => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise((resolve, reject) => {
        if (dbInitialized) {
            resolve();
            return;
        }

        console.log('Initializing users database at:', DB_PATH);

        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening users database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite users database');

            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    reject(err);
                } else {
                    console.log('Users table ready');
                    dbInitialized = true;
                    resolve();
                }
            });
        });
    });

    return initPromise;
};

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

export const usersDb = {
    createUser: async (email: string, password: string, name: string): Promise<UserRow> => {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await run(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [email, passwordHash, name]
        );
        const newUser = await get('SELECT id, email, name, created_at FROM users WHERE id = ?', [result.lastID]);
        return newUser;
    },

    findByEmail: async (email: string): Promise<UserRow | null> => {
        const row = await get('SELECT * FROM users WHERE email = ?', [email]);
        return row || null;
    },

    validatePassword: async (password: string, hash: string): Promise<boolean> => {
        return bcrypt.compare(password, hash);
    }
};
