"use client";
import { useState } from "react";
import {
  Users, Briefcase, UserCheck, Plus, ArrowUpRight,
  Clock, XCircle, Send, ChevronRight, GraduationCap,
  MapPin, DollarSign, Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Job, JobApplication } from "@/types";

type ActiveCard = "active-jobs" | "total-jobs" | "applications" | "accepted" | "pending" | "invitations" | null;

const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  accepted: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  rejected: "bg-red-50 dark:bg-red-900/20 text-red-500",
  active:   "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  closed:   "bg-stone-100 dark:bg-stone-800 text-stone-500",
  draft:    "bg-stone-100 dark:bg-stone-800 text-stone-500",
};

export default function SchoolDashboard() {
  const [activeCard, setActiveCard] = useState<ActiveCard>(null);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["school-jobs"],
    queryFn: async () => (await api.get("/jobs/my")).data,
  });

  const { data: applications = [] } = useQuery<JobApplication[]>({
    queryKey: ["school-applications"],
    queryFn: async () => (await api.get("/applications/school")).data,
  });

  const { data: invitations = [] } = useQuery<{ id: number; teacher_name?: string; department?: string; status: string; created_at: string }[]>({
    queryKey: ["invitations"],
    queryFn: async () => (await api.get("/invitations")).data,
  });

  // Derived counts
  const activeJobs   = jobs.filter(j => j.status === "active");
  const allJobs      = jobs;
  const allApps      = applications;
  const acceptedApps = applications.filter(a => a.status === "accepted");
  const pendingApps  = applications.filter(a => a.status === "pending");

  const toggle = (card: ActiveCard) =>
    setActiveCard(prev => (prev === card ? null : card));

  const stats: { id: ActiveCard; label: string; value: number; icon: React.ElementType; color: string; bg: string; border: string }[] = [
    { id: "active-jobs",   label: "Active Jobs",         value: activeJobs.length,   icon: Briefcase,   color: "text-[#C5A021]",    bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-amber-300 dark:border-amber-700" },
    { id: "total-jobs",    label: "Total Jobs",          value: allJobs.length,      icon: Eye,         color: "text-purple-600",   bg: "bg-purple-50 dark:bg-purple-900/20",   border: "border-purple-300 dark:border-purple-700" },
    { id: "applications",  label: "Total Applications",  value: allApps.length,      icon: Users,       color: "text-blue-600",     bg: "bg-blue-50 dark:bg-blue-900/20",       border: "border-blue-300 dark:border-blue-700" },
    { id: "accepted",      label: "Accepted",            value: acceptedApps.length, icon: UserCheck,   color: "text-emerald-600",  bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-300 dark:border-emerald-700" },
    { id: "pending",       label: "Pending",             value: pendingApps.length,  icon: Clock,       color: "text-amber-600",    bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-amber-300 dark:border-amber-700" },
    { id: "invitations",   label: "Invitations Sent",    value: invitations.length,  icon: Send,        color: "text-indigo-600",   bg: "bg-indigo-50 dark:bg-indigo-900/20",   border: "border-indigo-300 dark:border-indigo-700" },
  ];

  // What to show in the detail panel
  const detailContent = (): React.ReactNode => {
    if (!activeCard) return null;

    if (activeCard === "active-jobs" || activeCard === "total-jobs") {
      const list = activeCard === "active-jobs" ? activeJobs : allJobs;
      return (
        <JobList
          jobs={list}
          title={activeCard === "active-jobs" ? "Active Jobs" : "All Jobs"}
          emptyMsg="No jobs found"
        />
      );
    }

    if (activeCard === "applications" || activeCard === "accepted" || activeCard === "pending") {
      const list =
        activeCard === "accepted" ? acceptedApps :
        activeCard === "pending"  ? pendingApps  : allApps;
      const title =
        activeCard === "accepted" ? "Accepted Applications" :
        activeCard === "pending"  ? "Pending Applications"  : "All Applications";
      return <AppList apps={list} title={title} />;
    }

    if (activeCard === "invitations") {
      return <InvList invitations={invitations} />;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">School Dashboard</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">Manage your recruitment and school profile.</p>
        </div>
        <Link href="/dashboard/post-job"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 text-sm">
          <Plus size={17} /> Post New Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <button key={s.id} onClick={() => toggle(s.id)}
            className={cn(
              "text-left p-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md",
              activeCard === s.id
                ? cn("bg-white dark:bg-stone-900", s.border)
                : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            )}>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
              <s.icon size={17} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-stone-900 dark:text-white">{s.value}</p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">{s.label}</p>
            {activeCard === s.id && (
              <div className={cn("mt-2 text-[10px] font-bold uppercase tracking-wider", s.color)}>
                Showing ↓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Detail panel — slides in when a card is active */}
      {activeCard && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          {detailContent()}
        </div>
      )}

      {/* Bottom section — only show when no card is active */}
      {!activeCard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-stone-900 dark:text-white">Recent Applications</h2>
              <Link href="/dashboard/applications" className="text-xs font-bold text-[#C5A021] hover:underline flex items-center gap-1">
                View All <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    {["Applicant", "Job", "Applied", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {applications.slice(0, 6).map((app, idx) => (
                    <tr key={app.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-stone-800/20", "hover:bg-amber-50/40 dark:hover:bg-stone-800/30 transition-colors")}>
                      <td className="px-4 py-3 text-sm font-semibold text-stone-900 dark:text-white">
                        {app.teacher ? `${app.teacher.first_name} ${app.teacher.last_name}` : `Teacher #${app.teacher_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400 truncate max-w-[140px]">{app.job?.title || `Job #${app.job_id}`}</td>
                      <td className="px-4 py-3 text-xs text-stone-400">{formatDate(app.applied_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full", STATUS_COLOR[app.status] ?? "bg-stone-100 text-stone-500")}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!applications.length && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-stone-400">No applications yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Jobs sidebar */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">Active Jobs</h3>
              <Link href="/dashboard/jobs" className="text-xs font-bold text-[#C5A021] hover:underline flex items-center gap-1">
                All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {activeJobs.slice(0, 5).map(job => (
                <div key={job.id} className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:border-[#C5A021]/30 transition-all">
                  <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{job.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{job.department}{job.location ? ` · ${job.location}` : ""}</p>
                </div>
              ))}
              {!activeJobs.length && <p className="text-sm text-stone-400 text-center py-4">No active jobs</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-list components ───────────────────────────────────────────────────────

function JobList({ jobs, title, emptyMsg }: { jobs: Job[]; title: string; emptyMsg: string }) {
  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
        <h3 className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-2">
          <Briefcase size={15} className="text-[#C5A021]" /> {title}
          <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-bold rounded-full">{jobs.length}</span>
        </h3>
        <Link href="/dashboard/jobs" className="text-xs font-bold text-[#C5A021] hover:underline flex items-center gap-1">
          Manage <ChevronRight size={12} />
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-400">{emptyMsg}</p>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {jobs.map((job, idx) => (
            <div key={job.id} className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors",
              idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-stone-800/20",
              "hover:bg-amber-50/40 dark:hover:bg-stone-800/30")}>
              <div className="w-9 h-9 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                <Briefcase size={15} className="text-[#C5A021]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{job.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                  {job.department && <span className="flex items-center gap-1"><GraduationCap size={10} /> {job.department}</span>}
                  {job.location && <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>}
                  {job.salary_range && <span className="flex items-center gap-1"><DollarSign size={10} /> {job.salary_range}</span>}
                </div>
              </div>
              <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex-shrink-0",
                STATUS_COLOR[job.status] ?? "bg-stone-100 text-stone-500")}>
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppList({ apps, title }: { apps: JobApplication[]; title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
        <h3 className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-2">
          <Users size={15} className="text-[#C5A021]" /> {title}
          <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-bold rounded-full">{apps.length}</span>
        </h3>
        <Link href="/dashboard/applications" className="text-xs font-bold text-[#C5A021] hover:underline flex items-center gap-1">
          View All <ChevronRight size={12} />
        </Link>
      </div>
      {apps.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-400">No applications found</p>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-50 dark:border-stone-800/50">
            <span>Applicant</span><span>Job</span><span>Applied</span><span>Status</span>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {apps.map((app, idx) => (
              <div key={app.id} className={cn("grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-center px-5 py-3.5 transition-colors",
                idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-stone-800/20",
                "hover:bg-amber-50/40 dark:hover:bg-stone-800/30")}>
                <p className="text-sm font-semibold text-stone-900 dark:text-white">
                  {app.teacher ? `${app.teacher.first_name} ${app.teacher.last_name}` : `Teacher #${app.teacher_id}`}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{app.job?.title || `Job #${app.job_id}`}</p>
                <p className="text-xs text-stone-400">{formatDate(app.applied_at)}</p>
                <span className={cn("w-fit px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                  STATUS_COLOR[app.status] ?? "bg-stone-100 text-stone-500")}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InvList({ invitations }: { invitations: { id: number; teacher_name?: string; department?: string; status: string; created_at: string }[] }) {
  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
        <h3 className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-2">
          <Send size={15} className="text-[#C5A021]" /> Invitations Sent
          <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-bold rounded-full">{invitations.length}</span>
        </h3>
        <Link href="/dashboard/invitations" className="text-xs font-bold text-[#C5A021] hover:underline flex items-center gap-1">
          View All <ChevronRight size={12} />
        </Link>
      </div>
      {invitations.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-400">No invitations sent yet</p>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {invitations.map((inv, idx) => (
            <div key={inv.id} className={cn("flex items-center gap-4 px-5 py-3.5 transition-colors",
              idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-stone-800/20",
              "hover:bg-amber-50/40 dark:hover:bg-stone-800/30")}>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                <Send size={14} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-white">{inv.teacher_name || "Teacher"}</p>
                {inv.department && <p className="text-xs text-stone-400 mt-0.5">{inv.department}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-xs text-stone-400 hidden sm:block">{formatDate(inv.created_at)}</p>
                <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                  STATUS_COLOR[inv.status] ?? "bg-stone-100 text-stone-500")}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
