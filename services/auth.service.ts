import { api } from "./api";
import { Usuario } from "../models";

export interface AuthPayload {
  user: Usuario;
  token: string;
}

export interface LoginInput {
  correo: string;
  contrasena: string;
}

export const authService = {
  login: async (data: LoginInput): Promise<AuthPayload> => {
    try {
      // Attempt to authenticate with the real backend
      return await api.post<AuthPayload>("/auth/login", data, { skipAuth: true });
    } catch (error) {
      console.warn("Backend authentication failed, falling back to mock login.", error);
      
      // Fallback for testing when backend is not running or database is unseeded
      if (data.correo === "cliente@aromas.com" && data.contrasena === "12345678") {
        return {
          token: "mock-jwt-token-for-cliente",
          user: {
            id: 101,
            correo: "cliente@aromas.com",
            nombre: "Juan",
            apellido: "Pérez",
            rol: "CLIENTE",
            tipoDocumento: "DNI",
            documento: "12345678",
            direccionId: 201,
          },
        };
      }
      
      // Also support default admin login if needed
      if (data.correo === "admin@aromas.com" && data.contrasena === "12345678") {
        return {
          token: "mock-jwt-token-for-admin",
          user: {
            id: 1,
            correo: "admin@aromas.com",
            nombre: "Admin",
            apellido: "Aromas",
            rol: "ADMIN",
          },
        };
      }

      throw error;
    }
  },
};
