'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Table,
    Button,
    Badge,
    Group,
    Text,
    Loader,
    Alert,
    Card,
    Tabs
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX, IconTrash } from '@tabler/icons-react';

interface User {
    id: number;
    email: string;
    name: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading users');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (userId: number, status: 'active' | 'rejected') => {
        try {
            setActionLoading(userId);
            const response = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status })
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            // Update local state
            setUsers(prev => prev.map(user => 
                user.id === userId ? { ...user, status } : user
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error updating user');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (userId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

        try {
            setActionLoading(userId);
            const response = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            setUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting user');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'pending': return 'yellow';
            case 'rejected': return 'red';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'pending': return 'Pendiente';
            case 'rejected': return 'Rechazado';
            default: return status;
        }
    };

    const renderUserTable = (filteredUsers: User[]) => (
        <Table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Fecha de registro</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {filteredUsers.map((user) => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                            <Badge color={getStatusColor(user.status)}>
                                {getStatusLabel(user.status)}
                            </Badge>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                        <td>
                            <Group gap="xs">
                                {user.status === 'pending' && (
                                    <>
                                        <Button
                                            size="xs"
                                            color="green"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => updateStatus(user.id, 'active')}
                                            loading={actionLoading === user.id}
                                        >
                                            Aprobar
                                        </Button>
                                        <Button
                                            size="xs"
                                            color="red"
                                            variant="outline"
                                            leftSection={<IconX size={14} />}
                                            onClick={() => updateStatus(user.id, 'rejected')}
                                            loading={actionLoading === user.id}
                                        >
                                            Rechazar
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="xs"
                                    color="gray"
                                    variant="subtle"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() => deleteUser(user.id)}
                                    loading={actionLoading === user.id}
                                >
                                    Eliminar
                                </Button>
                            </Group>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    if (loading) {
        return (
            <Container size="xl" my={40}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                    <Loader />
                </div>
            </Container>
        );
    }

    const pendingUsers = users.filter(u => u.status === 'pending');
    const activeUsers = users.filter(u => u.status === 'active');
    const rejectedUsers = users.filter(u => u.status === 'rejected');

    return (
        <Container size="xl" my={40}>
            <Title order={2} mb="xl">Panel de Administración</Title>
            
            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
                    {error}
                </Alert>
            )}

            <Card withBorder mb="xl">
                <Group>
                    <Text>Total usuarios: <strong>{users.length}</strong></Text>
                    <Badge color="yellow">Pendientes: {pendingUsers.length}</Badge>
                    <Badge color="green">Activos: {activeUsers.length}</Badge>
                    <Badge color="red">Rechazados: {rejectedUsers.length}</Badge>
                </Group>
            </Card>

            <Tabs defaultValue="pending">
                <Tabs.List>
                    <Tabs.Tab value="pending">
                        Pendientes ({pendingUsers.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="active">
                        Activos ({activeUsers.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="rejected">
                        Rechazados ({rejectedUsers.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="all">
                        Todos ({users.length})
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="pending" pt="md">
                    {pendingUsers.length === 0 ? (
                        <Text c="dimmed" ta="center" py={40}>
                            No hay usuarios pendientes de aprobación
                        </Text>
                    ) : (
                        renderUserTable(pendingUsers)
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="active" pt="md">
                    {activeUsers.length === 0 ? (
                        <Text c="dimmed" ta="center" py={40}>
                            No hay usuarios activos
                        </Text>
                    ) : (
                        renderUserTable(activeUsers)
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="rejected" pt="md">
                    {rejectedUsers.length === 0 ? (
                        <Text c="dimmed" ta="center" py={40}>
                            No hay usuarios rechazados
                        </Text>
                    ) : (
                        renderUserTable(rejectedUsers)
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="all" pt="md">
                    {users.length === 0 ? (
                        <Text c="dimmed" ta="center" py={40}>
                            No hay usuarios registrados
                        </Text>
                    ) : (
                        renderUserTable(users)
                    )}
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}
