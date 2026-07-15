import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, images, shadow } from "@/src/theme";
import { useAuth } from "@/src/context/auth";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña");
      return;
    }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="login-screen">
      <View style={{ height: height * 0.42 }}>
        <Image source={images.heroBike} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(19,28,21,0.1)", "rgba(19,28,21,0.55)", colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.brandBox}>
          <View style={styles.logoRow}>
            <Ionicons name="bicycle" size={30} color={colors.onSurfaceInverse} />
            <Text style={styles.brandText}>BiciValera</Text>
          </View>
          <Text style={styles.brandSub}>Movilidad sostenible para Valera, Trujillo</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formWrap}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Inicia sesión para pedalear</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error} testID="login-error">{error}</Text>}

          <Pressable
            testID="login-submit-button"
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <Text style={styles.ctaText}>Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable testID="go-to-register" onPress={() => router.push("/(auth)/register")} style={styles.linkRow}>
            <Text style={styles.linkText}>¿No tienes cuenta? </Text>
            <Text style={styles.linkStrong}>Regístrate</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  brandBox: { position: "absolute", bottom: spacing.xl, left: spacing.xl, right: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandText: { color: colors.onSurfaceInverse, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { color: colors.onSurfaceInverse, fontSize: 15, marginTop: spacing.xs, opacity: 0.92 },
  formWrap: { flex: 1 },
  form: { padding: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceTertiary, marginTop: spacing.sm, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.onSurface,
  },
  error: { color: colors.error, fontSize: 14, marginTop: spacing.sm },
  cta: {
    backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingVertical: 17,
    alignItems: "center", marginTop: spacing.xl, ...shadow.card,
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 17, fontWeight: "700" },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  linkText: { color: colors.muted, fontSize: 15 },
  linkStrong: { color: colors.brand, fontSize: 15, fontWeight: "700" },
});
