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
            <UserNameContext.Provider value={{ name: 'Unai' }}>
              <ChatContextProvider>
                <NavBar />
                <Chat />
              </ChatContextProvider>
            </UserNameContext.Provider>
          </Box>


  );
}