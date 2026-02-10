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

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
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
                Crea una cuenta para empezar
                <br />
                <Text span size="xs" c="orange" fw={500}>
                    ⚠️ Las nuevas cuentas requieren aprobación manual antes de poder acceder
                </Text>
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md">
                {success ? (
                    <Stack align="center">
                        <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Registro exitoso">
                            Tu cuenta ha sido creada, pero está pendiente de aprobación.
                            <br /><br />
                            Un administrador debe revisar y aprobar tu solicitud antes de que puedas iniciar sesión.
                            <br /><br />
                            Esto suele tomar menos de 24 horas.
                        </Alert>
                        <Button component={Link} href="/login" fullWidth>
                            Ir al login
                        </Button>
                    </Stack>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Stack>
                            {error && (
                                <Alert icon={<IconAlertCircle size={16} />} color="red">
                                    {error}
                                </Alert>
                            )}

                            <TextInput
                                label="Nombre"
                                placeholder="Tu nombre"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <TextInput
                                label="Email"
                                placeholder="tu@email.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <PasswordInput
                                label="Contraseña"
                                placeholder="Mínimo 6 caracteres"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <PasswordInput
                                label="Confirmar contraseña"
                                placeholder="Repite tu contraseña"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />

                            <Button type="submit" fullWidth loading={loading}>
                                Crear cuenta
                            </Button>
                        </Stack>
                    </form>
                )}

                <Text ta="center" mt="md" size="sm">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" style={{ color: 'var(--mantine-color-blue-6)' }}>
                        Inicia sesión
                    </Link>
                </Text>
            </Paper>
        </Container>
    );
}
