import { ActionIcon, TextInput } from '@mantine/core';
import { useContext, useState } from 'react';
import styles from './Chat.styles.module.css';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import Message from '../Message';
import { IMessage } from '../Message/Message.types';
import ChatContext, { IChatContext } from '@/contexts/ChatContext';

const Chat = () => {
    const [text, setText] = useState('');
    const { messages, addMessage } = useContext(ChatContext) as IChatContext;

    const renderMessages = () => {
        return messages.map((message: IMessage, index: number) => (
            <Message key={index} message={message} />
        ));
    };
    const sumbitMessage = () => {
        addMessage({ sender: 'User', text: text })
        setText('');
    }
    return (
        <div className={styles.chat}>
            {renderMessages()}
            <div className={styles.bottomBar}>
                <TextInput
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    radius="xl"
                    onKeyDown={(event) => event.key === 'Enter' ? sumbitMessage() : null}
                    size="md"
                    placeholder="Search questions"
                    rightSectionWidth={42}
                    leftSection={<IconSearch size={18} stroke={1.5} />}
                    rightSection={
                        <ActionIcon size={32} radius="xl" onClick={() => sumbitMessage()}>
                            <IconArrowRight size={18} stroke={1.5} />
                        </ActionIcon>
                    }
                />
            </div>
        </div>
    );
};

export default Chat;