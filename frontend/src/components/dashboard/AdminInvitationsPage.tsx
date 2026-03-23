"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail, Loader2, Clock, CheckCircle2, XCircle,
  Search, ChevronLeft, ChevronRight, Download, Trash2, Eye, X,
  User, Building2, Calendar, TrendingUp, ChevronDown, LayoutList, LayoutGrid,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Invitation, PaginatedResponse } from "@/types";

type StatusFilter = "all" | "pending" | "accepted" | "rejected";

interface AdminInvResponse extends PaginatedResponse<Invitation> {
  counts: Record<string, number>;
}

const STATUS_STYLE: Record<string, string> = {
  pending:  "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  accepted: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  rejected: "bg-red-50 dark:bg-red-900/20 text-red-600",
};

function DetailModal({
  inv, onClose, onStatusChange, onDelete, updating, deleting,
}: {
  inv: Invitation;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  updating: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Mail size={16} className="text-[#C5A021]" /> Invitation Detail
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* School + Teacher */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                <Building2 size={10} /> School
              </p>
              <p className="font-bold text-stone-900 dark:text-white text-sm">
                {inv.school_name || `School #${inv.school_id}`}
              </p>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                <User size={10} /> Teacher
              </p>
              <p className="font-bold text-stone-900 dark:text-white text-sm">
                {inv.teacher_name || `Teacher #${inv.teacher_id}`}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Department
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">{inv.department}</p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                <Calendar size={10} /> Date
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white">{formatDate(inv.created_at)}</p>
            </div>
          </div>

          {/* Current status */}
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Current Status</p>
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider", STATUS_STYLE[inv.status])}>
              {inv.status === "pending" ? <Clock size={10} /> : inv.status === "accepted" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
              {inv.status}
            </span>
          </div>

          {/* Message */}
          {inv.message && (
            <div className="p-4 bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Message</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed">&ldquo;{inv.message}&rdquo;</p>
            </div>
          )}

          {/* Status change */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Update Status</p>
            <div className="flex gap-2">
              {(["pending", "accepted", "rejected"] as const).map(s => (
                <button key={s} onClick={() => onStatusChange(inv.id, s)}
                  disabled={updating || inv.status === s}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    s === "accepted" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100" :
                    s === "rejected" ? "bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100" :
                    "bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100"
                  )}>
                  {updating ? <Loader2 size={12} className="animate-spin mx-auto" /> : s}
                </button>
              ))}
            </div>
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={14} /> Delete Invitation
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onDelete(inv.id)} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Confirm Delete
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-sm font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminInvitationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list"|"card">("list");
  const SIZE = 20;

  const { data, isLoading } = useQuery<AdminInvResponse>({
    queryKey: ["admin-invitations", statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: String(SIZE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      return (await api.get(`/admin/invitations?${params}`)).data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/invitations/${id}?status=${status}`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      if (selected && res.data) setSelected(res.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/invitations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      setSelected(null);
    },
  });

  const exportCSV = () => {
    if (!data?.items.length) return;
    const headers = ["ID", "Teacher", "School", "Department", "Message", "Date", "Status"];
    const rows = data.items.map(inv => [
      inv.id,
      inv.teacher_name || `Teacher #${inv.teacher_id}`,
      inv.school_name || `School #${inv.school_id}`,
      inv.department,
      inv.message || "",
      formatDate(inv.created_at),
      inv.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "invitations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const counts = data?.counts ?? {};

  const allDepts = [...new Set((data?.items ?? []).map(i => i.department).filter(Boolean))] as string[];
  const allSchools = [...new Set((data?.items ?? []).map(i => i.school_name).filter(Boolean))] as string[];

  const getDateCutoff = (range: string): Date | null => {
    const now = new Date();
    if (range === "today") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
    if (range === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (range === "6m") return new Date(now.getTime() - 180 * 86400000);
    if (range === "1y") return new Date(now.getTime() - 365 * 86400000);
    if (range === "2y") return new Date(now.getTime() - 730 * 86400000);
    return null;
  };

  const displayItems = (data?.items ?? []).filter(inv => {
    const deptOk = !deptFilter || inv.department === deptFilter;
    const schoolOk = !schoolFilter || (inv.school_name ?? "") === schoolFilter;
    const cutoff = getDateCutoff(dateFilter);
    const dateOk = !cutoff || new Date(inv.created_at) >= cutoff;
    return deptOk && schoolOk && dateOk;
  });

  const activeFilters = [deptFilter, schoolFilter, dateFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal
          inv={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
          onDelete={(id) => deleteMutation.mutate(id)}
          updating={updateMutation.isPending}
          deleting={deleteMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Invitations</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">All invitations across the platform.</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all","pending","accepted","rejected"] as const).map(t => {
          const count = t === "all" ? (data?.total ?? 0) : (counts[t] ?? 0);
          const colors: Record<string,string> = { all:"text-stone-700 dark:text-stone-200", pending:"text-amber-600", accepted:"text-emerald-600", rejected:"text-red-500" };
          const bgs: Record<string,string> = { all:"bg-stone-50 dark:bg-stone-800/50", pending:"bg-amber-50 dark:bg-amber-900/20", accepted:"bg-emerald-50 dark:bg-emerald-900/20", rejected:"bg-red-50 dark:bg-red-900/20" };
          return (
            <button key={t} onClick={() => { setStatusFilter(t); setPage(1); }}
              className={cn("p-4 rounded-2xl border text-left transition-all", statusFilter===t ? "border-[#C5A021] ring-1 ring-[#C5A021]/30" : "border-stone-200 dark:border-stone-700 hover:border-[#C5A021]/30", bgs[t])}>
              <p className={cn("text-2xl font-bold", colors[t])}>{count}</p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 capitalize mt-0.5">{t}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filters + View toggle */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search school or teacher name..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40" />
          </div>
          <div className="relative">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[150px]">
              <option value="">All Departments</option>
              {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[150px]">
              <option value="">All Schools</option>
              {allSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
          {/* Date */}
          <div className="relative">
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 appearance-none min-w-[150px]">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
              <option value="2y">Last 2 Years</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setDeptFilter(""); setSchoolFilter(""); setDateFilter(""); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-stone-500 hover:text-red-500 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-red-300 transition-colors">
              <X size={13} /> Clear ({activeFilters})
            </button>
          )}
          <div className="ml-auto flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayItems.map(inv => (
            <div key={inv.id} onClick={() => setSelected(inv)}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-[#C5A021]/40 hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden">
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20 flex-shrink-0">
                    <Mail size={20} className="text-[#C5A021]" />
                  </div>
                  <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1", STATUS_STYLE[inv.status])}>
                    {inv.status === "pending" ? <Clock size={9} /> : inv.status === "accepted" ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                    {inv.status}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-stone-900 dark:text-white">{inv.teacher_name || `Teacher #${inv.teacher_id}`}</p>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1"><Building2 size={10} /> {inv.school_name || `School #${inv.school_id}`}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full flex items-center gap-1">
                      <TrendingUp size={9} /> {inv.department}
                    </span>
                  </div>
                  {inv.message && <p className="text-xs text-stone-400 italic mt-2 line-clamp-2">&ldquo;{inv.message}&rdquo;</p>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-xs text-stone-400 flex items-center gap-1"><Calendar size={10} /> {formatDate(inv.created_at)}</span>
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(inv)} className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-lg hover:bg-[#C5A021]/10 hover:text-[#C5A021] transition-colors">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(inv.id)} disabled={deleteMutation.isPending}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!displayItems.length && (
            <div className="col-span-full py-20 text-center text-stone-400">
              <Mail size={40} className="mx-auto mb-3 opacity-30" /><p>No invitations found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
              <tr>
                {["Teacher", "School", "Department", "Message", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {displayItems.map((inv, idx) => (
                <tr key={inv.id} className={cn(idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-stone-800/20", "hover:bg-amber-50/40 dark:hover:bg-stone-800/30 transition-colors")}>
                  <td className="px-5 py-4 text-sm font-semibold text-stone-900 dark:text-white">
                    {inv.teacher_name || `Teacher #${inv.teacher_id}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-600 dark:text-stone-400">
                    {inv.school_name || `School #${inv.school_id}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-500">{inv.department}</td>
                  <td className="px-5 py-4 text-sm text-stone-400 max-w-[160px]">
                    {inv.message ? <span className="italic line-clamp-1">&ldquo;{inv.message}&rdquo;</span> : <span className="text-stone-300 dark:text-stone-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-500 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                  <td className="px-5 py-4">
                    <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1", STATUS_STYLE[inv.status])}>
                      {inv.status === "pending" ? <Clock size={10} /> : inv.status === "accepted" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(inv)} title="View & Edit"
                        className="p-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-[#C5A021]/10 hover:text-[#C5A021] transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(inv.id)} disabled={deleteMutation.isPending} title="Delete"
                        className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!displayItems.length && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-stone-400">
                  <Mail size={40} className="mx-auto mb-3 opacity-30" /><p>No invitations found</p>
                </td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 dark:border-stone-800">
              <p className="text-xs text-stone-500">
                Showing {(page - 1) * SIZE + 1}–{Math.min(page * SIZE, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm font-semibold text-stone-700 dark:text-stone-300">{page} / {data.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
