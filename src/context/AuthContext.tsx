import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const AUTH_KEY = "naighborly-auth-session";
const PROFILE_KEY = "naighborly-user-profile";

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  location: string;
  bio: string;
  memberSince: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Michael Heri",
  initials: "MH",
  email: "michael@example.com",
  location: "Westlands",
  bio: "Product designer and community-minded builder creating trusted exchange across Nairobi neighborhoods.",
  memberSince: "2024",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface Session {
  email: string;
  signedInAt: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile;
  isSignedIn: boolean;
  signIn: (email: string, name?: string) => boolean;
  signOut: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readJson<Session | null>(AUTH_KEY, null));
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = readJson<Partial<UserProfile>>(PROFILE_KEY, {});
    const name = (stored.name ?? DEFAULT_PROFILE.name).trim() || DEFAULT_PROFILE.name;
    return { ...DEFAULT_PROFILE, ...stored, name, initials: getInitials(name) };
  });

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) setSession(readJson<Session | null>(AUTH_KEY, null));
      if (e.key === PROFILE_KEY) {
        const stored = readJson<Partial<UserProfile>>(PROFILE_KEY, {});
        const name = (stored.name ?? DEFAULT_PROFILE.name).trim() || DEFAULT_PROFILE.name;
        setProfile({ ...DEFAULT_PROFILE, ...stored, name, initials: getInitials(name) });
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const signIn = useCallback(
    (email: string, name?: string) => {
      const safeEmail = email.trim().toLowerCase();
      if (!safeEmail.includes("@")) return false;
      const next: Session = { email: safeEmail, signedInAt: new Date().toISOString() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      setSession(next);
      const profileName = (name ?? profile.name).trim() || DEFAULT_PROFILE.name;
      const nextProfile: UserProfile = {
        ...profile,
        email: safeEmail,
        name: profileName,
        initials: getInitials(profileName),
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      return true;
    },
    [profile],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setSession(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const name = (patch.name ?? prev.name).trim() || prev.name;
      const next: UserProfile = { ...prev, ...patch, name, initials: getInitials(name) };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isSignedIn: Boolean(session),
      signIn,
      signOut,
      updateProfile,
    }),
    [session, profile, signIn, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
