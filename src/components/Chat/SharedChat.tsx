import { ActionIcon, TextInput } from '@mantine/core';
import { useState, useEffect, useRef } from 'react';
import styles from './Chat.styles.module.css';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import Message from '../Message';
import { IMessage } from '../Message/Message.types';

interface SharedChatProps {
    initialMessages?: IMessage[];
    onMessagesUpdate?: (messages: IMessage[]) => void;
    onChatUpdate?: (chatId: string, messages: IMessage[]) => void;
    chatId?: string;
}

const SharedChat: React.FC<SharedChatProps> = ({
    initialMessages = [],
    onMessagesUpdate,
    onChatUpdate,
    chatId
}) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    // Si no hay mensajes iniciales, mostrar el mensaje de bienvenida por defecto
    const [messages, setMessages] = useState<IMessage[]>(
        initialMessages.length > 0
            ? initialMessages
            : [{ sender: 'System', text: 'Soy tu asistente de nutrición. ¿Qué necesitas?' }]
    );
    const bottomRef = useRef<HTMLDivElement>(null);

    // Sincronizar mensajes con el padre
    useEffect(() => {
        if (onMessagesUpdate) {
            onMessagesUpdate(messages);
        }
    }, [messages, onMessagesUpdate]);

    // Actualizar chat en base de datos cuando cambian los mensajes
    useEffect(() => {
        if (chatId && onChatUpdate && messages.length > 1) {
            onChatUpdate(chatId, messages);
        }
    }, [chatId, messages, onChatUpdate]);

    // Auto-scroll al final
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const renderMessages = () => {
        return messages.map((message: IMessage, index: number) => (
            <Message key={index} message={message} />
        ));
    };

    const submitMessage = async () => {
        const userText = text.trim();
        if (!userText || loading) return;

        // Agregar mensaje del usuario
        setMessages(prev => [...prev, { sender: 'User', text: userText }]);
        setText('');
        setLoading(true);

        // Enviar a la IA
        const apiMessages = messages
            .concat([{ sender: 'User' as const, text: userText }])
            .map((m) => ({
                role: m.sender === 'User' ? 'user' as const : 'assistant' as const,
                content: m.text
            }));

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });
            const data = await res.json();

            // Agregar respuesta de la IA
            setMessages(prev => [...prev, { sender: 'System', text: data.content ?? '' }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                sender: 'System',
                text: `Error de conexión: ${e instanceof Error ? e.message : 'Inténtalo de nuevo.'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.chat}>
            <div className={styles.messagesWrapper}>
                {renderMessages()}
                <div ref={bottomRef} />
            </div>
            <div className={styles.bottomBar}>
                <TextInput
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    radius="xl"
                    onKeyDown={(event) => event.key === 'Enter' ? submitMessage() : null}
                    size="md"
                    placeholder="Search questions"
                    rightSectionWidth={42}
                    leftSection={<IconSearch size={18} stroke={1.5} />}
                    rightSection={
                        <ActionIcon size={32} radius="xl" onClick={() => submitMessage()} loading={loading} disabled={loading}>
                            <IconArrowRight size={18} stroke={1.5} />
                        </ActionIcon>
                    }
                />
            </div>
        </div>
    );
};

export default SharedChat;
