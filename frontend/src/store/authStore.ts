"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Teacher, School } from "@/types";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

interface AuthState {
  user: User | null;
  profile: Teacher | School | null;
  token: string | null;
  lastActivity: number | null;
  setAuth: (user: User, profile: Teacher | School | null, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  refreshActivity: () => void;
  checkExpiry: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      lastActivity: null,
      setAuth: (user, profile, token) => {
        localStorage.setItem("access_token", token);
        set({ user, profile, token, lastActivity: Date.now() });
      },
      clearAuth: () => {
        localStorage.removeItem("access_token");
        set({ user: null, profile: null, token: null, lastActivity: null });
      },
      isAuthenticated: () => !!get().token,
      refreshActivity: () => {
        if (get().token) set({ lastActivity: Date.now() });
      },
      checkExpiry: () => {
        const { token, lastActivity, clearAuth } = get();
        if (token && lastActivity && Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
          clearAuth();
        }
      },
    }),
    { name: "astemari-auth", partialize: (s) => ({ user: s.user, profile: s.profile, token: s.token, lastActivity: s.lastActivity }) }
  )
);
