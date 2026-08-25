"use client";

import {
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  RingProgress,
  Stack,
  Text,
} from "@mantine/core";
import { useContext, useMemo } from "react";
import { MealContext } from "@/contexts/MealContext";
import { MICRO_NUTRIENTS, type MicroKey } from "@/lib/microGoals";

export function DailySummary() {
  const { entries, goal, deleteEntry } = useContext(MealContext);

  const todayEntries = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter(
      (entry) => new Date(entry.logged_at).toDateString() === today,
    );
  }, [entries]);

  const totals = useMemo(() => {
    return todayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        proteinG: acc.proteinG + entry.protein_g,
        carbsG: acc.carbsG + entry.carbs_g,
        fatG: acc.fatG + entry.fat_g,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
  }, [todayEntries]);

  const caloriesPercent = goal
    ? Math.min(100, Math.round((totals.calories / goal.kcal) * 100))
    : 0;

  const microTotals = useMemo(() => {
    const totals: Partial<Record<MicroKey, number>> = {};
    for (const entry of todayEntries) {
      if (!entry.micros) continue;
      for (const key of Object.keys(entry.micros) as MicroKey[]) {
        const value = entry.micros[key];
        if (value === undefined) continue;
        totals[key] = (totals[key] ?? 0) + value;
      }
    }
    return totals;
  }, [todayEntries]);

  const microKeysWithData = useMemo(
    () =>
      (Object.keys(microTotals) as MicroKey[]).filter(
        (key) => microTotals[key] !== undefined,
      ),
    [microTotals],
  );

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar esta entrada?")) {
      await deleteEntry(id);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={500}>Resumen de hoy</Text>

        <Group align="center">
          <RingProgress
            size={120}
            thickness={12}
            sections={[
              {
                value: caloriesPercent,
                color: caloriesPercent > 100 ? "red" : "blue",
              },
            ]}
            label={
              <Text size="xs" ta="center">
                {Math.round(totals.calories)} /{" "}
                {goal ? Math.round(goal.kcal) : "—"} kcal
              </Text>
            }
          />

          <Stack gap="xs" style={{ flex: 1 }}>
            <div>
              <Text size="sm">
                Proteína: {Math.round(totals.proteinG)} /{" "}
                {goal ? Math.round(goal.proteinG) : "—"} g
              </Text>
              <Progress
                value={
                  goal
                    ? Math.min(100, (totals.proteinG / goal.proteinG) * 100)
                    : 0
                }
                color="grape"
              />
            </div>
            <div>
              <Text size="sm">
                Hidratos: {Math.round(totals.carbsG)} /{" "}
                {goal ? Math.round(goal.carbsG) : "—"} g
              </Text>
              <Progress
                value={
                  goal ? Math.min(100, (totals.carbsG / goal.carbsG) * 100) : 0
                }
                color="orange"
              />
            </div>
            <div>
              <Text size="sm">
                Grasas: {Math.round(totals.fatG)} /{" "}
                {goal ? Math.round(goal.fatG) : "—"} g
              </Text>
              <Progress
                value={
                  goal ? Math.min(100, (totals.fatG / goal.fatG) * 100) : 0
                }
                color="yellow"
              />
            </div>
          </Stack>
        </Group>

        <Stack gap="xs">
          {todayEntries.map((entry) => (
            <Group key={entry.id} justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm">{entry.food_name}</Text>
                <Badge size="sm" variant="light">
                  {Math.round(entry.quantity_grams)} g ·{" "}
                  {Math.round(entry.calories)} kcal
                </Badge>
              </div>
              <Button
                size="xs"
                color="red"
                variant="light"
                onClick={() => handleDelete(entry.id)}
              >
                Eliminar
              </Button>
            </Group>
          ))}
          {todayEntries.length === 0 && (
            <Text size="sm" c="dimmed">
              No hay entradas registradas hoy.
            </Text>
          )}
        </Stack>

        {microKeysWithData.length > 0 && (
          <Accordion variant="contained">
            <Accordion.Item value="micros">
              <Accordion.Control>Micronutrientes</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {microKeysWithData.map((key) => {
                    const info = MICRO_NUTRIENTS[key];
                    const amount = microTotals[key] ?? 0;
                    return (
                      <div key={key}>
                        <Text size="sm">
                          {info.label}: {amount.toFixed(1)} / {info.rda}{" "}
                          {info.unit}
                        </Text>
                        <Progress
                          value={Math.min(100, (amount / info.rda) * 100)}
                          color="teal"
                        />
                      </div>
                    );
                  })}
                  <Text size="xs" c="dimmed">
                    Objetivo genérico de referencia (NRV UE para un adulto), no
                    calculado a partir de tu plan personal.
                  </Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
      </Stack>
    </Card>
  );
}
