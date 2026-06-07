import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useHomeController } from "../../controllers/home.controller";
import { SeguirPedidoView } from "../../views/seguir-pedido.view";
import { Ionicons } from "@expo/vector-icons";

export default function SeguirPedidoScreen() {
  const { activeOrder, loading, checkActiveOrder } = useHomeController();

  // If loading is done and there is no active order, redirect back to the menu (Carta)
  useEffect(() => {
    if (!loading && !activeOrder) {
      router.replace("/(tabs)");
    }
  }, [loading, activeOrder]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1A202C" />
        <Text style={styles.loadingText}>Verificando estado del pedido...</Text>
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="basket-outline" size={48} color="#A0AEC0" />
        <Text style={styles.emptyText}>No tienes ningún pedido en curso.</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.menuButtonText}>Ver la Carta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <SeguirPedidoView order={activeOrder} onRefresh={checkActiveOrder} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#718096",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 24,
  },
  menuButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  menuButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
