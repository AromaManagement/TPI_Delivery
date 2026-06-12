import React, { useState, useEffect, useRef, useCallback } from "react";
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
  FlatList,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth.service";
import { direccionService } from "../services/direccion.service";
import { Direccion } from "../models";

// Centro de Mendoza por defecto
const DEFAULT_REGION: Region = {
  latitude: -32.8894,
  longitude: -68.8458,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    state?: string;
  };
}

interface Coords {
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Nominatim helpers
// ---------------------------------------------------------------------------

const NOMINATIM_HEADERS = { "User-Agent": "AromaDeliveryApp/2.0" };

async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  try {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=ar&accept-language=es&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function extractFields(result: NominatimResult) {
  const a = result.address ?? {};
  return {
    calle: a.road ?? "",
    numeracion: a.house_number ?? "",
    etiqueta: result.display_name,
  };
}

// ---------------------------------------------------------------------------
// DireccionModal
// ---------------------------------------------------------------------------

interface DireccionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess: (direccion: Direccion) => void;
}

export function DireccionModal({ visible, onClose, onSaveSuccess }: DireccionModalProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);

  // Pin coordinates
  const [pinCoords, setPinCoords] = useState<Coords | null>(null);

  // Form fields
  const [calle, setCalle] = useState("");
  const [numeracion, setNumeracion] = useState("");
  const [manzanaPiso, setManzanaPiso] = useState("");
  const [casaDepto, setCasaDepto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  // Search
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPinCoords(null);
      setCalle("");
      setNumeracion("");
      setManzanaPiso("");
      setCasaDepto("");
      setReferencia("");
      setEtiqueta("");
      setSearchText("");
      setSearchResults([]);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchText.trim() || searchText.length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(`${searchText}, Mendoza, Argentina`);
      setSearchResults(results);
      setSearching(false);
    }, 500);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchText]);

  const applyResult = useCallback((result: NominatimResult) => {
    const coords: Coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    const fields = extractFields(result);
    setPinCoords(coords);
    setCalle(fields.calle);
    setNumeracion(fields.numeracion);
    setEtiqueta(fields.etiqueta);
    setSearchText("");
    setSearchResults([]);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400
    );
  }, []);

  const handleMapPress = useCallback(async (e: { nativeEvent: { coordinate: Coords } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPinCoords({ latitude, longitude });
    setGeocoding(true);
    const result = await reverseGeocode(latitude, longitude);
    if (result) {
      const fields = extractFields(result);
      setCalle(fields.calle);
      setNumeracion(fields.numeracion);
      setEtiqueta(fields.etiqueta);
    }
    setGeocoding(false);
  }, []);

  const handleMyLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Habilitá el acceso a la ubicación en Ajustes.");
      return;
    }
    setGeocoding(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPinCoords(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
      const result = await reverseGeocode(coords.latitude, coords.longitude);
      if (result) {
        const fields = extractFields(result);
        setCalle(fields.calle);
        setNumeracion(fields.numeracion);
        setEtiqueta(fields.etiqueta);
      }
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación actual.");
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!calle.trim() || !numeracion.trim()) {
      Alert.alert("Campos obligatorios", "Seleccioná una dirección en el mapa o completá Calle y Altura.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const newDireccion = await direccionService.crearDireccion({
        calle: calle.trim(),
        numeracion: numeracion.trim(),
        manzanaPiso: manzanaPiso.trim() || null,
        casaDepto: casaDepto.trim() || null,
        referencia: referencia.trim() || null,
        lat: pinCoords?.latitude ?? null,
        lng: pinCoords?.longitude ?? null,
        etiqueta: etiqueta || `${calle.trim()} ${numeracion.trim()}`,
      });

      const updatedUser = await authService.updateProfile(user.id, { direccionId: newDireccion.id });
      setSession(token!, updatedUser);
      onSaveSuccess(newDireccion);
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la dirección.");
    } finally {
      setSaving(false);
    }
  }, [calle, numeracion, manzanaPiso, casaDepto, referencia, pinCoords, etiqueta, user, token, setSession, onSaveSuccess, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>¿Dónde entregamos?</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map + Search overlay wrapper */}
        <View style={styles.mapOuter}>
          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {pinCoords && (
                <Marker coordinate={pinCoords} title="Entrega aquí" pinColor="#E53E3E" />
              )}
            </MapView>

            {/* My location button */}
            <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} disabled={geocoding}>
              <Ionicons name="locate" size={22} color="#1A202C" />
            </TouchableOpacity>

            {/* Geocoding indicator */}
            {geocoding && (
              <View style={styles.geocodingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.geocodingText}>Obteniendo dirección…</Text>
              </View>
            )}

            {/* Tap hint (shown when no pin) */}
            {!pinCoords && !geocoding && (
              <View style={styles.tapHint}>
                <Ionicons name="hand-left-outline" size={14} color="#4A5568" />
                <Text style={styles.tapHintText}>Tocá el mapa para ubicar tu domicilio</Text>
              </View>
            )}
          </View>

          {/* Search bar — floats over the map */}
          <View style={styles.searchOverlay}>
            <Ionicons name="search" size={18} color="#718096" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar dirección..."
              placeholderTextColor="#A0AEC0"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color="#718096" style={{ marginRight: 10 }} />}
            {searchText.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { setSearchText(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#A0AEC0" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results — floats below the search bar, over the map */}
          {searchResults.length > 0 && (
            <View style={styles.resultsOverlay}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.place_id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => applyResult(item)}>
                    <Ionicons name="location-outline" size={16} color="#718096" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Form fields */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Calle y Altura */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Calle *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Av. San Martín"
                placeholderTextColor="#A0AEC0"
                value={calle}
                onChangeText={setCalle}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Altura *</Text>
              <TextInput
                style={styles.input}
                placeholder="1234"
                placeholderTextColor="#A0AEC0"
                value={numeracion}
                onChangeText={setNumeracion}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Piso/Manzana y Depto */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Piso / Manzana</Text>
              <TextInput
                style={styles.input}
                placeholder="Piso 3"
                placeholderTextColor="#A0AEC0"
                value={manzanaPiso}
                onChangeText={setManzanaPiso}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Depto / Casa</Text>
              <TextInput
                style={styles.input}
                placeholder="Depto B"
                placeholderTextColor="#A0AEC0"
                value={casaDepto}
                onChangeText={setCasaDepto}
              />
            </View>
          </View>

          {/* Referencias */}
          <View style={styles.field}>
            <Text style={styles.label}>Indicaciones para el repartidor</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej. Portón negro, timbre roto, llamar al llegar."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
              value={referencia}
              onChangeText={setReferencia}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || geocoding}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Confirmar dirección</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A202C" },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: "#2D3748", paddingVertical: 0 },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  resultText: { flex: 1, fontSize: 13, color: "#2D3748", lineHeight: 18 },
  mapOuter: {
    marginHorizontal: 12,
    marginBottom: 4,
    position: "relative",
  },
  mapContainer: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
  },
  searchOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 44,
    paddingLeft: 10,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  resultsOverlay: {
    position: "absolute",
    top: 64,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: 200,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  map: { flex: 1 },
  myLocationBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  geocodingBadge: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    left: "15%",
    right: "15%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,32,44,0.82)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  geocodingText: { color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
  tapHint: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    left: "10%",
    right: "10%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  tapHintText: { fontSize: 12, color: "#4A5568" },
  formScroll: { flex: 1 },
  formContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  row: { flexDirection: "row" },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#4A5568", marginBottom: 4 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#2D3748",
  },
  textArea: { height: 72, paddingTop: 10, textAlignVertical: "top" },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
