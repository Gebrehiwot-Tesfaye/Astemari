"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Search, CheckCircle2, XCircle, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Globe, Phone, MapPin, Users,
  Clock, BookOpen, Filter, LayoutList, LayoutGrid, X, Loader2, Plus,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ActionsMenu from "./ActionsMenu";

type SchoolRow = {
  id: number; school_name: string; representative_name: string;
  phone?: string; email?: string; address?: string; website?: string;
  description?: string; school_type?: string; school_level?: string;
  founded_year?: number; number_of_students?: number; number_of_teachers?: number;
  license_number?: string; license_file_path?: string; accreditation_info?: string;
  created_at: string;
  user_email?: string; user_status?: string;
  job_count?: number; invitation_count?: number;
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  pending:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  inactive:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  completed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

// ── Detail / View Modal ───────────────────────────────────────────────────────
function DetailModal({ school, onClose }: { school: SchoolRow; onClose: () => void }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A021]/10 flex items-center justify-center">
              <Building2 size={18} className="text-[#C5A021]" />
            </div>
            <div>
              <h2 className="font-bold text-[#221902] dark:text-white">{school.school_name}</h2>
              <p className="text-xs text-stone-500">{school.representative_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full capitalize", STATUS_STYLES[school.user_status ?? "pending"])}>
              {school.user_status ?? "pending"}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg">
              <X size={16} className="text-stone-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Globe, label: "Email", value: school.user_email },
              { icon: Phone, label: "Phone", value: school.phone },
              { icon: MapPin, label: "Address", value: school.address },
              { icon: Globe, label: "Website", value: school.website },
              { icon: BookOpen, label: "Level", value: school.school_level },
              { icon: Filter, label: "Type", value: school.school_type },
              { icon: Clock, label: "Founded", value: school.founded_year?.toString() },
              { icon: Users, label: "Teachers", value: school.number_of_teachers?.toString() },
              { icon: Users, label: "Students", value: school.number_of_students?.toString() },
              { icon: Building2, label: "Jobs Posted", value: school.job_count?.toString() },
              { icon: Building2, label: "Invitations", value: school.invitation_count?.toString() },
              { icon: Filter, label: "License No.", value: school.license_number },
            ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={10} /> {label}</p>
                <p className="text-sm font-medium text-stone-900 dark:text-white capitalize">{value}</p>
              </div>
            ))}
          </div>
          {school.accreditation_info && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Accreditation</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{school.accreditation_info}</p>
            </div>
          )}
          {school.description && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{school.description}</p>
            </div>
          )}
          {school.license_file_path && (
            <div className="p-3 bg-stone-50 dark:bg-[#221902]/80 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">License Document</p>
              <a href={`${apiBase}/${school.license_file_path}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-lg hover:bg-[#C5A021]/20 transition-colors">
                <Globe size={12} /> View License
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ school, onClose, onSave, saving }: {
  school: SchoolRow; onClose: () => void;
  onSave: (data: Partial<SchoolRow>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({
    school_name: school.school_name,
    representative_name: school.representative_name,
    phone: school.phone ?? "",
    email: school.email ?? "",
    address: school.address ?? "",
    website: school.website ?? "",
    description: school.description ?? "",
    school_type: school.school_type ?? "",
    school_level: school.school_level ?? "",
    founded_year: school.founded_year?.toString() ?? "",
    number_of_students: school.number_of_students?.toString() ?? "",
    number_of_teachers: school.number_of_teachers?.toString() ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2"><Pencil size={16} className="text-[#C5A021]" /> Edit School</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            { key: "school_name", label: "School Name" },
            { key: "representative_name", label: "Representative" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "address", label: "Address" },
            { key: "website", label: "Website" },
            { key: "founded_year", label: "Founded Year" },
            { key: "number_of_students", label: "No. Students" },
            { key: "number_of_teachers", label: "No. Teachers" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-stone-500 mb-1 block">{label}</label>
              <input value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Level</label>
              <select value={form.school_level} onChange={e => setForm(f => ({ ...f, school_level: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
                <option value="">Select</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="preparatory">Preparatory</option>
                <option value="university">University</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Type</label>
              <select value={form.school_type} onChange={e => setForm(f => ({ ...f, school_type: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
                <option value="">Select</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="international">International</option>
                <option value="religious">Religious</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => onSave({ ...form, founded_year: form.founded_year ? Number(form.founded_year) : undefined, number_of_students: form.number_of_students ? Number(form.number_of_students) : undefined, number_of_teachers: form.number_of_teachers ? Number(form.number_of_teachers) : undefined })}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create School Modal ───────────────────────────────────────────────────────
function CreateSchoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    email: "", password: "",
    school_name: "", representative_name: "",
    phone: "", address: "", website: "", description: "",
    school_type: "", school_level: "", founded_year: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.school_name || !form.representative_name) {
      setError("Email, password, school name and representative are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const params = new URLSearchParams({ email: form.email, password: form.password });
      await api.post(`/admin/schools?${params}`, {
        school_name: form.school_name,
        representative_name: form.representative_name,
        phone: form.phone || null,
        address: form.address || null,
        website: form.website || null,
        description: form.description || null,
        school_type: form.school_type || null,
        school_level: form.school_level || null,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Failed to create school.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2"><Plus size={16} className="text-[#C5A021]" /> Create School</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
          <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Account Credentials</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: "email", label: "Email", type: "email" }, { key: "password", label: "Password", type: "password" }].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-stone-500 mb-1 block">{label}</label>
                <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider pt-1">School Info</p>
          {[
            { key: "school_name", label: "School Name" },
            { key: "representative_name", label: "Representative Name" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            { key: "website", label: "Website" },
            { key: "founded_year", label: "Founded Year" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-stone-500 mb-1 block">{label}</label>
              <input value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Level</label>
              <select value={form.school_level} onChange={e => setForm(f => ({ ...f, school_level: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
                <option value="">Select Level</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="preparatory">Preparatory</option>
                <option value="university">University</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Type</label>
              <select value={form.school_type} onChange={e => setForm(f => ({ ...f, school_type: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
                <option value="">Select Type</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="international">International</option>
                <option value="religious">Religious</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create School
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirm({ school, onClose, onConfirm, deleting }: {
  school: SchoolRow; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-center font-bold text-stone-900 dark:text-white mb-1">Delete School</h3>
        <p className="text-center text-sm text-stone-500 mb-6">Are you sure you want to delete <span className="font-semibold text-stone-700 dark:text-stone-200">{school.school_name}</span>? This cannot be undone.</p>
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
export default function SchoolsManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [dateRange, setDateRange] = useState("");
  const [view, setView] = useState<"list" | "card">("list");
  const [page, setPage] = useState(1);
  const [viewSchool, setViewSchool] = useState<SchoolRow | null>(null);
  const [editSchool, setEditSchool] = useState<SchoolRow | null>(null);
  const [deleteSchool, setDeleteSchool] = useState<SchoolRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const PER_PAGE = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-schools", page, search, statusFilter, levelFilter, typeFilter, sortBy, order],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), size: String(PER_PAGE), sort_by: sortBy, order });
      if (search) p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      if (levelFilter) p.set("school_level", levelFilter);
      if (typeFilter) p.set("school_type", typeFilter);
      return (await api.get(`/admin/schools?${p}`)).data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/admin/schools/${id}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-schools"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SchoolRow> }) => api.patch(`/admin/schools/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-schools"] }); setEditSchool(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/schools/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-schools"] }); setDeleteSchool(null); },
  });

  const schools: SchoolRow[] = (() => {
    const all: SchoolRow[] = data?.items ?? [];
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
    return cutoff ? all.filter(s => new Date(s.created_at) >= cutoff) : all;
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

  const toggleSort = (col: string) => {
    if (sortBy === col) setOrder(o => o === "desc" ? "asc" : "desc");
    else { setSortBy(col); setOrder("desc"); }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#221902] dark:text-white flex items-center gap-2">
            <Building2 size={22} className="text-[#C5A021]" /> Manage Schools
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">View and manage all schools in the system.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors text-sm">
          <Plus size={16} /> Create School
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
            placeholder="Search schools..."
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={13} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Levels</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="preparatory">Preparatory</option>
          <option value="university">University</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="international">International</option>
          <option value="religious">Religious</option>
        </select>
        <select value={`${sortBy}:${order}`} onChange={e => { const [s, o] = e.target.value.split(":"); setSortBy(s); setOrder(o); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="school_name:asc">Name A-Z</option>
          <option value="school_name:desc">Name Z-A</option>
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
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-[#C5A021]" onClick={() => toggleSort("school_name")}>
                    School Name {sortBy === "school_name" ? (order === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Representative</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Level / Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Jobs</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:text-[#C5A021]" onClick={() => toggleSort("created_at")}>
                    Registered {sortBy === "created_at" ? (order === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-[#8E6708]/10">
                {schools.map((school, idx) => (
                  <tr key={school.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30", "hover:bg-amber-50/40 dark:hover:bg-[#221902]/40 transition-colors")}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                          <Building2 size={14} className="text-[#C5A021]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#221902] dark:text-white text-sm">{school.school_name}</p>
                          {school.address && <p className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5"><MapPin size={9} /> {school.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-stone-600 dark:text-stone-300 hidden md:table-cell">{school.representative_name}</td>
                    <td className="px-4 py-3.5 text-xs text-stone-500 hidden lg:table-cell">{school.user_email}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {school.school_level && <span className="text-xs px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full capitalize w-fit">{school.school_level}</span>}
                        {school.school_type && <span className="text-xs px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full capitalize w-fit">{school.school_type}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", STATUS_STYLES[school.user_status ?? "pending"])}>
                        {school.user_status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-white/5 text-xs font-bold text-stone-600 dark:text-stone-300">
                        {school.job_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-400 hidden xl:table-cell">{formatDate(school.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <ActionsMenu
                          currentStatus={school.user_status}
                          onView={() => setViewSchool(school)}
                          onEdit={() => setEditSchool(school)}
                          onDelete={() => setDeleteSchool(school)}
                          onStatusChange={(s) => s && statusMutation.mutate({ id: school.id, status: s })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!schools.length && (
            <div className="py-16 text-center text-stone-400">
              <Building2 size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No schools found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schools.map(school => (
            <div key={school.id}
              className="bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 hover:border-[#C5A021]/40 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-[#C5A021]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#221902] dark:text-white text-sm truncate">{school.school_name}</p>
                    <p className="text-[10px] text-stone-500">{school.representative_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[school.user_status ?? "pending"])}>
                    {school.user_status ?? "pending"}
                  </span>
                  <ActionsMenu
                    currentStatus={school.user_status}
                    onView={() => setViewSchool(school)}
                    onEdit={() => setEditSchool(school)}
                    onDelete={() => setDeleteSchool(school)}
                    onStatusChange={(s) => s && statusMutation.mutate({ id: school.id, status: s })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-stone-500 mb-3">
                {school.address && <span className="flex items-center gap-1"><MapPin size={10} /> {school.address}</span>}
                {school.school_level && <span className="px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full capitalize">{school.school_level}</span>}
                {school.school_type && <span className="px-2 py-0.5 bg-stone-100 dark:bg-white/5 rounded-full capitalize">{school.school_type}</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-50 dark:border-[#8E6708]/10 text-xs text-stone-400">
                <span className="flex items-center gap-2">
                  <span>{school.job_count ?? 0} jobs</span>
                  <span>{school.invitation_count ?? 0} invites</span>
                </span>
                <span className="text-[10px]">{formatDate(school.created_at)}</span>
              </div>
            </div>
          ))}
          {!schools.length && (
            <div className="col-span-3 py-16 text-center text-stone-400">
              <Building2 size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No schools found</p>
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
      {viewSchool && <DetailModal school={viewSchool} onClose={() => setViewSchool(null)} />}
      {editSchool && (
        <EditModal school={editSchool} onClose={() => setEditSchool(null)}
          onSave={(d) => editMutation.mutate({ id: editSchool.id, data: d })}
          saving={editMutation.isPending} />
      )}
      {deleteSchool && (
        <DeleteConfirm school={deleteSchool} onClose={() => setDeleteSchool(null)}
          onConfirm={() => deleteMutation.mutate(deleteSchool.id)}
          deleting={deleteMutation.isPending} />
      )}
      {showCreate && (
        <CreateSchoolModal onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["admin-schools"] })} />
      )}
    </div>
  );
}
