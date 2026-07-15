import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "@/src/components/mapHtml";

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type MovingBike = { id: string; type: string; lat: number; lon: number };

export function MapWebView({
  stations, movingBikes, onSelect,
}: {
  stations: Station[]; movingBikes: MovingBike[]; onSelect: (id: string) => void;
}) {
  const ref = useRef<WebView>(null);
  const html = React.useMemo(() => buildMapHtml(stations, movingBikes), [stations.length]);

  useEffect(() => {
    if (ref.current && movingBikes.length) {
      ref.current.injectJavaScript(
        `window.updateBikes && window.updateBikes(${JSON.stringify(movingBikes)}); true;`
      );
    }
  }, [movingBikes]);

  if (stations.length === 0) return <View style={styles.fill} testID="map-canvas" />;

  return (
    <View style={styles.fill} testID="map-canvas">
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.fill}
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "select") onSelect(data.id);
          } catch {}
        }}
        {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: "#DCE7DE" } });
