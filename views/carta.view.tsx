import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartaController } from "../controllers/carta.controller";
import { useCartStore } from "../store/cartStore";
import { useHomeController } from "../controllers/home.controller";
import { router } from "expo-router";
import { Plato, Seccion } from "../models";
import { useAuthStore } from "../store/authStore";
import { direccionService } from "../services/direccion.service";
import { DireccionModal } from "../components/DireccionModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Format currency in Spanish style ($ 3.500,00)
const formatPrice = (value: number) => {
  return `$ ${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function CartaView() {
  const {
    carta,
    loading,
    error,
    selectedPlato,
    setSelectedPlato,
    activeSectionId,
    setActiveSectionId,
    refreshCarta,
  } = useCartaController();

  const { hasActiveOrder } = useHomeController();
  const addItem = useCartStore((state) => state.addItem);

  const user = useAuthStore((state) => state.user);
  const [direccion, setDireccion] = React.useState<string | null>(null);
  const [showDireccionModal, setShowDireccionModal] = React.useState(false);
  const [loadingDireccion, setLoadingDireccion] = React.useState(false);

  React.useEffect(() => {
    if (user?.direccionId) {
      setLoadingDireccion(true);
      direccionService
        .getDireccion(user.direccionId)
        .then((dir) => {
          setDireccion(`${dir.calle} ${dir.numeracion} (${dir.barrio || ""})`);
        })
        .catch((err) => {
          console.error("Error loading address:", err);
          setDireccion("Error al cargar dirección");
        })
        .finally(() => {
          setLoadingDireccion(false);
        });
    } else {
      setDireccion(null);
    }
  }, [user?.direccionId]);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [sheetQuantity, setSheetQuantity] = React.useState(1);

  React.useEffect(() => {
    if (selectedPlato) {
      setSheetQuantity(1);
    }
  }, [selectedPlato]);

  const cartTotal = React.useMemo(
    () => cartItems.reduce((sum, i) => sum + i.plato.precio * i.cantidad, 0),
    [cartItems],
  );
  const cartCount = React.useMemo(
    () => cartItems.reduce((sum, i) => sum + i.cantidad, 0),
    [cartItems],
  );

  // Reference for the main scroll view to scroll to sections
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Use ref (not state) for layouts so onScroll doesn't cause re-renders
  const sectionLayoutsRef = React.useRef<Record<number, number>>({});
  // Ref mirrors state so onScroll callback always has current value
  const activeSectionIdRef = React.useRef<number>(activeSectionId);
  activeSectionIdRef.current = activeSectionId;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A202C" />
        <Text style={styles.loadingText}>Cargando la carta...</Text>
      </View>
    );
  }

  if (error || !carta) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#E53E3E" />
        <Text style={styles.errorText}>{error || "No se pudo cargar la carta."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshCarta}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const secciones = carta.secciones || [];

  const handleSectionTabPress = (id: number) => {
    setActiveSectionId(id);
    const yOffset = sectionLayoutsRef.current[id];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Aroma Delivery</Text>
          <TouchableOpacity
            style={[styles.addressBar, !direccion && styles.addressBarWarning]}
            onPress={() => setShowDireccionModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={direccion ? "location-outline" : "warning-outline"}
              size={14}
              color={direccion ? "#4A5568" : "#E53E3E"}
            />
            <Text style={[styles.addressText, !direccion && styles.noAddressText]} numberOfLines={1}>
              {loadingDireccion
                ? "Buscando ubicación..."
                : direccion
                ? `Enviar a: ${direccion}`
                : "Seleccionar dirección de envío ⚠️"}
            </Text>
            <Ionicons name="chevron-down" size={12} color={direccion ? "#718096" : "#E53E3E"} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sticky horizontal categories tab bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContainer}
        >
          {secciones.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.tabButton,
                activeSectionId === s.id && styles.tabButtonActive,
              ]}
              onPress={() => handleSectionTabPress(s.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeSectionId === s.id && styles.tabButtonTextActive,
                ]}
              >
                {s.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable list of sections and plates */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuScrollContainer}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          let currentSectionId = activeSectionIdRef.current;
          for (let i = secciones.length - 1; i >= 0; i--) {
            const sec = secciones[i];
            const secY = sectionLayoutsRef.current[sec.id];
            if (secY !== undefined && y >= secY - 10) {
              currentSectionId = sec.id;
              break;
            }
          }
          if (currentSectionId !== activeSectionIdRef.current) {
            setActiveSectionId(currentSectionId);
          }
        }}
      >
        {secciones.map((s) => (
          <View
            key={s.id}
            onLayout={(event) => {
              sectionLayoutsRef.current[s.id] = event.nativeEvent.layout.y;
            }}
            style={styles.sectionBlock}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{s.nombre}</Text>
              {s.detalle && <Text style={styles.sectionSubtitle}>{s.detalle}</Text>}
            </View>

            <View style={styles.platesContainer}>
              {(!s.platos || s.platos.length === 0) ? (
                <Text style={styles.emptyText}>Sin platos en esta sección.</Text>
              ) : (
                s.platos.map((plato) => {
                  const cartItem = cartItems.find((item) => item.plato.id === plato.id);
                  return (
                    <TouchableOpacity
                      key={plato.id}
                      style={styles.plateRow}
                      activeOpacity={0.7}
                      onPress={() => setSelectedPlato(plato)}
                    >
                      {/* Plate Info */}
                      <View style={styles.plateInfo}>
                        <Text style={styles.plateName}>{plato.nombre}</Text>
                        {plato.detalle && (
                          <Text style={styles.plateDetail} numberOfLines={2}>
                            {plato.detalle}
                          </Text>
                        )}
                        
                        <View style={styles.priceRowContainer}>
                          <Text style={styles.platePrice}>{formatPrice(plato.precio)}</Text>
                          
                          {!hasActiveOrder && (
                            cartItem ? (
                              <View style={styles.rowQuantityContainer}>
                                <TouchableOpacity
                                  style={styles.rowQuantityBtn}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(plato.id, cartItem.cantidad - 1);
                                  }}
                                >
                                  <Ionicons name="remove" size={12} color="#1A202C" />
                                </TouchableOpacity>
                                <Text style={styles.rowQuantityText}>{cartItem.cantidad}</Text>
                                <TouchableOpacity
                                  style={styles.rowQuantityBtn}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(plato.id, cartItem.cantidad + 1);
                                  }}
                                >
                                  <Ionicons name="add" size={12} color="#1A202C" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.rowAddButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  addItem(plato);
                                }}
                              >
                                <Text style={styles.rowAddButtonText}>+ Agregar</Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </View>

                      {/* Plate Image or Placeholder */}
                      <View style={styles.plateImageContainer}>
                        {plato.imagen?.imagenSi ? (
                          <Image
                            source={{ uri: plato.imagen.imagenSi }}
                            style={styles.plateImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.plateImagePlaceholder}>
                            <Ionicons name="restaurant-outline" size={24} color="#CBD5E0" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating cart button */}
      {cartItems.length > 0 && !hasActiveOrder && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => router.push("/(tabs)/carrito" as any)}
          activeOpacity={0.9}
        >
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.floatingCartText}>Ir al carrito</Text>
          <Text style={styles.floatingCartPrice}>{formatPrice(cartTotal)}</Text>
        </TouchableOpacity>
      )}

      {/* Dish detail bottom sheet Modal */}
      <Modal
        visible={!!selectedPlato}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPlato(null)}
      >
        {selectedPlato && (
          <View style={styles.modalOverlay}>
            {/* Backdrop press closes */}
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedPlato(null)}
            />

            {/* Bottom Sheet Card */}
            <View style={styles.sheetCard}>
              {/* Close Icon Badge */}
              <TouchableOpacity
                style={styles.closeBadge}
                onPress={() => setSelectedPlato(null)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Cover Image */}
              <View style={styles.sheetImageContainer}>
                {selectedPlato.imagen?.imagenSi ? (
                  <Image
                    source={{ uri: selectedPlato.imagen.imagenSi }}
                    style={styles.sheetImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.sheetImagePlaceholder}>
                    <Ionicons name="restaurant-outline" size={72} color="#E2E8F0" />
                  </View>
                )}
              </View>

              {/* Content area */}
              <View style={styles.sheetContent}>
                <Text style={styles.sheetName}>{selectedPlato.nombre}</Text>
                
                {selectedPlato.detalle && (
                  <Text style={styles.sheetDetail}>{selectedPlato.detalle}</Text>
                )}
                
                <View style={styles.sheetPriceRow}>
                  <Text style={styles.sheetPriceLabel}>Precio Unitario</Text>
                  <Text style={styles.sheetPriceValue}>{formatPrice(selectedPlato.precio)}</Text>
                </View>

                {/* Selector de cantidad */}
                {!hasActiveOrder && (
                  <View style={styles.sheetQuantityRow}>
                    <Text style={styles.sheetQuantityLabel}>Cantidad</Text>
                    <View style={styles.modalQuantityControls}>
                      <TouchableOpacity
                        style={styles.modalQuantityBtn}
                        onPress={() => setSheetQuantity(Math.max(1, sheetQuantity - 1))}
                      >
                        <Ionicons name="remove" size={18} color="#1A202C" />
                      </TouchableOpacity>
                      <Text style={styles.modalQuantityText}>{sheetQuantity}</Text>
                      <TouchableOpacity
                        style={styles.modalQuantityBtn}
                        onPress={() => setSheetQuantity(sheetQuantity + 1)}
                      >
                        <Ionicons name="add" size={18} color="#1A202C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {hasActiveOrder ? (
                  <View style={[styles.sheetButton, styles.sheetButtonDisabled]}>
                    <Text style={styles.sheetButtonText}>Pedido en curso</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.sheetButton}
                    onPress={() => {
                      addItem(selectedPlato, sheetQuantity);
                      setSelectedPlato(null);
                      Alert.alert("¡Plato Agregado!", `Se agregaron ${sheetQuantity}x ${selectedPlato.nombre} a tu pedido.`, [
                        { text: "Ver Pedido", onPress: () => router.push("/(tabs)/carrito" as any) },
                        { text: "Continuar" }
                      ]);
                    }}
                  >
                    <Text style={styles.sheetButtonText}>
                      Agregar al pedido ({formatPrice(selectedPlato.precio * sheetQuantity)})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>

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
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#718096",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#E53E3E",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1A202C",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  header: {
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
    backgroundColor: "#FFFFFF",
  },
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "#F7FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxWidth: "85%",
  },
  addressBarWarning: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FED2D2",
  },
  addressText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4A5568",
    marginLeft: 4,
    marginRight: 2,
  },
  noAddressText: {
    color: "#E53E3E",
    fontWeight: "bold",
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EDF2F7",
  },
  tabButtonActive: {
    backgroundColor: "#1A202C",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  menuScrollContainer: {
    paddingBottom: 40,
  },
  sectionBlock: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#718096",
    marginTop: 2,
  },
  platesContainer: {
    paddingHorizontal: 16,
  },
  emptyText: {
    paddingVertical: 16,
    fontSize: 14,
    color: "#A0AEC0",
    fontStyle: "italic",
  },
  plateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  plateInfo: {
    flex: 1,
    paddingRight: 16,
  },
  plateName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  plateDetail: {
    fontSize: 13,
    color: "#718096",
    marginTop: 4,
    lineHeight: 18,
  },
  platePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3748",
    marginTop: 8,
  },
  plateImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EDF2F7",
  },
  plateImage: {
    width: "100%",
    height: "100%",
  },
  plateImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  closeBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetImageContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.3,
    backgroundColor: "#F7FAFC",
  },
  sheetImage: {
    width: "100%",
    height: "100%",
  },
  sheetImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: {
    padding: 24,
  },
  sheetName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
    lineHeight: 28,
  },
  sheetDetail: {
    fontSize: 15,
    color: "#4A5568",
    marginTop: 12,
    lineHeight: 22,
  },
  sheetPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  sheetPriceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#718096",
  },
  sheetPriceValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  sheetButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  sheetButtonDisabled: {
    backgroundColor: "#A0AEC0",
    opacity: 0.8,
  },
  sheetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  sheetQuantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  sheetQuantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#718096",
  },
  modalQuantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  modalQuantityBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalQuantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
    paddingHorizontal: 12,
  },
  priceRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  rowQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  rowQuantityBtn: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  rowQuantityText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A202C",
    paddingHorizontal: 8,
  },
  rowAddButton: {
    backgroundColor: "#1A202C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rowAddButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  floatingCartBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    height: 56,
    backgroundColor: "#1A202C",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4A5568",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  floatingBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  floatingCartText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  floatingCartPrice: {
    color: "#A0AEC0",
    fontSize: 14,
    fontWeight: "600",
  },
});
