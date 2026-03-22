"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getSupabase } from "./supabase";
import { getStoredPinHash, storePinHash, clearStoredPinHash, hashPin, PIN_LENGTH } from "./pin-hash";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthContextValue {
  pinHash: string | null;
  supabase: SupabaseClient | null;
  isLoading: boolean;
  isNewUser: boolean | null; // null = checking, true = no PIN set yet, false = PIN exists
  authenticate: (pin: string) => Promise<boolean>;
  register: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  // On mount: check localStorage for stored PIN hash, verify it's still valid
  useEffect(() => {
    async function init() {
      const stored = getStoredPinHash();
      if (stored) {
        // Verify the hash is valid by querying app_settings
        const client = getSupabase(stored);
        const { data } = await client.from("app_settings").select("id").eq("pin_hash", stored).maybeSingle();
        if (data) {
          setPinHash(stored);
          setIsNewUser(false);
        } else {
          // Stored hash is invalid (maybe DB was reset)
          clearStoredPinHash();
          setIsNewUser(null); // will be determined when user interacts
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const authenticate = useCallback(async (pin: string): Promise<boolean> => {
    const hash = await hashPin(pin);
    const client = getSupabase(hash);
    const { data } = await client.from("app_settings").select("id").eq("pin_hash", hash).maybeSingle();
    if (data) {
      storePinHash(hash);
      setPinHash(hash);
      setIsNewUser(false);
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (pin: string): Promise<boolean> => {
    const hash = await hashPin(pin);
    const client = getSupabase(hash);
    const { error } = await client.from("app_settings").insert({ pin_hash: hash });
    if (!error) {
      storePinHash(hash);
      setPinHash(hash);
      setIsNewUser(false);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearStoredPinHash();
    setPinHash(null);
  }, []);

  const supabase = pinHash ? getSupabase(pinHash) : null;

  return (
    <AuthContext.Provider value={{ pinHash, supabase, isLoading, isNewUser, authenticate, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
