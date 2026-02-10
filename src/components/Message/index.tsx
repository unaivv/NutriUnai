import React, { useContext } from 'react';
import styles from './Message.styles.module.css';
import Avatar from '../Avatar';
import { RecipeContext } from '@/contexts/RecipeContext';
import { containsRecipe, extractRecipeTitle } from '@/utils/recipeDetector';

interface IMessage {
    sender: 'System' | 'User';
    text: string;
    userName?: string; // Para obtener la inicial del usuario
}

const Message: React.FC<{ message: IMessage }> = ({ message }) => {
    const isSystem = message.sender === 'System';
    const { saveRecipe, isRecipeSaved, loading } = useContext(RecipeContext);

    // Check if this system message contains a recipe
    const hasRecipe = isSystem && containsRecipe(message.text);
    const isSaved = hasRecipe && isRecipeSaved(message.text);

    const handleSaveRecipe = async () => {
        if (hasRecipe && !isSaved && !loading) {
            try {
                const title = extractRecipeTitle(message.text);
                await saveRecipe(title, message.text);
            } catch (error) {
                console.error('Error saving recipe:', error);
                // El error ya se maneja en el contexto
            }
        }
    };

    return (
        <div className={`${styles.message} ${isSystem ? styles.system : styles.user}`}>
            <Avatar
                isSystem={isSystem}
            />
            <div className={styles.content}>
                <div className={styles.text} dangerouslySetInnerHTML={{ __html: message.text }} />
                {hasRecipe && (
                    <button
                        className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
                        onClick={handleSaveRecipe}
                        disabled={isSaved || loading}
                    >
                        {loading ? 'Guardando...' : isSaved ? '✓ Guardada' : 'Guardar receta'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Message;
export type { IMessage };