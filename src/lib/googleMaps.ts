// Loads the Google Maps JS API (places library) exactly once, on demand.
// Uses the Lovable-managed browser key + tracking channel.

let loaderPromise: Promise<typeof google> | null = null;

declare global {
  interface Window {
    google?: typeof google;
    __naighborlyMapsInit?: () => void;
  }
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  loaderPromise = new Promise((resolve, reject) => {
    window.__naighborlyMapsInit = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps loaded but unavailable"));
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      v: "weekly",
      libraries: "places",
      loading: "async",
      callback: "__naighborlyMapsInit",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}
