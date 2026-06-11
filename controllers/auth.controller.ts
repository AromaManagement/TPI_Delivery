import {
  authService,
  LoginInput,
  RegisterInput,
} from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { Usuario } from "../models";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export const authController = {
  loginAction: async (input: LoginInput): Promise<ActionResult> => {
    // Basic validation
    if (!input.correo || !input.correo.includes("@")) {
      return {
        ok: false,
        error: "Por favor, ingrese un correo electrónico válido.",
      };
    }

    if (!input.contrasena || input.contrasena.length < 6) {
      return {
        ok: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }

    try {
      const { token, user } = await authService.login(input);

      if (user.rol !== "CLIENTE" && user.rol !== "REPARTIDOR") {
        return {
          ok: false,
          error:
            "Acceso denegado. Esta aplicación es para clientes y repartidores.",
        };
      }

      // Update the state store
      useAuthStore.getState().setSession(token, user);

      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al iniciar sesión. Inténtelo de nuevo.",
      };
    }
  },

  registerAction: async (input: RegisterInput): Promise<ActionResult> => {
    if (!input.nombre.trim() || !input.apellido.trim()) {
      return { ok: false, error: "El nombre y el apellido son obligatorios." };
    }
    if (!input.correo.includes("@")) {
      return { ok: false, error: "Ingresá un correo electrónico válido." };
    }
    if (input.contrasena.length < 6) {
      return {
        ok: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }
    try {
      const { token, user } = await authService.register(input);
      useAuthStore.getState().setSession(token, user);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message || "Error al registrarse." };
    }
  },

  updateUserAction: async (
    updatedFields: Partial<Usuario>,
  ): Promise<ActionResult> => {
    const store = useAuthStore.getState();
    if (!store.user) {
      return { ok: false, error: "No hay una sesión activa." };
    }

    try {
      let updatedUser: Usuario;
      try {
        updatedUser = await authService.updateProfile(
          store.user.id,
          updatedFields,
        );
      } catch {
        updatedUser = { ...store.user, ...updatedFields };
      }
      store.setSession(store.token || "", updatedUser);
      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al actualizar el perfil.",
      };
    }
  },

  logoutAction: async (): Promise<void> => {
    useAuthStore.getState().clearSession();
  },
};
