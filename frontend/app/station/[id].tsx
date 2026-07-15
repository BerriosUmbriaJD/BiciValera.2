import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { spacing, radius, shadow, Palette } from "@/src/theme";
import { api } from "@/src/lib/api";
import { useTheme } from "@/src/context/theme";

export default function StationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [station, setStation] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.station(id!).then((s) => { setStation(s); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const start = async () => {
    if (!selected) return;
    setStarting(true); setError(null);
    try {
      await api.startRide(station.id, selected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/activity");
    } catch (e: any) { setError(e.message); setStarting(false); }
  };

  return (
    <View style={styles.container} testID="station-detail">
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{station?.name || "Estación"}</Text>
          <Text style={styles.sub}>Selecciona una bicicleta para desbloquear</Text>
        </View>
        <Pressable testID="station-close" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={c.onSurface} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.brand} style={{ marginTop: spacing["3xl"] }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {station?.bikes?.length === 0 && <Text style={styles.noBikes} testID="no-bikes">No hay bicicletas disponibles en esta estación.</Text>}
          {station?.bikes?.map((b: any) => {
            const isElec = b.type === "electric";
            const active = selected === b.id;
            return (
              <Pressable key={b.id} testID={`bike-option-${b.id}`} onPress={() => { Haptics.selectionAsync(); setSelected(b.id); }}
                style={[styles.bikeRow, active && styles.bikeRowActive]}>
                <View style={[styles.bikeIcon, { backgroundColor: (isElec ? c.info : c.brandSecondary) + "1A" }]}>
                  <Ionicons name={isElec ? "battery-charging" : "bicycle"} size={22} color={isElec ? c.info : c.brandSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bikeCode}>Bici {b.code}</Text>
                  <Text style={styles.bikeType}>{isElec ? `Eléctrica · ${b.battery}% batería` : "Mecánica"}</Text>
                </View>
                <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={24} color={active ? c.brand : c.borderStrong} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error && <Text style={styles.error} testID="station-error">{error}</Text>}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="start-ride-button" onPress={start} disabled={!selected || starting}
          style={[styles.cta, (!selected || starting) && styles.ctaDisabled]}>
          {starting ? <ActivityIndicator color={c.onBrandPrimary} /> : <Text style={styles.ctaText}>Desbloquear y comenzar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong, alignSelf: "center", marginTop: spacing.md },
  header: { flexDirection: "row", alignItems: "flex-start", padding: spacing.xl, paddingBottom: spacing.md, gap: spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: c.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: c.muted, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.lg },
  noBikes: { fontSize: 15, color: c.muted, textAlign: "center", marginTop: spacing.xl },
  bikeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1.5, borderColor: c.border },
  bikeRowActive: { borderColor: c.brand, backgroundColor: c.brandTertiary },
  bikeIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  bikeCode: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  bikeType: { fontSize: 13, color: c.muted, marginTop: 2 },
  error: { color: c.error, fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.divider, backgroundColor: c.surface },
  cta: { backgroundColor: c.brandPrimary, borderRadius: radius.md, paddingVertical: 17, alignItems: "center", ...shadow.card },
  ctaDisabled: { backgroundColor: c.borderStrong },
  ctaText: { color: c.onBrandPrimary, fontSize: 17, fontWeight: "700" },
});
