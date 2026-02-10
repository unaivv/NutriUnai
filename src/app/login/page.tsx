'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Container,
    Paper,
    TextInput,
    PasswordInput,
    Button,
    Title,
    Text,
    Stack,
    Alert
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={80}>
            <Title ta="center" order={2} mb="md">
                NutriUnai
            </Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">
                Inicia sesión para continuar
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red">
                                {error}
                            </Alert>
                        )}

                        <TextInput
                            label="Email"
                            placeholder="tu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <PasswordInput
                            label="Contraseña"
                            placeholder="Tu contraseña"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button type="submit" fullWidth loading={loading}>
                            Iniciar sesión
                        </Button>
                    </Stack>
                </form>

                <Text ta="center" mt="md" size="sm">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" style={{ color: 'var(--mantine-color-blue-6)' }}>
                        Regístrate
                    </Link>
                </Text>
            </Paper>
        </Container>
    );
}
