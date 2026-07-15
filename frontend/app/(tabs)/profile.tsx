import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { colors, spacing, radius, shadow } from "@/src/theme";
import { useAuth } from "@/src/context/auth";
import { api } from "@/src/lib/api";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [sim, setSim] = useState<any>(null);

  useFocusEffect(useCallback(() => {
    api.simulator().then(setSim).catch(() => {});
  }, []));

  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <View style={styles.container} testID="profile-screen">
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name} testID="profile-name">{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Estado de la flota (en vivo)</Text>
        <View style={styles.fleetCard}>
          <FleetRow icon="bicycle" label="Total de bicicletas" value={sim?.total_bikes ?? "–"} />
          <View style={styles.divider} />
          <FleetRow icon="battery-charging" label="Eléctricas" value={sim?.electric ?? "–"} color={colors.info} />
          <View style={styles.divider} />
          <FleetRow icon="cog" label="Mecánicas" value={sim?.mechanical ?? "–"} color={colors.brandSecondary} />
          <View style={styles.divider} />
          <FleetRow icon="location" label="Estaciones" value={sim?.stations ?? "–"} color={colors.warning} />
          <View style={styles.divider} />
          <FleetRow icon="people" label="Usuarios registrados" value={sim?.users ?? "–"} color={colors.brand} />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.brand} />
          <Text style={styles.infoText}>
            BiciValera · Sistema inteligente de bicicletas compartidas para Valera, Estado Trujillo.
          </Text>
        </View>

        <Pressable testID="signout-button" onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.9 }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FleetRow({ icon, label, value, color = colors.brand }: any) {
  return (
    <View style={styles.fleetRow}>
      <View style={[styles.fleetIcon, { backgroundColor: color + "1A" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.fleetLabel}>{label}</Text>
      <Text style={styles.fleetValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  avatarWrap: { alignItems: "center", marginBottom: spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", ...shadow.card },
  avatarText: { color: colors.onBrandPrimary, fontSize: 32, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.onSurface, marginTop: spacing.md },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.md },
  fleetCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  fleetRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  fleetIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  fleetLabel: { flex: 1, fontSize: 14, color: colors.onSurfaceSecondary, fontWeight: "500" },
  fleetValue: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.divider },
  infoCard: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg, alignItems: "center" },
  infoText: { flex: 1, fontSize: 13, color: colors.onBrandTertiary, lineHeight: 19, fontWeight: "500" },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: 15, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  signOutText: { color: colors.error, fontSize: 16, fontWeight: "700" },
});
