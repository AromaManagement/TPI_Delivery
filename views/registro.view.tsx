import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authController } from "../controllers/auth.controller";

export function RegistroView() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [securePass, setSecurePass] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const result = await authController.registerAction({ nombre, apellido, correo, contrasena });
    setLoading(false);

    if (result.ok) {
      router.replace("/(tabs)" as any);
    } else {
      setError(result.error || "Ocurrió un error inesperado.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="person-add" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Crear Cuenta</Text>
          <Text style={styles.brandSubtitle}>Registrate en Aroma Delivery</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#E53E3E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan"
                placeholderTextColor="#A0AEC0"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                placeholder="Pérez"
                placeholderTextColor="#A0AEC0"
                value={apellido}
                onChangeText={setApellido}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder="ejemplo@aromas.com"
                placeholderTextColor="#A0AEC0"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#A0AEC0"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={securePass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecurePass(!securePass)} style={styles.eyeButton}>
                <Ionicons name={securePass ? "eye-outline" : "eye-off-outline"} size={20} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                placeholder="Repetí la contraseña"
                placeholderTextColor="#A0AEC0"
                value={confirmar}
                onChangeText={setConfirmar}
                secureTextEntry={secureConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)} style={styles.eyeButton}>
                <Ionicons name={secureConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Link to login */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace("/login" as any)}>
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: { alignItems: "center", marginBottom: 28 },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#1A202C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  brandTitle: { fontSize: 28, fontWeight: "bold", color: "#1A202C" },
  brandSubtitle: { fontSize: 15, color: "#718096", marginTop: 4 },
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
  errorText: { color: "#C53030", fontSize: 14, marginLeft: 8, flex: 1 },
  row: { flexDirection: "row" },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#4A5568", marginBottom: 6 },
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  inputInner: { flex: 1, height: 48, fontSize: 15, color: "#2D3748" },
  eyeButton: { padding: 8 },
  registerButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  registerButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  loginLinkText: { fontSize: 14, color: "#718096" },
  loginLink: { fontSize: 14, color: "#1A202C", fontWeight: "bold" },
});
