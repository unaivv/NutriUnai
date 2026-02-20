"use client";
import React, { useContext, useState } from 'react';
import { Box, Text, Card, Button, Group, Stack, Title, Badge, Alert, LoadingOverlay, Modal } from '@mantine/core';
import { NavBar } from '@/components/NavBar';
import { RecipeContextProvider, RecipeContext } from '@/contexts/RecipeContext';
import styles from '../Home.styles.module.css';
import ProtectedRoute from '@/components/ProtectedRoute';

function RecetasContent() {
  const { recipes, deleteRecipe, loading, error } = useContext(RecipeContext);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);

  const handleDeleteRecipe = async (id: number) => {
    setRecipeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (recipeToDelete === null) return;
    
    try {
      setDeletingId(recipeToDelete.toString());
      await deleteRecipe(recipeToDelete);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      // El error ya se maneja en el contexto
    } finally {
      setDeletingId(null);
      setDeleteModalOpen(false);
      setRecipeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRecipeToDelete(null);
  };

  const getPlanLabel = (plan?: 'unai' | 'marifeli' | 'both') => {
    switch (plan) {
      case 'unai': return 'Unai';
      case 'marifeli': return 'Mari Feli';
      case 'both': return 'Ambos';
      default: return 'Desconocido';
    }
  };

  const getPlanColor = (plan?: 'unai' | 'marifeli' | 'both') => {
    switch (plan) {
      case 'unai': return 'blue';
      case 'marifeli': return 'pink';
      case 'both': return 'grape';
      default: return 'gray';
    }
  };

  return (
    <Box className={styles.homeWrapper}>
      <div className={styles.mainLayout}>
        <NavBar />
        <div className={styles.chatArea} style={{ overflow: 'auto' }}>
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
                      <Group gap="xs">
                        {recipe.plan && (
                          <Badge color={getPlanColor(recipe.plan)} variant="filled" size="sm">
                            {getPlanLabel(recipe.plan)}
                          </Badge>
                        )}
                        <Badge color="blue" variant="light">
                          {new Date(recipe.savedAt).toLocaleDateString('es-ES')}
                        </Badge>
                      </Group>
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
                        loading={deletingId === recipe.id.toString()}
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
      
      {/* Modal de confirmación de eliminación */}
      <Modal
        opened={deleteModalOpen}
        onClose={cancelDelete}
        title="Confirmar eliminación"
        centered
      >
        <Text mb="lg">
          ¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={cancelDelete}>
            Cancelar
          </Button>
          <Button color="red" onClick={confirmDelete} loading={!!deletingId}>
            Eliminar
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}

export default function RecetasPage() {
  return (
    <ProtectedRoute>
      <RecipeContextProvider>
        <RecetasContent />
      </RecipeContextProvider>
    </ProtectedRoute>
  );
}
