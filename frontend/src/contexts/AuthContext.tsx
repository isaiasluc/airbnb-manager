import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { AuthContext } from "./auth-context";

const AUTH_SESSION_STARTED_AT_KEY = "airbnb-manager.auth.sessionStartedAt";
const DEFAULT_AUTH_SESSION_MAX_AGE_MS = 1 * 60 * 60 * 1000;

const configuredSessionMaxAgeMs = Number(
  import.meta.env.VITE_AUTH_SESSION_MAX_AGE_MS,
);

const AUTH_SESSION_MAX_AGE_MS =
  Number.isFinite(configuredSessionMaxAgeMs) && configuredSessionMaxAgeMs > 0
    ? configuredSessionMaxAgeMs
    : DEFAULT_AUTH_SESSION_MAX_AGE_MS;

function getSessionStartedAt(user: User) {
  const storedSessionStartedAt = Number(
    window.localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY),
  );

  if (Number.isFinite(storedSessionStartedAt) && storedSessionStartedAt > 0) {
    return storedSessionStartedAt;
  }

  const lastSignInAt = Date.parse(user.metadata.lastSignInTime ?? "");

  return Number.isFinite(lastSignInAt) ? lastSignInAt : Date.now();
}

function clearStoredSession() {
  window.localStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY);
}

function storeNewSession() {
  window.localStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, String(Date.now()));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionExpirationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearSessionExpirationTimeout = () => {
      if (sessionExpirationTimeoutRef.current) {
        window.clearTimeout(sessionExpirationTimeoutRef.current);
        sessionExpirationTimeoutRef.current = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearSessionExpirationTimeout();

      if (!currentUser) {
        clearStoredSession();
        setUser(null);
        setLoading(false);
        return;
      }

      const sessionStartedAt = getSessionStartedAt(currentUser);
      const sessionAgeMs = Date.now() - sessionStartedAt;

      if (sessionAgeMs >= AUTH_SESSION_MAX_AGE_MS) {
        clearStoredSession();
        setUser(null);
        await firebaseSignOut(auth);
        setLoading(false);
        return;
      }

      window.localStorage.setItem(
        AUTH_SESSION_STARTED_AT_KEY,
        String(sessionStartedAt),
      );
      sessionExpirationTimeoutRef.current = window.setTimeout(async () => {
        clearStoredSession();
        setUser(null);
        await firebaseSignOut(auth);
      }, AUTH_SESSION_MAX_AGE_MS - sessionAgeMs);

      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      clearSessionExpirationTimeout();
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        storeNewSession();
      },
      signOut: async () => {
        clearStoredSession();
        await firebaseSignOut(auth);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
