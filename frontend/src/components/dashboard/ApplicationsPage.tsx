"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, Loader2, CheckCircle2, XCircle, Clock, User,
  LayoutList, LayoutGrid, FileText, MapPin, GraduationCap,
  TrendingUp, Info, X, ExternalLink, Search, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { JobApplication } from "@/types";

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  pending:  { bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800/30" },
  accepted: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/30" },
  rejected: { bg: "bg-red-50 dark:bg-red-900/20",       text: "text-red-600 dark:text-red-400",       border: "border-red-200 dark:border-red-800/30" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", s.bg, s.text, s.border)}>
      {status === "pending" ? <Clock size={9} /> : status === "accepted" ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
      {status}
    </span>
  );
}

function DetailModal({ app, isSchool, onClose, onUpdate, updating }: {
  app: JobApplication; isSchool: boolean; onClose: () => void;
  onUpdate: (id: number, status: string) => void; updating: boolean;
}) {
  const teacherName = app.teacher ? `${app.teacher.first_name} ${app.teacher.last_name}` : `Teacher #${app.teacher_id}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Briefcase size={16} className="text-[#C5A021]" /> Application Detail
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20">
              <User size={22} className="text-[#C5A021]" />
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-white">{isSchool ? teacherName : (app.job?.title || `Job #${app.job_id}`)}</p>
              <StatusBadge status={app.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Job Title</p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">{app.job?.title || `Job #${app.job_id}`}</p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Applied</p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">{formatDate(app.applied_at)}</p>
            </div>
            {!isSchool && app.job?.school_name && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">School</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-white">{app.job.school_name}</p>
              </div>
            )}
            {!isSchool && app.job?.school_address && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Address</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-white">{app.job.school_address}</p>
              </div>
            )}
            {isSchool && app.teacher && (
              <>
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Department</p>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">{app.teacher.department || "—"}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Location</p>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">{app.teacher.preferred_location || "—"}</p>
                </div>
              </>
            )}
          </div>
          {app.cover_letter && (
            <div className="p-4 bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Cover Letter</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic">&ldquo;{app.cover_letter}&rdquo;</p>
            </div>
          )}
          {isSchool && app.teacher?.cv_path && (
            <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1","")}/${app.teacher.cv_path}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 hover:border-[#C5A021]/40 transition-colors">
              <FileText size={15} className="text-[#C5A021]" /> View CV / Resume <ExternalLink size={12} className="ml-auto text-stone-400" />
            </a>
          )}
          {isSchool && app.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => onUpdate(app.id, "accepted")} disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept
              </button>
              <button onClick={() => onUpdate(app.id, "rejected")} disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-600 hover:text-red-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isSchool = user?.role === "school";

  const [filter, setFilter] = useState<"all"|"pending"|"accepted"|"rejected">("all");
  const [viewMode, setViewMode] = useState<"list"|"card">("list");
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const { data, isLoading } = useQuery<JobApplication[]>({
    queryKey: ["applications"],
    queryFn: async () => (await api.get(isSchool ? "/applications/school" : "/applications/my")).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/applications/${id}`, { status }),
    onSuccess: () => { setUpdatingId(null); setSelected(null); qc.invalidateQueries({ queryKey: ["applications"] }); },
  });

  const handleUpdate = (id: number, status: string) => { setUpdatingId(id); updateMutation.mutate({ id, status }); };

  const counts = {
    all: data?.length ?? 0,
    pending: data?.filter(a => a.status === "pending").length ?? 0,
    accepted: data?.filter(a => a.status === "accepted").length ?? 0,
    rejected: data?.filter(a => a.status === "rejected").length ?? 0,
  };

  const filtered = (filter === "all" ? data : data?.filter(a => a.status === filter))
    ?.filter(a => {
      const q = search.toLowerCase();
      if (!q && !deptFilter) return true;
      const nameMatch = isSchool
        ? (a.teacher ? `${a.teacher.first_name} ${a.teacher.last_name}` : "").toLowerCase().includes(q)
        : (a.job?.title || "").toLowerCase().includes(q);
      const deptMatch = !deptFilter || (a.teacher?.department ?? "") === deptFilter;
      return (!q || nameMatch) && deptMatch;
    });

  const allDepts = [...new Set((data ?? []).map(a => a.teacher?.department).filter(Boolean))] as string[];
  const activeFilters = [search, deptFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal app={selected} isSchool={isSchool} onClose={() => setSelected(null)}
          onUpdate={handleUpdate} updating={updatingId === selected.id && updateMutation.isPending} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-[#C5A021]" size={24} /> Applications
            {counts.pending > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#C5A021] text-white text-xs font-bold rounded-full">{counts.pending}</span>
            )}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            {isSchool ? "Review and manage incoming applications." : "Track your job applications."}
          </p>
        </div>
        <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
          <button onClick={() => setViewMode("list")} title="List view"
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white dark:bg-stone-700 shadow-sm text-[#C5A021]" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300")}>
            <LayoutList size={16} />
          </button>
          <button onClick={() => setViewMode("card")} title="Card view"
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "card" ? "bg-white dark:bg-stone-700 shadow-sm text-[#C5A021]" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300")}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all","pending","accepted","rejected"] as const).map(s => {
          const colors: Record<string,string> = { all:"text-stone-700 dark:text-stone-200", pending:"text-amber-600", accepted:"text-emerald-600", rejected:"text-red-500" };
          const bgs: Record<string,string> = { all:"bg-stone-50 dark:bg-stone-800/50", pending:"bg-amber-50 dark:bg-amber-900/20", accepted:"bg-emerald-50 dark:bg-emerald-900/20", rejected:"bg-red-50 dark:bg-red-900/20" };
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("p-4 rounded-2xl border text-left transition-all", filter===s ? "border-[#C5A021] ring-1 ring-[#C5A021]/30" : "border-stone-200 dark:border-stone-700 hover:border-[#C5A021]/30", bgs[s])}>
              <p className={cn("text-2xl font-bold", colors[s])}>{counts[s]}</p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 capitalize mt-0.5">{s}</p>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isSchool ? "Search by applicant name..." : "Search by job title..."}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40" />
          </div>
          {isSchool && allDepts.length > 0 && (
            <div className="relative">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[160px]">
                <option value="">All Departments</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          )}
          {activeFilters > 0 && (
            <button onClick={() => { setSearch(""); setDeptFilter(""); }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-stone-500 hover:text-red-500 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-red-300 transition-colors">
              <X size={14} /> Clear ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
          ) : !filtered?.length ? (
            <div className="py-20 text-center text-stone-400">
              <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium text-lg">No {filter === "all" ? "" : filter} applications</p>
              <p className="text-sm mt-1">{isSchool ? "Applications from teachers will appear here." : "Apply to jobs to see them here."}</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="rounded-xl border border-stone-200 dark:border-[#8E6708]/25 overflow-hidden">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-stone-50 dark:bg-[#221902]/40 border-b border-stone-200 dark:border-[#8E6708]/20 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                {isSchool ? (
                  <>
                    <span className="flex-1">Applicant</span>
                    <span className="w-32">Job</span>
                    <span className="hidden md:block w-28">Department</span>
                    <span className="hidden lg:block w-20">Location</span>
                    <span className="w-20">Applied</span>
                    <span className="w-24">Status</span>
                    <span className="w-28 text-right">Actions</span>
                  </>
                ) : (
                  <>
                    <span className="flex-1">Job</span>
                    <span className="w-36">School</span>
                    <span className="w-24">Applied</span>
                    <span className="w-24">Status</span>
                  </>
                )}
              </div>
              <div className="divide-y divide-stone-100 dark:divide-[#8E6708]/10 bg-white dark:bg-[#221902]/60">
                {filtered.map((app, idx) => {
                  const teacherName = app.teacher ? `${app.teacher.first_name} ${app.teacher.last_name}` : `Teacher #${app.teacher_id}`;
                  return (
                    <div key={app.id} onClick={() => setSelected(app)}
                      className={cn("flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer group",
                        idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30",
                        "hover:bg-amber-50/40 dark:hover:bg-[#221902]/60")}>
                      {isSchool ? (
                        <>
                          <div className="flex-1 min-w-0 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 border border-[#C5A021]/20">
                              <User size={14} className="text-[#C5A021]" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-sm text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors truncate block">{teacherName}</span>
                              {app.teacher?.preferred_location && <span className="text-xs text-stone-400 flex items-center gap-1 truncate"><MapPin size={9} />{app.teacher.preferred_location}</span>}
                            </div>
                          </div>
                          <span className="w-32 flex-shrink-0 text-xs text-stone-600 dark:text-stone-400 truncate">{app.job?.title || `Job #${app.job_id}`}</span>
                          <span className="hidden md:block w-28 flex-shrink-0 text-xs text-stone-500 truncate">{app.teacher?.department || "—"}</span>
                          <span className="hidden lg:block w-20 flex-shrink-0 text-xs text-stone-500">{app.teacher?.preferred_location || "—"}</span>
                          <span className="w-20 flex-shrink-0 text-xs text-stone-400">{formatDate(app.applied_at)}</span>
                          <div className="w-24 flex-shrink-0"><StatusBadge status={app.status} /></div>
                          <div className="w-28 flex-shrink-0 flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {app.status === "pending" && (
                              <>
                                <button onClick={() => handleUpdate(app.id, "accepted")} disabled={updatingId === app.id && updateMutation.isPending}
                                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60">Accept</button>
                                <button onClick={() => handleUpdate(app.id, "rejected")} disabled={updatingId === app.id && updateMutation.isPending}
                                  className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">Reject</button>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors truncate block">{app.job?.title || `Job #${app.job_id}`}</span>
                            <span className="text-xs text-stone-400 truncate block">{app.job?.school_name || "—"}</span>
                          </div>
                          <span className="w-36 flex-shrink-0 text-xs text-stone-500 truncate">{app.job?.school_name || "—"}</span>
                          <span className="w-24 flex-shrink-0 text-xs text-stone-400">{formatDate(app.applied_at)}</span>
                          <div className="w-24 flex-shrink-0"><StatusBadge status={app.status} /></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(app => {
                const teacherName = app.teacher ? `${app.teacher.first_name} ${app.teacher.last_name}` : `Teacher #${app.teacher_id}`;
                return (
                  <div key={app.id} onClick={() => setSelected(app)}
                    className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm hover:border-[#C5A021]/40 hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden">
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20 flex-shrink-0">
                          {isSchool ? <User size={20} className="text-[#C5A021]" /> : <Briefcase size={20} className="text-[#C5A021]" />}
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors">
                          {isSchool ? teacherName : (app.job?.title || `Job #${app.job_id}`)}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {isSchool ? (app.job?.title || `Job #${app.job_id}`) : (app.job?.school_name || "—")}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {isSchool && app.teacher?.department && (
                            <span className="px-2.5 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full flex items-center gap-1">
                              <GraduationCap size={10} /> {app.teacher.department}
                            </span>
                          )}
                          {isSchool && app.teacher?.preferred_location && (
                            <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded-full flex items-center gap-1">
                              <MapPin size={10} /> {app.teacher.preferred_location}
                            </span>
                          )}
                          {isSchool && app.teacher?.salary_expectation != null && (
                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full flex items-center gap-1">
                              <TrendingUp size={10} /> ETB {app.teacher.salary_expectation}
                            </span>
                          )}
                        </div>
                        {app.cover_letter && (
                          <p className="text-xs text-stone-400 italic mt-2 line-clamp-2">&ldquo;{app.cover_letter}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-[#8E6708]/10">
                        <span className="text-xs text-stone-400">{formatDate(app.applied_at)}</span>
                        {isSchool && app.status === "pending" && (
                          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleUpdate(app.id, "accepted")} disabled={updatingId === app.id && updateMutation.isPending}
                              className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60">Accept</button>
                            <button onClick={() => handleUpdate(app.id, "rejected")} disabled={updatingId === app.id && updateMutation.isPending}
                              className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
          <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40">
              <p className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
                <Briefcase size={14} className="text-[#C5A021]" /> Application Management
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                { status: "pending", label: "Pending", desc: "Awaiting your review", color: "text-amber-600", dot: "bg-amber-400" },
                { status: "accepted", label: "Accepted", desc: "Applicant approved", color: "text-emerald-600", dot: "bg-emerald-400" },
                { status: "rejected", label: "Rejected", desc: "Application declined", color: "text-red-500", dot: "bg-red-400" },
              ].map(item => (
                <div key={item.status} className="flex items-start gap-2.5">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", item.dot)} />
                  <div>
                    <p className={cn("text-xs font-bold", item.color)}>{item.label}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
              <Info size={14} className="text-[#C5A021]" /> Tips
            </p>
            {isSchool ? (
              <ul className="space-y-2">
                {["Review cover letters carefully before deciding.","Check the teacher's CV for qualifications.","Respond promptly to keep candidates engaged.","Use filters to focus on pending applications."].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <span className="w-4 h-4 rounded-full bg-[#C5A021]/20 text-[#C5A021] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {["Keep your profile updated to stand out.","Write a tailored cover letter for each job.","Check back regularly for status updates.","Accept invitations to expand opportunities."].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <span className="w-4 h-4 rounded-full bg-[#C5A021]/20 text-[#C5A021] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
