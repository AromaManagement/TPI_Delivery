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

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const result = await authController.loginAction({ correo, contrasena });
    
    if (result.ok) {
      onLoginSuccess();
    } else {
      setError(result.error || "Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header Visual Section */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="fast-food" size={42} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Aroma</Text>
          <Text style={styles.brandSubtitle}>Delivery de Sabores</Text>
        </View>

        {/* Input Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#E53E3E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInput}
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
                style={styles.inputInput}
                placeholder="••••••••"
                placeholderTextColor="#A0AEC0"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={secureText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeButton}>
                <Ionicons
                  name={secureText ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#718096"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerLinkContainer}>
          <Text style={styles.registerLinkText}>¿No tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/registro" as any)}>
            <Text style={styles.registerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1A202C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A202C",
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "#718096",
    marginTop: 4,
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
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 20,
    textAlign: "center",
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
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 6,
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
  inputIcon: {
    marginRight: 8,
  },
  inputInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#2D3748",
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#1A202C",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  registerLinkText: { fontSize: 14, color: "#718096" },
  registerLink: { fontSize: 14, color: "#1A202C", fontWeight: "bold" },
});
