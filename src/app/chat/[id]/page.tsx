"use client";
import { Box, Text } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RecipeContextProvider } from '@/contexts/RecipeContext';
import { NavBar } from '@/components/NavBar';
import SharedChat from '@/components/Chat/SharedChat';
import { IMessage } from '@/components/Message/Message.types';
import styles from '../../Home.styles.module.css';
import ProtectedRoute from '@/components/ProtectedRoute';

const ChatPage = () => {
    const router = useRouter();
    const params = useParams();
    const chatId = params.id as string;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<any>(null);

    // Cargar el chat específico desde el backend
    useEffect(() => {
        const loadChat = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/chats/${chatId}`);
                if (response.ok) {
                    const chatData = await response.json();
                    setChat(chatData);
                } else {
                    throw new Error('Chat not found');
                }
            } catch (err) {
                console.error('Error loading chat:', err);
                setError('Error al cargar el chat');
            } finally {
                setLoading(false);
            }
        };

        if (chatId) {
            loadChat();
        }
    }, [chatId]);

    // Función para actualizar el chat en la base de datos
    const handleChatUpdate = async (chatId: string, messages: IMessage[]) => {
        try {
            await fetch(`/api/chats/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages })
            });
        } catch (error) {
            console.error('Error updating chat:', error);
        }
    };

    if (loading && !chat) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Text>Cargando chat...</Text>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Text color="red">{error}</Text>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <Box className={styles.homeWrapper}>
            <div className={styles.mainLayout}>
                <NavBar />
                <div className={styles.chatArea}>
                    <RecipeContextProvider>
                        <SharedChat
                            initialMessages={chat?.messages || []}
                            chatId={chatId}
                            onChatUpdate={handleChatUpdate}
                        />
                    </RecipeContextProvider>
                </div>
            </div>
        </Box>
        </ProtectedRoute>
    );
};

export default ChatPage;
