import { useState, useEffect } from "react";
import { Direccion } from "../models";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const RESTAURANT_COORDS: Coordinates = { latitude: -32.8907, longitude: -68.8400 };
export const FALLBACK_CUSTOMER_COORDS: Coordinates = { latitude: -32.8943, longitude: -68.8385 };

async function fetchRoute(from: Coordinates, to: Coordinates): Promise<Coordinates[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
  } catch {
    // fall through
  }
  return [from, to];
}

export function useGeocoding(direccion: Direccion | null | undefined) {
  const [coords, setCoords] = useState<Coordinates>(FALLBACK_CUSTOMER_COORDS);
  const [route, setRoute] = useState<Coordinates[]>([RESTAURANT_COORDS, FALLBACK_CUSTOMER_COORDS]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!direccion) {
      setCoords(FALLBACK_CUSTOMER_COORDS);
      setRoute([RESTAURANT_COORDS, FALLBACK_CUSTOMER_COORDS]);
      return;
    }

    // If coords are already stored, use them directly — no Nominatim call needed
    if (direccion.lat != null && direccion.lng != null) {
      const storedCoords: Coordinates = { latitude: direccion.lat, longitude: direccion.lng };
      setCoords(storedCoords);
      setLoading(true);
      fetchRoute(RESTAURANT_COORDS, storedCoords).then((path) => {
        setRoute(path);
        setLoading(false);
      });
      return;
    }

    // Fallback: geocode from address text via Nominatim
    const { calle, numeracion, barrio } = direccion;
    if (!calle || !numeracion) {
      setCoords(FALLBACK_CUSTOMER_COORDS);
      setRoute([RESTAURANT_COORDS, FALLBACK_CUSTOMER_COORDS]);
      return;
    }

    setLoading(true);
    const query = encodeURIComponent(`${calle} ${numeracion}, ${barrio ?? ""}, Mendoza, Argentina`);

    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { "User-Agent": "AromaDeliveryApp/2.0" },
    })
      .then((res) => res.json())
      .then(async (data) => {
        let finalCoords: Coordinates;

        if (data?.[0]) {
          finalCoords = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        } else {
          const offsetLat = (calle.length % 10) * 0.0015 - 0.005;
          const offsetLng = (numeracion.length % 10) * 0.0015 - 0.005;
          finalCoords = {
            latitude: RESTAURANT_COORDS.latitude + offsetLat,
            longitude: RESTAURANT_COORDS.longitude + offsetLng,
          };
        }

        setCoords(finalCoords);
        setRoute(await fetchRoute(RESTAURANT_COORDS, finalCoords));
      })
      .catch(() => {
        const offsetLat = (calle.length % 10) * 0.0015 - 0.005;
        const offsetLng = (numeracion.length % 10) * 0.0015 - 0.005;
        const fallback = {
          latitude: RESTAURANT_COORDS.latitude + offsetLat,
          longitude: RESTAURANT_COORDS.longitude + offsetLng,
        };
        setCoords(fallback);
        setRoute([RESTAURANT_COORDS, fallback]);
      })
      .finally(() => setLoading(false));
  }, [direccion?.lat, direccion?.lng, direccion?.calle, direccion?.numeracion, direccion?.barrio]);

  return { coords, route, loading };
}
