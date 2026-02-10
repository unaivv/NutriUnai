import { IMessage } from '@/components/Message/Message.types';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export interface IChatContext {
    messages: IMessage[];
    addMessage: (message: IMessage) => void;
    chatHistory: ChatHistory[];
    saveChatHistory: () => void;
    clearChatHistory: () => void;
    setChatHistory: React.Dispatch<React.SetStateAction<ChatHistory[]>>;
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    createNewChat: () => string;
}

export interface ChatHistory {
    id: string;
    title: string;
    messages: IMessage[];
    createdAt: string;
}

const defaultMessages: IMessage[] = [{
    sender: 'System',
    text: 'Soy tu asistente de nutrición. ¿Qué necesitas?'
}];

const defaultValue: IChatContext = {
    messages: defaultMessages,
    addMessage: () => { },
    chatHistory: [],
    saveChatHistory: () => { },
    clearChatHistory: () => { },
    setChatHistory: () => { },
    currentChatId: null,
    setCurrentChatId: () => { },
    createNewChat: () => ''
};

const ChatContext = createContext<IChatContext>(defaultValue);

export const ChatContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<IMessage[]>(defaultMessages);
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    // Load chat history from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chatHistory');
            if (saved) {
                setChatHistory(JSON.parse(saved));
            }
        }
    }, []);

    // Save chat history whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }, [chatHistory]);

    const addMessage = useCallback((message: IMessage) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    const saveChatHistory = useCallback(async () => {
        if (messages.length > 1) { // Don't save if just the welcome message
            const title = messages[1]?.text.substring(0, 50) + '...' || 'Nuevo Chat';
            const newChat: ChatHistory = {
                id: Date.now().toString(),
                title,
                messages: [...messages],
                createdAt: new Date().toISOString()
            };

            // Guardar en el backend
            try {
                const response = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title,
                        messages: newChat.messages
                    })
                });

                if (response.ok) {
                    const savedChat = await response.json();
                    setChatHistory(prev => [savedChat, ...prev]);
                } else {
                    throw new Error('Failed to save chat');
                }
            } catch (error) {
                console.error('Error saving chat to backend:', error);
            }
        }
    }, [messages]);

    const clearChatHistory = useCallback(() => {
        setChatHistory([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('chatHistory');
        }
    }, []);

    const createNewChat = useCallback(() => {
        const newId = Date.now().toString();
        setCurrentChatId(newId);
        setMessages(defaultMessages);
        return newId;
    }, []);

    return (
        <ChatContext.Provider value={{
            messages,
            addMessage,
            chatHistory,
            saveChatHistory,
            clearChatHistory,
            setChatHistory,
            currentChatId,
            setCurrentChatId,
            createNewChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const ChatProvider = ChatContextProvider;
export { ChatContext };
export default ChatContext;
