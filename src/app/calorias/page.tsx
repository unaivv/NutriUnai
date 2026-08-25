"use client";
import { Alert, Box, LoadingOverlay, Stack, Title } from "@mantine/core";
import { useContext } from "react";
import { DailySummary } from "@/components/DailySummary";
import { MealUpload } from "@/components/MealUpload";
import { MonthlyChart } from "@/components/MonthlyChart";
import { NavBar } from "@/components/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { WeeklyChart } from "@/components/WeeklyChart";
import { MealContext, MealContextProvider } from "@/contexts/MealContext";
import styles from "../Home.styles.module.css";

function CaloriasContent() {
  const { loading, error } = useContext(MealContext);

  return (
    <Box className={styles.homeWrapper}>
      <div className={styles.mainLayout}>
        <NavBar />
        <div className={styles.chatArea} style={{ overflow: "auto" }}>
          <Box style={{ padding: "20px", width: "100%", position: "relative" }}>
            <LoadingOverlay visible={loading} />

            <Title order={5} mb="md">
              Contador de Calorías
            </Title>

            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}

            <Stack gap="md">
              <MealUpload />
              <DailySummary />
              <WeeklyChart />
              <MonthlyChart />
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
