import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "@/src/components/mapHtml";
import { Palette } from "@/src/theme";

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type UserLoc = { lat: number; lon: number } | null;

export type MapHandle = { recenter: () => void };

type Props = {
  stations: Station[];
  userLoc: UserLoc;
  c: Palette;
  isDark: boolean;
  onSelect: (id: string) => void;
  onNearest?: (n: { id: string; name: string; distance: number }) => void;
};

export const MapWebView = forwardRef<MapHandle, Props>(function MapWebView(
  { stations, userLoc, c, isDark, onSelect, onNearest }, ref
) {
  const webRef = useRef<WebView>(null);
  const html = React.useMemo(
    () => buildMapHtml(stations, c, userLoc, isDark),
    [stations.length, isDark, userLoc?.lat, userLoc?.lon]
  );

  useImperativeHandle(ref, () => ({
    recenter: () => webRef.current?.injectJavaScript("window._recenter && window._recenter(); true;"),
  }));

  if (stations.length === 0) return <View style={[styles.fill, { backgroundColor: c.mapBg }]} testID="map-canvas" />;

  return (
    <View style={[styles.fill, { backgroundColor: c.mapBg }]} testID="map-canvas">
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={[styles.fill, { backgroundColor: c.mapBg }]}
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "select") onSelect(data.id);
            else if (data.type === "nearest" && onNearest) onNearest(data);
          } catch {}
        }}
        {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
      />
    </View>
  );
});

const styles = StyleSheet.create({ fill: { flex: 1 } });
