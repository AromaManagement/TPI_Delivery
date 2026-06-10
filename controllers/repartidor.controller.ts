import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { repartidorService } from "../services/repartidor.service";
import { useAuthStore } from "../store/authStore";
import { useRepartidorStore } from "../store/repartidorStore";
import { Comanda } from "../models";

export function usePedidosDisponiblesController() {
  const [pedidos, setPedidos] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setPedidoActivo = useRepartidorStore((state) => state.setPedidoActivo);
  const pedidoActivo = useRepartidorStore((state) => state.pedidoActivo);

  const cargarPedidos = useCallback(async () => {
    try {
      const data = await repartidorService.getPedidosDisponibles();
      setPedidos(data);
    } catch (error) {
      console.warn("Error cargando pedidos disponibles", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarPedidos();
  };

  const tomarPedido = async (comanda: Comanda) => {
    if (!user) return;
    if (pedidoActivo) {
      Alert.alert(
        "Ya tenés una entrega activa",
        `Completá el pedido #${pedidoActivo.id} antes de tomar otro.`
      );
      return;
    }
    try {
      const updated = await repartidorService.tomarPedido(comanda.id, user.id);
      setPedidoActivo(updated);
      setPedidos((prev) => prev.filter((p) => p.id !== comanda.id));
      Alert.alert("Pedido tomado", "El pedido fue asignado a vos.");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo tomar el pedido.");
    }
  };

  return { pedidos, loading, refreshing, onRefresh, tomarPedido, pedidoActivo };
}

export function useMiEntregaController() {
  const pedidoActivo = useRepartidorStore((state) => state.pedidoActivo);
  const setPedidoActivo = useRepartidorStore((state) => state.setPedidoActivo);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  // Al montar, si el store está vacío busca la entrega activa en el backend
  useEffect(() => {
    if (!pedidoActivo && user) {
      repartidorService
        .getMiEntregaActiva(user.id)
        .then((order) => {
          if (order) setPedidoActivo(order);
        })
        .catch((err) => console.warn("Error buscando entrega activa", err))
        .finally(() => setLoadingInit(false));
    } else {
      setLoadingInit(false);
    }
  }, []);

  const marcarEnCamino = async () => {
    if (!pedidoActivo) return;
    setLoading(true);
    try {
      const updated = await repartidorService.actualizarEstado(pedidoActivo.id, "EN_CAMINO");
      setPedidoActivo(updated);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo actualizar el estado.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntrega = () => {
    if (!pedidoActivo) return;
    Alert.alert(
      "Confirmar entrega",
      "¿Confirmás que entregaste el pedido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await repartidorService.actualizarEstado(pedidoActivo.id, "ENTREGADO");
              setPedidoActivo(null);
            } catch (error: any) {
              Alert.alert("Error", error?.message || "No se pudo confirmar la entrega.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return { pedidoActivo, loading, loadingInit, marcarEnCamino, confirmarEntrega };
}

export function useHistorialController() {
  const [historial, setHistorial] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const cargarHistorial = useCallback(async () => {
    if (!user) return;
    try {
      const data = await repartidorService.getHistorial(user.id);
      setHistorial(data);
    } catch (error) {
      console.warn("Error cargando historial", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarHistorial();
  };

  return { historial, loading, refreshing, onRefresh };
}
