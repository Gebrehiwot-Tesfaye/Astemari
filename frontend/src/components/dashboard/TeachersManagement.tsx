"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, Search, CheckCircle2, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, MapPin, LayoutList, LayoutGrid,
  X, Loader2, Plus, Mail, Phone, Briefcase, Users,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ActionsMenu from "./ActionsMenu";

type TeacherRow = {
  id: number; user_id: number; user_email?: string; user_status?: string;
  first_name: string; last_name: string; phone?: string;
  department?: string; profile_completed: boolean;
  status: string; created_at: string;
  application_count?: number; invitation_count?: number;
  address?: string; work_experience?: string; preferred_location?: string;
  salary_expectation?: number; cv_path?: string;
  profile_picture?: string; additional_documents?: string;
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  pending:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  inactive:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  completed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

const DEPARTMENTS = [
  "Mathematics", "English", "Science", "Biology", "Chemistry", "Physics",
  "History", "Geography", "Amharic", "Art", "Music", "PE", "ICT", "Other",
];

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ teacher, onClose }: { teacher: TeacherRow; onClose: () => void }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 border border-[#C5A021]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {(teacher as TeacherRow & { profile_picture?: string }).profile_picture ? (
                <img src={`${apiBase}/${(teacher as TeacherRow & { profile_picture?: string }).profile_picture}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <GraduationCap size={20} className="text-[#C5A021]" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-[#221902] dark:text-white">{teacher.first_name} {teacher.last_name}</h2>
              <p className="text-xs text-stone-500">{teacher.user_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full capitalize", STATUS_STYLES[teacher.user_status ?? "pending"])}>
              {teacher.user_status ?? "pending"}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg">
              <X size={16} className="text-stone-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mail, label: "Email", value: teacher.user_email },
              { icon: Phone, label: "Phone", value: teacher.phone },
              { icon: GraduationCap, label: "Department", value: teacher.department },
              { icon: MapPin, label: "Address", value: teacher.address },
              { icon: MapPin, label: "Preferred Location", value: teacher.preferred_location },
              { icon: Briefcase, label: "Applications", value: teacher.application_count?.toString() },
              { icon: Users, label: "Invitations", value: teacher.invitation_count?.toString() },
              { icon: CheckCircle2, label: "Profile", value: teacher.profile_completed ? "Complete" : "Incomplete" },
              { icon: Briefcase, label: "Salary Expectation", value: teacher.salary_expectation ? `ETB ${Number(teacher.salary_expectation).toLocaleString()}/mo` : undefined },
            ].filter(f => f.value !== undefined && f.value !== null).map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={10} /> {label}</p>
                <p className="text-sm font-medium text-stone-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
          {teacher.work_experience && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Work Experience</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{teacher.work_experience}</p>
            </div>
          )}
          {(teacher as TeacherRow & { cv_path?: string }).cv_path && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">CV / Resume</p>
              <a href={`${apiBase}/${(teacher as TeacherRow & { cv_path?: string }).cv_path}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-lg hover:bg-[#C5A021]/20 transition-colors">
                <Briefcase size={12} /> Download CV
              </a>
            </div>
          )}
          {(teacher as TeacherRow & { additional_documents?: string }).additional_documents && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">Additional Documents</p>
              <div className="flex flex-wrap gap-2">
                {((teacher as TeacherRow & { additional_documents?: string }).additional_documents ?? "").split(",").filter(Boolean).map((doc, i) => (
                  <a key={i} href={`${apiBase}/${doc}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-lg hover:bg-stone-200 dark:hover:bg-white/10 transition-colors">
                    <Briefcase size={11} /> Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ teacher, onClose, onSave, saving }: {
  teacher: TeacherRow; onClose: () => void;
  onSave: (data: Partial<TeacherRow>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    phone: teacher.phone ?? "",
    department: teacher.department ?? "",
    address: teacher.address ?? "",
    preferred_location: teacher.preferred_location ?? "",
    work_experience: teacher.work_experience ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2"><Pencil size={16} className="text-[#C5A021]" /> Edit Teacher</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            { key: "first_name", label: "First Name" },
            { key: "last_name", label: "Last Name" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            { key: "preferred_location", label: "Preferred Location" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-stone-500 mb-1 block">{label}</label>
              <input value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
            </div>
          ))}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Department</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Work Experience</label>
            <textarea value={form.work_experience} onChange={e => setForm(f => ({ ...f, work_experience: e.target.value }))} rows={3}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Teacher Modal ──────────────────────────────────────────────────────
function CreateTeacherModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "", department: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError("Email, password, first name and last name are required.");
      return;
    }
    setSaving(true); setError("");
    try {
      const params = new URLSearchParams({ email: form.email, password: form.password });
      await api.post(`/admin/teachers?${params}`, {
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone || null, department: form.department || null,
      });
      onCreated(); onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Failed to create teacher.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2"><Plus size={16} className="text-[#C5A021]" /> Create Teacher</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
          {[
            { key: "email", label: "Email", type: "email" },
            { key: "password", label: "Password", type: "password" },
            { key: "first_name", label: "First Name", type: "text" },
            { key: "last_name", label: "Last Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-stone-500 mb-1 block">{label}</label>
              <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
            </div>
          ))}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Department</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ teacher, onClose, onConfirm, deleting }: {
  teacher: TeacherRow; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-center font-bold text-stone-900 dark:text-white mb-1">Delete Teacher</h3>
        <p className="text-center text-sm text-stone-500 mb-6">Delete <span className="font-semibold text-stone-700 dark:text-stone-200">{teacher.first_name} {teacher.last_name}</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TeachersManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [dateRange, setDateRange] = useState("");
  const [view, setView] = useState<"list" | "card">("list");
  const [page, setPage] = useState(1);
  const [viewTeacher, setViewTeacher] = useState<TeacherRow | null>(null);
  const [editTeacher, setEditTeacher] = useState<TeacherRow | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<TeacherRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const PER_PAGE = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-teachers", page, search, statusFilter, deptFilter, sortBy, order],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), size: String(PER_PAGE), sort_by: sortBy, order });
      if (search) p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      if (deptFilter) p.set("department", deptFilter);
      return (await api.get(`/admin/teachers?${p}`)).data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/admin/teachers/${id}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-teachers"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeacherRow> }) => api.patch(`/admin/teachers/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-teachers"] }); setEditTeacher(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/teachers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-teachers"] }); setDeleteTeacher(null); },
  });

  const teachers: TeacherRow[] = (() => {
    const all: TeacherRow[] = data?.items ?? [];
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
    return cutoff ? all.filter(t => new Date(t.created_at) >= cutoff) : all;
  })();
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);
  const stats = data?.stats ?? { all: 0, pending: 0, active: 0, inactive: 0, completed: 0 };

  const TABS = [
    { key: "", label: "All", value: stats.all, color: "border-blue-500 text-blue-600" },
    { key: "pending", label: "Pending", value: stats.pending, color: "border-amber-500 text-amber-600" },
    { key: "active", label: "Active", value: stats.active, color: "border-emerald-500 text-emerald-600" },
    { key: "inactive", label: "Inactive", value: stats.inactive, color: "border-red-500 text-red-600" },
    { key: "completed", label: "Completed", value: stats.completed, color: "border-blue-400 text-blue-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#221902] dark:text-white flex items-center gap-2">
            <GraduationCap size={22} className="text-[#C5A021]" /> Manage Teachers
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">View and manage all teachers in the system.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors text-sm">
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Stat tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn("p-3 rounded-2xl border-2 bg-white dark:bg-[#221902]/60 flex flex-col transition-all hover:shadow-md",
              statusFilter === tab.key ? tab.color : "border-stone-100 dark:border-[#8E6708]/20")}>
            <p className={cn("text-xl font-bold", statusFilter === tab.key ? "" : "text-[#221902] dark:text-white")}>{tab.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20">
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl flex-1 min-w-40">
          <Search size={14} className="text-stone-400 flex-shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search teachers..."
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={13} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={`${sortBy}:${order}`} onChange={e => { const [s, o] = e.target.value.split(":"); setSortBy(s); setOrder(o); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="first_name:asc">Name A-Z</option>
          <option value="first_name:desc">Name Z-A</option>
        </select>
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Invitations</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Applications</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden xl:table-cell">Registered</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-[#8E6708]/10">
                {teachers.map((t, idx) => (
                  <tr key={t.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30", "hover:bg-amber-50/40 dark:hover:bg-[#221902]/40 transition-colors")}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 text-[#C5A021] font-bold text-sm">
                          {t.first_name[0]}{t.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#221902] dark:text-white text-sm">{t.first_name} {t.last_name}</p>
                          {t.address && <p className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5"><MapPin size={9} /> {t.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-500 hidden lg:table-cell">{t.user_email}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {t.department && <span className="text-xs px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full">{t.department}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", STATUS_STYLES[t.user_status ?? "pending"])}>
                        {t.user_status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 text-xs font-bold text-stone-600 dark:text-stone-300">
                        {t.invitation_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 text-xs font-bold text-stone-600 dark:text-stone-300">
                        {t.application_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-400 hidden xl:table-cell">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <ActionsMenu
                          currentStatus={t.user_status}
                          onView={() => setViewTeacher(t)}
                          onEdit={() => setEditTeacher(t)}
                          onDelete={() => setDeleteTeacher(t)}
                          onStatusChange={(s) => statusMutation.mutate({ id: t.id, status: s })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!teachers.length && (
            <div className="py-16 text-center text-stone-400">
              <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No teachers found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 hover:border-[#C5A021]/40 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 text-[#C5A021] font-bold">
                    {t.first_name[0]}{t.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#221902] dark:text-white text-sm truncate">{t.first_name} {t.last_name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{t.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[t.user_status ?? "pending"])}>
                    {t.user_status ?? "pending"}
                  </span>
                  <ActionsMenu
                    currentStatus={t.user_status}
                    onView={() => setViewTeacher(t)}
                    onEdit={() => setEditTeacher(t)}
                    onDelete={() => setDeleteTeacher(t)}
                    onStatusChange={(s) => statusMutation.mutate({ id: t.id, status: s })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-stone-500 mb-3">
                {t.department && <span className="px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full">{t.department}</span>}
                {t.profile_completed && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full">Profile Complete</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-50 dark:border-[#8E6708]/10 text-xs text-stone-400">
                <span className="flex items-center gap-2">
                  <span>{t.application_count ?? 0} apps</span>
                  <span>{t.invitation_count ?? 0} invites</span>
                </span>
                <span>{formatDate(t.created_at)}</span>
              </div>
            </div>
          ))}
          {!teachers.length && (
            <div className="col-span-3 py-16 text-center text-stone-400">
              <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No teachers found</p>
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

      {/* Modals */}
      {viewTeacher && <ViewModal teacher={viewTeacher} onClose={() => setViewTeacher(null)} />}
      {editTeacher && (
        <EditModal teacher={editTeacher} onClose={() => setEditTeacher(null)}
          onSave={(d) => editMutation.mutate({ id: editTeacher.id, data: d })}
          saving={editMutation.isPending} />
      )}
      {deleteTeacher && (
        <DeleteConfirm teacher={deleteTeacher} onClose={() => setDeleteTeacher(null)}
          onConfirm={() => deleteMutation.mutate(deleteTeacher.id)}
          deleting={deleteMutation.isPending} />
      )}
      {showCreate && (
        <CreateTeacherModal onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["admin-teachers"] })} />
      )}
    </div>
  );
}
