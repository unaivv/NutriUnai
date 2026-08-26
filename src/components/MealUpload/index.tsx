"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  FileInput,
  Group,
  Image,
  Slider,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconCamera, IconRefresh } from "@tabler/icons-react";
import { useContext, useEffect, useState } from "react";
import type { DetectedFood, NutritionCandidate } from "@/contexts/MealContext";
import { MealContext } from "@/contexts/MealContext";
import { MICRO_NUTRIENTS, type MicroKey } from "@/lib/microGoals";

function formatAmount(amount: number): string {
  return amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
}

interface PendingFood extends DetectedFood {
  grams: number;
  nutrition: NutritionCandidate | null;
}

export function MealUpload() {
  const { analyzePhoto, lookupNutrition, createEntry } =
    useContext(MealContext);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState<Date | null>(new Date());
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingFoods, setPendingFoods] = useState<PendingFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const [relookupIndex, setRelookupIndex] = useState<number | null>(null);
  const [photoConsumed, setPhotoConsumed] = useState(false);

  // Revoke the object URL once it's no longer the active preview
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setPendingFoods([]);
    setError(null);
    setPhotoConsumed(false);

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selectedFile ? URL.createObjectURL(selectedFile) : null;
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setError(null);
    try {
      setAnalyzing(true);
      const detectedFoods = await analyzePhoto(file, description);

      const withNutrition: PendingFood[] = await Promise.all(
        detectedFoods.map(async (food) => {
          const candidates = await lookupNutrition(food.foodName).catch(
            () => [],
          );
          return {
            ...food,
            grams: food.estimatedGrams,
            nutrition: candidates[0] || null,
          };
        }),
      );

      setPendingFoods(withNutrition);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al analizar la foto",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGramsChange = (index: number, grams: number) => {
    setPendingFoods((prev) =>
      prev.map((food, i) => (i === index ? { ...food, grams } : food)),
    );
  };

  const handleFoodNameChange = (index: number, foodName: string) => {
    setPendingFoods((prev) =>
      prev.map((food, i) => (i === index ? { ...food, foodName } : food)),
    );
  };

  const handleRelookupNutrition = async (index: number) => {
    const food = pendingFoods[index];
    if (!food) return;

    try {
      setRelookupIndex(index);
      const candidates = await lookupNutrition(food.foodName).catch(() => []);
      setPendingFoods((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, nutrition: candidates[0] || null } : f,
        ),
      );
    } finally {
      setRelookupIndex(null);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDescription("");
    setPhotoConsumed(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const removePendingFood = (index: number) => {
    setPendingFoods((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) resetForm();
      return next;
    });
  };

  const handleDiscard = (index: number) => {
    removePendingFood(index);
  };

  const handleConfirm = async (index: number) => {
    const food = pendingFoods[index];
    if (!food.nutrition) return;

    try {
      setConfirmingIndex(index);
      const now = new Date();
      const entryTimestamp = loggedAt
        ? new Date(
            loggedAt.getFullYear(),
            loggedAt.getMonth(),
            loggedAt.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
          )
        : now;
      const attachPhoto = !photoConsumed && !!file;
      await createEntry({
        photo: attachPhoto ? file : null,
        foodName: food.foodName,
        quantityGrams: food.grams,
        caloriesPer100g: food.nutrition.caloriesPer100g,
        proteinPer100g: food.nutrition.proteinPer100g,
        carbsPer100g: food.nutrition.carbsPer100g,
        fatPer100g: food.nutrition.fatPer100g,
        microsPer100g: food.nutrition.microsPer100g,
        source: food.nutrition.source,
        loggedAt: entryTimestamp.toISOString(),
      });
      if (attachPhoto) setPhotoConsumed(true);

      notifications.show({
        color: "green",
        message: `${food.foodName} añadido`,
      });
      removePendingFood(index);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la entrada",
      );
    } finally {
      setConfirmingIndex(null);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={500}>Registrar comida por foto</Text>

        <Box
          p="md"
          style={{
            border: "1px dashed var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-md)",
            backgroundColor: "var(--mantine-color-default)",
          }}
        >
          <Stack gap="sm">
            <FileInput
              placeholder="Selecciona una foto"
              accept="image/*"
              value={file}
              onChange={handleFileChange}
              disabled={analyzing}
              leftSection={<IconCamera size={18} />}
              radius="md"
              clearable
            />

            {previewUrl && (
              <Box
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                  overflow: "hidden",
                  width: 160,
                }}
              >
                <Image
                  src={previewUrl}
                  alt="Vista previa de la foto seleccionada"
                  h={120}
                  w={160}
                  fit="cover"
                />
              </Box>
            )}
          </Stack>
        </Box>

        <DateInput
          label="Fecha"
          valueFormat="DD/MM/YYYY"
          value={loggedAt}
          onChange={(value) =>
            setLoggedAt(typeof value === "string" ? new Date(value) : value)
          }
          maxDate={new Date()}
          disabled={analyzing}
          radius="md"
          clearable={false}
        />

        <Textarea
          label="Descripción (opcional)"
          placeholder="ej: solo me he comido la mitad, lleva aceite extra, es la versión integral"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          disabled={analyzing}
          autosize
          minRows={2}
          maxRows={3}
          radius="md"
        />

        <Group justify="flex-end">
          <Button
            onClick={handleAnalyze}
            disabled={!file}
            loading={analyzing}
            radius="md"
          >
            {pendingFoods.length > 0 ? "Volver a analizar" : "Analizar foto"}
          </Button>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        {pendingFoods.map((food, index) => (
          <Card
            key={`${food.foodName}-${index}`}
            padding="md"
            radius="sm"
            withBorder
          >
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap" align="flex-end">
                <TextInput
                  label="Alimento"
                  value={food.foodName}
                  onChange={(event) =>
                    handleFoodNameChange(index, event.currentTarget.value)
                  }
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => handleRelookupNutrition(index)}
                  loading={relookupIndex === index}
                  title="Buscar de nuevo con este nombre"
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Group>
              {food.nutrition ? (
                <>
                  <Text size="sm" c="dimmed">
                    {Math.round(food.grams)} g
                  </Text>
                  <Slider
                    min={1}
                    max={Math.max(500, Math.round(food.grams * 2))}
                    value={food.grams}
                    onChange={(value) => handleGramsChange(index, value)}
                  />

                  <Group gap="xs">
                    <Badge size="sm" variant="light" color="blue">
                      {formatAmount(
                        food.nutrition.caloriesPer100g * (food.grams / 100),
                      )}{" "}
                      kcal
                    </Badge>
                    <Badge size="sm" variant="light" color="grape">
                      Proteína:{" "}
                      {formatAmount(
                        food.nutrition.proteinPer100g * (food.grams / 100),
                      )}{" "}
                      g
                    </Badge>
                    <Badge size="sm" variant="light" color="orange">
                      Hidratos:{" "}
                      {formatAmount(
                        food.nutrition.carbsPer100g * (food.grams / 100),
                      )}{" "}
                      g
                    </Badge>
                    <Badge size="sm" variant="light" color="cyan">
                      Grasas:{" "}
                      {formatAmount(
                        food.nutrition.fatPer100g * (food.grams / 100),
                      )}{" "}
                      g
                    </Badge>
                  </Group>

                  {food.nutrition.microsPer100g &&
                    Object.keys(food.nutrition.microsPer100g).length > 0 && (
                      <Group gap="xs">
                        {(
                          Object.entries(food.nutrition.microsPer100g) as [
                            MicroKey,
                            number,
                          ][]
                        ).map(([key, per100g]) => {
                          const info = MICRO_NUTRIENTS[key];
                          if (!info) return null;
                          return (
                            <Badge
                              key={key}
                              size="sm"
                              variant="outline"
                              color="teal"
                            >
                              {info.label}:{" "}
                              {formatAmount(per100g * (food.grams / 100))}{" "}
                              {info.unit}
                            </Badge>
                          );
                        })}
                      </Group>
                    )}

                  <Group justify="flex-end">
                    <Button
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => handleDiscard(index)}
                      disabled={confirmingIndex === index}
                    >
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(index)}
                      loading={confirmingIndex === index}
                    >
                      Confirmar
                    </Button>
                  </Group>
                </>
              ) : (
                <>
                  <Text size="sm" c="red">
                    No se encontraron datos nutricionales para este alimento
                  </Text>
                  <Group justify="flex-end">
                    <Button
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => handleDiscard(index)}
                    >
                      Descartar
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}
