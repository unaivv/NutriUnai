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
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { label: 'Chat', route: '/' },
    { label: 'Recetas', route: '/recetas' }
];

//TODO: get recent chats from database
const chats = [
    { label: 'Sales' },
    { label: 'Deliveries' },
    { label: 'Discounts' },
    { label: 'Profits' },
    { label: 'Reports' },
    { label: 'Orders' },
    { label: 'Events' },
    { label: 'Debts' },
    { label: 'Customers' },
];

export function NavBar() {
    const mainLinks = links.map((link) => {
        const isActive = usePathname() === link.route;
        return (
            <UnstyledButton key={link.label} className={classes.mainLink}>
                <div className={classes.mainLinkInner}>
                    {
                        <Link href={link.route} className={`${classes.mainLinkText} ${isActive ? classes.active : ''}`}>{link.label}</Link>
                    }
                </div>
            </UnstyledButton>
        );
    });

    const user = { name: 'Unai Vidal' };

    const collectionLinks = chats.map((chat) => (
        <a
            href="#"
            onClick={(event) => event.preventDefault()}
            key={chat.label}
            className={classes.collectionLink}
        >
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
                        Chats recientes
                    </Text>
                </Group>
                <div className={classes.collections}>{collectionLinks}</div>
            </div>
        </nav>
    );
}