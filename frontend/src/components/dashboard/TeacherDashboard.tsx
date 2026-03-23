"use client";
import {
  Briefcase, CheckCircle2, TrendingUp, Bell, ArrowUpRight,
  MapPin, Calendar, History, Mail, Star, Clock, ChevronRight,
  Target, Award, BookOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Job, JobApplication, Notification, Invitation } from "@/types";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";

// Minimal bar chart using pure CSS/SVG
function MiniBarChart({ data, color = "#C5A021" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, backgroundColor: color, opacity: 0.6 + (i / data.length) * 0.4 }}
        />
      ))}
    </div>
  );
}

// Radial progress ring
function RadialProgress({ pct, size = 80, stroke = 7, color = "#C5A021" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-stone-100 dark:text-stone-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

export default function TeacherDashboard() {
  const { user, profile } = useAuthStore();
  const { t } = useAppContext();

  const { data: applications } = useQuery<JobApplication[]>({
    queryKey: ["my-applications"],
    queryFn: async () => (await api.get("/applications/my")).data,
  });

  const { data: jobs } = useQuery<{ items: Job[] }>({
    queryKey: ["recommended-jobs"],
    queryFn: async () => (await api.get("/jobs?limit=4&status=active")).data,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications?limit=5")).data,
    refetchInterval: 30_000,
  });

  const { data: invitations } = useQuery<Invitation[]>({
    queryKey: ["invitations"],
    queryFn: async () => (await api.get("/invitations")).data,
    refetchInterval: 30_000,
  });

  const p = profile as { first_name?: string; last_name?: string; department?: string; profile_completed?: boolean } | null;
  const firstName = p?.first_name || user?.email?.split("@")[0] || "Teacher";
  const dept = p?.department || "—";
  const profilePct = p?.profile_completed ? 100 : 45;

  const pending = applications?.filter(a => a.status === "pending").length ?? 0;
  const accepted = applications?.filter(a => a.status === "accepted").length ?? 0;
  const total = applications?.length ?? 0;
  const unread = notifications?.filter(n => !n.is_read).length ?? 0;
  const pendingInvites = invitations?.filter(i => i.status === "pending").length ?? 0;

  // Fake weekly application trend (last 7 days)
  const weekTrend = [1, 0, 2, 1, 3, 2, pending];

  const stats = [
    { label: "Active Applications", value: pending, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", trend: "+2 this week" },
    { label: "Accepted", value: accepted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", trend: `${total} total` },
    { label: "Invitations", value: pendingInvites, icon: Mail, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", trend: "from schools" },
    { label: "Unread Alerts", value: unread, icon: Bell, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", trend: "notifications" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#221902] via-[#3a2d08] to-[#221902] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A021] rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8E6708] rounded-full -ml-24 -mb-24 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[#C5A021] text-sm font-bold uppercase tracking-widest mb-1">Teacher Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {t("teacher.welcome")}, {firstName} 👋
            </h1>
            <p className="text-stone-300 text-sm max-w-md">{t("teacher.subtitle")}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold">
                <BookOpen size={12} /> {dept}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold">
                <Target size={12} /> {total} Applications
              </span>
            </div>
          </div>
          {/* Profile completion ring */}
          <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex-shrink-0">
            <div className="relative">
              <RadialProgress pct={profilePct} size={72} stroke={6} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{profilePct}%</span>
            </div>
            <div>
              <p className="text-xs text-stone-300 mb-1">Profile</p>
              <p className="font-bold text-sm">Completion</p>
              {profilePct < 100 && (
                <Link href="/dashboard/profile" className="text-[#C5A021] text-xs font-bold hover:underline flex items-center gap-1 mt-1">
                  Complete now <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] text-stone-400 font-medium">{stat.trend}</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</h3>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Recommended jobs + chart */}
        <div className="xl:col-span-2 space-y-6">

          {/* Application trend chart */}
          <div className="bg-white dark:bg-[#221902]/60 p-6 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-stone-900 dark:text-white">Application Activity</h2>
                <p className="text-xs text-stone-400 mt-0.5">Last 7 days</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="w-3 h-3 rounded-sm bg-[#C5A021] inline-block" /> Applications
              </div>
            </div>
            <MiniBarChart data={weekTrend} />
            <div className="flex justify-between mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"].map(d => (
                <span key={d} className="text-[10px] text-stone-400 flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>

          {/* Recommended jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-stone-900 dark:text-white">{t("teacher.recommended")}</h2>
              <Link href="/dashboard/jobs" className="text-sm font-bold text-[#C5A021] hover:underline flex items-center gap-1">
                {t("teacher.view_all")} <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="space-y-3">
              {jobs?.items?.map((job) => (
                <div key={job.id} className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm hover:border-[#C5A021]/40 hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={18} className="text-[#C5A021]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors truncate">{job.title}</h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{job.school_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-stone-400">
                          {job.location && <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>}
                          {job.salary_range && <span className="text-emerald-600 font-semibold">{job.salary_range}</span>}
                          <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(job.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase rounded-full">{job.department}</span>
                      <Link href="/dashboard/jobs" className="text-[10px] font-bold text-[#C5A021] hover:underline">Apply →</Link>
                    </div>
                  </div>
                </div>
              ))}
              {!jobs?.items?.length && (
                <div className="bg-white dark:bg-[#221902]/60 p-8 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 text-center text-stone-400">
                  <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recommendations yet. Complete your profile to get matched.</p>
                  <Link href="/dashboard/profile" className="mt-3 inline-block text-xs font-bold text-[#C5A021] hover:underline">Complete Profile →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Profile card + invitations + activity */}
        <div className="space-y-5">

          {/* Profile summary card */}
          <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-[#221902] to-[#8E6708]" />
            <div className="px-5 pb-5 -mt-8">
              <div className="w-14 h-14 rounded-2xl bg-[#C5A021] flex items-center justify-center text-white font-bold text-xl border-4 border-white dark:border-[#221902] shadow-md mb-3">
                {firstName[0]?.toUpperCase()}
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white">{firstName} {p?.last_name || ""}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{dept} Teacher</p>
              <div className="flex gap-2">
                <Link href="/dashboard/profile" className="flex-1 py-2 text-center text-xs font-bold bg-[#C5A021] text-white rounded-xl hover:bg-[#8E6708] transition-colors">
                  Edit Profile
                </Link>
                <Link href="/dashboard/settings" className="px-3 py-2 text-xs font-bold border border-stone-200 dark:border-[#8E6708]/30 rounded-xl hover:bg-stone-50 dark:hover:bg-[#221902]/60 transition-colors text-stone-600 dark:text-stone-400">
                  ⚙
                </Link>
              </div>
            </div>
          </div>

          {/* Pending invitations */}
          {pendingInvites > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Mail size={16} className="text-[#C5A021]" /> Pending Invitations
                </h3>
                <span className="w-6 h-6 bg-[#C5A021] text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingInvites}</span>
              </div>
              {invitations?.filter(i => i.status === "pending").slice(0, 2).map(inv => (
                <div key={inv.id} className="bg-white dark:bg-[#221902]/60 rounded-xl p-3 mb-2 border border-amber-100 dark:border-amber-800/20">
                  <p className="text-sm font-bold text-stone-900 dark:text-white">School #{inv.school_id}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{inv.department} · {formatDate(inv.created_at)}</p>
                </div>
              ))}
              <Link href="/dashboard/invitations" className="block text-center text-xs font-bold text-[#C5A021] hover:underline mt-2">
                View All Invitations →
              </Link>
            </div>
          )}

          {/* Application status breakdown */}
          <div className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm">
            <h3 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-[#C5A021]" /> Application Status
            </h3>
            <div className="space-y-3">
              {[
                { label: "Pending", count: pending, color: "bg-amber-400", pct: total ? (pending / total) * 100 : 0 },
                { label: "Accepted", count: accepted, color: "bg-emerald-500", pct: total ? (accepted / total) * 100 : 0 },
                { label: "Rejected", count: (applications?.filter(a => a.status === "rejected").length ?? 0), color: "bg-red-400", pct: total ? ((applications?.filter(a => a.status === "rejected").length ?? 0) / total) * 100 : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 dark:text-stone-400 font-medium">{s.label}</span>
                    <span className="font-bold text-stone-900 dark:text-white">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", s.color)} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm">
            <h3 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={16} className="text-[#C5A021]" /> {t("teacher.recent_activity")}
            </h3>
            <div className="space-y-4">
              {notifications?.slice(0, 4).map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className={cn("h-2 w-2 rounded-full mt-2 flex-shrink-0", n.is_read ? "bg-stone-300" : "bg-[#C5A021]")} />
                  <div>
                    <p className="text-xs font-semibold text-stone-900 dark:text-white">{n.title}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{n.message}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              ))}
              {!notifications?.length && (
                <div className="flex items-center gap-2 text-stone-400">
                  <Clock size={14} />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/jobs", label: "Browse Jobs", icon: Briefcase, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600" },
              { href: "/dashboard/invitations", label: "Invitations", icon: Mail, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600" },
              { href: "/dashboard/applications", label: "My Applications", icon: Star, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" },
              { href: "/dashboard/profile", label: "My Profile", icon: TrendingUp, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600" },
            ].map(l => (
              <Link key={l.href} href={l.href} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 hover:shadow-md transition-all text-center", l.color)}>
                <l.icon size={20} />
                <span className="text-xs font-bold">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
