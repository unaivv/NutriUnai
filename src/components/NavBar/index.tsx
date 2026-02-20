import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Code,
    Group,
    Text,
    TextInput,
    Tooltip,
    UnstyledButton,
    Loader,
    Drawer,
    Burger,
} from '@mantine/core';
import { IconPlus, IconTrash, IconLogout, IconX } from '@tabler/icons-react';
import classes from './NavBar.module.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDisclosure } from '@mantine/hooks';

const mainLinks = [
    { label: 'Chat', route: '/' },
    { label: 'Recetas', route: '/recetas' }
];

export function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [chats, setChats] = useState<Array<{ label: string; route: string; chatId: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredChat, setHoveredChat] = useState<string | null>(null);
    const [deletingChat, setDeletingChat] = useState<string | null>(null);
    const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es pantalla móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Función para manejar clic en enlaces (cerrar drawer en móvil)
    const handleLinkClick = () => {
        if (isMobile) {
            closeMobile();
        }
    };

    const mainLinksComponents = mainLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
            <UnstyledButton key={link.label} className={classes.mainLink}>
                <div className={classes.mainLinkInner}>
                    <Link 
                        href={link.route} 
                        className={`${classes.mainLinkText} ${isActive ? classes.active : ''}`}
                        onClick={handleLinkClick}
                    >
                        {link.label}
                    </Link>
                </div>
            </UnstyledButton>
        );
    });

    const userDisplayName = user?.name || 'Usuario';

    // Contenido del navbar (para desktop y drawer)
    const navbarContent = (
        <>
            <div className={classes.section}>
                {/* Logo de la app */}
                <Text size="lg" fw={700} c="blue" style={{
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                }}>NutriUnai</Text>
                <div className={classes.user}>
                    <Text size="sm" fw={500} c="dimmed">
                        Hola, {userDisplayName}
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
                                            onClick={handleLinkClick}
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
                                <Link href="/" className={classes.newChatLink} onClick={handleLinkClick}>
                                    <IconPlus size={16} />
                                    Empezar nuevo chat
                                </Link>
                            </>
                        ) : (
                            <>
                                <Text size="xs" c="dimmed" style={{ paddingTop: 6, marginBottom: 10 }}>
                                    No tienes chats guardados
                                </Text>
                                <Link href="/" className={classes.newChatButton} onClick={handleLinkClick}>
                                    <IconPlus size={16} />
                                    Empezar nuevo chat
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={classes.section} style={{ marginTop: 'auto' }}>
                <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<IconLogout size={14} />}
                    onClick={() => {
                        logout();
                        if (isMobile) closeMobile();
                    }}
                    fullWidth
                >
                    Cerrar sesión
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Versión Desktop */}
            {!isMobile && (
                <nav className={classes.navbar}>
                    {navbarContent}
                </nav>
            )}
            
            {/* Versión Mobile - Burger button */}
            {isMobile && (
                <div className={classes.mobileHeader}>
                    <Group justify="space-between" w="100%">
                        <Text size="lg" fw={700} c="blue" style={{
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                        }}>NutriUnai</Text>
                        <Burger
                            opened={mobileOpened}
                            onClick={toggleMobile}
                            size="sm"
                            color="var(--mantine-color-blue-6)"
                        />
                    </Group>
                </div>
            )}

            {/* Drawer para Mobile */}
            <Drawer
                opened={mobileOpened}
                onClose={closeMobile}
                size="280px"
                padding="md"
                title={
                    <Group>
                        <Text size="lg" fw={700} c="blue">NutriUnai</Text>
                        <ActionIcon size="sm" onClick={closeMobile}>
                            <IconX size={16} />
                        </ActionIcon>
                    </Group>
                }
                withCloseButton={false}
                overlayProps={{ opacity: 0.5, blur: 4 }}
            >
                <div className={classes.mobileDrawerContent}>
                    {navbarContent}
                </div>
            </Drawer>
        </>
    );
}
