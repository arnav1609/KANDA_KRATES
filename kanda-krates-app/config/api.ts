/**
 * Centralized API Configuration
 * Change API_BASE_URL here — no more hardcoded IPs scattered across the app.
 */

import * as SecureStore from "expo-secure-store";

// ──── Base URL ────
// Update this single value when switching environments
export const API_BASE_URL = "http://192.168.1.10:5000";

// ──── Endpoints ────
export const API_ENDPOINTS = {
  login: "/api/farmer",
  farmerRegister: "/api/farmer/register",
  adminRegister: "/api/admin/register",
  sensors: (crate: string, batch: string) =>
    `/api/sensors/${crate}/${batch}`,
  allSensors: "/api/sensors",
  history: (crate: string) => `/api/history/${crate}`,
  historyHealth: (crate: string, lang: string) => `/api/history/health/${crate}/${lang}`,
  chat: "/api/chat",
  farmers: "/api/farmers",
  farmer: (username: string) => `/api/farmers/${username}`,
  crates: "/api/crates",
  crate: (crateId: string) => `/api/crates/${crateId}`,
  crateReassign: (crateId: string) => `/api/crates/${crateId}/reassign`,
  marketPrice: "/api/market/price/onion",
  advisory: (crateId: string) => `/api/advisory/${crateId}`,
  fleetAnalytics: "/api/analytics/fleet",
} as const;

// ──── Request Timeout (ms) ────
const REQUEST_TIMEOUT = 20000;

// ──── Secure Request Helper ────

type RequestOptions = Omit<RequestInit, "signal"> & {
  skipAuth?: boolean;
};

/**
 * Wrapper around fetch that:
 * 1. Prepends the base URL
 * 2. Attaches the stored JWT token as a Bearer header
 * 3. Sets a timeout to avoid hanging requests
 * 4. Logs requests for debugging
 */
export async function secureRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: extraHeaders, ...rest } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  // Attach auth token if available
  if (!skipAuth) {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // SecureStore not available (e.g. web) — continue without token
    }
  }

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  console.log(`[SecureRequest] ${rest.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ──── Input Sanitization ────

/**
 * Strip HTML/script tags and trim whitespace.
 * Prevents basic injection attacks.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/[<>"'`;(){}]/g, "")   // strip dangerous chars
    .trim();
}

/**
 * Validate username: 3-30 chars, alphanumeric + underscore
 */
export function validateUsername(username: string): string | null {
  if (!username || username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 30) return "Username must be at most 30 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
  return null;
}

/**
 * Validate Indian phone number: exactly 10 digits
 */
export function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s/g, "");
  if (!/^\d{10}$/.test(cleaned)) return "Enter a valid 10-digit phone number";
  return null;
}

/**
 * Validate password: minimum 6 characters
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  return null;
}
