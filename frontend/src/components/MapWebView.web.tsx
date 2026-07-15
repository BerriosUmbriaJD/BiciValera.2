import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { buildMapHtml } from "@/src/components/mapHtml";

type Station = { id: string; name: string; lat: number; lon: number; available: number };
type MovingBike = { id: string; type: string; lat: number; lon: number };

export function MapWebView({
  stations, movingBikes, onSelect,
}: {
  stations: Station[]; movingBikes: MovingBike[]; onSelect: (id: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const html = React.useMemo(() => buildMapHtml(stations, movingBikes), [stations.length]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.type === "select") onSelect(data.id);
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (win && movingBikes.length) {
      win.postMessage(JSON.stringify({ type: "bikes", list: movingBikes }), "*");
    }
  }, [movingBikes]);

  if (stations.length === 0) return <View style={styles.fill} testID="map-canvas" />;

  return (
    <View style={styles.fill} testID="map-canvas">
      {React.createElement("iframe", {
        ref: iframeRef,
        srcDoc: html,
        style: { width: "100%", height: "100%", border: "none", display: "block" },
        title: "map",
      })}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: "#DCE7DE" } });
