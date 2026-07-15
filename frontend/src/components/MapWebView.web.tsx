import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const html = React.useMemo(
    () => buildMapHtml(stations, c, userLoc, isDark),
    [stations.length, isDark, userLoc?.lat, userLoc?.lon]
  );

  useImperativeHandle(ref, () => ({
    recenter: () => iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "recenter" }), "*"),
  }));

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === "select") onSelect(data.id);
        else if (data?.type === "nearest" && onNearest) onNearest(data);
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect, onNearest]);

  if (stations.length === 0) return <View style={[styles.fill, { backgroundColor: c.mapBg }]} testID="map-canvas" />;

  return (
    <View style={[styles.fill, { backgroundColor: c.mapBg }]} testID="map-canvas">
      {React.createElement("iframe", {
        ref: iframeRef,
        srcDoc: html,
        style: { width: "100%", height: "100%", border: "none", display: "block" },
        title: "map",
      })}
    </View>
  );
});

const styles = StyleSheet.create({ fill: { flex: 1 } });
