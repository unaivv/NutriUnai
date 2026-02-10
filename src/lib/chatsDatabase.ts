import sqlite3 from 'sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'chats.db');

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface ChatRow {
    id?: number;
    chat_id: string;
    user_id: number;
    title: string;
    messages: string;
    created_at: string;
}

export const initChatsDatabase = (): Promise<void> => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise((resolve, reject) => {
        if (dbInitialized) {
            resolve();
            return;
        }

        console.log('Initializing chats database at:', DB_PATH);

        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening chats database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite chats database');

            db.run(`
                CREATE TABLE IF NOT EXISTS chats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    messages TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating chats table:', err);
                    reject(err);
                } else {
                    console.log('Chats table ready');
                    dbInitialized = true;
                    resolve();
                }
            });
        });
    });

    return initPromise;
};

export const closeChatsDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Chats database connection closed');
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

// Chat CRUD operations
export const chatsDb = {
    // Get all chats for a specific user
    getAllForUser: async (userId: number): Promise<ChatRow[]> => {
        const rows = await all('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows.map(row => ({
            ...row,
            messages: JSON.parse(row.messages)
        }));
    },

    // Get chat by ID (only if belongs to user)
    getByChatId: async (chatId: string, userId?: number): Promise<ChatRow | null> => {
        let query = 'SELECT * FROM chats WHERE chat_id = ?';
        const params: any[] = [chatId];

        if (userId !== undefined) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const row = await get(query, params);
        if (row) {
            return {
                ...row,
                messages: JSON.parse(row.messages)
            };
        }
        return null;
    },

    // Create new chat
    create: async (chatId: string, userId: number, title: string, messages: any[]): Promise<ChatRow> => {
        const result = await run(
            'INSERT INTO chats (chat_id, user_id, title, messages) VALUES (?, ?, ?, ?)',
            [chatId, userId, title, JSON.stringify(messages)]
        );

        const newChat = await get('SELECT * FROM chats WHERE id = ?', [result.lastID]);
        return {
            ...newChat,
            messages: JSON.parse(newChat.messages)
        };
    },

    // Update chat messages (only if belongs to user)
    updateMessages: async (chatId: string, userId: number, messages: any[]): Promise<boolean> => {
        const result = await run(
            'UPDATE chats SET messages = ? WHERE chat_id = ? AND user_id = ?',
            [JSON.stringify(messages), chatId, userId]
        );
        return result.changes > 0;
    },

    // Delete chat by chat_id (only if belongs to user)
    delete: async (chatId: string, userId: number): Promise<boolean> => {
        const result = await run('DELETE FROM chats WHERE chat_id = ? AND user_id = ?', [chatId, userId]);
        return result.changes > 0;
    },

    // Check if chat exists for user
    exists: async (chatId: string, userId: number): Promise<boolean> => {
        const chat = await get('SELECT chat_id FROM chats WHERE chat_id = ? AND user_id = ?', [chatId, userId]);
        return !!chat;
    }
};
