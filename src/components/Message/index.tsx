import React, { useContext } from 'react';
import styles from './Message.styles.module.css';
import Avatar from '../Avatar';
import { RecipeContext } from '@/contexts/RecipeContext';
import { ChatContext } from '@/contexts/ChatContext';
import { containsRecipe, extractRecipeTitle } from '@/utils/recipeDetector';
import { IMessage } from './Message.types';

const Message: React.FC<{ message: IMessage }> = ({ message }) => {
    const isSystem = message.sender === 'System';
    const { saveRecipe, isRecipeSaved, loading } = useContext(RecipeContext);
    const { selectedPlan } = useContext(ChatContext);

    // Check if this system message contains a recipe
    const hasRecipe = isSystem && containsRecipe(message.text);
    const isSaved = hasRecipe && isRecipeSaved(message.text);

    const handleSaveRecipe = async () => {
        if (hasRecipe && !isSaved && !loading) {
            try {
                const title = extractRecipeTitle(message.text);
                // Use plan from message if available, otherwise use selectedPlan from context
                const plan = message.plan || selectedPlan;
                await saveRecipe(title, message.text, plan);
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
                {message.planLabel && (
                    <div className={styles.planIndicator}>
                        <span style={{
                            backgroundColor: message.plan === 'unai' ? '#339af0' : message.plan === 'marifeli' ? '#e64980' : '#9775fa',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            marginBottom: '8px'
                        }}>
                            {message.planLabel}
                        </span>
                    </div>
                )}
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