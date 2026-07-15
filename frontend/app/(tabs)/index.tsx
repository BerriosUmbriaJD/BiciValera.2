import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, shadow } from "@/src/theme";
import { api } from "@/src/lib/api";
import { MapCanvas } from "@/src/components/MapCanvas";
import { useAuth } from "@/src/context/auth";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [sim, setSim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<any>(null);

  const loadStations = async () => {
    try {
      const data = await api.stations();
      setStations(data);
    } catch {}
    setLoading(false);
  };

  const loadSim = async () => {
    try {
      const data = await api.simulator();
      setSim(data);
    } catch {}
  };

  const loadActive = async () => {
    if (!user) return;
    try {
      const r = await api.activeRide();
      setActiveRide(r);
    } catch {}
  };

  useEffect(() => {
    loadStations();
    loadSim();
    const t = setInterval(loadSim, 4000);
    return () => clearInterval(t);
  }, []);

  useFocusEffect(useCallback(() => { loadStations(); loadActive(); }, [user]));

  const canvasH = height - insets.top - 88;

  return (
    <View style={styles.container} testID="map-screen">
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <MapCanvas
          width={width}
          height={canvasH}
          stations={stations}
          movingBikes={sim?.moving_bikes || []}
          onSelect={(s) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/station/${s.id}`);
          }}
        />
      )}

      {/* Top glass simulator status pill */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <BlurView intensity={40} tint="light" style={styles.statusPill} testID="simulator-status">
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>Simulador activo</Text>
          <View style={styles.statusDivider} />
          <Ionicons name="bicycle" size={15} color={colors.brand} />
          <Text style={styles.statusStat}>{sim?.active_rides ?? "–"} en ruta</Text>
        </BlurView>
      </View>

      {/* Live stats strip */}
      {sim && (
        <View style={[styles.statsStrip, { top: insets.top + 56 }]} pointerEvents="none">
          <StatChip icon="battery-charging" label="Eléctricas" value={sim.electric} color={colors.info} />
          <StatChip icon="bicycle" label="Mecánicas" value={sim.mechanical} color={colors.brandSecondary} />
          <StatChip icon="location" label="Disponibles" value={sim.available} color={colors.warning} />
        </View>
      )}

      {/* Active ride banner */}
      {activeRide && (
        <Pressable
          testID="active-ride-banner"
          onPress={() => router.push("/(tabs)/activity")}
          style={[styles.activeBanner, { bottom: 100 }]}
        >
          <Ionicons name="navigate-circle" size={24} color={colors.onBrandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>Viaje en curso</Text>
            <Text style={styles.activeSub}>Bici {activeRide.bike_code} · Toca para finalizar</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onBrandPrimary} />
        </Pressable>
      )}

      {/* Unlock FAB */}
      <Pressable
        testID="unlock-fab"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/unlock");
        }}
        style={({ pressed }) => [styles.fab, { bottom: 24 }, pressed && { opacity: 0.9 }]}
      >
        <Ionicons name="qr-code" size={22} color={colors.onBrandPrimary} />
        <Text style={styles.fabText}>Desbloquear bici</Text>
      </Pressable>
    </View>
  );
}

function StatChip({ icon, label, value, color }: any) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceTertiary },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg,
    paddingVertical: 10, borderRadius: radius.pill, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
    ...shadow.card,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontSize: 13, fontWeight: "700", color: colors.onSurface },
  statusDivider: { width: 1, height: 14, backgroundColor: colors.borderStrong, marginHorizontal: 2 },
  statusStat: { fontSize: 13, fontWeight: "700", color: colors.brand },
  statsStrip: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, ...shadow.card,
  },
  chipValue: { fontSize: 13, fontWeight: "800", color: colors.onSurface },
  chipLabel: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  activeBanner: {
    position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center",
    gap: spacing.md, backgroundColor: colors.brandSecondary, padding: spacing.md, borderRadius: radius.lg, ...shadow.float,
  },
  activeTitle: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "800" },
  activeSub: { color: colors.onBrandPrimary, fontSize: 12, opacity: 0.9 },
  fab: {
    position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.xl, paddingVertical: 16, borderRadius: radius.pill, ...shadow.float,
  },
  fabText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "700" },
});
