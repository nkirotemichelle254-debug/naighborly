import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  memberSince: string;
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
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<UserProfile, "name" | "location" | "bio" | "avatarUrl">>) => Promise<AuthResult>;
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
          loadProfile(nextSession.user!).then(setProfile);
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

  const signInWithGoogle = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return { error: result.error instanceof Error ? result.error.message : String(result.error) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, "name" | "location" | "bio" | "avatarUrl">>) => {
      if (!user) return { error: "Not signed in" };
      const dbPatch: {
        display_name?: string;
        neighborhood?: string;
        bio?: string;
        avatar_url?: string | null;
      } = {};
      if (patch.name !== undefined) dbPatch.display_name = patch.name.trim();
      if (patch.location !== undefined) dbPatch.neighborhood = patch.location.trim();
      if (patch.bio !== undefined) dbPatch.bio = patch.bio.trim();
      if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
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
