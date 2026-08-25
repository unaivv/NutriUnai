"use client";

import { BarChart } from "@mantine/charts";
import { ActionIcon, Card, Group, Stack, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { MealContext, type MealEntry } from "@/contexts/MealContext";

const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long" });

function getMonthRange(monthOffset: number) {
  const today = new Date();
  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1,
  );
  const lastDay = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
    23,
    59,
    59,
  );
  return { firstDay, lastDay };
}

function formatMonthLabel(firstDay: Date) {
  const month = monthFormatter.format(firstDay);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${firstDay.getFullYear()}`;
}

export function MonthlyChart() {
  const { goal, fetchEntriesInRange } = useContext(MealContext);
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthEntries, setMonthEntries] = useState<MealEntry[]>([]);

  const { firstDay, lastDay } = useMemo(
    () => getMonthRange(monthOffset),
    [monthOffset],
  );

  useEffect(() => {
    let cancelled = false;

    fetchEntriesInRange(firstDay.toISOString(), lastDay.toISOString()).then(
      (data) => {
        if (!cancelled) {
          setMonthEntries(data);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [firstDay, lastDay, fetchEntriesInRange]);

  const daysInMonth = lastDay.getDate();

  const { data, dayEntryCounts } = useMemo(() => {
    const dayTotals = new Map<number, number>();
    const dayEntryCounts = new Map<number, number>();

    for (let day = 1; day <= daysInMonth; day++) {
      dayTotals.set(day, 0);
      dayEntryCounts.set(day, 0);
    }

    for (const entry of monthEntries) {
      const day = new Date(entry.logged_at).getDate();
      if (dayTotals.has(day)) {
        dayTotals.set(day, (dayTotals.get(day) || 0) + entry.calories);
        dayEntryCounts.set(day, (dayEntryCounts.get(day) || 0) + 1);
      }
    }

    const data = Array.from(dayTotals.entries()).map(([day, calories]) => ({
      day: String(day),
      kcal: Math.round(calories),
    }));

    return { data, dayTotals, dayEntryCounts };
  }, [monthEntries, daysInMonth]);

  const stats = useMemo(() => {
    const daysWithData = Array.from(dayEntryCounts.values()).filter(
      (count) => count > 0,
    ).length;

    let totalKcal = 0;
    let daysOverGoal = 0;

    for (const { day, kcal } of data) {
      if ((dayEntryCounts.get(Number(day)) || 0) === 0) continue;
      totalKcal += kcal;
      if (goal && kcal > goal.kcal) {
        daysOverGoal += 1;
      }
    }

    const avgKcal = daysWithData > 0 ? totalKcal / daysWithData : 0;

    return { daysWithData, daysOverGoal, avgKcal };
  }, [data, dayEntryCounts, goal]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Calorías del mes</Text>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              aria-label="Mes anterior"
              onClick={() => setMonthOffset((prev) => prev - 1)}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {formatMonthLabel(firstDay)}
            </Text>
            <ActionIcon
              variant="subtle"
              aria-label="Mes siguiente"
              disabled={monthOffset === 0}
              onClick={() => setMonthOffset((prev) => prev + 1)}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between" wrap="wrap">
          <Text size="sm" c="dimmed">
            Días registrados: {stats.daysWithData}
          </Text>
          <Text size="sm" c="dimmed">
            Días por encima del objetivo: {stats.daysOverGoal}
          </Text>
          <Text size="sm" c="dimmed">
            Media: {Math.round(stats.avgKcal)} kcal/día
          </Text>
        </Group>

        <BarChart
          h={250}
          data={data}
          dataKey="day"
          series={[{ name: "kcal", color: "blue.6" }]}
          referenceLines={
            goal
              ? [{ y: Math.round(goal.kcal), label: "Objetivo", color: "red" }]
              : []
          }
        />
      </Stack>
    </Card>
  );
}
