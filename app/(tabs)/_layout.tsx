import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeController } from "../../controllers/home.controller";

export default function TabLayout() {
  const { hasActiveOrder } = useHomeController();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1A202C",
        tabBarInactiveTintColor: "#718096",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      {/* 1. Order Tracking Tab (dynamic) */}
      <Tabs.Screen
        name="seguir-pedido"
        options={{
          title: "Seguir Pedido",
          // Hide tab from bottom bar if there is no active order
          href: hasActiveOrder ? "/(tabs)/seguir-pedido" : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bicycle" : "bicycle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Menu (Carta) Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Carta",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "restaurant" : "restaurant-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Shopping Cart Tab (dynamic) */}
      <Tabs.Screen
        name="carrito"
        options={{
          title: "Mi Pedido",
          // Hide tab from bottom bar if there is an active order
          href: hasActiveOrder ? null : ("/carrito" as any),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Profile Tab */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Hide default explore tab */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
