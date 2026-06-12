import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { comandaService } from "../services/comanda.service";
import { useAuthStore } from "../store/authStore";

const PUBLIC_ROUTES = ["/login", "/registro"];

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const pathname = usePathname();
  const prevAuthRef = React.useRef<boolean | null>(null);

  // Only redirect when auth state actually changes value, not on every render.
  // Wait for AsyncStorage hydration first to avoid flashing the login screen.
  useEffect(() => {
    if (!hasHydrated) return;
    if (prevAuthRef.current === isAuthenticated) return;
    prevAuthRef.current = isAuthenticated;

    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace("/login");
        }
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
  }, [isAuthenticated, hasHydrated]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="registro" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(repartidor)" options={{ gestureEnabled: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
