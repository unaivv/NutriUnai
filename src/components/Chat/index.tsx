import { ActionIcon, TextInput } from '@mantine/core';
import styles from './Chat.styles.module.css';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import Message from '../Message';
import { IMessage } from '../Message/Message.types';

const Chat = () => {
    const messages: IMessage[] = [
        {
            sender: 'System',
            text: '¡Bienvenido al chat! ¿En qué puedo ayudarte hoy?'
        },
        {
            sender: 'User',
            text: 'Hola, ¿puedes ayudarme con mi cuenta?',
        }
    ];

    const renderMessages = () => {
        return messages.map((message, index) => (
            <Message key={index} message={message} />
        ));
    };

    return (
        <div className={styles.chat}>
            {renderMessages()}
            <div className={styles.bottomBar}>
                <TextInput
                    radius="xl"
                    size="md"
                    placeholder="Search questions"
                    rightSectionWidth={42}
                    leftSection={<IconSearch size={18} stroke={1.5} />}
                    rightSection={
                        <ActionIcon size={32} radius="xl">
                            <IconArrowRight size={18} stroke={1.5} />
                        </ActionIcon>
                    }
                />
            </div>
        </div>
    );
};

export default Chat;