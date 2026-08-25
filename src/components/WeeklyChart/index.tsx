"use client";

import { BarChart } from "@mantine/charts";
import { ActionIcon, Card, Group, Stack, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { MealContext, type MealEntry } from "@/contexts/MealContext";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const rangeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

function getWeekRange(weekOffset: number) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + diffToMonday + weekOffset * 7,
  );
  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
    23,
    59,
    59,
  );
  return { monday, sunday };
}

function formatRangeLabel(monday: Date, sunday: Date) {
  return `${rangeFormatter.format(monday)} – ${rangeFormatter.format(sunday)}`;
}

export function WeeklyChart() {
  const { goal, fetchEntriesInRange } = useContext(MealContext);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekEntries, setWeekEntries] = useState<MealEntry[]>([]);

  const { monday, sunday } = useMemo(
    () => getWeekRange(weekOffset),
    [weekOffset],
  );

  useEffect(() => {
    let cancelled = false;

    fetchEntriesInRange(monday.toISOString(), sunday.toISOString()).then(
      (data) => {
        if (!cancelled) {
          setWeekEntries(data);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [monday, sunday, fetchEntriesInRange]);

  const data = useMemo(() => {
    const byDay = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + i,
      );
      byDay.set(date.toDateString(), 0);
    }

    for (const entry of weekEntries) {
      const key = new Date(entry.logged_at).toDateString();
      if (byDay.has(key)) {
        byDay.set(key, (byDay.get(key) || 0) + entry.calories);
      }
    }

    return Array.from(byDay.entries()).map(([key, calories]) => ({
      day: WEEKDAY_LABELS[new Date(key).getDay()],
      kcal: Math.round(calories),
    }));
  }, [weekEntries, monday]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Calorías de la semana</Text>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              aria-label="Semana anterior"
              onClick={() => setWeekOffset((prev) => prev - 1)}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {formatRangeLabel(monday, sunday)}
            </Text>
            <ActionIcon
              variant="subtle"
              aria-label="Semana siguiente"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((prev) => prev + 1)}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
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
