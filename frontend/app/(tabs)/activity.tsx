import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { spacing, radius, shadow, Palette } from "@/src/theme";
import { api } from "@/src/lib/api";
import { useTheme } from "@/src/context/theme";

export default function Activity() {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [rides, setRides] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [r, a] = await Promise.all([api.rides(), api.activeRide()]);
      setRides(r.filter((x: any) => x.status === "completed"));
      setActive(a);
    } catch {}
    setLoading(false); setRefreshing(false);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const endRide = async () => {
    if (!active) return;
    setEnding(true);
    try {
      await api.endRide(active.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch {}
    setEnding(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={c.brand} /></View>;

  return (
    <View style={styles.container} testID="activity-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Mis viajes</Text>
        <Text style={styles.headerSub}>Historial de recorridos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={c.brand} />}>
        {active && (
          <Animated.View entering={FadeInDown} style={styles.activeCard} testID="active-ride-card">
            <View style={styles.activeTop}><View style={styles.pulseDot} /><Text style={styles.activeLabel}>Viaje en curso</Text></View>
            <Text style={styles.activeBike}>Bici {active.bike_code}</Text>
            <Text style={styles.activeMeta}>{active.bike_type === "electric" ? "Eléctrica ⚡" : "Mecánica"} · Desde {active.start_station_name}</Text>
            <Pressable testID="end-ride-button" onPress={endRide} disabled={ending} style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.9 }]}>
              {ending ? <ActivityIndicator color={c.onBrandPrimary} /> : (<><Ionicons name="stop-circle" size={20} color={c.onBrandPrimary} /><Text style={styles.endBtnText}>Finalizar viaje</Text></>)}
            </Pressable>
          </Animated.View>
        )}

        {rides.length === 0 && !active ? (
          <View style={styles.empty} testID="rides-empty">
            <View style={styles.emptyIcon}><Ionicons name="bicycle" size={40} color={c.brandSecondary} /></View>
            <Text style={styles.emptyTitle}>Aún no tienes viajes</Text>
            <Text style={styles.emptySub}>Desbloquea una bici desde el mapa para comenzar tu primer recorrido</Text>
          </View>
        ) : (
          rides.map((r) => (
            <View key={r.id} style={styles.rideCard} testID={`ride-${r.id}`}>
              <View style={[styles.rideIcon, { backgroundColor: (r.bike_type === "electric" ? c.info : c.brandSecondary) + "1A" }]}>
                <Ionicons name={r.bike_type === "electric" ? "battery-charging" : "bicycle"} size={20} color={r.bike_type === "electric" ? c.info : c.brandSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rideRoute}>{r.start_station_name} → {r.end_station_name}</Text>
                <Text style={styles.rideDate}>{new Date(r.started_at).toLocaleDateString("es")} · {r.duration_min} min</Text>
              </View>
              <View style={styles.rideStats}>
                <Text style={styles.rideKm}>{r.distance_km} km</Text>
                <Text style={styles.rideCo2}>−{r.co2_saved_kg} kg CO₂</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { fontSize: 30, fontWeight: "800", color: c.onSurface, letterSpacing: -0.6 },
  headerSub: { fontSize: 15, color: c.muted, marginTop: 2 },
  scroll: { padding: spacing.xl, paddingTop: 0, paddingBottom: spacing["3xl"], gap: spacing.md },
  activeCard: { backgroundColor: c.surfaceInverse, borderRadius: radius.lg, padding: spacing.xl, ...shadow.card },
  activeTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.success },
  activeLabel: { color: c.success, fontSize: 13, fontWeight: "700" },
  activeBike: { color: c.onSurfaceInverse, fontSize: 26, fontWeight: "800", marginTop: spacing.sm },
  activeMeta: { color: c.onSurfaceInverse, opacity: 0.7, fontSize: 14, marginTop: 2 },
  endBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: c.error, borderRadius: radius.md, paddingVertical: 15, marginTop: spacing.lg },
  endBtnText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: spacing["3xl"], gap: spacing.sm },
  emptyIcon: { width: 80, height: 80, borderRadius: radius.pill, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  emptySub: { fontSize: 14, color: c.muted, textAlign: "center", paddingHorizontal: spacing.xl, lineHeight: 20 },
  rideCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card },
  rideIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  rideRoute: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  rideDate: { fontSize: 12, color: c.muted, marginTop: 2 },
  rideStats: { alignItems: "flex-end" },
  rideKm: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  rideCo2: { fontSize: 12, color: c.brand, fontWeight: "700", marginTop: 2 },
});
