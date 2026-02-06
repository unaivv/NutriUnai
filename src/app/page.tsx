"use client";
import { Box } from '@mantine/core';
import { NavBar } from '@/components/NavBar';
import styles from './Home.styles.module.css';
import { ChatContextProvider } from '@/contexts/ChatContext';
import Chat from '@/components/Chat';
import { UserNameContext } from '@/contexts/UserNameContext';


export default function ChatPage() {
  return (
    <Box className={styles.homeWrapper}>
      <div className={styles.mainLayout}>
        <NavBar />
        <div className={styles.chatArea}>
          <UserNameContext.Provider value={{ name: 'Unai' }}>
            <ChatContextProvider>
              <Chat />
            </ChatContextProvider>
          </UserNameContext.Provider>
        </div>
      </div>
    </Box>


  );
}