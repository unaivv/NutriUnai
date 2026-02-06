import { IMessage } from '@/components/Message/Message.types';
import React, { createContext, useCallback, useState } from 'react';

export interface IChatContext {
    messages: IMessage[];
    addMessage: (message: IMessage) => void;
}

const defaultMessages: IMessage[] = [{
    sender: 'System',
    text: 'Soy tu asistente de nutrición. ¿Qué necesitas?'
}];

const defaultValue: IChatContext = {
    messages: defaultMessages,
    addMessage: () => null
};

const ChatContext = createContext<IChatContext>(defaultValue);

export const ChatContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<IMessage[]>(defaultMessages);

    const addMessage = useCallback((message: IMessage) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    return (
        <ChatContext.Provider value={{ messages, addMessage }}>
            {children}
        </ChatContext.Provider>
    );
};

export const ChatProvider = ChatContextProvider;
export default ChatContext;
