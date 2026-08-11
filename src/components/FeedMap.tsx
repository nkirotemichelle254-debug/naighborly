/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Post } from "@/data/posts";

/** Deterministic ~120 m jitter so a pin never reveals someone's exact door. */
function jitter(id: string, lat: number, lng: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = ((h % 360) * Math.PI) / 180;
  const r = 0.0011; // ~120 m
  return { lat: lat + r * Math.sin(a), lng: lng + r * Math.cos(a) };
}

interface Props {
  posts: Post[];
  center?: { latitude?: number | null; longitude?: number | null };
}

export function FeedMap({ posts, center }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const pins = posts.filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number",
  );

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        if (!mapRef.current) {
          mapRef.current = new g.maps.Map(ref.current, {
            center: {
              lat: typeof center?.latitude === "number" ? center.latitude : -1.2921,
              lng: typeof center?.longitude === "number" ? center.longitude : 36.8219,
            },
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          });
        }
        const map = mapRef.current;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new g.maps.LatLngBounds();
        if (typeof center?.latitude === "number" && typeof center?.longitude === "number") {
          const here = { lat: center.latitude, lng: center.longitude };
          bounds.extend(here);
          markersRef.current.push(
            new g.maps.Marker({
              map,
              position: here,
              title: "You",
              icon: {
                path: g.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#1d4ed8",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
            }),
          );
        }

        pins.forEach((p) => {
          const pos = jitter(p.id, p.latitude as number, p.longitude as number);
          bounds.extend(pos);
          const marker = new g.maps.Marker({
            map,
            position: pos,
            title: p.title,
          });
          marker.addListener("click", () => navigate(`/post/${p.id}`));
          markersRef.current.push(marker);
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 48);
          const z = map.getZoom();
          if (typeof z === "number" && z > 15) map.setZoom(15);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Map unavailable"));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, center?.latitude, center?.longitude]);

  useEffect(
    () => () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    },
    [],
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Map unavailable right now. Switch back to the list view.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div ref={ref} className="h-[60vh] min-h-[320px] w-full rounded-2xl border border-border overflow-hidden" />
      <p className="text-xs text-muted-foreground px-1">
        {pins.length} post{pins.length === 1 ? "" : "s"} on the map • pins are approximate for safety
      </p>
    </div>
  );
}
