import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { comandaService } from "../services/comanda.service";
import { Comanda } from "../models";

export function useHomeController() {
  const user = useAuthStore((state) => state.user);
  const [activeOrder, setActiveOrder] = useState<Comanda | null>(null);
  const [loading, setLoading] = useState(true);

  const checkActiveOrder = async () => {
    if (!user) return;
    try {
      const order = await comandaService.getActiveOrder(user.id);
      setActiveOrder(order);
    } catch (error) {
      console.warn("Error checking active order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveOrder();

    // Poll for order status updates every 3 seconds to animate the driver on the map
    const interval = setInterval(() => {
      checkActiveOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    activeOrder,
    hasActiveOrder: !!activeOrder,
    loading,
    checkActiveOrder,
  };
}
