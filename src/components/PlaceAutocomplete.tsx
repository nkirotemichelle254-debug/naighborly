import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";

export interface PlaceValue {
  label: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface Props {
  value: string;
  onChange: (label: string) => void;
  onSelect: (place: PlaceValue) => void;
  placeholder?: string;
  className?: string;
  /** Restrict suggestions to country codes (e.g. ["ke"]) */
  countries?: string[];
}

interface Suggestion {
  primary: string;
  secondary: string;
  prediction: google.maps.places.AutocompletePrediction | unknown;
}

/**
 * Google Places (New) autocomplete input.
 * - Debounced (250ms)
 * - Uses an AutocompleteSessionToken so billing is per-session, not per-keystroke.
 * - On selection, fetches lat/lng + canonical name and calls onSelect.
 */
export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your neighborhood…",
  className = "",
  countries,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const placesLibRef = useRef<google.maps.PlacesLibrary | null>(null);
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(async (g) => {
        const lib = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        if (cancelled) return;
        placesLibRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSuggestions = (input: string) => {
    const lib = placesLibRef.current;
    if (!lib || !input.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: sessionTokenRef.current as google.maps.places.AutocompleteSessionToken,
      includedRegionCodes: countries,
    })
      .then(({ suggestions: raw }) => {
        const next: Suggestion[] = raw
          .map((s) => {
            const p = s.placePrediction;
            if (!p) return null;
            return {
              primary: p.mainText?.text ?? p.text?.text ?? "",
              secondary: p.secondaryText?.text ?? "",
              prediction: p,
            } as Suggestion;
          })
          .filter(Boolean) as Suggestion[];
        setSuggestions(next);
        setOpen(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  };

  const handleInput = (v: string) => {
    onChange(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 250);
  };

  const handlePick = async (s: Suggestion) => {
    const lib = placesLibRef.current;
    if (!lib) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prediction = s.prediction as any;
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location"],
      });
      const loc = place.location;
      const lat = typeof loc?.lat === "function" ? loc.lat() : (loc as { lat?: number })?.lat;
      const lng = typeof loc?.lng === "function" ? loc.lng() : (loc as { lng?: number })?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;
      const label = s.primary || place.displayName || s.secondary;
      onChange(label);
      onSelect({
        label,
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        placeId: place.id ?? "",
      });
      setOpen(false);
      setSuggestions([]);
      // Rotate the session token after a successful pick (per Places billing guidance).
      sessionTokenRef.current = new lib.AutocompleteSessionToken();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-3 outline-none focus:ring-2 focus:ring-ring"
          placeholder={ready ? placeholder : "Loading map…"}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          autoComplete="off"
          disabled={!ready}
        />
        {loading && (
          <Loader2 className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-72 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li key={i} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted transition flex items-start gap-2"
              >
                <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{s.primary}</span>
                  {s.secondary && (
                    <span className="block text-xs text-muted-foreground truncate">{s.secondary}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
