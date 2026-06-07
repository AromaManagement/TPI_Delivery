import { api } from "./api";
import { Comanda, EstadoComanda, DetalleComanda } from "../models";

// Simulated state variables
let simulationStartTime = Date.now();
let isOrderActive = false;
let activeMockOrder: Comanda | null = null;

export const resetSimulation = () => {
  simulationStartTime = Date.now();
  isOrderActive = false;
  activeMockOrder = null;
};

export const comandaService = {
  // Check if there is an active order
  getActiveOrder: async (clienteId: number): Promise<Comanda | null> => {
    try {
      return await api.get<Comanda | null>(`/comandas/active?clienteId=${clienteId}`);
    } catch (error) {
      console.log("Using simulated active order data.");

      if (clienteId !== 101 || !isOrderActive || !activeMockOrder) {
        return null;
      }

      const elapsedMs = Date.now() - simulationStartTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      // Order lifetime simulation:
      // 0 - 20s: EN_COCINA
      // 20s - 60s: EN_CAMINO (repartidor en reparto)
      // > 60s: ENTREGADO (completed)
      let estadoComanda: EstadoComanda = "EN_COCINA";
      let estadoRecorrido = "PENDIENTE";

      if (elapsedSeconds > 20) {
        estadoComanda = "LISTO";
        estadoRecorrido = "EN_CAMINO";
      }

      if (elapsedSeconds > 60) {
        // Complete the order
        isOrderActive = false;
        activeMockOrder = null;
        return null;
      }

      // Origin (Aroma restaurant): Mendoza Center
      const originLat = -32.8897;
      const originLng = -68.8450;

      // Destination (Customer): Quinta Sección
      const destLat = -32.8943;
      const destLng = -68.8385;

      // Calculate street coordinates (orthogonally following streets: Belgrano and Emilio Civit)
      // Point 1: Origin (-32.8897, -68.8450)
      // Point 2: Corner of Belgrano & Emilio Civit (-32.8943, -68.8450)
      // Point 3: Destination (-32.8943, -68.8385)
      let driverLat = originLat;
      let driverLng = originLng;

      if (estadoRecorrido === "EN_CAMINO") {
        // Linear interpolation from 20s to 60s (40s duration) along the 2 street segments
        const progress = Math.min((elapsedSeconds - 20) / 40, 1);
        
        // 50% of time going South along Belgrano, 50% of time going West along Emilio Civit
        if (progress < 0.5) {
          const segProgress = progress / 0.5;
          driverLat = originLat + (destLat - originLat) * segProgress;
          driverLng = originLng;
        } else {
          const segProgress = (progress - 0.5) / 0.5;
          driverLat = destLat;
          driverLng = originLng + (destLng - originLng) * segProgress;
        }
      }

      // Update the active mock order coordinates and status dynamically
      return {
        ...activeMockOrder,
        estadoComanda,
        comandaAplicacion: {
          ...activeMockOrder.comandaAplicacion!,
          recorridos: [
            {
              id: 601,
              comandaAplicacionId: activeMockOrder.comandaAplicacion!.id,
              empleadoId: 3,
              estado: estadoRecorrido as any,
              coordIn: `${originLat},${originLng}`, // Restaurant
              coordFin: `${destLat},${destLng}`, // Home
              updatedAt: `${driverLat},${driverLng}`, // Driver current simulated position
              fechaIn: new Date(simulationStartTime + 20000).toISOString(),
            },
          ],
        },
      };
    }
  },

  // Create/Place a new order
  crearComanda: async (clienteId: number, items: { plato: any; cantidad: number }[]): Promise<Comanda> => {
    try {
      // Send order to backend if API is connected
      const body = {
        clienteId,
        items: items.map((i) => ({ platoId: i.plato.id, cantidad: i.cantidad })),
      };
      return await api.post<Comanda>("/comandas", body);
    } catch (error) {
      console.log("Creating simulated order in memory.");

      simulationStartTime = Date.now();
      isOrderActive = true;

      const orderId = Math.floor(100 + Math.random() * 900);
      
      const detalles: DetalleComanda[] = items.map((item, idx) => ({
        id: 2000 + idx,
        comandaId: orderId,
        platoId: item.plato.id,
        plato: item.plato,
        precioUnitario: item.plato.precio,
      }));

      activeMockOrder = {
        id: orderId,
        clienteId,
        estadoComanda: "SIN_ASIGNAR",
        fechaSolicitud: new Date().toISOString(),
        detalles,
        comandaAplicacion: {
          id: orderId + 500,
          comandaId: orderId,
          direccionId: 201,
          direccion: {
            id: 201,
            barrio: "Quinta Sección",
            calle: "Av. Emilio Civit",
            numeracion: "450",
            referencia: "Puerta de rejas negras",
            localidadId: 1,
          },
          recorridos: [],
        },
      };

      return activeMockOrder;
    }
  },
};
