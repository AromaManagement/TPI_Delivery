import { Platform } from "react-native";
import { useAuthStore } from "../store/authStore";

// Determine the backend API URL based on environment variables or running platform
export const API_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  android: "http://10.0.2.2:5000/api",
  ios: "http://localhost:5000/api",
  default: "http://localhost:5000/api",
});

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Content-Type", "application/json");

  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = payload?.message || "Ocurrió un error al comunicarse con el servidor.";
      throw new ApiError(message, response.status);
    }

    // Backend typically wraps responses in { status, message, data }
    return payload?.data !== undefined ? payload.data : payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifique la conexión o el estado del backend.",
      503
    );
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
};
