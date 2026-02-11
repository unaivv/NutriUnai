import { ActionIcon, TextInput, SegmentedControl, Badge } from '@mantine/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Chat.styles.module.css';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import Message from '../Message';
import { IMessage } from '../Message/Message.types';
import ChatContext, { IChatContext, NutritionPlan } from '@/contexts/ChatContext';

const Chat = () => {
    const router = useRouter();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const { messages, addMessage, saveChatHistory, currentChatId, createNewChat, selectedPlan, setSelectedPlan } = useContext(ChatContext) as IChatContext;

    const renderMessages = () => {
        return messages.map((message: IMessage, index: number) => (
            <Message key={index} message={message} />
        ));
    };

    const submitMessage = async () => {
        const userText = text.trim();
        if (!userText || loading) return;

        // Si no hay un chat actual, guardar el chat primero y luego redirigir
        if (!currentChatId) {
            try {
                setLoading(true);

                // Guardar el chat en el backend primero
                const title = userText.substring(0, 50) + '...';
                const response = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title,
                        messages: [
                            { sender: 'System', text: 'Soy tu asistente de nutrición. ¿Qué necesitas?' },
                            { sender: 'User', text: userText }
                        ]
                    })
                });

                if (response.ok) {
                    const savedChat = await response.json();
                    const chatId = savedChat.chat_id;

                    // Primero obtener la respuesta de la IA
                    const apiMessages = [
                        { role: 'assistant', content: 'Soy tu asistente de nutrición. ¿Qué necesitas?' },
                        { role: 'user', content: userText }
                    ];

                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: apiMessages, plan: selectedPlan })
                    });
                    const data = await res.json();
                    const aiResponse = data.content ?? '';
                    const responsePlan = data.plan || selectedPlan;
                    const responsePlanLabel = data.planLabel || getPlanLabel(selectedPlan);

                    // Actualizar el chat con la respuesta completa (mensaje de bienvenida + usuario + IA)
                    await fetch(`/api/chats/${chatId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                { sender: 'System', text: 'Soy tu asistente de nutrición. ¿Qué necesitas?' },
                                { sender: 'User', text: userText },
                                { sender: 'System', text: aiResponse, plan: responsePlan, planLabel: responsePlanLabel }
                            ]
                        })
                    });

                    // Ahora redirigir al chat guardado con la conversación completa
                    router.push(`/chat/${chatId}`);
                } else {
                    throw new Error('Failed to save chat');
                }
            } catch (e) {
                console.error('Error creating chat:', e);
                addMessage({
                    sender: 'System',
                    text: `Error al crear chat: ${e instanceof Error ? e.message : 'Inténtalo de nuevo.'}`
                });
            } finally {
                setLoading(false);
                setText('');
            }
            return;
        }

        // Flujo normal para chats existentes
        addMessage({ sender: 'User', text: userText });
        setText('');
        setLoading(true);

        const apiMessages = messages
            .concat([{ sender: 'User' as const, text: userText }])
            .map((m) => ({
                role: m.sender === 'User' ? ('user' as const) : ('assistant' as const),
                content: m.text
            }));

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages, plan: selectedPlan })
            });
            const data = await res.json();
            const responsePlan = data.plan || selectedPlan;
            const responsePlanLabel = data.planLabel || getPlanLabel(selectedPlan);

            addMessage({ sender: 'System', text: data.content ?? '', plan: responsePlan, planLabel: responsePlanLabel });

            // Guardar el chat en el historial después de recibir respuesta
            await saveChatHistory();
        } catch (e) {
            addMessage({
                sender: 'System',
                text: `Error de conexión: ${e instanceof Error ? e.message : 'Inténtalo de nuevo.'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const getPlanLabel = (plan: NutritionPlan) => {
        switch (plan) {
            case 'unai': return 'Unai';
            case 'marifeli': return 'Mari Feli';
            case 'both': return 'Ambos';
        }
    };

    const getPlanColor = (plan: NutritionPlan) => {
        switch (plan) {
            case 'unai': return 'blue';
            case 'marifeli': return 'pink';
            case 'both': return 'grape';
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
                <div className={styles.planSelector}>
                    <Badge color={getPlanColor(selectedPlan)} size="sm" variant="light">
                        Plan: {getPlanLabel(selectedPlan)}
                    </Badge>
                    <SegmentedControl
                        value={selectedPlan}
                        onChange={(value) => setSelectedPlan(value as NutritionPlan)}
                        data={[
                            { label: 'Unai', value: 'unai' },
                            { label: 'Mari Feli', value: 'marifeli' },
                            { label: 'Ambos', value: 'both' }
                        ]}
                        size="xs"
                        disabled={loading}
                    />
                </div>
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