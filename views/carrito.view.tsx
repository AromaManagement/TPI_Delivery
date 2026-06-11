import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import { comandaService, cancelarComanda } from "../services/comanda.service";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { direccionService } from "../services/direccion.service";
import { DireccionModal } from "../components/DireccionModal";

WebBrowser.maybeCompleteAuthSession();

const formatPrice = (value: number) => {
  return `$ ${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function CarritoView() {
  const user = useAuthStore((state) => state.user);
  const { items, updateQuantity, removeItem, clearCart, getTotal } =
    useCartStore();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [direccion, setDireccion] = useState<string | null>(null);
  const [showDireccionModal, setShowDireccionModal] = useState(false);
  const [loadingDireccion, setLoadingDireccion] = useState(false);

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [createdComandaId, setCreatedComandaId] = useState<number | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<any>(null);

  React.useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const handleCancelVerification = async () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setShowPendingModal(false);
    setLoading(false);
    
    if (createdComandaId) {
      try {
        await cancelarComanda(createdComandaId);
        console.log(`[Checkout] Comanda #${createdComandaId} cancelada.`);
      } catch (err) {
        console.error("Error canceling unpaid comanda:", err);
      }
      setCreatedComandaId(null);
    }
  };

  React.useEffect(() => {
    if (user?.direccionId) {
      setLoadingDireccion(true);
      direccionService
        .getDireccion(user.direccionId)
        .then((dir) => {
          setDireccion(`${dir.calle} ${dir.numeracion} (${dir.barrio || ""})`);
        })
        .catch((err) => {
          console.error("Error loading address in cart:", err);
          setDireccion("Error al cargar dirección");
        })
        .finally(() => {
          setLoadingDireccion(false);
        });
    } else {
      setDireccion(null);
    }
  }, [user?.direccionId]);
  const [selectedPayment, setSelectedPayment] = useState<
    "efectivo" | "mercadopago" | null
  >(null);

  const subtotal = getTotal();
  const costoEnvio = subtotal > 0 ? 800 : 0;
  const total = subtotal + costoEnvio;

  const openPaymentModal = () => {
    if (!user) {
      Alert.alert("Error", "Debe iniciar sesión para realizar un pedido.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Pedido vacío", "Agregue platos antes de confirmar.");
      return;
    }
    if (!user.direccionId) {
      Alert.alert(
        "Dirección requerida",
        "Por favor ingresá tu dirección de envío para continuar.",
        [
          { text: "Agregar dirección", onPress: () => setShowDireccionModal(true) },
          { text: "Cancelar", style: "cancel" }
        ]
      );
      return;
    }
    setSelectedPayment(null);
    setShowPaymentModal(true);
  };

  const handleCheckout = async () => {
    if (!direccion) {
      Alert.alert("Error", "Por favor ingresa una dirección de entrega.");
      return;
    }
    if (!selectedPayment) {
      Alert.alert("Error", "Por favor selecciona un método de pago.");
      return;
    }
    if (!user) {
      Alert.alert("Error", "Inicia sesión para realizar un pedido.");
      return;
    }
    setLoading(true);
    setShowPaymentModal(false);

    try {
      const newComanda = await comandaService.crearComanda(
        user.id,
        items,
        selectedPayment.toUpperCase(),
      );

      if (selectedPayment === "mercadopago") {
        if (newComanda.pago?.urlPago) {
          const urlPago = newComanda.pago.urlPago;
          setCreatedComandaId(newComanda.id);
          setShowPendingModal(true);

          console.log("[Checkout] Abriendo Mercado Pago en navegador seguro:", urlPago);
          WebBrowser.openBrowserAsync(urlPago).catch((err) => {
            console.error("Failed to open browser:", err);
            Linking.openURL(urlPago);
          });

          const interval = setInterval(async () => {
            try {
              const activeOrder = await comandaService.getActiveOrder();
              
              if (activeOrder && activeOrder.id === newComanda.id) {
                const estado = activeOrder.estadoComanda as string;
                console.log("[Checkout Polling] Estado de la orden:", estado);
                
                if (estado !== "SIN_PAGAR" && estado !== "CANCELADO") {
                  clearInterval(interval);
                  setPollingIntervalId(null);
                  setCreatedComandaId(null);
                  setLoading(false);
                  setShowPendingModal(false);
                  WebBrowser.dismissBrowser();
                  
                  Alert.alert("Éxito", "¡Pago confirmado! Tu pedido ha sido recibido.");
                  router.replace("/(tabs)/seguir-pedido" as any);
                  clearCart();
                } else if (estado === "CANCELADO") {
                  clearInterval(interval);
                  setPollingIntervalId(null);
                  setCreatedComandaId(null);
                  setLoading(false);
                  setShowPendingModal(false);
                  WebBrowser.dismissBrowser();
                  Alert.alert("Pago fallido", "El pago de Mercado Pago fue rechazado o cancelado.");
                }
              } else {
                clearInterval(interval);
                setPollingIntervalId(null);
                setCreatedComandaId(null);
                setLoading(false);
                setShowPendingModal(false);
                WebBrowser.dismissBrowser();
                Alert.alert("Pago cancelado", "El pedido fue cancelado.");
              }
            } catch (pollErr) {
              console.error("[Checkout Polling] Error checking payment:", pollErr);
            }
          }, 3000);

          setPollingIntervalId(interval);
        } else {
          Alert.alert("Error", "No se recibió la URL de pago de Mercado Pago.");
          setLoading(false);
        }
      } else {
        // EFECTIVO
        Alert.alert("Pedido Confirmado", "Tu pedido ha sido recibido. Pagás al recibir.");
        router.replace("/(tabs)/seguir-pedido" as any);
        clearCart();
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo realizar el pedido.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Pedido</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <Ionicons name="cart-outline" size={48} color="#718096" />
          </View>
          <Text style={styles.emptyTitle}>Tu pedido está vacío</Text>
          <Text style={styles.emptySubtitle}>
            Explora nuestro menú y agrega platos deliciosos a tu pedido.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(tabs)/" as any)}
          >
            <Text style={styles.exploreButtonText}>Ver la Carta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Pedido</Text>
      </View>

      {/* Payment method selection modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPaymentModal(false)}
          />
          <View style={styles.paymentSheet}>
            <View style={styles.paymentHandle} />
            <Text style={styles.paymentTitle}>¿Cómo querés pagar?</Text>
            <Text style={styles.paymentSubtitle}>
              Seleccioná un método de pago
            </Text>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === "efectivo" && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment("efectivo")}
            >
              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="cash-outline"
                  size={28}
                  color={selectedPayment === "efectivo" ? "#FFFFFF" : "#2D3748"}
                />
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text
                  style={[
                    styles.paymentOptionTitle,
                    selectedPayment === "efectivo" &&
                      styles.paymentOptionTitleSelected,
                  ]}
                >
                  Efectivo
                </Text>
                <Text
                  style={[
                    styles.paymentOptionDesc,
                    selectedPayment === "efectivo" &&
                      styles.paymentOptionDescSelected,
                  ]}
                >
                  Pagás al repartidor al recibir
                </Text>
              </View>
              {selectedPayment === "efectivo" && (
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === "mercadopago" &&
                  styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment("mercadopago")}
            >
              <View
                style={[
                  styles.paymentIconContainer,
                  selectedPayment !== "mercadopago" && styles.mpIconBg,
                ]}
              >
                <Text
                  style={[
                    styles.mpLogo,
                    selectedPayment === "mercadopago" && { color: "#FFFFFF" },
                  ]}
                >
                  MP
                </Text>
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text
                  style={[
                    styles.paymentOptionTitle,
                    selectedPayment === "mercadopago" &&
                      styles.paymentOptionTitleSelected,
                  ]}
                >
                  Mercado Pago
                </Text>
                <Text
                  style={[
                    styles.paymentOptionDesc,
                    selectedPayment === "mercadopago" &&
                      styles.paymentOptionDescSelected,
                  ]}
                >
                  Pago digital seguro
                </Text>
              </View>
              {selectedPayment === "mercadopago" && (
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmPaymentBtn,
                !selectedPayment && styles.confirmPaymentBtnDisabled,
              ]}
              onPress={handleCheckout}
              disabled={!selectedPayment}
            >
              <Text style={styles.confirmPaymentText}>
                {selectedPayment
                  ? `Pagar ${formatPrice(total)}`
                  : "Seleccioná un método"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pending Payment confirmation polling overlay */}
      <Modal
        visible={showPendingModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.pendingSheet}>
            <ActivityIndicator size="large" color="#E53E3E" style={{ marginBottom: 20 }} />
            <Text style={styles.pendingTitle}>Esperando confirmación del pago</Text>
            <Text style={styles.pendingSubtitle}>
              Por favor, completa el pago en la ventana de Mercado Pago.
            </Text>
            <Text style={styles.pendingSubtext}>
              Esta ventana se cerrará automáticamente una vez confirmado el pago.
            </Text>
            
            <TouchableOpacity
              style={styles.cancelPendingBtn}
              onPress={handleCancelVerification}
            >
              <Text style={styles.cancelPendingText}>Cancelar verificación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={items}
        keyExtractor={(item) => item.plato.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartName}>{item.plato.nombre}</Text>
              <Text style={styles.cartPrice}>
                {formatPrice(item.plato.precio)}
              </Text>
            </View>

            {/* Quantity Selector controls */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => updateQuantity(item.plato.id, item.cantidad - 1)}
              >
                <Ionicons name="remove" size={16} color="#1A202C" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.cantidad}</Text>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => updateQuantity(item.plato.id, item.cantidad + 1)}
              >
                <Ionicons name="add" size={16} color="#1A202C" />
              </TouchableOpacity>
            </View>

            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => removeItem(item.plato.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {/* Delivery Details Card */}
            <View style={styles.detailsCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[styles.detailsTitle, { marginBottom: 0 }]}>Detalles de Entrega</Text>
                <TouchableOpacity onPress={() => setShowDireccionModal(true)}>
                  <Text style={{ fontSize: 13, fontWeight: "bold", color: "#E53E3E" }}>
                    {direccion ? "Cambiar" : "Agregar"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={direccion ? "#4A5568" : "#E53E3E"} />
                <Text style={[styles.detailText, !direccion && { color: "#E53E3E", fontWeight: "bold" }]}>
                  {loadingDireccion
                    ? "Cargando dirección..."
                    : direccion
                    ? direccion
                    : "No has ingresado una dirección de entrega."}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={18} color="#4A5568" />
                <Text style={styles.detailText}>
                  Método de pago: {selectedPayment === "efectivo" ? "Efectivo" : selectedPayment === "mercadopago" ? "Mercado Pago" : "Seleccionar al confirmar"}
                </Text>
              </View>
            </View>

            {/* Totals Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Costo de envío</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(costoEnvio)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            {/* Pay and Checkout Button */}
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={openPaymentModal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.payButtonText}>Confirmar pedido</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <DireccionModal
        visible={showDireccionModal}
        onClose={() => setShowDireccionModal(false)}
        onSaveSuccess={(newDir) => {
          setDireccion(`${newDir.calle} ${newDir.numeracion} (${newDir.barrio || ""})`);
        }}
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
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: "#EDF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  exploreButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  cartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  cartInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cartName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A202C",
  },
  cartPrice: {
    fontSize: 13,
    color: "#718096",
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A202C",
    paddingHorizontal: 10,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  footerContainer: {
    marginTop: 12,
    paddingBottom: 24,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#4A5568",
    marginLeft: 8,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#718096",
  },
  summaryValue: {
    fontSize: 14,
    color: "#2D3748",
    fontWeight: "500",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingTop: 10,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
  },
  payButton: {
    flexDirection: "row",
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  paymentSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  paymentHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
    textAlign: "center",
  },
  paymentSubtitle: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  paymentOptionSelected: {
    borderColor: "#1A202C",
    backgroundColor: "#1A202C",
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  mpIconBg: { backgroundColor: "#009ee3" },
  mpLogo: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
  paymentOptionInfo: { flex: 1 },
  paymentOptionTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  paymentOptionTitleSelected: { color: "#FFFFFF" },
  paymentOptionDesc: { fontSize: 13, color: "#718096", marginTop: 2 },
  paymentOptionDescSelected: { color: "#CBD5E0" },
  confirmPaymentBtn: {
    backgroundColor: "#1A202C",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  confirmPaymentBtnDisabled: { backgroundColor: "#CBD5E0" },
  confirmPaymentText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pendingSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 8,
  },
  pendingSubtitle: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  pendingSubtext: {
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  cancelPendingBtn: {
    backgroundColor: "#EDF2F7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  cancelPendingText: {
    color: "#4A5568",
    fontSize: 14,
    fontWeight: "bold",
  },
});
