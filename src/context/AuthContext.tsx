import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { TrustTier } from "@/components/TrustBadge";

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  memberSince: string;
  trustTier: TrustTier;
  asantiReceived: number;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
}

const FALLBACK_PROFILE: UserProfile = {
  id: "",
  name: "Neighbor",
  initials: "N",
  email: "",
  location: "Nairobi",
  bio: "",
  avatarUrl: null,
  memberSince: new Date().getFullYear().toString(),
  trustTier: "new",
  asantiReceived: 0,
  latitude: null,
  longitude: null,
  placeId: null,
};


function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "N"
  );
}

interface AuthResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile;
  isSignedIn: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<AuthResult>;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<UserProfile, "name" | "location" | "bio" | "avatarUrl" | "latitude" | "longitude" | "placeId">>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(user: User): Promise<UserProfile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const name = (data?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Neighbor").trim();
  return {
    id: user.id,
    name,
    initials: getInitials(name),
    email: data?.email ?? user.email ?? "",
    location: data?.neighborhood ?? "Nairobi",
    bio: data?.bio ?? "",
    avatarUrl: data?.avatar_url ?? null,
    memberSince: data?.created_at ? new Date(data.created_at).getFullYear().toString() : FALLBACK_PROFILE.memberSince,
    trustTier: (data?.trust_tier ?? "new") as TrustTier,
    asantiReceived: data?.asanti_received ?? 0,
    latitude: data?.latitude ?? null,
    longitude: data?.longitude ?? null,
    placeId: data?.place_id ?? null,
  };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        setTimeout(() => {
          const u = nextSession.user!;
          // If signup stashed a neighborhood, persist it now that we're signed in.
          try {
            const key = `naighborly:pending-neighborhood:${(u.email ?? "").toLowerCase()}`;
            const pendingRaw = localStorage.getItem(key);
            if (pendingRaw) {
              let patch: { neighborhood: string; latitude?: number; longitude?: number; place_id?: string } | null = null;
              try {
                const parsed = JSON.parse(pendingRaw);
                if (parsed && typeof parsed === "object" && parsed.label) {
                  patch = {
                    neighborhood: String(parsed.label),
                    latitude: typeof parsed.lat === "number" ? parsed.lat : undefined,
                    longitude: typeof parsed.lng === "number" ? parsed.lng : undefined,
                    place_id: typeof parsed.placeId === "string" ? parsed.placeId : undefined,
                  };
                }
              } catch {
                patch = { neighborhood: pendingRaw };
              }
              if (patch) {
                supabase.from("profiles").update(patch).eq("id", u.id).then(() => {
                  localStorage.removeItem(key);
                  loadProfile(u).then(setProfile);
                });
                return;
              }
            }
          } catch { /* ignore */ }
          loadProfile(u).then(setProfile);

        }, 0);
      } else {
        setProfile(FALLBACK_PROFILE);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return {};
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please confirm your email before signing in. Check your inbox for the Naighborly confirmation link." };
    }
    return { error: error.message };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: name.trim(), full_name: name.trim() },
      },
    });
    if (error) return { error: error.message };
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    const safePath = redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "";
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${safePath}`,
    });
    if (result.error) return { error: result.error instanceof Error ? result.error.message : String(result.error) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return { error: "Not signed in" };
      const dbPatch: {
        display_name?: string;
        neighborhood?: string;
        bio?: string;
        avatar_url?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        place_id?: string | null;
      } = {};
      if (patch.name !== undefined) dbPatch.display_name = patch.name.trim();
      if (patch.location !== undefined) dbPatch.neighborhood = patch.location.trim();
      if (patch.bio !== undefined) dbPatch.bio = patch.bio.trim();
      if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
      if (patch.latitude !== undefined) dbPatch.latitude = patch.latitude;
      if (patch.longitude !== undefined) dbPatch.longitude = patch.longitude;
      if (patch.placeId !== undefined) dbPatch.place_id = patch.placeId;
      const { error } = await supabase.from("profiles").update(dbPatch).eq("id", user.id);
      if (error) return { error: error.message };
      setProfile((prev) => {
        const name = (patch.name ?? prev.name).trim() || prev.name;
        return {
          ...prev,
          ...patch,
          name,
          initials: getInitials(name),
        };
      });
      return {};
    },
    [user],
  );


  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      isSignedIn: Boolean(session?.user),
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      updateProfile,
    }),
    [session, user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
