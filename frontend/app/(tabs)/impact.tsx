import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { BarChart } from "react-native-gifted-charts";
import Animated, { FadeInUp } from "react-native-reanimated";
import { spacing, radius, shadow, images, Palette } from "@/src/theme";
import { api } from "@/src/lib/api";
import { useTheme } from "@/src/context/theme";

export default function Impact() {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [data, setData] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [achv, setAchv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [d, t, a] = await Promise.all([api.impact(), api.impactTrend(), api.achievements()]);
      setData(d); setTrend(t); setAchv(a);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={c.brand} /></View>;

  const u = data?.user;
  const cty = data?.city;
  const maxCo2 = Math.max(0.1, ...(trend?.days?.map((d: any) => d.co2) || [0.1]));
  const barData = (trend?.days || []).map((d: any) => ({
    value: d.co2, label: d.label, frontColor: c.brand,
    topLabelComponent: () => d.co2 > 0 ? <Text style={styles.barTop}>{d.co2}</Text> : null,
  }));
  const chartWidth = Dimensions.get("window").width - spacing.xl * 2 - spacing.lg * 2;

  return (
    <View style={styles.container} testID="impact-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Tu impacto</Text>
        <Text style={styles.headerSub}>Cada pedalada cuenta 🌱</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={c.brand} />}>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard} testID="co2-hero-card">
          <Image source={images.heroLeaf} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(19,28,21,0.2)", "rgba(19,28,21,0.85)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="cloud-outline" size={16} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>CO₂ evitado</Text>
            </View>
            <Text style={styles.heroValue}>{u.co2_saved_kg} <Text style={styles.heroUnit}>kg</Text></Text>
            <Text style={styles.heroCaption}>Equivale a {u.trees_equivalent} árboles absorbiendo CO₂ por un año</Text>
          </View>
        </Animated.View>

        <View style={styles.grid}>
          <Metric c={c} icon="bicycle" value={u.rides} label="Viajes" color={c.brand} />
          <Metric c={c} icon="navigate" value={`${u.distance_km}`} suffix="km" label="Distancia" color={c.info} />
          <Metric c={c} icon="time" value={u.duration_min} suffix="min" label="Tiempo" color={c.warning} />
          <Metric c={c} icon="flame" value={u.calories} suffix="cal" label="Calorías" color={c.error} />
        </View>

        {/* Trend chart */}
        <Text style={styles.sectionTitle}>CO₂ evitado · últimos 7 días</Text>
        <View style={styles.chartCard} testID="trend-chart">
          <BarChart
            data={barData}
            width={chartWidth}
            height={140}
            barWidth={20}
            spacing={(chartWidth - 20 * 7) / 7}
            initialSpacing={8}
            barBorderRadius={5}
            noOfSections={3}
            maxValue={Math.ceil(maxCo2 * 1.3 * 10) / 10 || 1}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules={false}
            rulesColor={c.divider}
            xAxisLabelTextStyle={{ color: c.muted, fontSize: 11 }}
            yAxisTextStyle={{ color: c.muted, fontSize: 10 }}
            disableScroll
          />
        </View>

        {/* Achievements */}
        <View style={styles.achvHeader}>
          <Text style={styles.sectionTitle}>Logros</Text>
          {achv && <Text style={styles.achvCount}>{achv.unlocked}/{achv.total}</Text>}
        </View>
        <View style={styles.achvGrid}>
          {achv?.achievements?.map((a: any) => (
            <View key={a.id} style={[styles.achvCard, !a.unlocked && styles.achvLocked]} testID={`achievement-${a.id}`}>
              <View style={[styles.achvIcon, { backgroundColor: a.unlocked ? c.brandTertiary : c.surfaceTertiary }]}>
                <Ionicons name={a.icon} size={22} color={a.unlocked ? c.brand : c.muted} />
              </View>
              <Text style={[styles.achvName, !a.unlocked && { color: c.muted }]} numberOfLines={1}>{a.name}</Text>
              <Text style={styles.achvDesc} numberOfLines={2}>{a.desc}</Text>
              {!a.unlocked && <Text style={styles.achvProgress}>{a.progress}/{a.goal}</Text>}
              {a.unlocked && <View style={styles.achvBadge}><Ionicons name="checkmark" size={11} color={c.onSuccess} /></View>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Impacto de Valera</Text>
        <View style={styles.cityCard}>
          <CityRow c={c} icon="people" label="Viajes en la ciudad" value={cty.rides.toLocaleString("es")} />
          <View style={styles.rowDivider} />
          <CityRow c={c} icon="map" label="Kilómetros recorridos" value={`${cty.distance_km.toLocaleString("es")} km`} />
          <View style={styles.rowDivider} />
          <CityRow c={c} icon="leaf" label="CO₂ evitado (ciudad)" value={`${cty.co2_saved_kg.toLocaleString("es")} kg`} />
        </View>

        <View style={styles.visionCard}>
          <Ionicons name="earth" size={22} color={c.brand} />
          <Text style={styles.visionText}>
            BiciValera impulsa la movilidad sostenible en el Estado Trujillo, reduciendo emisiones y
            conectando a la comunidad con bicicletas mecánicas y eléctricas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ c, icon, value, suffix, label, color }: any) {
  const s = createStyles(c);
  return (
    <View style={s.metricCard}>
      <View style={[s.metricIcon, { backgroundColor: color + "1A" }]}><Ionicons name={icon} size={18} color={color} /></View>
      <Text style={s.metricValue}>{value}<Text style={s.metricSuffix}>{suffix ? ` ${suffix}` : ""}</Text></Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}
function CityRow({ c, icon, label, value }: any) {
  const s = createStyles(c);
  return (
    <View style={s.cityRow}>
      <Ionicons name={icon} size={18} color={c.brandSecondary} />
      <Text style={s.cityLabel}>{label}</Text>
      <Text style={s.cityValue}>{value}</Text>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: c.surface },
  headerTitle: { fontSize: 30, fontWeight: "800", color: c.onSurface, letterSpacing: -0.6 },
  headerSub: { fontSize: 15, color: c.muted, marginTop: 2 },
  scroll: { padding: spacing.xl, paddingTop: 0, paddingBottom: spacing["3xl"] },
  heroCard: { height: 200, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: spacing.xl },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  heroBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroValue: { color: "#FFFFFF", fontSize: 52, fontWeight: "800", marginTop: spacing.sm, letterSpacing: -1 },
  heroUnit: { fontSize: 24, fontWeight: "700" },
  heroCaption: { color: "#FFFFFF", fontSize: 13, opacity: 0.92, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  metricCard: { width: "47.5%", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card },
  metricIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  metricValue: { fontSize: 24, fontWeight: "800", color: c.onSurface, letterSpacing: -0.5 },
  metricSuffix: { fontSize: 14, fontWeight: "600", color: c.muted },
  metricLabel: { fontSize: 13, color: c.muted, marginTop: 2, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  chartCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card, alignItems: "center" },
  barTop: { color: c.brand, fontSize: 9, fontWeight: "700", marginBottom: 2 },
  achvHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  achvCount: { fontSize: 15, fontWeight: "800", color: c.brand, marginBottom: spacing.md },
  achvGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  achvCard: { width: "47.5%", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card },
  achvLocked: { opacity: 0.7 },
  achvIcon: { width: 44, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  achvName: { fontSize: 14, fontWeight: "800", color: c.onSurface },
  achvDesc: { fontSize: 12, color: c.muted, marginTop: 2, lineHeight: 16, minHeight: 32 },
  achvProgress: { fontSize: 12, fontWeight: "700", color: c.brand, marginTop: 4 },
  achvBadge: { position: "absolute", top: spacing.md, right: spacing.md, width: 20, height: 20, borderRadius: 10, backgroundColor: c.success, alignItems: "center", justifyContent: "center" },
  cityCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card },
  cityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  cityLabel: { flex: 1, fontSize: 14, color: c.onSurfaceSecondary, fontWeight: "500" },
  cityValue: { fontSize: 15, fontWeight: "800", color: c.brand },
  rowDivider: { height: 1, backgroundColor: c.divider },
  visionCard: { flexDirection: "row", gap: spacing.md, backgroundColor: c.brandTertiary, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg },
  visionText: { flex: 1, fontSize: 13, color: c.onBrandTertiary, lineHeight: 19, fontWeight: "500" },
});
