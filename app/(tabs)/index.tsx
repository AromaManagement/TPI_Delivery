import React, { useEffect } from "react";
import { router } from "expo-router";
import { useHomeController } from "../../controllers/home.controller";
import { CartaView } from "../../views/carta.view";

export default function CartaScreen() {
  const { hasActiveOrder, loading } = useHomeController();

  useEffect(() => {
    if (!loading && hasActiveOrder) {
      router.replace("/(tabs)/seguir-pedido");
    }
  }, [loading, hasActiveOrder]);

  return <CartaView />;
}
