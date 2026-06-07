import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCartStore } from "../store/cartStore";
import { comandaService } from "../services/comanda.service";
import { useAuthStore } from "../store/authStore";

const formatPrice = (value: number) => {
  return `$ ${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function CarritoView() {
  const user = useAuthStore((state) => state.user);
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);

  const subtotal = getTotal();
  const costoEnvio = subtotal > 0 ? 800 : 0;
  const total = subtotal + costoEnvio;

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert("Error", "Debe iniciar sesión para realizar un pedido.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Pedido vacío", "Agregue platos antes de confirmar.");
      return;
    }

    setLoading(true);
    try {
      // Create the order using comandaService
      await comandaService.crearComanda(user.id, items);
      
      // Clear shopping cart
      clearCart();
      
      Alert.alert("¡Pago Exitoso!", "Tu pedido ha sido recibido y ya se está preparando.", [
        {
          text: "Seguir Pedido",
          onPress: () => {
            // Redirect immediately to the order tracking screen
            router.replace("/(tabs)/seguir-pedido" as any);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo realizar el pedido.");
    } finally {
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

      <FlatList
        data={items}
        keyExtractor={(item) => item.plato.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartName}>{item.plato.nombre}</Text>
              <Text style={styles.cartPrice}>{formatPrice(item.plato.precio)}</Text>
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
              <Text style={styles.detailsTitle}>Detalles de Entrega</Text>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color="#4A5568" />
                <Text style={styles.detailText}>
                  Av. Emilio Civit 450, Quinta Sección, Mendoza
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={18} color="#4A5568" />
                <Text style={styles.detailText}>
                  Método de pago: Tarjeta de Crédito/Débito (Simulado)
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
                <Text style={styles.summaryValue}>{formatPrice(costoEnvio)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
              </View>
            </View>

            {/* Pay and Checkout Button */}
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.payButtonText}>Pagar y Realizar Pedido</Text>
                </>
              )}
            </TouchableOpacity>
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
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
