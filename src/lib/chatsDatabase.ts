import sqlite3 from 'sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'chats.db');

let db: sqlite3.Database;
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export interface ChatRow {
    id?: number;
    chat_id: string;
    title: string;
    messages: string; // JSON string
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

            // Create chats table if it doesn't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS chats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    messages TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    // Get all chats
    getAll: async (): Promise<ChatRow[]> => {
        const rows = await all('SELECT * FROM chats ORDER BY created_at DESC');
        return rows.map(row => ({
            ...row,
            messages: JSON.parse(row.messages)
        }));
    },

    // Get chat by ID
    getByChatId: async (chatId: string): Promise<ChatRow | null> => {
        const row = await get('SELECT * FROM chats WHERE chat_id = ?', [chatId]);
        if (row) {
            return {
                ...row,
                messages: JSON.parse(row.messages)
            };
        }
        return null;
    },

    // Create new chat
    create: async (chatId: string, title: string, messages: any[]): Promise<ChatRow> => {
        const result = await run(
            'INSERT INTO chats (chat_id, title, messages) VALUES (?, ?, ?)',
            [chatId, title, JSON.stringify(messages)]
        );

        const newChat = await get('SELECT * FROM chats WHERE id = ?', [result.lastID]);
        return {
            ...newChat,
            messages: JSON.parse(newChat.messages)
        };
    },

    // Update chat messages
    updateMessages: async (chatId: string, messages: any[]): Promise<boolean> => {
        const result = await run(
            'UPDATE chats SET messages = ? WHERE chat_id = ?',
            [JSON.stringify(messages), chatId]
        );
        return result.changes > 0;
    },

    // Delete chat by chat_id
    delete: async (chatId: string): Promise<boolean> => {
        const result = await run('DELETE FROM chats WHERE chat_id = ?', [chatId]);
        return result.changes > 0;
    },

    // Check if chat exists
    exists: async (chatId: string): Promise<boolean> => {
        const chat = await get('SELECT chat_id FROM chats WHERE chat_id = ?', [chatId]);
        return !!chat;
    }
};
