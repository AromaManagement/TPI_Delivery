import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePedidosDisponiblesController } from "../controllers/repartidor.controller";
import { Comanda } from "../models";

function PedidoCard({
  comanda,
  onTomar,
}: {
  comanda: Comanda;
  onTomar: (c: Comanda) => void;
}) {
  const direccion = comanda.direccion;
  const cliente = (comanda as any).cliente;
  const total = comanda.detalles?.reduce(
    (sum, d) => sum + Number(d.precioUnitario),
    0
  ) ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdText}>Pedido #{comanda.id}</Text>
        </View>
        <Text style={styles.totalText}>${total.toLocaleString("es-AR")}</Text>
      </View>

      {cliente && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>
            {cliente.nombre} {cliente.apellido}
          </Text>
        </View>
      )}

      {direccion && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#718096" />
          <Text style={styles.infoText} numberOfLines={2}>
            {[direccion.calle, direccion.numeracion, direccion.barrio]
              .filter(Boolean)
              .join(", ") || "Sin dirección especificada"}
          </Text>
        </View>
      )}

      {comanda.detalles && comanda.detalles.length > 0 && (
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>
            {comanda.detalles.length}{" "}
            {comanda.detalles.length === 1 ? "ítem" : "ítems"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.tomarButton}
        onPress={() => onTomar(comanda)}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.tomarButtonText}>Tomar pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

export function PedidosDisponiblesView() {
  const { pedidos, loading, refreshing, onRefresh, tomarPedido, pedidoActivo } =
    usePedidosDisponiblesController();

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
        <Text style={styles.headerTitle}>Pedidos Disponibles</Text>
        {pedidoActivo && (
          <View style={styles.activeBanner}>
            <Ionicons name="bicycle" size={16} color="#2F855A" />
            <Text style={styles.activeBannerText}>
              Ya tenés el pedido #{pedidoActivo.id} activo
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <PedidoCard comanda={item} onTomar={tomarPedido} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No hay pedidos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Deslizá hacia abajo para actualizar
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#9AE6B4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  activeBannerText: {
    fontSize: 13,
    color: "#2F855A",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
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
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4A5568",
    flex: 1,
  },
  tomarButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  tomarButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
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
  },
});
