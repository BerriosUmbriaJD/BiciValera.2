import { storage } from "@/src/utils/storage";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = "bicivalera_token";

async function request(path: string, options: RequestInit = {}, auth = true) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = await storage.secureGet(TOKEN_KEY, "");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.detail || "Ocurrió un error");
  }
  return data;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }, false),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  me: () => request("/auth/me"),
  stations: () => request("/stations", {}, false),
  station: (id: string) => request(`/stations/${id}`, {}, false),
  startRide: (station_id: string, bike_id: string) =>
    request("/rides/start", { method: "POST", body: JSON.stringify({ station_id, bike_id }) }),
  endRide: (ride_id: string) => request(`/rides/${ride_id}/end`, { method: "POST" }),
  rides: () => request("/rides"),
  activeRide: () => request("/rides/active"),
  impact: () => request("/impact"),
  impactTrend: () => request("/impact/trend"),
  achievements: () => request("/achievements"),
  simulator: () => request("/simulator", {}, false),
};
