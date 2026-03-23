"use client";
import { useState } from "react";
import { Bell, Briefcase, UserPlus, Building2, Info } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Notification } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  job_posted:  { icon: Briefcase,  color: "text-[#8E6708] dark:text-[#C5A021]", bg: "bg-[#C5A021]/10" },
  application: { icon: UserPlus,   color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  invitation:  { icon: Building2,  color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  system:      { icon: Info,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { t } = useAppContext();
  const qc = useQueryClient();

  const { data } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications?limit=20")).data,
    refetchInterval: 30_000,
  });

  const unread = data?.filter((n) => !n.is_read).length || 0;

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.post("/notifications/read-all");
        qc.setQueryData<Notification[]>(["notifications"], (old) =>
          old ? old.map((n) => ({ ...n, is_read: true })) : old
        );
      } catch {
        // silently ignore
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <p className="font-bold text-stone-900 dark:text-white text-sm">{t("header.notifications")}</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
              {data?.length ? data.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.system;
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 flex gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors",
                      !n.is_read && "bg-amber-50/50 dark:bg-amber-900/10"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", meta.bg, meta.color)}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-stone-900 dark:text-white leading-tight">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#C5A021] flex-shrink-0 mt-1" />}
                      </div>
                      {n.message && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-stone-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-4 py-8 text-center text-sm text-stone-400">{t("header.no_notifications")}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
