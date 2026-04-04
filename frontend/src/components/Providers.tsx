"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppProvider } from "@/context/AppContext";
import { useAuthStore } from "@/store/authStore";

function IdleSessionGuard() {
  const { refreshActivity, checkExpiry } = useAuthStore();

  useEffect(() => {
    // Check expiry on mount and every minute
    checkExpiry();
    const interval = setInterval(checkExpiry, 60_000);

    // Refresh activity on user interaction
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handler = () => refreshActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <IdleSessionGuard />
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}

