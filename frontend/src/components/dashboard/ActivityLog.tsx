"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, Filter, User, Building2, Briefcase, LogIn, UserPlus, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  action: string;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  login: LogIn,
  register: UserPlus,
  job_posted: Briefcase,
  job_applied: Briefcase,
  school_approved: CheckCircle2,
  school_rejected: XCircle,
  application_updated: CheckCircle2,
  invitation_updated: CheckCircle2,
  profile_updated: User,
  default: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  register: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  job_posted: "bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021]",
  job_applied: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  school_approved: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  school_rejected: "bg-red-50 dark:bg-red-900/20 text-red-600",
  application_updated: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
  invitation_updated: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
  profile_updated: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
  default: "bg-stone-100 dark:bg-stone-800 text-stone-500",
};

const PER_PAGE = 10;

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", page, search, roleFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (actionFilter) params.set("action", actionFilter);
      return (await api.get(`/admin/activity?${params}`)).data as { items: LogEntry[]; total: number; pages: number };
    },
  });

  const logs: LogEntry[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  const todayCount = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const loginCount = logs.filter(l => l.action === "login").length;

  const statCards = [
    { label: "All Events", value: total, icon: Activity, color: "text-[#C5A021]", bg: "bg-[#C5A021]/10", filterRole: "", filterAction: "" },
    { label: "Today", value: todayCount, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", filterRole: "", filterAction: "" },
    { label: "Logins", value: loginCount, icon: LogIn, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", filterRole: "", filterAction: "login" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#221902] dark:text-white">
          Activity <span className="text-[#C5A021] italic">Log</span>
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Full audit trail of all platform actions.</p>
      </div>

      {/* Stats strip — clickable filters */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(s => {
          const isActive = actionFilter === s.filterAction && roleFilter === s.filterRole && s.filterAction !== "";
          const isAllActive = s.filterAction === "" && actionFilter === "" && roleFilter === "";
          const active = isActive || (s.label === "All Events" && isAllActive);
          return (
            <button
              key={s.label}
              onClick={() => { setActionFilter(s.filterAction); setRoleFilter(s.filterRole); setPage(1); }}
              className={cn(
                "bg-white dark:bg-[#221902]/60 p-4 rounded-xl border flex items-center gap-3 text-left transition-all",
                active
                  ? "border-[#C5A021] ring-1 ring-[#C5A021]/40"
                  : "border-stone-100 dark:border-[#8E6708]/20 hover:border-[#C5A021]/40"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", s.bg, s.color)}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-lg font-bold text-[#221902] dark:text-white">{s.value}</p>
                <p className="text-xs text-stone-500">{s.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl">
          <Search size={15} className="text-stone-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email or description..."
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl">
          <Filter size={14} className="text-stone-400 flex-shrink-0" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="school">School</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl">
          <Activity size={14} className="text-stone-400 flex-shrink-0" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="register">Register</option>
            <option value="job_posted">Job Posted</option>
            <option value="job_applied">Job Applied</option>
            <option value="school_approved">School Approved</option>
            <option value="school_rejected">School Rejected</option>
            <option value="application_updated">Application Updated</option>
            <option value="invitation_updated">Invitation Updated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-stone-400 text-sm">Loading activity...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
            <Activity size={32} className="opacity-30" />
            <p className="text-sm">No activity found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50 dark:bg-[#221902]/80">
                  <th className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">IP</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-[#8E6708]/10">
                {logs.map((log, idx) => {
                  const Icon = ACTION_ICONS[log.action] ?? ACTION_ICONS.default;
                  const colorClass = ACTION_COLORS[log.action] ?? ACTION_COLORS.default;
                  return (
                    <tr key={log.id} className={cn(
                      idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30",
                      "hover:bg-amber-50/40 dark:hover:bg-[#221902]/40 transition-colors"
                    )}>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold", colorClass)}>
                          <Icon size={12} />
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            log.user_role === "admin" ? "bg-[#221902] text-[#C5A021]" :
                            log.user_role === "school" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                            "bg-stone-100 dark:bg-stone-800 text-stone-600"
                          )}>
                            {log.user_role === "school" ? <Building2 size={12} /> : <User size={12} />}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900 dark:text-white text-xs">{log.user_email ?? "—"}</p>
                            <p className="text-[10px] text-stone-400 capitalize">{log.user_role ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400 hidden md:table-cell max-w-xs truncate">{log.description ?? "—"}</td>
                      <td className="px-5 py-3.5 text-stone-400 text-xs font-mono hidden lg:table-cell">{log.ip_address ?? "—"}</td>
                      <td className="px-5 py-3.5 text-stone-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-[#8E6708]/20">
            <p className="text-xs text-stone-500">
              Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-7 h-7 rounded-lg text-xs font-bold transition-colors",
                    page === p ? "bg-[#221902] text-[#C5A021]" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
