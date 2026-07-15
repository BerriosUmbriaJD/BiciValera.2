import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { spacing, radius, shadow, Palette } from "@/src/theme";
import { api } from "@/src/lib/api";
import { MapWebView, MapHandle } from "@/src/components/MapWebView";
import { useAuth } from "@/src/context/auth";
import { useTheme } from "@/src/context/theme";
import { useUserLocation } from "@/src/hooks/use-location";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const mapRef = useRef<MapHandle>(null);
  const { coords, status, request, openSettings } = useUserLocation();
  const [stations, setStations] = useState<any[]>([]);
  const [sim, setSim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [nearest, setNearest] = useState<any>(null);

  const loadStations = async () => {
    try { setStations(await api.stations()); } catch {}
    setLoading(false);
  };
  const loadSim = async () => {
    try {
      const data = await api.simulator();
      setSim(data);
      mapRef.current?.update({ stations: data.station_status, bikes: data.moving_bikes });
    } catch {}
  };
  const loadActive = async () => { if (!user) return; try { setActiveRide(await api.activeRide()); } catch {} };

  useEffect(() => {
    loadStations();
    loadSim();
    const t = setInterval(loadSim, 2000);
    return () => clearInterval(t);
  }, []);

  useFocusEffect(useCallback(() => { loadStations(); loadActive(); }, [user]));

  const onLocate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (coords) { mapRef.current?.recenter(); return; }
    await request();
  };

  return (
    <View style={styles.container} testID="map-screen">
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={c.brand} /></View>
      ) : (
        <MapWebView
          ref={mapRef}
          stations={stations}
          userLoc={coords}
          c={c}
          isDark={isDark}
          onSelect={(id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(`/station/${id}`); }}
          onNearest={setNearest}
        />
      )}

      {/* Top glass simulator status pill */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <BlurView intensity={isDark ? 30 : 40} tint={isDark ? "dark" : "light"} style={styles.statusPill} testID="simulator-status">
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>Simulador activo</Text>
          <View style={styles.statusDivider} />
          <Ionicons name="bicycle" size={15} color={c.brand} />
          <Text style={styles.statusStat}>{sim?.active_rides ?? "–"} en ruta</Text>
        </BlurView>
      </View>

      {sim && (
        <View style={[styles.statsStrip, { top: insets.top + 56 }]} pointerEvents="none">
          <StatChip c={c} icon="battery-charging" label="Eléctricas" value={sim.electric} color={c.info} />
          <StatChip c={c} icon="bicycle" label="Mecánicas" value={sim.mechanical} color={c.brandSecondary} />
          <StatChip c={c} icon="location" label="Disponibles" value={sim.available} color={c.warning} />
        </View>
      )}

      {/* Locate FAB */}
      <Pressable testID="locate-fab" onPress={onLocate} style={[styles.locateFab, { top: insets.top + 104 }]}>
        {status === "loading"
          ? <ActivityIndicator color={c.brand} size="small" />
          : <Ionicons name="locate" size={22} color={coords ? c.brand : c.onSurfaceSecondary} />}
      </Pressable>

      {/* Nearest station banner */}
      {nearest && (
        <Animated.View entering={FadeInDown} style={[styles.nearestPill, { top: insets.top + 104 }]}>
          <Ionicons name="navigate" size={15} color={c.brand} />
          <Text style={styles.nearestText} numberOfLines={1}>{nearest.name} · {nearest.distance} m</Text>
        </Animated.View>
      )}

      {/* Location permission blocked note */}
      {status === "blocked" && (
        <Pressable testID="open-settings" onPress={openSettings} style={[styles.blockedNote, { bottom: 100 }]}>
          <Ionicons name="warning" size={16} color={c.onError} />
          <Text style={styles.blockedText}>Ubicación bloqueada · Abrir ajustes</Text>
        </Pressable>
      )}

      {activeRide && (
        <Pressable testID="active-ride-banner" onPress={() => router.push("/(tabs)/activity")} style={[styles.activeBanner, { bottom: 100 }]}>
          <Ionicons name="navigate-circle" size={24} color={c.onBrandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>Viaje en curso</Text>
            <Text style={styles.activeSub}>Bici {activeRide.bike_code} · Toca para finalizar</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.onBrandPrimary} />
        </Pressable>
      )}

      <Pressable testID="unlock-fab" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/unlock"); }}
        style={({ pressed }) => [styles.fab, { bottom: 24 }, pressed && { opacity: 0.9 }]}>
        <Ionicons name="qr-code" size={22} color={c.onBrandPrimary} />
        <Text style={styles.fabText}>Desbloquear bici</Text>
      </Pressable>
    </View>
  );
}

function StatChip({ c, icon, label, value, color }: any) {
  const s = createStyles(c);
  return (
    <View style={s.chip}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={s.chipValue}>{value}</Text>
      <Text style={s.chipLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.mapBg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, overflow: "hidden", borderWidth: 1, borderColor: c.border, ...shadow.card },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.success },
  statusText: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  statusDivider: { width: 1, height: 14, backgroundColor: c.borderStrong, marginHorizontal: 2 },
  statusStat: { fontSize: 13, fontWeight: "700", color: c.brand },
  statsStrip: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, ...shadow.card },
  chipValue: { fontSize: 13, fontWeight: "800", color: c.onSurface },
  chipLabel: { fontSize: 11, color: c.muted, fontWeight: "600" },
  locateFab: { position: "absolute", right: spacing.lg, width: 44, height: 44, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center", ...shadow.float },
  nearestPill: { position: "absolute", left: spacing.lg, maxWidth: 220, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, ...shadow.card },
  nearestText: { fontSize: 12, fontWeight: "700", color: c.onSurface },
  blockedNote: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: c.error, paddingVertical: 12, borderRadius: radius.md, ...shadow.card },
  blockedText: { color: c.onError, fontWeight: "700", fontSize: 13 },
  activeBanner: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.brandSecondary, padding: spacing.md, borderRadius: radius.lg, ...shadow.float },
  activeTitle: { color: c.onBrandPrimary, fontSize: 15, fontWeight: "800" },
  activeSub: { color: c.onBrandPrimary, fontSize: 12, opacity: 0.9 },
  fab: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: c.brandPrimary, paddingHorizontal: spacing.xl, paddingVertical: 16, borderRadius: radius.pill, ...shadow.float },
  fabText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "700" },
});
