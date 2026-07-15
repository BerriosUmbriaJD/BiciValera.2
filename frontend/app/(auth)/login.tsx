import React, { useState, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { spacing, radius, images, shadow, Palette } from "@/src/theme";
import { useAuth } from "@/src/context/auth";
import { useTheme } from "@/src/context/theme";

export default function Login() {
  const { signIn } = useAuth();
  const { c } = useTheme();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password) { setError("Ingresa tu correo y contraseña"); return; }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signIn(email.trim(), password);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container} testID="login-screen">
      <View style={{ height: height * 0.42 }}>
        <Image source={images.heroBike} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(19,28,21,0.1)", "rgba(19,28,21,0.55)", c.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.brandBox}>
          <View style={styles.logoRow}>
            <Ionicons name="bicycle" size={30} color="#FFFFFF" />
            <Text style={styles.brandText}>BiciValera</Text>
          </View>
          <Text style={styles.brandSub}>Movilidad sostenible para Valera, Trujillo</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formWrap}>
        <Animated.ScrollView entering={FadeInDown.duration(500)} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Inicia sesión para pedalear</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput testID="login-email-input" value={email} onChangeText={setEmail}
            placeholder="tu@correo.com" placeholderTextColor={c.muted} autoCapitalize="none"
            keyboardType="email-address" style={styles.input} />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput testID="login-password-input" value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor={c.muted} secureTextEntry style={styles.input} />

          {error && <Text style={styles.error} testID="login-error">{error}</Text>}

          <Pressable testID="login-submit-button" onPress={submit} disabled={loading}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
            {loading ? <ActivityIndicator color={c.onBrandPrimary} /> : <Text style={styles.ctaText}>Iniciar sesión</Text>}
          </Pressable>

          <Pressable testID="go-to-register" onPress={() => router.push("/(auth)/register")} style={styles.linkRow}>
            <Text style={styles.linkText}>¿No tienes cuenta? </Text>
            <Text style={styles.linkStrong}>Regístrate</Text>
          </Pressable>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  brandBox: { position: "absolute", bottom: spacing.xl, left: spacing.xl, right: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandText: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { color: "#FFFFFF", fontSize: 15, marginTop: spacing.xs, opacity: 0.92 },
  formWrap: { flex: 1 },
  form: { padding: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: c.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: c.muted, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceTertiary, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: c.onSurface },
  error: { color: c.error, fontSize: 14, marginTop: spacing.sm },
  cta: { backgroundColor: c.brandPrimary, borderRadius: radius.md, paddingVertical: 17, alignItems: "center", marginTop: spacing.xl, ...shadow.card },
  ctaText: { color: c.onBrandPrimary, fontSize: 17, fontWeight: "700" },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  linkText: { color: c.muted, fontSize: 15 },
  linkStrong: { color: c.brand, fontSize: 15, fontWeight: "700" },
});
