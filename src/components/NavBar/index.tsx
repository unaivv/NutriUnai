import {
    ActionIcon,
    Badge,
    Box,
    Code,
    Group,
    Text,
    TextInput,
    Tooltip,
    UnstyledButton,
    Loader,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import classes from './NavBar.module.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const mainLinks = [
    { label: 'Chat', route: '/' },
    { label: 'Recetas', route: '/recetas' }
];

export function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [chats, setChats] = useState<Array<{ label: string; route: string; chatId: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredChat, setHoveredChat] = useState<string | null>(null);
    const [deletingChat, setDeletingChat] = useState<string | null>(null);

    // Cargar chats desde el backend
    useEffect(() => {
        const fetchChats = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/chats');
                const data = await response.json();
                setChats(data.map((chat: any) => ({
                    label: chat.title,
                    route: `/chat/${chat.chat_id}`,
                    chatId: chat.chat_id
                })));
            } catch (error) {
                console.error('Error loading chats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, []);

    // Función para eliminar un chat
    const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('¿Estás seguro de que quieres eliminar este chat?')) return;

        try {
            setDeletingChat(chatId);
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Actualizar la lista de chats
                setChats(prev => prev.filter(chat => chat.chatId !== chatId));

                // Si el chat eliminado es el actual, redirigir al home
                if (pathname === `/chat/${chatId}`) {
                    router.push('/');
                }
            } else {
                console.error('Error deleting chat:', await response.json());
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        } finally {
            setDeletingChat(null);
        }
    };

    const mainLinksComponents = mainLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
            <UnstyledButton key={link.label} className={classes.mainLink}>
                <div className={classes.mainLinkInner}>
                    <Link href={link.route} className={`${classes.mainLinkText} ${isActive ? classes.active : ''}`}>{link.label}</Link>
                </div>
            </UnstyledButton>
        );
    });

    const user = { name: 'Unai Vidal' };

    return (
        <nav className={classes.navbar}>
            <div className={classes.section}>
                {/* Logo de la app */}
                <Text size="lg" fw={700} c="blue" style={{
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                }}>NutriUnai</Text>
                <div className={classes.user}>
                    <Text size="sm" fw={500} c="dimmed">
                        Hola, {user.name}
                    </Text>
                </div>
            </div>

            <div className={classes.section}>
                <Box className={classes.navbarInner}>
                    <Group>
                        <div className={classes.links}>
                            {mainLinksComponents}
                        </div>
                    </Group>
                </Box>
            </div>

            <div className={`${classes.section} ${classes.sectionGrow}`}>
                <Text size="xs" fw={500} c="dimmed">
                    Chats recientes
                </Text>
                <div className={classes.chatsSection}>
                    <div className={classes.collectionsList}>
                        {loading ? (
                            <div className={classes.collectionsLoader}>
                                <Loader size="sm" />
                            </div>
                        ) : chats.length > 0 ? (
                            <>
                                {chats.map((chat) => {
                                    const isActive = pathname === chat.route;
                                    const isHovered = hoveredChat === chat.chatId;
                                    const isDeleting = deletingChat === chat.chatId;
                                    return (
                                        <Link
                                            key={chat.route}
                                            href={chat.route}
                                            className={`${classes.collectionLink} ${isActive ? classes.collectionLinkActive : ''} ${classes.collectionLinkWithDelete}`}
                                            onMouseEnter={() => setHoveredChat(chat.chatId)}
                                            onMouseLeave={() => setHoveredChat(null)}
                                            style={{ position: 'relative' }}
                                        >
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {chat.label}
                                            </span>
                                            {(isHovered || isDeleting) && (
                                                <ActionIcon
                                                    size="sm"
                                                    color="red"
                                                    variant="transparent"
                                                    onClick={(e) => handleDeleteChat(chat.chatId, e)}
                                                    loading={isDeleting}
                                                    style={{
                                                        marginLeft: '4px',
                                                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                                                        opacity: isHovered || isDeleting ? 1 : 0,
                                                        transform: isHovered || isDeleting ? 'scale(1)' : 'scale(0.8)'
                                                    }}
                                                >
                                                    <IconTrash size={14} />
                                                </ActionIcon>
                                            )}
                                        </Link>
                                    );
                                })}
                                <Link href="/" className={classes.newChatLink}>
                                    <IconPlus size={16} />
                                    Empezar nuevo chat
                                </Link>
                            </>
                        ) : (
                            <>
                                <Text size="xs" c="dimmed" style={{ paddingTop: 6, marginBottom: 10 }}>
                                    No tienes chats guardados
                                </Text>
                                <Link href="/" className={classes.newChatButton}>
                                    <IconPlus size={16} />
                                    Empezar nuevo chat
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
