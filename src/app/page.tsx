"use client";
import React, { useState } from 'react';
import { Box, Stack, ScrollArea, Text, TextInput, Button } from '@mantine/core';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return; // Prevent sending empty messages

    const newMessage = { sender: 'User', text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');

    // Simulate a response from the system
    simulateResponse(input).then((response) => {
      setMessages((prevMessages) => [...prevMessages, { sender: 'System', text: response }]);
    });
  };

  const simulateResponse = (message: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Respuesta simulada para: "${message}"`);
      }, 1000);
    });
  };

  return (
    <Box style={{ maxWidth: 600, margin: 'auto', padding: '1rem' }}>
      <Stack>
        <ScrollArea style={{ height: 400, border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem' }}>
          <Stack>
            {messages.map((msg, index) => (
              <Text key={index} color={msg.sender === 'User' ? 'blue' : 'green'}>
                <strong>{msg.sender}:</strong> {msg.text}
              </Text>
            ))}
          </Stack>
        </ScrollArea>
        <TextInput
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>Enviar</Button>
      </Stack>
    </Box>
  );
}