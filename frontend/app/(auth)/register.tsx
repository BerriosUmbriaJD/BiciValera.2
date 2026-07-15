import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, shadow } from "@/src/theme";
import { useAuth } from "@/src/context/auth";

export default function Register() {
  const { signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError("Completa todos los campos");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signUp(name.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="register-screen">
      <View style={styles.header}>
        <Pressable testID="register-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.iconBadge}>
            <Ionicons name="leaf" size={28} color={colors.brand} />
          </View>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Únete al movimiento verde de Valera</Text>

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            testID="register-name-input"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            testID="register-email-input"
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
            testID="register-password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error} testID="register-error">{error}</Text>}

          <Pressable
            testID="register-submit-button"
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <Text style={styles.ctaText}>Crear cuenta</Text>
            )}
          </Pressable>

          <Pressable testID="go-to-login" onPress={() => router.back()} style={styles.linkRow}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? </Text>
            <Text style={styles.linkStrong}>Inicia sesión</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  form: { padding: spacing.xl, gap: spacing.sm },
  iconBadge: {
    width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.brandTertiary,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
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
