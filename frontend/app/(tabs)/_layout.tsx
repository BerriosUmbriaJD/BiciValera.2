import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/context/theme";

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.surfaceSecondary,
          borderTopColor: c.divider,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
    >
      <Tabs.Screen name="index" options={{ title: "Mapa", tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }} />
      <Tabs.Screen name="impact" options={{ title: "Impacto", tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }} />
      <Tabs.Screen name="activity" options={{ title: "Viajes", tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
