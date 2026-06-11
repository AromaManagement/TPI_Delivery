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

export interface RegisterInput {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol?: "CLIENTE" | "REPARTIDOR";
}

export const authService = {
  register: async (data: RegisterInput): Promise<AuthPayload> => {
    return await api.post<AuthPayload>("/auth/register", data, { skipAuth: true });
  },

  updateProfile: async (userId: number, fields: Partial<Usuario>): Promise<Usuario> => {
    return await api.put<Usuario>("/usuarios/me", fields);
  },

  login: async (data: LoginInput): Promise<AuthPayload> => {
    return await api.post<AuthPayload>("/auth/login", data, { skipAuth: true });
  },
};
