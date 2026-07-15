import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { colors, spacing, radius, shadow, images } from "@/src/theme";
import { api } from "@/src/lib/api";

export default function Impact() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await api.impact();
      setData(d);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <View style={styles.loader}><ActivityIndicator size="large" color={colors.brand} /></View>
    );
  }

  const u = data?.user;
  const c = data?.city;

  return (
    <View style={styles.container} testID="impact-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Tu impacto</Text>
        <Text style={styles.headerSub}>Cada pedalada cuenta 🌱</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
      >
        {/* Hero CO2 card */}
        <View style={styles.heroCard} testID="co2-hero-card">
          <Image source={images.heroLeaf} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(19,28,21,0.2)", "rgba(19,28,21,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="cloud-outline" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.heroBadgeText}>CO₂ evitado</Text>
            </View>
            <Text style={styles.heroValue}>{u.co2_saved_kg} <Text style={styles.heroUnit}>kg</Text></Text>
            <Text style={styles.heroCaption}>Equivale a {u.trees_equivalent} árboles absorbiendo CO₂ por un año</Text>
          </View>
        </View>

        {/* Metric grid */}
        <View style={styles.grid}>
          <Metric icon="bicycle" value={u.rides} label="Viajes" color={colors.brand} />
          <Metric icon="navigate" value={`${u.distance_km}`} suffix="km" label="Distancia" color={colors.info} />
          <Metric icon="time" value={u.duration_min} suffix="min" label="Tiempo" color={colors.warning} />
          <Metric icon="flame" value={u.calories} suffix="cal" label="Calorías" color={colors.error} />
        </View>

        {/* City impact */}
        <Text style={styles.sectionTitle}>Impacto de Valera</Text>
        <View style={styles.cityCard}>
          <CityRow icon="people" label="Viajes en la ciudad" value={c.rides.toLocaleString("es")} />
          <View style={styles.rowDivider} />
          <CityRow icon="map" label="Kilómetros recorridos" value={`${c.distance_km.toLocaleString("es")} km`} />
          <View style={styles.rowDivider} />
          <CityRow icon="leaf" label="CO₂ evitado (ciudad)" value={`${c.co2_saved_kg.toLocaleString("es")} kg`} />
        </View>

        <View style={styles.visionCard}>
          <Ionicons name="earth" size={22} color={colors.brand} />
          <Text style={styles.visionText}>
            BiciValera impulsa la movilidad sostenible en el Estado Trujillo, reduciendo emisiones y
            conectando a la comunidad con bicicletas mecánicas y eléctricas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ icon, value, suffix, label, color }: any) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + "1A" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}<Text style={styles.metricSuffix}>{suffix ? ` ${suffix}` : ""}</Text></Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function CityRow({ icon, label, value }: any) {
  return (
    <View style={styles.cityRow}>
      <Ionicons name={icon} size={18} color={colors.brandSecondary} />
      <Text style={styles.cityLabel}>{label}</Text>
      <Text style={styles.cityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.surface },
  headerTitle: { fontSize: 30, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.6 },
  headerSub: { fontSize: 15, color: colors.muted, marginTop: 2 },
  scroll: { padding: spacing.xl, paddingTop: 0, paddingBottom: spacing["3xl"] },
  heroCard: { height: 200, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: spacing.xl },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  heroBadgeText: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "700" },
  heroValue: { color: colors.onBrandPrimary, fontSize: 52, fontWeight: "800", marginTop: spacing.sm, letterSpacing: -1 },
  heroUnit: { fontSize: 24, fontWeight: "700" },
  heroCaption: { color: colors.onBrandPrimary, fontSize: 13, opacity: 0.92, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  metricCard: {
    width: "47.5%", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  metricIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  metricValue: { fontSize: 24, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  metricSuffix: { fontSize: 14, fontWeight: "600", color: colors.muted },
  metricLabel: { fontSize: 13, color: colors.muted, marginTop: 2, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  cityCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  cityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  cityLabel: { flex: 1, fontSize: 14, color: colors.onSurfaceSecondary, fontWeight: "500" },
  cityValue: { fontSize: 15, fontWeight: "800", color: colors.brand },
  rowDivider: { height: 1, backgroundColor: colors.divider },
  visionCard: {
    flexDirection: "row", gap: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md,
    padding: spacing.lg, marginTop: spacing.lg,
  },
  visionText: { flex: 1, fontSize: 13, color: colors.onBrandTertiary, lineHeight: 19, fontWeight: "500" },
});
