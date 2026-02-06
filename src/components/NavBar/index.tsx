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
} from '@mantine/core';
import classes from './NavBar.module.css';

const links = [
    { label: 'Activity' },
    { label: 'Tasks' },
    { label: 'Contacts' },
];

const chats = [
    { emoji: '👍', label: 'Sales' },
    { emoji: '🚚', label: 'Deliveries' },
    { emoji: '💸', label: 'Discounts' },
    { emoji: '💰', label: 'Profits' },
    { emoji: '✨', label: 'Reports' },
    { emoji: '🛒', label: 'Orders' },
    { emoji: '📅', label: 'Events' },
    { emoji: '🙈', label: 'Debts' },
    { emoji: '💁‍♀️', label: 'Customers' },
];

export function NavBar() {
    const mainLinks = links.map((link) => (
        <UnstyledButton key={link.label} className={classes.mainLink}>
            <div className={classes.mainLinkInner}>
                <span>{link.label}</span>
            </div>
        </UnstyledButton>
    ));

    const user = { name: 'Unai Vidal' };

    const collectionLinks = chats.map((chat) => (
        <a
            href="#"
            onClick={(event) => event.preventDefault()}
            key={chat.label}
            className={classes.collectionLink}
        >
            <Box component="span" mr={9} fz={16}>
                {chat.emoji}
            </Box>{' '}
            {chat.label}
        </a>
    ));

    return (
        <nav className={classes.navbar}>
            <div className={classes.section}>
                <div className={classes.user}>
                    Hola {user.name}
                </div>
            </div>

            <div className={classes.section}>
                <div className={classes.mainLinks}>{mainLinks}</div>
            </div>

            <div className={classes.section}>
                <Group className={classes.collectionsHeader} justify="space-between">
                    <Text size="xs" fw={500} c="dimmed">
                        Collections
                    </Text>
                </Group>
                <div className={classes.collections}>{collectionLinks}</div>
            </div>
        </nav>
    );
}