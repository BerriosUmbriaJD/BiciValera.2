import { useState, useCallback } from "react";
import { Platform, Linking } from "react-native";
import * as Location from "expo-location";

export type LocStatus = "idle" | "loading" | "granted" | "denied" | "blocked";

export function useUserLocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<LocStatus>("idle");

  const request = useCallback(async () => {
    setStatus("loading");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus(perm.canAskAgain ? "denied" : "blocked");
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setCoords(c);
      setStatus("granted");
      return c;
    } catch {
      setStatus("denied");
      return null;
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === "web") return;
    Linking.openSettings();
  }, []);

  return { coords, status, request, openSettings };
}
