import { useState, useEffect } from "react";
import { cartaService } from "../services/carta.service";
import { Carta, Plato } from "../models";

export function useCartaController() {
  const [carta, setCarta] = useState<Carta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlato, setSelectedPlato] = useState<Plato | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number>(0);

  const loadCarta = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartaService.getCarta();
      setCarta(data);
      if (data.secciones && data.secciones.length > 0) {
        setActiveSectionId(data.secciones[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la carta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarta();
  }, []);

  return {
    carta,
    loading,
    error,
    selectedPlato,
    setSelectedPlato,
    activeSectionId,
    setActiveSectionId,
    refreshCarta: loadCarta,
  };
}
