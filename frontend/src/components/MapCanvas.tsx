import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/src/theme";

// Valera geographic bounds for normalizing coordinates onto the canvas
const BOUNDS = { minLat: 9.300, maxLat: 9.340, minLon: -70.612, maxLon: -70.590 };

function project(lat: number, lon: number, w: number, h: number) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * w;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * h;
  return { x, y };
}

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type MovingBike = { id: string; type: string; lat: number; lon: number };

export function MapCanvas({
  width, height, stations, movingBikes, onSelect,
}: {
  width: number; height: number; stations: Station[]; movingBikes: MovingBike[];
  onSelect: (s: Station) => void;
}) {
  return (
    <View style={[styles.canvas, { width, height }]} testID="map-canvas">
      {/* Decorative streets */}
      {[0.25, 0.5, 0.75].map((p) => (
        <View key={`h${p}`} style={[styles.road, { top: height * p, width, height: 2 }]} />
      ))}
      {[0.3, 0.6].map((p) => (
        <View key={`v${p}`} style={[styles.road, { left: width * p, height, width: 2 }]} />
      ))}
      <View style={[styles.river, { top: height * 0.4, width }]} />

      {/* Moving simulated bikes */}
      {movingBikes.map((b) => {
        const { x, y } = project(b.lat, b.lon, width, height);
        return (
          <View key={b.id} style={[styles.movingBike, { left: x - 7, top: y - 7 }]}>
            <View style={[styles.movingDot, { backgroundColor: b.type === "electric" ? colors.info : colors.brandSecondary }]} />
          </View>
        );
      })}

      {/* Stations */}
      {stations.map((s) => {
        const { x, y } = project(s.lat, s.lon, width, height);
        return (
          <Pressable
            key={s.id}
            testID={`station-marker-${s.id}`}
            onPress={() => onSelect(s)}
            style={[styles.marker, { left: x - 20, top: y - 44 }]}
          >
            <View style={styles.pin}>
              <Ionicons name="bicycle" size={16} color={colors.onBrandPrimary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{s.available}</Text>
              </View>
            </View>
            <View style={styles.pinTail} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: "#DCE7DE", overflow: "hidden" },
  road: { position: "absolute", backgroundColor: "#C4D3C6" },
  river: { position: "absolute", height: 14, backgroundColor: "#BEE3E0", opacity: 0.7 },
  marker: { position: "absolute", alignItems: "center", width: 40 },
  pin: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandPrimary,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF", ...shadow.float,
  },
  pinTail: {
    width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 9,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: colors.brandPrimary, marginTop: -2,
  },
  badge: {
    position: "absolute", top: -6, right: -8, backgroundColor: colors.warning,
    minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: "#FFFFFF",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  movingBike: { position: "absolute", width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  movingDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#FFFFFF" },
});
