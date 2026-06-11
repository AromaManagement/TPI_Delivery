import { useState, useEffect } from "react";
import { Direccion } from "../models";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const RESTAURANT_COORDS: Coordinates = { latitude: -32.8907, longitude: -68.8400 };
export const FALLBACK_CUSTOMER_COORDS: Coordinates = { latitude: -32.8943, longitude: -68.8385 };

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

    const { calle, numeracion, barrio } = direccion;
    if (!calle || !numeracion) {
      setCoords(FALLBACK_CUSTOMER_COORDS);
      setRoute([RESTAURANT_COORDS, FALLBACK_CUSTOMER_COORDS]);
      return;
    }

    setLoading(true);
    const query = encodeURIComponent(`${calle} ${numeracion}, ${barrio || ""}, Mendoza, Argentina`);

    // 1. Geocode the address to find coordinates
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: {
        "User-Agent": "AromaDeliveryApp/1.0",
      },
    })
      .then((res) => res.json())
      .then(async (data) => {
        let finalCoords = FALLBACK_CUSTOMER_COORDS;
        
        if (data && data.length > 0) {
          finalCoords = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        } else {
          // Deterministic fallback based on address details to generate a unique point in Mendoza
          const offsetLat = (calle.length % 10) * 0.0015 - 0.005;
          const offsetLng = (numeracion.length % 10) * 0.0015 - 0.005;
          finalCoords = {
            latitude: RESTAURANT_COORDS.latitude + offsetLat,
            longitude: RESTAURANT_COORDS.longitude + offsetLng,
          };
        }

        setCoords(finalCoords);

        // 2. Fetch routing path following actual streets from OSRM
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_COORDS.longitude},${RESTAURANT_COORDS.latitude};${finalCoords.longitude},${finalCoords.latitude}?overview=full&geometries=geojson`;
          const osrmRes = await fetch(osrmUrl);
          const osrmData = await osrmRes.json();
          
          if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
            const geojsonCoords = osrmData.routes[0].geometry.coordinates; // Array of [lng, lat]
            const path = geojsonCoords.map(([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }));
            setRoute(path);
          } else {
            setRoute([RESTAURANT_COORDS, finalCoords]);
          }
        } catch (routeError) {
          console.error("OSRM street routing failed, using direct line:", routeError);
          setRoute([RESTAURANT_COORDS, finalCoords]);
        }
      })
      .catch((err) => {
        console.error("Geocoding failed, using deterministic fallback and direct route line:", err);
        const offsetLat = (calle.length % 10) * 0.0015 - 0.005;
        const offsetLng = (numeracion.length % 10) * 0.0015 - 0.005;
        const fallbackCoords = {
          latitude: RESTAURANT_COORDS.latitude + offsetLat,
          longitude: RESTAURANT_COORDS.longitude + offsetLng,
        };
        setCoords(fallbackCoords);
        setRoute([RESTAURANT_COORDS, fallbackCoords]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [direccion?.calle, direccion?.numeracion, direccion?.barrio]);

  return { coords, route, loading };
}
