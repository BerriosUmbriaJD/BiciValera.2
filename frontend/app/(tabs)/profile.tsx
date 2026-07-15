import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { spacing, radius, shadow, Palette } from "@/src/theme";
import { useAuth } from "@/src/context/auth";
import { useTheme } from "@/src/context/theme";
import { api } from "@/src/lib/api";

const MODES = [
  { key: "light", label: "Claro", icon: "sunny" },
  { key: "dark", label: "Oscuro", icon: "moon" },
  { key: "system", label: "Sistema", icon: "phone-portrait" },
] as const;

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { c, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [sim, setSim] = useState<any>(null);

  useFocusEffect(useCallback(() => { api.simulator().then(setSim).catch(() => {}); }, []));

  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <View style={styles.container} testID="profile-screen">
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name} testID="profile-name">{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Theme selector */}
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.themeRow} testID="theme-selector">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable key={m.key} testID={`theme-${m.key}`} onPress={() => { Haptics.selectionAsync(); setMode(m.key); }}
                style={[styles.themeBtn, active && styles.themeBtnActive]}>
                <Ionicons name={m.icon as any} size={18} color={active ? c.onBrandPrimary : c.onSurfaceSecondary} />
                <Text style={[styles.themeLabel, active && { color: c.onBrandPrimary }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Estado de la flota (en vivo)</Text>
        <View style={styles.fleetCard}>
          <FleetRow c={c} icon="bicycle" label="Total de bicicletas" value={sim?.total_bikes ?? "–"} />
          <View style={styles.divider} />
          <FleetRow c={c} icon="battery-charging" label="Eléctricas" value={sim?.electric ?? "–"} color={c.info} />
          <View style={styles.divider} />
          <FleetRow c={c} icon="cog" label="Mecánicas" value={sim?.mechanical ?? "–"} color={c.brandSecondary} />
          <View style={styles.divider} />
          <FleetRow c={c} icon="location" label="Estaciones" value={sim?.stations ?? "–"} color={c.warning} />
          <View style={styles.divider} />
          <FleetRow c={c} icon="people" label="Usuarios registrados" value={sim?.users ?? "–"} color={c.brand} />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={c.brand} />
          <Text style={styles.infoText}>BiciValera · Sistema inteligente de bicicletas compartidas para Valera, Estado Trujillo.</Text>
        </View>

        <Pressable testID="signout-button" onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.9 }]}>
          <Ionicons name="log-out-outline" size={20} color={c.error} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FleetRow({ c, icon, label, value, color }: any) {
  const s = createStyles(c);
  const col = color || c.brand;
  return (
    <View style={s.fleetRow}>
      <View style={[s.fleetIcon, { backgroundColor: col + "1A" }]}><Ionicons name={icon} size={16} color={col} /></View>
      <Text style={s.fleetLabel}>{label}</Text>
      <Text style={s.fleetValue}>{value}</Text>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  avatarWrap: { alignItems: "center", marginBottom: spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", ...shadow.card },
  avatarText: { color: c.onBrandPrimary, fontSize: 32, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: c.onSurface, marginTop: spacing.md },
  email: { fontSize: 14, color: c.muted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md, marginTop: spacing.lg },
  themeRow: { flexDirection: "row", gap: spacing.sm, backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: 4 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: radius.sm },
  themeBtnActive: { backgroundColor: c.brandPrimary },
  themeLabel: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  fleetCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: c.border, ...shadow.card },
  fleetRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  fleetIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  fleetLabel: { flex: 1, fontSize: 14, color: c.onSurfaceSecondary, fontWeight: "500" },
  fleetValue: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  divider: { height: 1, backgroundColor: c.divider },
  infoCard: { flexDirection: "row", gap: spacing.md, backgroundColor: c.brandTertiary, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg, alignItems: "center" },
  infoText: { flex: 1, fontSize: 13, color: c.onBrandTertiary, lineHeight: 19, fontWeight: "500" },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: 15, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  signOutText: { color: c.error, fontSize: 16, fontWeight: "700" },
});
