import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHistorialController } from "../controllers/repartidor.controller";
import { Comanda } from "../models";

function EntregaCard({ comanda }: { comanda: Comanda }) {
  const cliente = (comanda as any).cliente;
  const direccion = comanda.direccion;
  const total = comanda.detalles?.reduce(
    (sum, d) => sum + Number(d.precioUnitario),
    0
  ) ?? 0;

  const fecha = comanda.fechaEntrega ?? comanda.updatedAt;
  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdText}>Pedido #{comanda.id}</Text>
        </View>
        <View style={styles.entregadoBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#276749" />
          <Text style={styles.entregadoText}>Entregado</Text>
        </View>
      </View>

      {cliente && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={15} color="#718096" />
          <Text style={styles.infoText}>
            {cliente.nombre} {cliente.apellido}
          </Text>
        </View>
      )}

      {direccion && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color="#718096" />
          <Text style={styles.infoText} numberOfLines={1}>
            {[direccion.calle, direccion.numeracion, direccion.barrio]
              .filter(Boolean)
              .join(", ") || "Sin dirección"}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.totalText}>${total.toLocaleString("es-AR")}</Text>
        {fechaFormateada && (
          <Text style={styles.fechaText}>{fechaFormateada}</Text>
        )}
      </View>
    </View>
  );
}

export function HistorialRepartidorView() {
  const { historial, loading, refreshing, onRefresh } = useHistorialController();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1A202C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <Text style={styles.headerSubtitle}>
          {historial.length} {historial.length === 1 ? "entrega" : "entregas"}
        </Text>
      </View>

      <FlatList
        data={historial}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => <EntregaCard comanda={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={56} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Sin entregas aún</Text>
            <Text style={styles.emptySubtitle}>
              Tus entregas completadas aparecerán acá
            </Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#718096",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdBadge: {
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
  },
  entregadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  entregadoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#276749",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4A5568",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingTop: 8,
    marginTop: 2,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  fechaText: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A5568",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#A0AEC0",
    textAlign: "center",
  },
});
