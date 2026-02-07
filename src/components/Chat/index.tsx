import { ActionIcon, TextInput } from '@mantine/core';
import { useContext, useEffect, useRef, useState } from 'react';
import styles from './Chat.styles.module.css';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import Message from '../Message';
import { IMessage } from '../Message/Message.types';
import ChatContext, { IChatContext } from '@/contexts/ChatContext';

const Chat = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const { messages, addMessage } = useContext(ChatContext) as IChatContext;

    const renderMessages = () => {
        return messages.map((message: IMessage, index: number) => (
            <Message key={index} message={message} />
        ));
    };

    const submitMessage = async () => {
        const userText = text.trim();
        if (!userText || loading) return;

        addMessage({ sender: 'User', text: userText });
        setText('');
        setLoading(true);

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

            if (!res.ok) {
                addMessage({
                    sender: 'System',
                    text: `Error: ${data.error ?? res.statusText}. Comprueba que OPENAI_API_KEY esté configurada.`
                });
                return;
            }
            addMessage({ sender: 'System', text: data.content ?? '' });
        } catch (e) {
            addMessage({
                sender: 'System',
                text: `Error de conexión: ${e instanceof Error ? e.message : 'Inténtalo de nuevo.'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

export default Chat;