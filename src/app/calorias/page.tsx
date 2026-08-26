"use client";
import {
  Alert,
  Box,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCamera, IconFlame, IconHistory } from "@tabler/icons-react";
import { useContext } from "react";
import { DailySummary } from "@/components/DailySummary";
import { MealUpload } from "@/components/MealUpload";
import { MonthlyChart } from "@/components/MonthlyChart";
import { NavBar } from "@/components/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { WeeklyChart } from "@/components/WeeklyChart";
import { MealContext, MealContextProvider } from "@/contexts/MealContext";
import styles from "../Home.styles.module.css";

function SectionHeading({
  icon,
  color,
  children,
}: {
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Group gap="xs" mb="sm">
      <ThemeIcon variant="light" color={color} radius="md" size="md">
        {icon}
      </ThemeIcon>
      <Title order={5} c={color}>
        {children}
      </Title>
    </Group>
  );
}

function CaloriasContent() {
  const { loading, error } = useContext(MealContext);

  return (
    <Box className={styles.homeWrapper}>
      <div className={styles.mainLayout}>
        <NavBar />
        <div className={styles.chatArea} style={{ overflow: "auto" }}>
          <Box style={{ padding: "20px", width: "100%", position: "relative" }}>
            <LoadingOverlay visible={loading} />

            <Title order={5} mb="lg">
              Contador de Calorías
            </Title>

            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}

            <Stack gap="xl">
              <Box
                pl="md"
                style={{
                  borderLeft: "3px solid var(--mantine-color-blue-6)",
                }}
              >
                <SectionHeading icon={<IconCamera size={16} />} color="blue">
                  Registrar comida
                </SectionHeading>
                <MealUpload />
              </Box>

              <Box
                pl="md"
                style={{
                  borderLeft: "3px solid var(--mantine-color-teal-6)",
                }}
              >
                <SectionHeading icon={<IconFlame size={16} />} color="teal">
                  Hoy
                </SectionHeading>
                <DailySummary />
              </Box>

              <Divider />

              <Box
                pl="md"
                style={{
                  borderLeft: "3px solid var(--mantine-color-gray-5)",
                }}
              >
                <SectionHeading icon={<IconHistory size={16} />} color="gray">
                  Historial
                </SectionHeading>
                <Stack gap="md">
                  <WeeklyChart />
                  <MonthlyChart />
                </Stack>
              </Box>
            </Stack>
          </Box>
        </div>
      </div>
    </Box>
  );
}

export default function CaloriasPage() {
  return (
    <ProtectedRoute>
      <MealContextProvider>
        <CaloriasContent />
      </MealContextProvider>
    </ProtectedRoute>
  );
}
