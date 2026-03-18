import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { secureRequest, API_ENDPOINTS } from "../config/api";

// ──── Types ────

type UserRole = "farmer" | "admin" | null;

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  username: string | null;
  authToken: string | null;
};

type AuthContextType = AuthState & {
  login: (
    username: string,
    phoneNumber: string,
    password: string,
    role: "farmer" | "admin"
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ──── Secure Storage Helpers (fallback for web) ────

async function secureSet(key: string, value: string) {
  if (Platform.OS === "web") {
    // Web fallback — less secure but functional
    try { sessionStorage.setItem(key, value); } catch {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string) {
  if (Platform.OS === "web") {
    try { sessionStorage.removeItem(key); } catch {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ──── Provider ────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userRole: null,
    username: null,
    authToken: null,
  });

  // ── Restore session on app start ──
  useEffect(() => {
    (async () => {
      try {
        const token = await secureGet("authToken");
        const role = (await secureGet("userRole")) as UserRole;
        const name = await secureGet("username");

        if (token && role) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            userRole: role,
            username: name,
            authToken: token,
          });
          console.log("[Auth] Session restored for:", name, "role:", role);
          return;
        }
      } catch (err) {
        console.log("[Auth] Failed to restore session:", err);
      }

      setState((s) => ({ ...s, isLoading: false }));
    })();
  }, []);

  // ── Login with credentials ──
  const login = async (
    username: string,
    phoneNumber: string,
    password: string,
    role: "farmer" | "admin"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await secureRequest(API_ENDPOINTS.login, {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          username,
          phoneNumber,
          password,
          role,
          sensorData: { temperature: 25, humidity: 60 },
        }),
      });

      const data = await response.json();

      // Extract token — backend may return it as `token`, `jwt`, or `accessToken`
      const token = data.token || data.jwt || data.accessToken || `local_${Date.now()}`;

      await secureSet("authToken", token);
      await secureSet("userRole", role);
      await secureSet("username", username);

      setState({
        isAuthenticated: true,
        isLoading: false,
        userRole: role,
        username,
        authToken: token,
      });

      console.log("[Auth] Login success:", username, "role:", role);
      return { success: true };
    } catch (error: any) {
      console.error("[Auth] Login failed:", error);
      return {
        success: false,
        error: error.message || "Could not connect to server",
      };
    }
  };

  // ── Login with Google ──
  const loginWithGoogle = async (
    googleToken: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Store the Google token as auth
      await secureSet("authToken", googleToken);
      await secureSet("userRole", "farmer");
      await secureSet("username", "google_user");

      setState({
        isAuthenticated: true,
        isLoading: false,
        userRole: "farmer",
        username: "google_user",
        authToken: googleToken,
      });

      console.log("[Auth] Google login success");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ── Logout ──
  const logout = async () => {
    try {
      await secureDelete("authToken");
      await secureDelete("userRole");
      await secureDelete("username");
    } catch (err) {
      console.log("[Auth] SecureStore cleanup error:", err);
    }

    setState({
      isAuthenticated: false,
      isLoading: false,
      userRole: null,
      username: null,
      authToken: null,
    });

    console.log("[Auth] Logged out");
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ──── Hook ────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
