import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { comandaService } from "../services/comanda.service";
import { Comanda } from "../models";

export function HistorialView() {
  const [historial, setHistorial] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comandaService.getHistorial().then((data) => {
      setHistorial(data);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcTotal = (comanda: Comanda) =>
    (comanda.detalles ?? []).reduce(
      (sum, d) => sum + Number(d.precioUnitario),
      0
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A202C" />
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isEntregado = item.estadoComanda === "ENTREGADO";
            const platos = (item.detalles ?? []).map(
              (d) => `1x ${d.plato?.nombre ?? `Plato #${d.platoId}`}`
            );
            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Pedido #{item.id}</Text>
                    <Text style={styles.orderDate}>
                      {formatDate(item.fechaSolicitud)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isEntregado ? styles.statusDelivered : styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isEntregado ? styles.statusTextDelivered : styles.statusTextCancelled,
                      ]}
                    >
                      {item.estadoComanda}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  {platos.length > 0 ? (
                    platos.map((p, idx) => (
                      <Text key={idx} style={styles.plateText}>{p}</Text>
                    ))
                  ) : (
                    <Text style={styles.plateText}>Sin detalle</Text>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalPrice}>
                    $ {calcTotal(item).toLocaleString("es-AR")}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#A0AEC0" />
              <Text style={styles.emptyText}>No tenés pedidos anteriores.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1A202C" },
  listContainer: { padding: 24, gap: 16 },
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
  orderNumber: { fontSize: 16, fontWeight: "bold", color: "#1A202C" },
  orderDate: { fontSize: 12, color: "#718096", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDelivered: { backgroundColor: "#C6F6D5" },
  statusCancelled: { backgroundColor: "#FED7D7" },
  statusText: { fontSize: 11, fontWeight: "bold" },
  statusTextDelivered: { color: "#22543D" },
  statusTextCancelled: { color: "#9B2C2C" },
  cardContent: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    gap: 4,
  },
  plateText: { fontSize: 14, color: "#4A5568" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  totalLabel: { fontSize: 13, color: "#718096", fontWeight: "500" },
  totalPrice: { fontSize: 16, fontWeight: "bold", color: "#1A202C" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: { marginTop: 16, fontSize: 15, color: "#718096" },
});
