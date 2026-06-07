import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface HistorialItem {
  id: number;
  fecha: string;
  estado: "ENTREGADO" | "CANCELADO";
  platos: string[];
  total: number;
}

const MOCK_HISTORIAL: HistorialItem[] = [
  {
    id: 95,
    fecha: "2026-06-01T21:30:00.000Z",
    estado: "ENTREGADO",
    platos: ["1x Bife de chorizo con papas", "1x Copa Malbec de la casa"],
    total: 18000,
  },
  {
    id: 82,
    fecha: "2026-05-24T13:15:00.000Z",
    estado: "ENTREGADO",
    platos: ["2x Empanadas mendocinas (x3)", "1x Cerveza Patagonia IPA 24.7"],
    total: 9800,
  },
  {
    id: 74,
    fecha: "2026-05-10T20:45:00.000Z",
    estado: "CANCELADO",
    platos: ["1x Sorrentinos de jamón y queso"],
    total: 10500,
  },
];

export function HistorialView() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_HISTORIAL}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderNumber}>Pedido #{item.id}</Text>
                <Text style={styles.orderDate}>{formatDate(item.fecha)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.estado === "ENTREGADO" ? styles.statusDelivered : styles.statusCancelled,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.estado === "ENTREGADO" ? styles.statusTextDelivered : styles.statusTextCancelled,
                  ]}
                >
                  {item.estado}
                </Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              {item.platos.map((plato, idx) => (
                <Text key={idx} style={styles.plateText}>
                  {plato}
                </Text>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.totalLabel}>Total pagado</Text>
              <Text style={styles.totalPrice}>$ {item.total.toLocaleString("es-AR")}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#A0AEC0" />
            <Text style={styles.emptyText}>No tienes pedidos registrados.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  orderDate: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: "#C6F6D5",
  },
  statusCancelled: {
    backgroundColor: "#FED7D7",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  statusTextDelivered: {
    color: "#22543D",
  },
  statusTextCancelled: {
    color: "#9B2C2C",
  },
  cardContent: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    gap: 4,
  },
  plateText: {
    fontSize: 14,
    color: "#4A5568",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: "#718096",
  },
});
