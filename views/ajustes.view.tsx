import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { authController } from "../controllers/auth.controller";

export function AjustesView() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const [nombre, setNombre] = useState(user.nombre);
  const [apellido, setApellido] = useState(user.apellido);
  const [tipoDocumento, setTipoDocumento] = useState(user.tipoDocumento || "DNI");
  const [documento, setDocumento] = useState(user.documento || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      setError("El nombre y el apellido no pueden estar vacíos.");
      return;
    }

    setError(null);
    setSuccess(false);

    const result = await authController.updateUserAction({
      nombre,
      apellido,
      tipoDocumento,
      documento,
    });

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1000);
    } else {
      setError(result.error || "Ocurrió un error al actualizar el perfil.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Información de la Cuenta</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#C53030" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#2F855A" />
                <Text style={styles.successText}>¡Perfil guardado con éxito!</Text>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.inputInput}
                placeholder="Nombre"
                placeholderTextColor="#A0AEC0"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.inputInput}
                placeholder="Apellido"
                placeholderTextColor="#A0AEC0"
                value={apellido}
                onChangeText={setApellido}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Tipo de Documento</Text>
              <TextInput
                style={styles.inputInput}
                placeholder="DNI, Pasaporte, etc."
                placeholderTextColor="#A0AEC0"
                value={tipoDocumento}
                onChangeText={setTipoDocumento}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Número de Documento</Text>
              <TextInput
                style={styles.inputInput}
                placeholder="Número de documento"
                placeholderTextColor="#A0AEC0"
                value={documento}
                onChangeText={setDocumento}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
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
    padding: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#C53030",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#C6F6D5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: "#22543D",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 6,
  },
  inputInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#2D3748",
  },
  saveButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
