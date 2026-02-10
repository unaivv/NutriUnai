"use client";
import React, { useContext, useState } from 'react';
import { Box, Text, Card, Button, Group, Stack, Title, Badge, Alert, LoadingOverlay } from '@mantine/core';
import { NavBar } from '@/components/NavBar';
import { RecipeContextProvider } from '@/contexts/RecipeContext';
import { RecipeContext } from '@/contexts/RecipeContext';
import styles from '../Home.styles.module.css';

function RecetasContent() {
  const { recipes, deleteRecipe, loading, error } = useContext(RecipeContext);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRecipe = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      try {
        setDeletingId(id);
        await deleteRecipe(id);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        // El error ya se maneja en el contexto
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <Box className={styles.homeWrapper}>
      <div className={styles.mainLayout}>
        <NavBar />
        <div className={styles.chatArea}>
          <Box style={{ padding: '20px', width: '100%', position: 'relative' }}>
            <LoadingOverlay visible={loading && !deletingId} />

            <Title order={5} mb="md">Mis Recetas Guardadas</Title>

            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}

            {recipes.length === 0 && !loading ? (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text c="dimmed" ta="center" size="lg">
                  No tienes recetas guardadas aún.
                  <br />
                  Cuando chatees con el asistente y te dé una receta, podrás guardarla aquí.
                </Text>
              </Card>
            ) : (
              <Stack gap="md">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="lg">{recipe.title}</Text>
                      <Badge color="blue" variant="light">
                        {new Date(recipe.savedAt).toLocaleDateString('es-ES')}
                      </Badge>
                    </Group>
                    <div
                      dangerouslySetInnerHTML={{ __html: recipe.content }}
                    />

                    <Group justify="flex-end">
                      <Button
                        color="red"
                        variant="light"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        size="sm"
                        loading={deletingId === recipe.id}
                        disabled={deletingId !== null}
                      >
                        Eliminar
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </div>
      </div>
    </Box>
  );
}

export default function RecetasPage() {
  return (
    <RecipeContextProvider>
      <RecetasContent />
    </RecipeContextProvider>
  );
}
