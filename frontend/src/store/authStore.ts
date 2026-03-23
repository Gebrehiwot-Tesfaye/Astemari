"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Teacher, School } from "@/types";

interface AuthState {
  user: User | null;
  profile: Teacher | School | null;
  token: string | null;
  setAuth: (user: User, profile: Teacher | School | null, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      setAuth: (user, profile, token) => {
        localStorage.setItem("access_token", token);
        set({ user, profile, token });
      },
      clearAuth: () => {
        localStorage.removeItem("access_token");
        set({ user: null, profile: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: "astemari-auth", partialize: (s) => ({ user: s.user, profile: s.profile, token: s.token }) }
  )
);
