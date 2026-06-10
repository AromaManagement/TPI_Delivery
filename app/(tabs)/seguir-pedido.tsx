import { cancelarComanda } from "@/services/comanda.service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHomeController } from "../../controllers/home.controller";
import { SeguirPedidoView } from "../../views/seguir-pedido.view";

export default function SeguirPedidoScreen() {
  const { activeOrder, loading, checkActiveOrder } = useHomeController();
  const lastOrderRef = useRef(activeOrder);
  const [showCompleted, setShowCompleted] = useState(false);

  // Track the last known order so we can detect when it completes
  useEffect(() => {
    if (activeOrder) {
      lastOrderRef.current = activeOrder;
      setShowCompleted(false);
    }
  }, [activeOrder]);

  useEffect(() => {
    if (!loading && !activeOrder) {
      if (lastOrderRef.current) {
        // Had an active order that just disappeared → show completion screen
        setShowCompleted(true);
      } else {
        // Never had an order on this screen → go back to carta
        router.replace("/(tabs)");
      }
    }
  }, [loading, activeOrder]);

  if (loading && !activeOrder && !showCompleted) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1A202C" />
        <Text style={styles.loadingText}>Verificando estado del pedido...</Text>
      </View>
    );
  }

  if (showCompleted) {
    const orderId = lastOrderRef.current?.id;
    return (
      <View style={styles.centerContainer}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={52} color="#FFFFFF" />
        </View>
        <Text style={styles.completedTitle}>¡Pedido entregado!</Text>
        <Text style={styles.completedSubtitle}>
          {orderId ? `Pedido #${orderId} · ` : ""}
          Gracias por tu compra. ¡Buen provecho!
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            lastOrderRef.current = null;
            setShowCompleted(false);
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.menuButtonText}>Volver a la carta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="basket-outline" size={48} color="#A0AEC0" />
        <Text style={styles.emptyText}>No tienes ningún pedido en curso.</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.menuButtonText}>Ver la Carta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeOrder.pago.estadoPago === "PENDIENTE") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1A202C" />
        <Text style={styles.loadingText}>
          Esperando confirmación de pago...
        </Text>

        <TouchableOpacity
          style={[styles.menuButton, { marginTop: 24, width: "60%" }]}
          onPress={() => Linking.openURL(activeOrder.pago.urlPago || "")}
        >
          <Text style={[styles.menuButtonText, { textAlign: "center" }]}>
            Ir a pagar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton,
            { marginTop: 12, width: "60%", backgroundColor: "#E53E3E" },
          ]}
          onPress={() => {
            cancelarComanda(activeOrder.id)
              .then(() => {
                Alert.alert(
                  "Pedido cancelado",
                  "Tu pedido ha sido cancelado con éxito.",
                );
                lastOrderRef.current = null;
                setShowCompleted(false);
                router.replace("/(tabs)");
              })
              .catch((error) => {
                Alert.alert(
                  "Error",
                  "No se pudo cancelar el pedido. Por favor, intenta de nuevo más tarde.",
                );
              });
          }}
        >
          <Text style={[styles.menuButtonText, { textAlign: "center" }]}>
            Cancelar pedido
          </Text>
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
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#38A169",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 10,
  },
  completedSubtitle: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
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
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  menuButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
