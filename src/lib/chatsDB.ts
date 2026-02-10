// Base de datos compartida para chats
export interface ChatData {
    id: string;
    title: string;
    messages: Array<{
        sender: 'User' | 'System';
        text: string;
    }>;
    createdAt: string;
}

// Base de datos en memoria compartida entre todos los endpoints
export let chatsDB: ChatData[] = [];

// Funciones helper para la base de datos
export const chatDb = {
    getAll: (): ChatData[] => chatsDB,
    
    getById: (id: string): ChatData | undefined => {
        return chatsDB.find(chat => chat.id === id);
    },
    
    create: (chat: Omit<ChatData, 'id' | 'createdAt'>): ChatData => {
        const newChat: ChatData = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...chat
        };
        chatsDB.unshift(newChat); // El más reciente primero
        return newChat;
    },
    
    delete: (id: string): boolean => {
        const initialLength = chatsDB.length;
        chatsDB = chatsDB.filter(chat => chat.id !== id);
        return chatsDB.length < initialLength;
    },
    
    exists: (id: string): boolean => {
        return chatsDB.some(chat => chat.id === id);
    }
};
