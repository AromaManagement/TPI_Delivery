import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useMiEntregaController } from "../controllers/repartidor.controller";
import { EstadoComanda } from "../models";
import { useGeocoding, RESTAURANT_COORDS } from "../hooks/useGeocoding";

const MAP_REGION = {
  latitude: -32.892,
  longitude: -68.8418,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

const ESTADO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  LISTO: { label: "Listo para retirar", color: "#744210", bg: "#FEFCBF" },
  EN_CAMINO: { label: "En camino", color: "#2C5282", bg: "#EBF8FF" },
  ENTREGADO: { label: "Entregado", color: "#276749", bg: "#F0FFF4" },
};

function EstadoBadge({ estado }: { estado: EstadoComanda | null | undefined }) {
  const config = ESTADO_CONFIG[estado ?? ""] ?? {
    label: estado ?? "Sin estado",
    color: "#4A5568",
    bg: "#EDF2F7",
  };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

export function MiEntregaView() {
  const { pedidoActivo, loading, loadingInit, marcarEnCamino, confirmarEntrega } =
    useMiEntregaController();

  const { coords: destCoords, route } = useGeocoding(pedidoActivo?.direccion);
  const mapRef = useRef<MapView>(null);

  // Automatically adjust map viewpoint when destination coordinates change
  useEffect(() => {
    if (mapRef.current && pedidoActivo?.direccion) {
      mapRef.current.fitToCoordinates(
        [
          RESTAURANT_COORDS,
          destCoords,
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    }
  }, [destCoords]);

  if (loadingInit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A202C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!pedidoActivo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Entrega</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="bicycle-outline" size={64} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>Sin entrega activa</Text>
          <Text style={styles.emptySubtitle}>
            Tomá un pedido desde la pestaña "Disponibles"
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cliente = (pedidoActivo as any).cliente;
  const direccion = pedidoActivo.direccion;
  const estado = pedidoActivo.estadoComanda;
  const total = pedidoActivo.detalles?.reduce(
    (sum, d) => sum + Number(d.precioUnitario),
    0
  ) ?? 0;

  const direccionTexto = direccion
    ? [
        direccion.calle,
        direccion.numeracion,
        direccion.manzanaPiso,
        direccion.barrio,
        direccion.referencia,
      ]
        .filter(Boolean)
        .join(", ")
    : "Sin dirección";

  const handleLlamar = () => {
    const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente";
    const text = encodeURIComponent(`Hola ${nombreCliente}, soy tu repartidor de Aroma Delivery y voy en camino con tu pedido #${pedidoActivo.id}.`);
    Linking.openURL(`https://wa.me/5492610000000?text=${text}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Entrega</Text>
        <EstadoBadge estado={estado} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Orden ID */}
        <View style={styles.section}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>Pedido #{pedidoActivo.id}</Text>
            <Text style={styles.totalText}>${total.toLocaleString("es-AR")}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={20} color="#718096" />
              <Text style={styles.infoText}>
                {cliente
                  ? `${cliente.nombre} ${cliente.apellido}`
                  : "Cliente"}
              </Text>
              <TouchableOpacity 
                style={[styles.callButton, { backgroundColor: "#25D366" }]} 
                onPress={handleLlamar}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dirección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de entrega</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#E53E3E" />
              <Text style={styles.infoText}>{direccionTexto}</Text>
            </View>
            {direccion?.referencia && (
              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <Ionicons name="information-circle-outline" size={18} color="#718096" />
                <Text style={[styles.infoText, { color: "#718096" }]}>
                  Ref: {direccion.referencia}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Mapa de ruta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruta de entrega</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={MAP_REGION}
            >
              <Marker coordinate={RESTAURANT_COORDS} title="Restaurante" pinColor="#E53E3E" />
              <Marker coordinate={destCoords} title="Destino" pinColor="#38A169" />
              <Polyline
                coordinates={route}
                strokeColor="#3182CE"
                strokeWidth={3}
              />
            </MapView>
          </View>
        </View>

        {/* Ítems del pedido */}
        {pedidoActivo.detalles && pedidoActivo.detalles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ítems del pedido</Text>
            <View style={styles.card}>
              {pedidoActivo.detalles.map((detalle, idx) => (
                <View
                  key={detalle.id}
                  style={[
                    styles.itemRow,
                    idx < pedidoActivo.detalles!.length - 1 && styles.itemBorder,
                  ]}
                >
                  <Ionicons name="restaurant-outline" size={16} color="#718096" />
                  <Text style={styles.itemText}>
                    {(detalle as any).plato?.nombre ?? `Plato #${detalle.platoId}`}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${Number(detalle.precioUnitario).toLocaleString("es-AR")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actionsSection}>
          {estado === "LISTO" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.enCaminoButton]}
              onPress={marcarEnCamino}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="bicycle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Salir a entregar</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {estado === "EN_CAMINO" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.entregadoButton]}
              onPress={confirmarEntrega}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Confirmar entrega</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {estado === "ENTREGADO" && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-done-circle" size={24} color="#276749" />
              <Text style={styles.completedText}>Entrega completada</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: "#2D3748",
    flex: 1,
  },
  callButton: {
    backgroundColor: "#38A169",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  itemText: {
    fontSize: 14,
    color: "#2D3748",
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  actionsSection: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  enCaminoButton: {
    backgroundColor: "#3182CE",
  },
  entregadoButton: {
    backgroundColor: "#38A169",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#9AE6B4",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#276749",
  },
  mapContainer: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
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
    paddingHorizontal: 40,
  },
});
