import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { spacing, radius, shadow, Palette } from "@/src/theme";
import { api } from "@/src/lib/api";
import { useTheme } from "@/src/context/theme";

export default function Unlock() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const scanLine = useSharedValue(0);

  useEffect(() => {
    api.stations().then(setStations).catch(() => {});
    scanLine.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1);
  }, []);

  const lineStyle = useAnimatedStyle(() => ({ top: `${scanLine.value * 90 + 5}%` }));

  const pickAndStart = async () => {
    setError(null);
    const station = stations.find((s) => s.available > 0);
    if (!station) { setError("No hay bicicletas disponibles en este momento"); return; }
    setScanning(true);
    try {
      const detail = await api.station(station.id);
      const bike = detail.bikes[0];
      await new Promise((r) => setTimeout(r, 1500));
      await api.startRide(station.id, bike.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/activity");
    } catch (e: any) { setError(e.message); setScanning(false); }
  };

  return (
    <View style={styles.container} testID="unlock-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="unlock-close" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Escanear bicicleta</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.viewfinderWrap}>
        <View style={styles.viewfinder} testID="scanner-viewfinder">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          {!scanning && <Animated.View style={[styles.scanLine, lineStyle]} />}
          {scanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color={c.brandSecondary} />
              <Text style={styles.scanningText}>Desbloqueando...</Text>
            </View>
          )}
          <Ionicons name="qr-code-outline" size={64} color="rgba(255,255,255,0.25)" />
        </View>
        <Text style={styles.hint}>Apunta al código QR del manubrio de la bici</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable testID="simulate-scan-button" onPress={pickAndStart} disabled={scanning}
            style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.9 }]}>
            <Ionicons name="scan" size={20} color={c.onBrandPrimary} />
            <Text style={styles.scanBtnText}>Simular escaneo</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} /><Text style={styles.orText}>o ingresa el código</Text><View style={styles.orLine} />
          </View>

          <View style={styles.codeRow}>
            <TextInput testID="manual-code-input" value={code} onChangeText={setCode}
              placeholder="Ej. E-1234" placeholderTextColor={c.muted} autoCapitalize="characters" style={styles.codeInput} />
            <Pressable testID="manual-code-submit" onPress={pickAndStart} disabled={scanning} style={styles.codeBtn}>
              <Ionicons name="arrow-forward" size={22} color={c.onBrandPrimary} />
            </Pressable>
          </View>

          {error && <Text style={styles.error} testID="unlock-error">{error}</Text>}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F0C" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  viewfinderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  viewfinder: { width: 240, height: 240, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  corner: { position: "absolute", width: 34, height: 34, borderColor: c.brandSecondary },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.lg },
  scanLine: { position: "absolute", left: 12, right: 12, height: 2, backgroundColor: c.success, opacity: 0.8 },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: spacing.md, backgroundColor: "rgba(6,10,7,0.65)" },
  scanningText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  hint: { color: "#FFFFFF", opacity: 0.7, fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: c.brandPrimary, borderRadius: radius.md, paddingVertical: 16, ...shadow.card },
  scanBtnText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "700" },
  orRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: c.divider },
  orText: { fontSize: 13, color: c.muted },
  codeRow: { flexDirection: "row", gap: spacing.sm },
  codeInput: { flex: 1, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: c.onSurface },
  codeBtn: { width: 52, borderRadius: radius.md, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  error: { color: c.error, fontSize: 14, textAlign: "center" },
});
