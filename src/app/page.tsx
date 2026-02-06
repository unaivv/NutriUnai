"use client";
import { Box } from '@mantine/core';
import { NavBar } from '@/components/NavBar';
import styles from './Home.styles.module.css';
import Chat from '@/components/Chat';
import { UserNameContext } from '@/contexts/UserNameContext';


export default function ChatPage() {
  return (
    <UserNameContext.Provider value={{ name: 'Unai' }}>
      <Box className={styles.homeWrapper}>
        <NavBar />
        <Chat />
      </Box>
    </UserNameContext.Provider>
  );
}