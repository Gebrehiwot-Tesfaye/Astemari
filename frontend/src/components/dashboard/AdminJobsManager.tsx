"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, Search, Filter, Plus, Eye, Pencil, Trash2,
  CheckCircle2, XCircle, Loader2, MapPin, Building2, LayoutList, LayoutGrid,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Job } from "@/types";

const DEPARTMENTS = ["Mathematics", "Science", "English", "History", "Physical Education", "Arts", "ICT", "Social Studies", "Languages", "Other"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  active:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  closed:  "bg-stone-100 dark:bg-stone-800 text-stone-500",
  removed: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

type School = { id: number; school_name: string };
type JobWithApps = Job & { application_count?: number };

function PostJobModal({ schools, onClose, onSuccess }: { schools: School[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", department: "", description: "", requirements: "", salary_range: "", location: "", school_id: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/jobs?school_id=${form.school_id}`, {
      title: form.title, department: form.department, description: form.description,
      requirements: form.requirements, salary_range: form.salary_range, location: form.location,
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: () => setError("Failed to post job. Please try again."),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/80 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm placeholder:text-stone-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5A021]/10 flex items-center justify-center">
              <Plus size={18} className="text-[#C5A021]" />
            </div>
            <h2 className="font-bold text-[#221902] dark:text-white">Post Job As Admin</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-stone-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <XCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">School *</label>
            <select value={form.school_id} onChange={e => set("school_id", e.target.value)} className={inputCls}>
              <option value="">Select a school</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Job Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Mathematics Teacher" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Department *</label>
              <select value={form.department} onChange={e => set("department", e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Location</label>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Addis Ababa" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Salary Range</label>
              <input value={form.salary_range} onChange={e => set("salary_range", e.target.value)} placeholder="e.g. 15,000 – 20,000 ETB" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Description</label>
              <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Role responsibilities..." className={inputCls + " resize-none"} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">Requirements</label>
              <textarea rows={2} value={form.requirements} onChange={e => set("requirements", e.target.value)} placeholder="Required qualifications..." className={inputCls + " resize-none"} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => mutation.mutate()}
              disabled={!form.title || !form.department || !form.school_id || mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors disabled:opacity-50 text-sm">
              {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Post Job
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 text-stone-600 dark:text-stone-400 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminJobsManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [view, setView] = useState<"list" | "card">("list");
  const [page, setPage] = useState(1);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editJob, setEditJob] = useState<JobWithApps | null>(null);
  const PER_PAGE = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs", page, search, statusFilter, deptFilter, schoolFilter],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), size: String(PER_PAGE) });
      if (search) p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      if (deptFilter) p.set("department", deptFilter);
      if (schoolFilter) p.set("school_id", schoolFilter);
      return (await api.get(`/admin/jobs?${p}`)).data;
    },
  });

  const { data: schoolsData } = useQuery({
    queryKey: ["admin-schools-list"],
    queryFn: async () => (await api.get("/admin/schools/all")).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Job> }) => api.patch(`/admin/jobs/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-jobs"] }); setEditJob(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/jobs/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const jobs: JobWithApps[] = (() => {
    const all: JobWithApps[] = data?.items ?? [];
    if (!dateRange) return all;
    const now = new Date();
    const cutoffs: Record<string, Date> = {
      today: (() => { const d = new Date(now); d.setHours(0,0,0,0); return d; })(),
      "7d": new Date(now.getTime() - 7 * 86400000),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      "6m": new Date(now.getTime() - 180 * 86400000),
      "1y": new Date(now.getTime() - 365 * 86400000),
      "2y": new Date(now.getTime() - 730 * 86400000),
    };
    const cutoff = cutoffs[dateRange];
    return cutoff ? all.filter(j => new Date(j.created_at) >= cutoff) : all;
  })();
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);
  const schools: School[] = schoolsData?.items ?? [];

  const counts = {
    all: total,
    pending: jobs.filter(j => j.status === "pending").length,
    active: jobs.filter(j => j.status === "active").length,
    closed: jobs.filter(j => j.status === "closed").length,
    removed: jobs.filter(j => j.status === "removed").length,
  };

  const TAB_STYLES = [
    { key: "", label: "All", count: counts.all, icon: LayoutList, color: "border-blue-500 text-blue-600" },
    { key: "pending", label: "Pending", count: counts.pending, icon: CheckCircle2, color: "border-amber-500 text-amber-600" },
    { key: "active", label: "Active", count: counts.active, icon: CheckCircle2, color: "border-emerald-500 text-emerald-600" },
    { key: "closed", label: "Closed", count: counts.closed, icon: XCircle, color: "border-stone-400 text-stone-500" },
    { key: "removed", label: "Deleted", count: counts.removed, icon: Trash2, color: "border-red-500 text-red-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#221902] dark:text-white flex items-center gap-2">
            <Briefcase size={22} className="text-[#C5A021]" /> Manage Jobs
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">View, post, and manage all job postings in the system.</p>
        </div>
        <button onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors shadow-md shadow-[#C5A021]/20 text-sm flex-shrink-0">
          <Plus size={16} /> Post Job As Admin
        </button>
      </div>

      {/* Stat tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TAB_STYLES.map(tab => (
          <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn("p-4 rounded-2xl border-2 bg-white dark:bg-[#221902]/60 flex items-center justify-between transition-all hover:shadow-md",
              statusFilter === tab.key ? tab.color : "border-stone-100 dark:border-[#8E6708]/20")}>
            <div className="text-left">
              <p className="text-2xl font-bold text-[#221902] dark:text-white">{tab.count}</p>
              <p className="text-xs text-stone-500 mt-0.5">{tab.label} Jobs</p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
              statusFilter === tab.key ? "bg-current/10" : "bg-stone-100 dark:bg-white/5")}>
              <tab.icon size={20} className={statusFilter === tab.key ? "" : "text-stone-400"} />
            </div>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20">
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl flex-1 min-w-48">
          <Search size={14} className="text-stone-400 flex-shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search job or school..."
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={13} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl">
          <Building2 size={13} className="text-stone-400 flex-shrink-0" />
          <select value={schoolFilter} onChange={e => { setSchoolFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl">
          <Filter size={13} className="text-stone-400 flex-shrink-0" />
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 1 Year</option>
          <option value="2y">Last 2 Years</option>
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setView("list")}
            className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-[#221902] text-[#C5A021]" : "hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400")}>
            <LayoutList size={16} />
          </button>
          <button onClick={() => setView("card")}
            className={cn("p-2 rounded-lg transition-colors", view === "card" ? "bg-[#221902] text-[#C5A021]" : "hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400")}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C5A021]" /></div>
      ) : view === "list" ? (
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50 dark:bg-[#221902]/80">
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Job Title</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">School</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Posted</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-[#8E6708]/10">
                {jobs.map((job, idx) => (
                  <tr key={job.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30", "hover:bg-amber-50/40 dark:hover:bg-[#221902]/40 transition-colors")}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase size={14} className="text-[#C5A021]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#221902] dark:text-white">{job.title}</p>
                          {job.location && <p className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5"><MapPin size={9} /> {job.location}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-[#8E6708] dark:text-[#C5A021] font-medium text-xs">
                        <Building2 size={12} /> {job.school_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-stone-100 dark:bg-white/5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300">{job.department}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", STATUS_STYLES[job.status] ?? STATUS_STYLES.closed)}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-400 hidden lg:table-cell">{formatDate(job.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === "pending" && (
                          <button onClick={() => approveMutation.mutate(job.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors text-xs font-bold" title="Approve">
                            <CheckCircle2 size={13} /> Approve
                          </button>
                        )}
                        <button onClick={() => setEditJob(job)}
                          className="p-1.5 hover:bg-[#C5A021]/10 text-stone-400 hover:text-[#C5A021] rounded-lg transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(job.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-400 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!jobs.length && (
            <div className="py-16 text-center text-stone-400">
              <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 hover:border-[#C5A021]/40 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#C5A021]/10 flex items-center justify-center">
                    <Briefcase size={16} className="text-[#C5A021]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#221902] dark:text-white text-sm group-hover:text-[#C5A021] transition-colors">{job.title}</p>
                    <p className="text-[10px] text-[#8E6708] dark:text-[#C5A021]/70 flex items-center gap-1"><Building2 size={9} /> {job.school_name}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize flex-shrink-0", STATUS_STYLES[job.status])}>
                  {job.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                <span className="px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-lg text-stone-600 dark:text-stone-300 font-medium">{job.department}</span>
                {job.location && <span className="flex items-center gap-0.5 text-stone-400"><MapPin size={10} /> {job.location}</span>}
                {job.salary_range && <span className="text-emerald-600 font-semibold">{job.salary_range}</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-50 dark:border-[#8E6708]/10">
                <span className="text-[10px] text-stone-400">{formatDate(job.created_at)}</span>
                <div className="flex gap-1">
                  {job.status === "pending" && (
                    <button onClick={() => approveMutation.mutate(job.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-[10px] font-bold">
                      <CheckCircle2 size={11} /> Approve
                    </button>
                  )}
                  <button onClick={() => setEditJob(job)} className="p-1.5 hover:bg-[#C5A021]/10 text-stone-400 hover:text-[#C5A021] rounded-lg transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => deleteMutation.mutate(job.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          {!jobs.length && (
            <div className="col-span-3 py-16 text-center text-stone-400">
              <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500">Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total}</p>
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

      {/* Post Job Modal */}
      {showPostModal && (
        <PostJobModal
          schools={schools}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-jobs"] })}
        />
      )}

      {/* Edit Job Modal */}
      {editJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditJob(null)}>
          <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
              <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2"><Eye size={16} className="text-[#C5A021]" /> Edit Job</h2>
              <button onClick={() => setEditJob(null)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Status</label>
                <select value={editJob.status}
                  onChange={e => setEditJob({ ...editJob, status: e.target.value as Job["status"] })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/80 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 text-sm">
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Salary Range</label>
                <input value={editJob.salary_range ?? ""} onChange={e => setEditJob({ ...editJob, salary_range: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/80 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => updateMutation.mutate({ id: editJob.id, data: { status: editJob.status, salary_range: editJob.salary_range } })}
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#221902] text-[#C5A021] font-bold rounded-xl hover:bg-[#221902]/80 transition-colors text-sm disabled:opacity-50">
                  {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
                </button>
                <button onClick={() => setEditJob(null)} className="px-4 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 text-stone-500 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
