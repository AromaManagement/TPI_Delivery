import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { authController } from "../controllers/auth.controller";

export function PerfilView() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await authController.logoutAction();
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.nombre.charAt(0).toUpperCase()}{user.apellido.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.nombre} {user.apellido}</Text>
          <Text style={styles.userRole}>
            {user.rol === "ADMIN"
              ? "Administrador"
              : user.rol === "REPARTIDOR"
              ? "Repartidor"
              : "Cliente Aroma"}
          </Text>
        </View>

        {/* User Info Details */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Información Personal</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="mail-outline" size={20} color="#4A5568" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.correo}</Text>
            </View>
          </View>

          {user.documento && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="card-outline" size={20} color="#4A5568" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Documento ({user.tipoDocumento || "DNI"})</Text>
                <Text style={styles.infoValue}>{user.documento}</Text>
              </View>
            </View>
          )}

          {user.rol !== "REPARTIDOR" && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location-outline" size={20} color="#4A5568" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dirección de entrega</Text>
                <Text style={styles.infoValue}>
                  {user.direccionId ? "Av. Emilio Civit 450, Quinta Sección" : "No registrada"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions Section — solo para no repartidores */}
        {user.rol !== "REPARTIDOR" && (
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/ajustes" as any)}>
              <Ionicons name="settings-outline" size={20} color="#2D3748" />
              <Text style={styles.actionButtonText}>Ajustes de Cuenta</Text>
              <Ionicons name="chevron-forward" size={18} color="#A0AEC0" style={styles.actionChevron} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/historial" as any)}>
              <Ionicons name="receipt-outline" size={20} color="#2D3748" />
              <Text style={styles.actionButtonText}>Historial de Pedidos</Text>
              <Ionicons name="chevron-forward" size={18} color="#A0AEC0" style={styles.actionChevron} />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    alignItems: "center",
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
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A202C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  userRole: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
  infoCard: {
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
    marginBottom: 24,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EDF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A0AEC0",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    color: "#2D3748",
    marginTop: 2,
    fontWeight: "500",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    marginLeft: 16,
  },
  actionChevron: {
    alignSelf: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    borderRadius: 16,
    height: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  logoutButtonText: {
    color: "#C53030",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
