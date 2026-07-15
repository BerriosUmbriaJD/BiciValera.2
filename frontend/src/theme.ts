export const lightColors = {
  mode: "light" as const,
  surface: "#F9FAF9",
  onSurface: "#18211A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#202D23",
  surfaceTertiary: "#EAEFEA",
  onSurfaceTertiary: "#2E4133",
  surfaceInverse: "#131C15",
  onSurfaceInverse: "#FFFFFF",
  brand: "#1F7A43",
  brandPrimary: "#1F7A43",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#34995A",
  brandTertiary: "#D1F0DB",
  onBrandTertiary: "#124B28",
  success: "#22C55E",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#14B8A6",
  border: "#E2E8E4",
  borderStrong: "#A3B8A9",
  divider: "#E8ECE9",
  muted: "#5F6E63",
  mapBg: "#DCE7DE",
};

export const darkColors: typeof lightColors = {
  mode: "light" as const, // overwritten below
  surface: "#0E1611",
  onSurface: "#ECF3EE",
  surfaceSecondary: "#17221B",
  onSurfaceSecondary: "#DCE7DE",
  surfaceTertiary: "#1E2B22",
  onSurfaceTertiary: "#C4D3C6",
  surfaceInverse: "#060A07",
  onSurfaceInverse: "#FFFFFF",
  brand: "#3BAF6A",
  brandPrimary: "#2E9D57",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#43B872",
  brandTertiary: "#14361F",
  onBrandTertiary: "#A7E3BE",
  success: "#34D399",
  onSuccess: "#06231A",
  warning: "#FBBF24",
  error: "#F87171",
  onError: "#2A0A0A",
  info: "#2DD4BF",
  border: "#26332B",
  borderStrong: "#3E5244",
  divider: "#202C24",
  muted: "#8CA093",
  mapBg: "#1A241D",
};
(darkColors as any).mode = "dark";

export type Palette = typeof lightColors;

// Backwards-compatible static export (light) for non-themed modules.
export const colors = lightColors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const shadow = {
  card: {
    shadowColor: "#0B1F12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: "#0B1F12",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const images = {
  heroBike: "https://images.unsplash.com/photo-1762497403299-b5b68aa08594",
  heroLeaf: "https://images.unsplash.com/photo-1683444592479-18f1d9137b91",
};
