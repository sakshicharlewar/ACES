// ─── Dynamic API Base URL Configuration ─────────────────────────────────────
// Automatically adapts based on whether accessing from localhost, LAN (mobile via 192.168.x.x), or production

export function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== "undefined" && window.location) {
    const { hostname, protocol } = window.location;

    // If accessing from a local network IP (e.g. 192.168.x.x or 10.x.x.x on mobile):
    // Auto-route to the backend running on the same host IP on port 8000
    if (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      !hostname.includes("onrender.com") &&
      !hostname.includes("vercel.app") &&
      (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))
    ) {
      return `${protocol}//${hostname}:8000`;
    }
  }

  // Use environment variable if specified (e.g. production on Render or localhost)
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.replace(/\/$/, "");
  }

  // Default fallback
  return "https://aces-backkend.onrender.com";
}

export const BASE_URL = getBaseUrl();
