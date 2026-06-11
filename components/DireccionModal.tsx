import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth.service";
import { direccionService } from "../services/direccion.service";
import { Direccion, Localidad } from "../models";

interface DireccionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess: (direccion: Direccion) => void;
}

export function DireccionModal({ visible, onClose, onSaveSuccess }: DireccionModalProps) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);

  // Form states
  const [calle, setCalle] = useState("");
  const [numeracion, setNumeracion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [manzanaPiso, setManzanaPiso] = useState("");
  const [casaDepto, setCasaDepto] = useState("");
  const [referencia, setReferencia] = useState("");
  
  // Localidades states
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [selectedLocalidad, setSelectedLocalidad] = useState<Localidad | null>(null);
  const [showLocalidadSelector, setShowLocalidadSelector] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLocalidades();
    }
  }, [visible]);

  const fetchLocalidades = async () => {
    setLoadingLocalidades(true);
    try {
      const list = await direccionService.getLocalidades();
      setLocalidades(list);
      if (list.length > 0) {
        setSelectedLocalidad(list[0]);
      }
    } catch (error) {
      console.error("Error fetching localidades:", error);
    } finally {
      setLoadingLocalidades(false);
    }
  };

  const handleSave = async () => {
    if (!calle.trim() || !numeracion.trim() || !barrio.trim() || !selectedLocalidad) {
      Alert.alert("Campos obligatorios", "Por favor completa la Calle, Numeración, Barrio y selecciona una Localidad.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Debe iniciar sesión para guardar una dirección.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the address
      const newDireccion = await direccionService.crearDireccion({
        calle: calle.trim(),
        numeracion: numeracion.trim(),
        barrio: barrio.trim(),
        manzanaPiso: manzanaPiso.trim() || null,
        casaDepto: casaDepto.trim() || null,
        referencia: referencia.trim() || null,
        localidadId: selectedLocalidad.id,
      });

      // 2. Link it to the user profile
      const updatedUser = await authService.updateProfile(user.id, {
        direccionId: newDireccion.id,
      });

      // 3. Update the global session storage
      setSession(token!, updatedUser);

      Alert.alert("¡Éxito!", "Dirección guardada correctamente.");
      onSaveSuccess(newDireccion);
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la dirección.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Dirección de Envío</Text>
              <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* Form ScrollView */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.helperText}>
                Completá los detalles de tu domicilio para poder realizar pedidos.
              </Text>

              {/* Localidad Selector */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Localidad *</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setShowLocalidadSelector(true)}
                  disabled={loadingLocalidades || loading}
                >
                  <Text style={selectedLocalidad ? styles.selectorText : styles.selectorPlaceholder}>
                    {loadingLocalidades ? "Cargando localidades..." : selectedLocalidad ? selectedLocalidad.nombre : "Seleccionar Localidad"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#718096" />
                </TouchableOpacity>
              </View>

              {/* Calle y Altura en la misma fila */}
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Calle *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Av. San Martín"
                    placeholderTextColor="#A0AEC0"
                    value={calle}
                    onChangeText={setCalle}
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Altura *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 1234"
                    placeholderTextColor="#A0AEC0"
                    value={numeracion}
                    onChangeText={setNumeracion}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Barrio */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Barrio *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Centro"
                  placeholderTextColor="#A0AEC0"
                  value={barrio}
                  onChangeText={setBarrio}
                  editable={!loading}
                />
              </View>

              {/* Piso/Manzana y Depto en la misma fila */}
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Piso / Manzana</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Piso 3"
                    placeholderTextColor="#A0AEC0"
                    value={manzanaPiso}
                    onChangeText={setManzanaPiso}
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Depto / Casa</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Depto B"
                    placeholderTextColor="#A0AEC0"
                    value={casaDepto}
                    onChangeText={setCasaDepto}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Referencias */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Referencias o indicaciones de entrega</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ej. Portón negro al lado de la fiambrería."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={3}
                  value={referencia}
                  onChangeText={setReferencia}
                  editable={!loading}
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Dirección</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Sub-modal: Localidad Selector */}
      <Modal visible={showLocalidadSelector} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Elegí tu Localidad</Text>
              <TouchableOpacity onPress={() => setShowLocalidadSelector(false)}>
                <Ionicons name="close" size={24} color="#2D3748" />
              </TouchableOpacity>
            </View>
            <FlatListContainer localidades={localidades} onSelect={(loc) => {
              setSelectedLocalidad(loc);
              setShowLocalidadSelector(false);
            }} />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// FlatList equivalent inside Modal helper
function FlatListContainer({ localidades, onSelect }: { localidades: Localidad[]; onSelect: (loc: Localidad) => void }) {
  return (
    <ScrollView style={styles.selectorList}>
      {localidades.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.selectorItem}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.selectorItemText}>{item.nombre}</Text>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardContainer: {
    width: "100%",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  helperText: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#2D3748",
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
  },
  selectorText: {
    fontSize: 15,
    color: "#2D3748",
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: "#A0AEC0",
  },
  saveBtn: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  selectorContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  selectorList: {
    padding: 8,
  },
  selectorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  selectorItemText: {
    fontSize: 15,
    color: "#2D3748",
  },
});
