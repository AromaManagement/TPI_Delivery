import { api } from "./api";
import { Carta } from "../models";

// Static mock menu content mirroring C:\Users\Yeu\OneDrive\Documentos\ComputacionMovil\TPI\mock-data\carta.json
const MOCK_CARTA: Carta = {
  id: 1,
  secciones: [
    {
      id: 1,
      cartaId: 1,
      nombre: "Entradas",
      detalle: "Para comenzar tu experiencia",
      platos: [
        {
          id: 1,
          seccionId: 1,
          nombre: "Empanadas mendocinas (x3)",
          precio: 3500,
          detalle: "Carne cortada a cuchillo, jugosas y especiadas, cocinadas al horno de barro.",
          imagen: null,
        },
        {
          id: 2,
          seccionId: 1,
          nombre: "Tabla de fiambres",
          precio: 8900,
          detalle: "Selección regional de embutidos artesanales, quesos curados, aceitunas y pan casero para compartir.",
          imagen: null,
        },
        {
          id: 3,
          seccionId: 1,
          nombre: "Hummus artesanal",
          precio: 4200,
          detalle: "Hummus de garbanzo con pimentón ahumado, aceite de oliva virgen extra y pan árabe tostado.",
          imagen: null,
        },
      ],
    },
    {
      id: 2,
      cartaId: 1,
      nombre: "Plato Principal",
      detalle: "Nuestras especialidades de la casa",
      platos: [
        {
          id: 4,
          seccionId: 2,
          nombre: "Bife de chorizo con papas",
          precio: 14500,
          detalle: "350g de bife de chorizo de novillo a la parrilla, con guarnición de papas rústicas al horno.",
          imagen: null,
        },
        {
          id: 5,
          seccionId: 2,
          nombre: "Milanesa napolitana",
          precio: 11800,
          detalle: "Milanesa de ternera crujiente con salsa fileto fileteada, jamón cocido, abundante mozzarella derretida y ensalada mixta de guarnición.",
          imagen: {
            id: 100,
            imagenSi: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=300&auto=format&fit=crop",
          },
        },
        {
          id: 6,
          seccionId: 2,
          nombre: "Sorrentinos de jamón y queso",
          precio: 10500,
          detalle: "Pasta casera rellena de jamón cocido y mozzarella, servida con salsa bolognesa o crema.",
          imagen: null,
        },
      ],
    },
    {
      id: 3,
      cartaId: 1,
      nombre: "Bebidas",
      detalle: "Refrescos y vinos seleccionados",
      platos: [
        {
          id: 7,
          seccionId: 3,
          nombre: "Gaseosa línea Coca-Cola 500ml",
          precio: 1800,
          detalle: "Fría, regular o sin azúcares.",
          imagen: null,
        },
        {
          id: 8,
          seccionId: 3,
          nombre: "Cerveza Patagonia IPA 24.7 (Lata)",
          precio: 2800,
          detalle: "Cerveza aromática de lúpulo con toques cítricos, refrescante.",
          imagen: null,
        },
        {
          id: 9,
          seccionId: 3,
          nombre: "Copa Malbec de la casa",
          precio: 3500,
          detalle: "Vino tinto Malbec de Mendoza de aroma intenso a frutos rojos.",
          imagen: null,
        },
      ],
    },
  ],
};

export const cartaService = {
  getCarta: async (): Promise<Carta> => {
    try {
      // Try to fetch from backend if endpoint gets implemented
      return await api.get<Carta>("/carta");
    } catch (error) {
      console.log("Using static mock menu data (MOCK_CARTA).");
      return MOCK_CARTA;
    }
  },
};
