"use client";

import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Modal,
  Progress,
  RingProgress,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useContext, useMemo, useState } from "react";
import { MealContext, type MealEntry } from "@/contexts/MealContext";
import { MICRO_NUTRIENTS, type MicroKey } from "@/lib/microGoals";

function formatAmount(amount: number): string {
  return amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
}

export function DailySummary() {
  const { entries, goal, initialLoading, deleteEntry } =
    useContext(MealContext);

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

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [deleteTarget, setDeleteTarget] = useState<MealEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteEntry(deleteTarget.id);
      notifications.show({
        color: "green",
        message: `${deleteTarget.food_name} eliminado`,
      });
      setDeleteTarget(null);
    } catch {
      notifications.show({
        color: "red",
        message: "No se pudo eliminar la entrada",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Skeleton height={20} width={120} />
          <Group align="center">
            <Skeleton height={120} circle />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Skeleton height={14} />
              <Skeleton height={14} />
              <Skeleton height={14} />
            </Stack>
          </Group>
          <Skeleton height={60} />
        </Stack>
      </Card>
    );
  }

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
                color="cyan"
              />
            </div>
          </Stack>
        </Group>

        <Stack gap="xs">
          {todayEntries.map((entry) => {
            const proteinKcal = entry.protein_g * 4;
            const carbsKcal = entry.carbs_g * 4;
            const fatKcal = entry.fat_g * 9;
            const macroKcalTotal = proteinKcal + carbsKcal + fatKcal;
            const micros = entry.micros
              ? (Object.entries(entry.micros) as [MicroKey, number][]).filter(
                  ([key, value]) => MICRO_NUTRIENTS[key] && value !== undefined,
                )
              : [];
            const isExpanded = expandedIds.has(entry.id);

            return (
              <Card key={entry.id} padding="sm" radius="sm" withBorder>
                <Stack gap={6}>
                  <Group
                    justify="space-between"
                    wrap="nowrap"
                    align="flex-start"
                  >
                    <div>
                      <Text size="sm" fw={500}>
                        {entry.food_name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {Math.round(entry.quantity_grams)} g ·{" "}
                        {Math.round(entry.calories)} kcal
                      </Text>
                    </div>
                    <Group gap={4} wrap="nowrap">
                      {micros.length > 0 && (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => toggleExpanded(entry.id)}
                          title="Ver micronutrientes"
                        >
                          {isExpanded ? (
                            <IconChevronUp size={16} />
                          ) : (
                            <IconChevronDown size={16} />
                          )}
                        </ActionIcon>
                      )}
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        Eliminar
                      </Button>
                    </Group>
                  </Group>

                  {macroKcalTotal > 0 && (
                    <Progress.Root size="lg">
                      <Progress.Section
                        value={(proteinKcal / macroKcalTotal) * 100}
                        color="grape"
                        title={`Proteína: ${formatAmount(entry.protein_g)} g`}
                      />
                      <Progress.Section
                        value={(carbsKcal / macroKcalTotal) * 100}
                        color="orange"
                        title={`Hidratos: ${formatAmount(entry.carbs_g)} g`}
                      />
                      <Progress.Section
                        value={(fatKcal / macroKcalTotal) * 100}
                        color="cyan"
                        title={`Grasas: ${formatAmount(entry.fat_g)} g`}
                      />
                    </Progress.Root>
                  )}

                  <Group gap={4}>
                    <Badge size="sm" variant="dot" color="grape">
                      P {formatAmount(entry.protein_g)} g
                    </Badge>
                    <Badge size="sm" variant="dot" color="orange">
                      H {formatAmount(entry.carbs_g)} g
                    </Badge>
                    <Badge size="sm" variant="dot" color="cyan">
                      G {formatAmount(entry.fat_g)} g
                    </Badge>
                  </Group>

                  {micros.length > 0 && (
                    <Collapse in={isExpanded}>
                      <Group gap={4} pt={4}>
                        {micros.map(([key, value]) => {
                          const info = MICRO_NUTRIENTS[key];
                          return (
                            <Badge
                              key={key}
                              size="sm"
                              variant="outline"
                              color="teal"
                            >
                              {info.label}: {formatAmount(value)} {info.unit}
                            </Badge>
                          );
                        })}
                      </Group>
                    </Collapse>
                  )}
                </Stack>
              </Card>
            );
          })}
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

      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar entrada"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Seguro que quieres eliminar{" "}
            <Text span fw={500}>
              {deleteTarget?.food_name}
            </Text>
            ? Esta acción no se puede deshacer.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}
