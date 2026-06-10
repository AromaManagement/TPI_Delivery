import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapView = ({ style, children }: any) => (
  <View style={[styles.map, style]}>
    <Text style={styles.label}>🗺 Mapa (solo disponible en dispositivo)</Text>
    {children}
  </View>
);

export const Marker = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const Circle = (_props: any) => null;
export const Polygon = (_props: any) => null;
export const Callout = (_props: any) => null;
export const CalloutSubview = (_props: any) => null;
export const Overlay = (_props: any) => null;
export const Heatmap = (_props: any) => null;
export const Geojson = (_props: any) => null;
export const UrlTile = (_props: any) => null;
export const WMSTile = (_props: any) => null;
export const LocalTile = (_props: any) => null;
export const AnimatedRegion = class {};
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;

const styles = StyleSheet.create({
  map: {
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    minHeight: 120,
  },
  label: {
    color: "#718096",
    fontSize: 13,
    fontStyle: "italic",
  },
});

export default MapView;
