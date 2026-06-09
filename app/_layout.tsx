import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { comandaService } from "../services/comanda.service";
import { useAuthStore } from "../store/authStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Monitor auth state changes and redirect
  useEffect(() => {
    // A tiny timeout ensures the router is fully mounted before redirecting
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
      } else {
        const user = useAuthStore.getState().user;
        if (user) {
          if (user.rol === "REPARTIDOR") {
            router.replace("/(repartidor)/pedidos" as any);
          } else {
            comandaService
              .getActiveOrder()
              .then((order) => {
                if (order) {
                  router.replace("/(tabs)/seguir-pedido" as any);
                } else {
                  router.replace("/(tabs)");
                }
              })
              .catch((err) => {
                console.warn("Error checking active order on startup", err);
                router.replace("/(tabs)");
              });
          }
        } else {
          router.replace("/(tabs)");
        }
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(repartidor)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
