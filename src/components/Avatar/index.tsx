import { UserNameContext } from '@/contexts/UserNameContext';
import React, { useContext } from 'react';
import styles from './Avatar.styles.module.css';
import { IAvatarProps } from './Avatar.types';

const Avatar: React.FC<IAvatarProps> = ({ isSystem }: IAvatarProps) => {
    const userName = useContext(UserNameContext);
    return isSystem ? (
        <div className={styles.icon}>🤖</div>
    ) : (
        <div className={styles.avatar}>
            {userName?.name?.charAt(0).toUpperCase()}
        </div>
    );
};
export default Avatar;