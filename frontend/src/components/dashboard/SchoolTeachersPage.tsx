"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, Search, Loader2, LayoutList, LayoutGrid,
  MapPin, Briefcase, Mail, X, ChevronLeft, ChevronRight,
  CheckCircle2, Send, User, ChevronDown,
  DollarSign, FileText, Phone, Eye,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Teacher, PaginatedResponse } from "@/types";

const DEPARTMENTS = [
  "Mathematics","English","Science","Biology","Chemistry","Physics",
  "History","Geography","Amharic","Art","Music","PE","ICT","Other",
];
const LOCATIONS = ["Addis Ababa","Dire Dawa","Bahir Dar","Mekelle","Hawassa","Adama","Gondar","Jimma"];

interface TeacherRow extends Teacher { user_status?: string; }
interface TeachersResponse extends PaginatedResponse<TeacherRow> { departments: string[]; }

// ── Teacher Detail Modal ──────────────────────────────────────────────────────
function TeacherDetailModal({
  teacher, onClose, onInvite, alreadyInvited,
}: { teacher: TeacherRow; onClose: () => void; onInvite: () => void; alreadyInvited: boolean }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    inactive: "bg-red-50 dark:bg-red-900/20 text-red-500",
    completed: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#C5A021]/10 border border-[#C5A021]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {teacher.profile_picture ? (
                <img src={`${apiBase}/${teacher.profile_picture}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-[#C5A021]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white text-lg">{teacher.first_name} {teacher.last_name}</h3>
              {teacher.department && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-[10px] font-bold rounded-full mt-0.5">
                  <GraduationCap size={9} /> {teacher.department}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {teacher.user_status && (
              <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider", STATUS_STYLES[teacher.user_status] ?? "bg-stone-100 text-stone-500")}>
                {teacher.user_status}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MapPin, label: "Preferred Location", value: teacher.preferred_location },
              { icon: DollarSign, label: "Salary Expectation", value: teacher.salary_expectation ? `ETB ${Number(teacher.salary_expectation).toLocaleString()}/mo` : undefined },
              { icon: Phone, label: "Phone", value: teacher.phone },
              { icon: MapPin, label: "Address", value: teacher.address },
            ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={10} /> {label}</p>
                <p className="text-sm font-medium text-stone-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {teacher.work_experience && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Work Experience</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{teacher.work_experience}</p>
            </div>
          )}

          {teacher.cv_path && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">CV / Resume</p>
              <a href={`${apiBase}/${teacher.cv_path}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-lg hover:bg-[#C5A021]/20 transition-colors">
                <FileText size={12} /> Download CV
              </a>
            </div>
          )}

          {teacher.additional_documents && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2">Additional Documents</p>
              <div className="flex flex-wrap gap-2">
                {teacher.additional_documents.split(",").filter(Boolean).map((doc, i) => (
                  <a key={i} href={`${apiBase}/${doc}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-lg hover:bg-stone-200 dark:hover:bg-white/10 transition-colors">
                    <FileText size={11} /> Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => { onInvite(); onClose(); }} disabled={alreadyInvited}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all",
              alreadyInvited
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 cursor-default"
                : "bg-[#C5A021] hover:bg-[#8E6708] text-white")}>
            {alreadyInvited ? <><CheckCircle2 size={15} /> Already Invited</> : <><Send size={15} /> Invite Teacher</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({
  teacher, onClose, onSent,
}: { teacher: TeacherRow; onClose: () => void; onSent: () => void }) {
  const [dept, setDept] = useState(teacher.department || "");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.post("/invitations", {
      teacher_id: teacher.id,
      department: dept,
      message: message || undefined,
    }),
    onSuccess: () => { onSent(); onClose(); },
  });

  const inputCls = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Send size={16} className="text-[#C5A021]" /> Invite Teacher
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Teacher info */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-[#C5A021]/10 border border-[#C5A021]/20 flex items-center justify-center flex-shrink-0">
              {teacher.profile_picture ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL}/${teacher.profile_picture}`} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User size={18} className="text-[#C5A021]" />
              )}
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-white text-sm">{teacher.first_name} {teacher.last_name}</p>
              {teacher.department && <p className="text-xs text-stone-500">{teacher.department}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Department *</label>
            <select value={dept} onChange={e => setDept(e.target.value)} className={inputCls}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Personal Message</label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Write a personal message to the teacher..."
              className={cn(inputCls, "resize-none")} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => mutation.mutate()} disabled={!dept || mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] hover:bg-[#8E6708] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Invitation
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────────────────────────
function TeacherCard({ teacher, onInvite, onView, alreadyInvited }: {
  teacher: TeacherRow; onInvite: () => void; onView: () => void; alreadyInvited: boolean;
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  return (
    <div onClick={onView} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-[#C5A021]/40 transition-all flex flex-col overflow-hidden cursor-pointer">
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#C5A021]/10 border border-[#C5A021]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {teacher.profile_picture ? (
              <img src={`${apiBase}/${teacher.profile_picture}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-[#C5A021]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900 dark:text-white truncate">{teacher.first_name} {teacher.last_name}</p>
            {teacher.department && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-[10px] font-bold rounded-full mt-1">
                <GraduationCap size={9} /> {teacher.department}
              </span>
            )}
          </div>
          <span className={cn("flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
            teacher.user_status === "active"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
              : "bg-stone-100 dark:bg-stone-800 text-stone-500")}>
            {teacher.user_status ?? "—"}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
          {teacher.preferred_location && (
            <p className="flex items-center gap-1.5"><MapPin size={11} className="text-stone-400 flex-shrink-0" /> {teacher.preferred_location}</p>
          )}
          {teacher.salary_expectation && (
            <p className="flex items-center gap-1.5"><DollarSign size={11} className="text-stone-400 flex-shrink-0" /> ETB {Number(teacher.salary_expectation).toLocaleString()}/mo</p>
          )}
          {teacher.work_experience && (
            <p className="flex items-center gap-1.5 line-clamp-1"><Briefcase size={11} className="text-stone-400 flex-shrink-0" /> {teacher.work_experience}</p>
          )}
          {teacher.cv_path && (
            <p className="flex items-center gap-1.5 text-[#C5A021]"><FileText size={11} /> CV available</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-0 flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={onView}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
          <Eye size={13} /> View
        </button>
        <button onClick={onInvite} disabled={alreadyInvited}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all",
            alreadyInvited
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 cursor-default"
              : "bg-[#C5A021] hover:bg-[#8E6708] text-white")}>
          {alreadyInvited ? <><CheckCircle2 size={13} /> Invited</> : <><Send size={13} /> Invite</>}
        </button>
      </div>
    </div>
  );
}

// ── Teacher Row (list view) ───────────────────────────────────────────────────
function TeacherRow({ teacher, onInvite, onView, alreadyInvited, idx }: {
  teacher: TeacherRow; onInvite: () => void; onView: () => void; alreadyInvited: boolean; idx?: number;
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  return (
    <div onClick={onView} className={cn(
      "rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-[#C5A021]/40 transition-all cursor-pointer",
      idx !== undefined && idx % 2 !== 0 ? "bg-stone-50/60 dark:bg-stone-800/20" : "bg-white dark:bg-stone-900"
    )}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 border border-[#C5A021]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {teacher.profile_picture ? (
            <img src={`${apiBase}/${teacher.profile_picture}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={18} className="text-[#C5A021]" />
          )}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-center">
          <div className="min-w-0">
            <p className="font-bold text-stone-900 dark:text-white truncate text-sm">{teacher.first_name} {teacher.last_name}</p>
            <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider mt-0.5",
              teacher.user_status === "active"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                : "bg-stone-100 dark:bg-stone-800 text-stone-500")}>
              {teacher.user_status ?? "—"}
            </span>
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {teacher.department ? (
              <span className="flex items-center gap-1"><GraduationCap size={11} /> {teacher.department}</span>
            ) : <span className="text-stone-300 dark:text-stone-600">—</span>}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {teacher.preferred_location ? (
              <span className="flex items-center gap-1"><MapPin size={11} /> {teacher.preferred_location}</span>
            ) : <span className="text-stone-300 dark:text-stone-600">—</span>}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {teacher.salary_expectation ? (
              <span className="flex items-center gap-1"><DollarSign size={11} /> ETB {Number(teacher.salary_expectation).toLocaleString()}</span>
            ) : <span className="text-stone-300 dark:text-stone-600">—</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onView}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
            <Eye size={13} /> View
          </button>
          <button onClick={onInvite} disabled={alreadyInvited}
            className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all",
              alreadyInvited
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 cursor-default"
                : "bg-[#C5A021] hover:bg-[#8E6708] text-white")}>
            {alreadyInvited ? <><CheckCircle2 size={13} /> Invited</> : <><Send size={13} /> Invite</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SchoolTeachersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [location, setLocation] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [inviteTarget, setInviteTarget] = useState<TeacherRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<TeacherRow | null>(null);
  const SIZE = 12;

  const { data, isLoading } = useQuery<TeachersResponse>({
    queryKey: ["school-teachers", search, dept, location, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: String(SIZE) });
      if (search) params.set("search", search);
      if (dept) params.set("department", dept);
      if (location) params.set("location", location);
      if (statusFilter) params.set("status", statusFilter);
      return (await api.get(`/teachers?${params}`)).data;
    },
  });

  // Fetch existing invitations to mark already-invited teachers
  const { data: myInvitations } = useQuery<{ id: number; teacher_id: number; status: string }[]>({
    queryKey: ["invitations"],
    queryFn: async () => (await api.get("/invitations")).data,
  });
  const invitedTeacherIds = new Set((myInvitations ?? []).map(i => i.teacher_id));

  const clearFilters = () => {
    setDept(""); setLocation(""); setSearch(""); setStatusFilter(""); setPage(1);
  };

  const activeFilters = [dept, location, search, statusFilter].filter(Boolean).length;
  const departments = data?.departments ?? DEPARTMENTS;

  return (
    <div className="space-y-6">
      {inviteTarget && (
        <InviteModal
          teacher={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSent={() => qc.invalidateQueries({ queryKey: ["invitations"] })}
        />
      )}
      {detailTarget && (
        <TeacherDetailModal
          teacher={detailTarget}
          onClose={() => setDetailTarget(null)}
          onInvite={() => setInviteTarget(detailTarget)}
          alreadyInvited={invitedTeacherIds.has(detailTarget.id)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-[#C5A021]" size={24} /> Available Teachers
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Browse and invite teachers to join your school.
          </p>
        </div>
        {/* View toggle */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Teachers", value: data?.total ?? 0, color: "text-stone-700 dark:text-stone-300", bg: "bg-stone-50 dark:bg-stone-800/50" },
          { label: "Invited", value: invitedTeacherIds.size, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Departments", value: (data?.departments ?? []).length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
        ].map(s => (
          <div key={s.label} className={cn("p-4 rounded-2xl border border-stone-200 dark:border-stone-700", s.bg)}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or department..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40" />
          </div>

          {/* Department select */}
          <div className="relative">
            <select value={dept} onChange={e => { setDept(e.target.value); setPage(1); }}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[160px]">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          {/* Location select */}
          <div className="relative">
            <select value={location} onChange={e => { setLocation(e.target.value); setPage(1); }}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[160px]">
              <option value="">All Locations</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          {/* Status select */}
          <div className="relative">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[140px]">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-stone-500 hover:text-red-500 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-red-300 transition-colors">
              <X size={14} /> Clear ({activeFilters})
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {dept && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full border border-[#C5A021]/20">
                <GraduationCap size={10} /> {dept}
                <button onClick={() => { setDept(""); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800/30">
                <MapPin size={10} /> {location}
                <button onClick={() => { setLocation(""); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-full border border-stone-200 dark:border-stone-700">
                <Search size={10} /> &ldquo;{search}&rdquo;
                <button onClick={() => { setSearch(""); setPage(1); }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
      ) : !data?.items.length ? (
        <div className="py-20 text-center text-stone-400">
          <GraduationCap size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">No teachers found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.items.map(t => (
            <TeacherCard key={t.id} teacher={t}
              onView={() => setDetailTarget(t)}
              onInvite={() => setInviteTarget(t)}
              alreadyInvited={invitedTeacherIds.has(t.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* List header */}
          <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <span>Teacher</span>
            <span>Department</span>
            <span>Location</span>
            <span>Salary</span>
          </div>
          {data.items.map((t, idx) => (
            <TeacherRow key={t.id} teacher={t}
              onView={() => setDetailTarget(t)}
              onInvite={() => setInviteTarget(t)}
              alreadyInvited={invitedTeacherIds.has(t.id)}
              idx={idx} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Showing {(page - 1) * SIZE + 1}–{Math.min(page * SIZE, data.total)} of {data.total} teachers
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(data.pages, 7) }).map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-8 h-8 rounded-lg text-sm font-bold transition-all",
                    page === p ? "bg-[#C5A021] text-white shadow-sm" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500")}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
