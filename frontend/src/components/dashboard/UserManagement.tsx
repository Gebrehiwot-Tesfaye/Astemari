"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, Loader2, X, Plus, Trash2,
  Pencil, ChevronLeft, ChevronRight, Shield, CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { StaffProfile, StaffRole } from "@/types";
import ActionsMenu from "./ActionsMenu";

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "cleaner", label: "Cleaner" },
  { value: "secretary", label: "Secretary" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "it_support", label: "IT Support" },
  { value: "receptionist", label: "Receptionist" },
  { value: "other", label: "Other" },
];

const ROLE_COLORS: Record<string, string> = {
  manager:      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  secretary:    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  accountant:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  it_support:   "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  receptionist: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  cleaner:      "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
  other:        "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
};

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

const PRIVILEGES = [
  { key: "can_manage_jobs", label: "Manage Jobs" },
  { key: "can_manage_schools", label: "Manage Schools" },
  { key: "can_manage_teachers", label: "Manage Teachers" },
  { key: "can_view_reports", label: "View Reports" },
  { key: "can_manage_users", label: "Manage Users" },
] as const;

// ── Staff Form Modal ──────────────────────────────────────────────────────────
type StaffFormData = {
  email: string; password: string;
  first_name: string; last_name: string; phone: string;
  staff_role: StaffRole; department: string; notes: string;
  can_manage_jobs: boolean; can_manage_schools: boolean;
  can_manage_teachers: boolean; can_view_reports: boolean; can_manage_users: boolean;
};

function StaffFormModal({ staff, onClose, onSave, saving }: {
  staff?: StaffProfile | null;
  onClose: () => void;
  onSave: (data: StaffFormData) => void;
  saving: boolean;
}) {
  const isEdit = !!staff;
  const [form, setForm] = useState<StaffFormData>({
    email: staff?.user_email ?? "",
    password: "",
    first_name: staff?.first_name ?? "",
    last_name: staff?.last_name ?? "",
    phone: staff?.phone ?? "",
    staff_role: (staff?.staff_role as StaffRole) ?? "other",
    department: staff?.department ?? "",
    notes: staff?.notes ?? "",
    can_manage_jobs: staff?.can_manage_jobs ?? false,
    can_manage_schools: staff?.can_manage_schools ?? false,
    can_manage_teachers: staff?.can_manage_teachers ?? false,
    can_view_reports: staff?.can_view_reports ?? false,
    can_manage_users: staff?.can_manage_users ?? false,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-[#8E6708]/20">
          <h2 className="font-bold text-[#221902] dark:text-white flex items-center gap-2">
            {isEdit ? <Pencil size={16} className="text-[#C5A021]" /> : <Plus size={16} className="text-[#C5A021]" />}
            {isEdit ? "Edit Staff" : "Add Staff Member"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg"><X size={16} className="text-stone-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {!isEdit && (
            <>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Account</p>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: "email", label: "Email", type: "email" }, { key: "password", label: "Password", type: "password" }].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-stone-500 mb-1 block">{label}</label>
                    <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Personal Info</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: "first_name", label: "First Name" }, { key: "last_name", label: "Last Name" }, { key: "phone", label: "Phone" }, { key: "department", label: "Department" }].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-stone-500 mb-1 block">{label}</label>
                <input value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#C5A021]/50" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Role</label>
            <select value={form.staff_role} onChange={e => setForm(f => ({ ...f, staff_role: e.target.value as StaffRole }))}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none">
              {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none resize-none" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={12} /> Privileges</p>
            <div className="grid grid-cols-2 gap-2">
              {PRIVILEGES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 p-2.5 bg-stone-50 dark:bg-[#221902]/80 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-[#221902] transition-colors">
                  <input type="checkbox" checked={(form as Record<string, boolean>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-[#C5A021] rounded" />
                  <span className="text-xs text-stone-700 dark:text-stone-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isEdit ? "Save Changes" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onClose, onConfirm, deleting }: {
  name: string; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/30 w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-center font-bold text-stone-900 dark:text-white mb-1">Remove Staff</h3>
        <p className="text-center text-sm text-stone-500 mb-6">Remove <span className="font-semibold text-stone-700 dark:text-stone-200">{name}</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffProfile | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffProfile | null>(null);
  const PER_PAGE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-staff", search, roleFilter, statusFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), size: String(PER_PAGE) });
      if (search) p.set("search", search);
      if (roleFilter) p.set("staff_role", roleFilter);
      if (statusFilter) p.set("status", statusFilter);
      return (await api.get(`/admin/staff?${p}`)).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => api.post("/admin/staff", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setShowCreate(false); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.patch(`/admin/staff/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setEditStaff(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); setDeleteStaff(null); },
  });

  const toggleStatus = (staff: StaffProfile) => {
    const newStatus = staff.user_status === "active" ? "inactive" : "active";
    editMutation.mutate({ id: staff.id, data: { status: newStatus } });
  };

  const staffList: StaffProfile[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#221902] dark:text-white flex items-center gap-2">
            <Users size={22} className="text-[#C5A021]" /> Staff Management
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">Manage internal company staff and their privileges.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A021] text-[#221902] font-bold rounded-xl hover:bg-[#8E6708] hover:text-white transition-colors text-sm">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20">
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl flex-1 min-w-40">
          <Search size={14} className="text-stone-400 flex-shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search staff..."
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={13} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-stone-50 dark:bg-[#221902]/80 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C5A021]" /></div>
      ) : (
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50 dark:bg-[#221902]/80">
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Staff Member</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Privileges</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider hidden xl:table-cell">Added</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-[#8E6708]/10">
                {staffList.map((s, idx) => (
                  <tr key={s.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30", "hover:bg-amber-50/40 dark:hover:bg-[#221902]/40 transition-colors")}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 text-[#C5A021] font-bold text-sm">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#221902] dark:text-white text-sm">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-stone-400">{s.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", ROLE_COLORS[s.staff_role] ?? ROLE_COLORS.other)}>
                        {s.staff_role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {PRIVILEGES.filter(p => (s as Record<string, unknown>)[p.key]).map(p => (
                          <span key={p.key} className="text-[10px] px-1.5 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] rounded-md">{p.label}</span>
                        ))}
                        {!PRIVILEGES.some(p => (s as Record<string, unknown>)[p.key]) && (
                          <span className="text-[10px] text-stone-400">No privileges</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", STATUS_STYLES[s.user_status ?? "inactive"])}>
                        {s.user_status ?? "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-400 hidden xl:table-cell">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <ActionsMenu
                          currentStatus={s.user_status ?? "inactive"}
                          onEdit={() => setEditStaff(s)}
                          onDelete={() => setDeleteStaff(s)}
                          onStatusChange={() => toggleStatus(s)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!staffList.length && (
            <div className="py-16 text-center text-stone-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No staff members found</p>
              <p className="text-sm mt-1">Add your first staff member using the button above.</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 dark:border-[#8E6708]/20">
              <p className="text-xs text-stone-500">Page {page} of {totalPages} · {total} staff</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <StaffFormModal onClose={() => setShowCreate(false)}
          onSave={(d) => createMutation.mutate(d as Record<string, unknown>)}
          saving={createMutation.isPending} />
      )}
      {editStaff && (
        <StaffFormModal staff={editStaff} onClose={() => setEditStaff(null)}
          onSave={(d) => editMutation.mutate({ id: editStaff.id, data: d as Record<string, unknown> })}
          saving={editMutation.isPending} />
      )}
      {deleteStaff && (
        <DeleteConfirm name={`${deleteStaff.first_name} ${deleteStaff.last_name}`}
          onClose={() => setDeleteStaff(null)}
          onConfirm={() => deleteMutation.mutate(deleteStaff.id)}
          deleting={deleteMutation.isPending} />
      )}
    </div>
  );
}
