"use client";
import { Box } from '@mantine/core';
import { NavBar } from '@/components/NavBar';
import styles from './Home.styles.module.css';
import { ChatContextProvider } from '@/contexts/ChatContext';
import { RecipeContextProvider } from '@/contexts/RecipeContext';
import Chat from '@/components/Chat';
import { UserNameContext } from '@/contexts/UserNameContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <Box className={styles.homeWrapper}>
        <div className={styles.mainLayout}>
          <NavBar />
          <div className={styles.chatArea}>
            <UserNameContext.Provider value={{ name: 'Unai' }}>
              <RecipeContextProvider>
                <ChatContextProvider>
                  <Chat />
                </ChatContextProvider>
              </RecipeContextProvider>
            </UserNameContext.Provider>
          </div>
        </div>
      </Box>
    </ProtectedRoute>
  );
}