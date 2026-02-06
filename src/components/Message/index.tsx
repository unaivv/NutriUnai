import React from 'react';
import styles from './Message.styles.module.css';
import Avatar from '../Avatar';

interface IMessage {
    sender: 'System' | 'User';
    text: string;
    userName?: string; // Para obtener la inicial del usuario
}

const Message: React.FC<{ message: IMessage }> = ({ message }) => {
    const isSystem = message.sender === 'System';
    console.log(message)
    return (
        <div className={`${styles.message} ${isSystem ? styles.system : styles.user}`}>
            <Avatar
                isSystem={isSystem}
            />
            <div className={styles.text}>{message.text}</div>
        </div>
    );
};

export default Message;
export type { IMessage };