import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Comanda } from "../models";
import { useGeocoding, RESTAURANT_COORDS } from "../hooks/useGeocoding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SeguirPedidoViewProps {
  order: Comanda;
  onRefresh: () => void;
}

export function SeguirPedidoView({ order, onRefresh }: SeguirPedidoViewProps) {
  const { coords: destCoords, route } = useGeocoding(order.direccion);
  const mapRef = useRef<MapView>(null);

  const originLat = RESTAURANT_COORDS.latitude;
  const originLng = RESTAURANT_COORDS.longitude;
  const destLat = destCoords.latitude;
  const destLng = destCoords.longitude;

  // Automatically adjust map viewpoint when destination coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: originLat, longitude: originLng },
          { latitude: destLat, longitude: destLng },
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    }
  }, [destLat, destLng]);

  // Extract coordinate data
  const estadoComanda = order.estadoComanda;

  // Status descriptive text
  let statusTitle = "Pedido recibido";
  let statusDesc = "Estamos confirmando tu pedido...";
  let progressStep = 1;

  if (estadoComanda === "EN_COCINA") {
    statusTitle = "Preparando tu comida";
    statusDesc = "El chef está cocinando tu plato...";
    progressStep = 2;
  } else if (estadoComanda === "LISTO") {
    statusTitle = "Comida Lista";
    statusDesc = "Tu comida está lista. Asignando un repartidor...";
    progressStep = 2;
  } else if (estadoComanda === "EN_CAMINO") {
    statusTitle = "Pedido en Camino";
    statusDesc = "El repartidor está llevando tu pedido a domicilio.";
    progressStep = 3;
  } else if (estadoComanda === "ENTREGADO") {
    statusTitle = "Pedido Entregado";
    statusDesc = "¡Buen provecho! Tu pedido fue entregado.";
    progressStep = 4;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguimiento de Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Real Interactive Map Box */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: (originLat + destLat) / 2,
              longitude: (originLng + destLng) / 2,
              latitudeDelta: Math.abs(originLat - destLat) * 2.5,
              longitudeDelta: Math.abs(originLng - destLng) * 2.5,
            }}
          >
            {/* Restaurant Marker (Aroma) */}
            <Marker
              coordinate={{ latitude: originLat, longitude: originLng }}
              title="Aroma"
              description="Punto de origen"
            >
              <View style={{ alignItems: "center" }}>
                <View style={styles.markerBadgeRest}>
                  <Ionicons name="restaurant" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.markerPinRest} />
              </View>
            </Marker>

            {/* Customer Home Marker */}
            <Marker
              coordinate={{ latitude: destLat, longitude: destLng }}
              title="Destino"
              description="Tu domicilio"
            >
              <View style={{ alignItems: "center" }}>
                <View style={styles.markerBadgeHome}>
                  <Ionicons name="home" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.markerPinHome} />
              </View>
            </Marker>

            {/* Route path line directly to the customer */}
            <Polyline
              coordinates={route}
              strokeColor="#3182CE"
              strokeWidth={4}
            />
          </MapView>
        </View>

        {/* Live Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Pedido #{order.id}</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>

          <Text style={styles.statusTitle}>{statusTitle}</Text>
          <Text style={styles.statusDesc}>{statusDesc}</Text>

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperLine} />
            <View
              style={[
                styles.stepperLineActive,
                {
                  width:
                    progressStep === 1
                      ? "0%"
                      : progressStep === 2
                        ? "33%"
                        : progressStep === 3
                          ? "66%"
                          : "100%",
                },
              ]}
            />

            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  progressStep >= 1 && styles.stepDotActive,
                ]}
              >
                <Ionicons
                  name="receipt"
                  size={12}
                  color={progressStep >= 1 ? "#FFFFFF" : "#A0AEC0"}
                />
              </View>
              <Text style={styles.stepLabel}>Recibido</Text>
            </View>

            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  progressStep >= 2 && styles.stepDotActive,
                ]}
              >
                <Ionicons
                  name="flame"
                  size={12}
                  color={progressStep >= 2 ? "#FFFFFF" : "#A0AEC0"}
                />
              </View>
              <Text style={styles.stepLabel}>Cocina</Text>
            </View>

            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  progressStep >= 3 && styles.stepDotActive,
                ]}
              >
                <Ionicons
                  name="bicycle"
                  size={12}
                  color={progressStep >= 3 ? "#FFFFFF" : "#A0AEC0"}
                />
              </View>
              <Text style={styles.stepLabel}>Reparto</Text>
            </View>

            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  progressStep >= 4 && styles.stepDotActive,
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color={progressStep >= 4 ? "#FFFFFF" : "#A0AEC0"}
                />
              </View>
              <Text style={styles.stepLabel}>Entregado</Text>
            </View>
          </View>
        </View>

        {/* Delivery / Driver Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Datos del Reparto</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={28} color="#4A5568" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Repartidor Asignado</Text>
              <Text style={styles.detailValue}>
                {order.repartidor?.nombre || "No asignado"}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: "#25D366" }]}
              onPress={() => {
                const nombreRepartidor = order.repartidor?.nombre || "Repartidor";
                const text = encodeURIComponent(`Hola ${nombreRepartidor}, te escribo por el pedido #${order.id} de Aroma Delivery.`);
                Linking.openURL(`https://wa.me/5492610000000?text=${text}`);
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.detailRow,
              { borderBottomWidth: 0, paddingBottom: 0 },
            ]}
          >
            <Ionicons name="location-outline" size={28} color="#4A5568" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Dirección de Entrega</Text>
              <Text style={styles.detailValue}>
                {order.direccion?.calle} {order.direccion?.numeracion},{" "}
                {order.direccion?.barrio}
              </Text>
              {order.direccion?.referencia && (
                <Text style={styles.detailSubvalue}>
                  Ref: {order.direccion.referencia}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Order Content Summary Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Resumen del Pedido</Text>
          {order.detalles?.map((det) => (
            <View key={det.id} style={styles.orderItemRow}>
              <Text style={styles.itemName}>
                1x {det.plato?.nombre || "Plato"}
              </Text>
              <Text style={styles.itemPrice}>
                $ {det.precioUnitario.toLocaleString("es-AR")}
              </Text>
            </View>
          ))}
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
  refreshButton: {
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  mapContainer: {
    height: 220,
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    marginBottom: 20,
  },
  streetGridHorizontal1: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#FFFFFF",
  },
  streetGridHorizontal2: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#FFFFFF",
  },
  streetGridHorizontal3: {
    position: "absolute",
    top: 170,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#FFFFFF",
  },
  streetGridVertical1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 60,
    width: 8,
    backgroundColor: "#FFFFFF",
  },
  streetGridVertical2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 170,
    width: 10,
    backgroundColor: "#FFFFFF",
  },
  streetGridVertical3: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 280,
    width: 8,
    backgroundColor: "#FFFFFF",
  },
  routePathLine: {
    position: "absolute",
    height: 4,
    backgroundColor: "#3182CE",
    opacity: 0.6,
    transformOrigin: "0 50%",
  },
  marker: {
    position: "absolute",
    width: 32,
    alignItems: "center",
    zIndex: 10,
  },
  markerBadgeRest: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1A202C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerPinRest: {
    width: 4,
    height: 6,
    backgroundColor: "#1A202C",
  },
  markerBadgeHome: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E53E3E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerPinHome: {
    width: 4,
    height: 6,
    backgroundColor: "#E53E3E",
  },
  markerBadgeDriver: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#319795",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerPinDriver: {
    width: 4,
    height: 6,
    backgroundColor: "#319795",
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2D3748",
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  driverLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#319795",
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  statusCard: {
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
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEB2B2",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53E3E",
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#E53E3E",
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  statusDesc: {
    fontSize: 14,
    color: "#718096",
    marginTop: 6,
    lineHeight: 20,
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "relative",
    marginTop: 32,
    marginBottom: 8,
  },
  stepperLine: {
    position: "absolute",
    top: 12,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: "#E2E8F0",
    zIndex: 1,
  },
  stepperLineActive: {
    position: "absolute",
    top: 12,
    left: 20,
    height: 4,
    backgroundColor: "#1A202C",
    zIndex: 2,
  },
  stepWrapper: {
    alignItems: "center",
    width: 60,
    zIndex: 3,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDF2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#CBD5E0",
  },
  stepDotActive: {
    backgroundColor: "#1A202C",
    borderColor: "#1A202C",
  },
  stepLabel: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "600",
    marginTop: 6,
  },
  detailsCard: {
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#A0AEC0",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "bold",
    marginTop: 2,
  },
  detailSubvalue: {
    fontSize: 13,
    color: "#718096",
    marginTop: 1,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2B6CB0",
    justifyContent: "center",
    alignItems: "center",
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "bold",
  },
});
