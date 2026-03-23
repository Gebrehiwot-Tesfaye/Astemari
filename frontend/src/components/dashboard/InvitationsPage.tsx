"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail, CheckCircle2, XCircle, Clock, Plus, Loader2,
  Building2, Calendar, Info, TrendingUp, X, User, LayoutList, LayoutGrid,
  Search, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Invitation } from "@/types";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-600 dark:text-amber-400" },
  accepted: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  rejected: { bg: "bg-red-50 dark:bg-red-900/20",     text: "text-red-600 dark:text-red-400" },
};

const DEPARTMENTS = ["Mathematics","English","Science","Biology","Chemistry","Physics","History","Geography","Amharic","Art","Music","PE","ICT","Other"];

function DetailModal({ inv, isSchool, onClose, onRespond, responding }: {
  inv: Invitation; isSchool: boolean; onClose: () => void;
  onRespond: (id: number, status: string) => void; responding: boolean;
}) {
  const s = STATUS_STYLE[inv.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Mail size={16} className="text-[#C5A021]" /> Invitation Detail
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20">
              {isSchool ? <User size={22} className="text-[#C5A021]" /> : <Building2 size={22} className="text-[#C5A021]" />}
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-white">
                {isSchool ? (inv.teacher_name || `Teacher #${inv.teacher_id}`) : (inv.school_name || `School #${inv.school_id}`)}
              </p>
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mt-1", s.bg, s.text)}>
                {inv.status === "pending" ? <Clock size={10} /> : inv.status === "accepted" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {inv.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Department</p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[#C5A021]" /> {inv.department}
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Date</p>
              <p className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Calendar size={12} className="text-[#C5A021]" /> {formatDate(inv.created_at)}
              </p>
            </div>
          </div>
          {inv.message && (
            <div className="p-4 bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Message</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed">&ldquo;{inv.message}&rdquo;</p>
            </div>
          )}
          {!isSchool && inv.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => onRespond(inv.id, "accepted")} disabled={responding}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                {responding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept
              </button>
              <button onClick={() => onRespond(inv.id, "rejected")} disabled={responding}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                <XCircle size={14} /> Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isSchool = user?.role === "school";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ teacher_id: "", department: "", message: "" });
  const [filter, setFilter] = useState<"all"|"pending"|"accepted"|"rejected">("all");
  const [selectedInv, setSelectedInv] = useState<Invitation | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list"|"card">("list");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const { data: invitations, isLoading } = useQuery<Invitation[]>({
    queryKey: ["invitations"],
    queryFn: async () => (await api.get("/invitations")).data,
    refetchInterval: 15_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/invitations/${id}`, { status }),
    onSuccess: () => { setRespondingId(null); setSelectedInv(null); qc.invalidateQueries({ queryKey: ["invitations"] }); },
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post("/invitations", { ...form, teacher_id: parseInt(form.teacher_id) }),
    onSuccess: () => { setShowForm(false); setForm({ teacher_id: "", department: "", message: "" }); qc.invalidateQueries({ queryKey: ["invitations"] }); },
  });

  const handleRespond = (id: number, status: string) => { setRespondingId(id); respondMutation.mutate({ id, status }); };

  const counts = {
    all: invitations?.length ?? 0,
    pending: invitations?.filter(i => i.status === "pending").length ?? 0,
    accepted: invitations?.filter(i => i.status === "accepted").length ?? 0,
    rejected: invitations?.filter(i => i.status === "rejected").length ?? 0,
  };
  const filtered = (filter === "all" ? invitations : invitations?.filter(i => i.status === filter))
    ?.filter(inv => {
      const q = search.toLowerCase();
      const nameMatch = isSchool
        ? (inv.teacher_name || "").toLowerCase().includes(q)
        : (inv.school_name || "").toLowerCase().includes(q);
      const deptMatch = !deptFilter || inv.department === deptFilter;
      return (!q || nameMatch) && deptMatch;
    });
  const allDepts = [...new Set((invitations ?? []).map(i => i.department).filter(Boolean))] as string[];
  const activeFilters = [search, deptFilter].filter(Boolean).length;
  const inputCls = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm";

  return (
    <div className="space-y-6">
      {selectedInv && (
        <DetailModal inv={selectedInv} isSchool={isSchool} onClose={() => setSelectedInv(null)}
          onRespond={handleRespond} responding={respondingId === selectedInv.id && respondMutation.isPending} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Mail className="text-[#C5A021]" size={24} /> Invitations
            {counts.pending > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#C5A021] text-white text-xs font-bold rounded-full">{counts.pending}</span>
            )}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            {isSchool ? "Invite teachers to apply for your positions." : "View and respond to invitations from schools."}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {isSchool && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all text-sm">
              <Plus size={16} /> Send Invitation
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
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
              placeholder={isSchool ? "Search by teacher name..." : "Search by school name..."}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40" />
          </div>
          {allDepts.length > 0 && (
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

      {/* Send form */}
      {showForm && isSchool && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-[#C5A021]/30 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Mail size={16} className="text-[#C5A021]" /> New Invitation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Teacher ID</label>
              <input type="number" value={form.teacher_id} onChange={e => setForm(f => ({...f, teacher_id: e.target.value}))} placeholder="Teacher ID" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className={inputCls}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Personal Message</label>
              <textarea rows={3} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                placeholder="Write a personal message to the teacher..." className={cn(inputCls, "resize-none")} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => sendMutation.mutate()} disabled={!form.teacher_id || !form.department || sendMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all disabled:opacity-60 text-sm">
              {sendMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Send
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-stone-600 dark:text-stone-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isSchool && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-bold mb-1">About Invitations</p>
            <p className="text-xs leading-relaxed">Schools invite you based on your profile and department. Accepting lets the school contact you directly.</p>
          </div>
        </div>
      )}

      {/* Main layout: content + sidebar */}
      <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0">
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
      ) : !filtered?.length ? (
        <div className="py-20 text-center text-stone-400">
          <Mail size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">No {filter === "all" ? "" : filter} invitations</p>
          <p className="text-sm mt-1">{isSchool ? "Send your first invitation to a teacher." : "Schools will invite you based on your profile."}</p>
        </div>
      ) : viewMode === "list" ? (
        /* ── LIST VIEW ── */
        <div className="space-y-2">
          {filtered.map((inv, idx) => {
            const s = STATUS_STYLE[inv.status];
            const displayName = isSchool ? (inv.teacher_name || `Teacher #${inv.teacher_id}`) : (inv.school_name || `School #${inv.school_id}`);
            return (
              <div key={inv.id} onClick={() => setSelectedInv(inv)}
                className={cn("rounded-2xl border shadow-sm transition-all overflow-hidden cursor-pointer hover:shadow-md hover:border-[#C5A021]/40",
                  idx % 2 === 0 ? "bg-white dark:bg-stone-900" : "bg-stone-50/60 dark:bg-stone-800/20",
                  inv.status === "pending" && !isSchool ? "border-[#C5A021]/40" : "border-stone-200 dark:border-stone-800")}>
                {inv.status === "pending" && !isSchool && <div className="h-0.5 bg-gradient-to-r from-[#C5A021] to-[#8E6708]" />}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 border border-[#C5A021]/20">
                    {isSchool ? <User size={18} className="text-[#C5A021]" /> : <Building2 size={18} className="text-[#C5A021]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 dark:text-white truncate">{displayName}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1"><TrendingUp size={10} /> {inv.department}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(inv.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider", s.bg, s.text)}>
                          {inv.status === "pending" ? <Clock size={10} /> : inv.status === "accepted" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {inv.status}
                        </span>
                        {!isSchool && inv.status === "pending" && (
                          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleRespond(inv.id, "accepted")} disabled={respondingId === inv.id && respondMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                              {respondingId === inv.id && respondMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Accept
                            </button>
                            <button onClick={() => handleRespond(inv.id, "rejected")} disabled={respondingId === inv.id && respondMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-500 hover:text-red-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                              <XCircle size={11} /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {inv.message && <p className="text-xs text-stone-400 italic mt-1.5 line-clamp-1">&ldquo;{inv.message}&rdquo;</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── CARD VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((inv) => {
            const s = STATUS_STYLE[inv.status];
            const displayName = isSchool ? (inv.teacher_name || `Teacher #${inv.teacher_id}`) : (inv.school_name || `School #${inv.school_id}`);
            return (
              <div key={inv.id} onClick={() => setSelectedInv(inv)}
                className={cn("bg-white dark:bg-stone-900 rounded-2xl border shadow-sm transition-all overflow-hidden cursor-pointer hover:shadow-md hover:border-[#C5A021]/40 flex flex-col",
                  inv.status === "pending" && !isSchool ? "border-[#C5A021]/40" : "border-stone-200 dark:border-stone-800")}>
                {inv.status === "pending" && !isSchool && <div className="h-1 bg-gradient-to-r from-[#C5A021] to-[#8E6708]" />}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20 flex-shrink-0">
                      {isSchool ? <User size={22} className="text-[#C5A021]" /> : <Building2 size={22} className="text-[#C5A021]" />}
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider", s.bg, s.text)}>
                      {inv.status === "pending" ? <Clock size={10} /> : inv.status === "accepted" ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 dark:text-white">{displayName}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full flex items-center gap-1">
                        <TrendingUp size={10} /> {inv.department}
                      </span>
                    </div>
                    {inv.message && (
                      <p className="text-xs text-stone-400 italic mt-3 line-clamp-2">&ldquo;{inv.message}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-xs text-stone-400 flex items-center gap-1"><Calendar size={10} /> {formatDate(inv.created_at)}</span>
                    {!isSchool && inv.status === "pending" && (
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleRespond(inv.id, "accepted")} disabled={respondingId === inv.id && respondMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                          {respondingId === inv.id && respondMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Accept
                        </button>
                        <button onClick={() => handleRespond(inv.id, "rejected")} disabled={respondingId === inv.id && respondMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-500 hover:text-red-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                          <XCircle size={11} /> Decline
                        </button>
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
          {/* Status Guide */}
          <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40">
              <p className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
                <Mail size={14} className="text-[#C5A021]" /> Invitation Status Guide
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                { status: "pending", label: "Pending", desc: "Awaiting teacher response", color: "text-amber-600", dot: "bg-amber-400" },
                { status: "accepted", label: "Accepted", desc: "Teacher agreed to apply", color: "text-emerald-600", dot: "bg-emerald-400" },
                { status: "rejected", label: "Rejected", desc: "Teacher declined", color: "text-red-500", dot: "bg-red-400" },
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

          {/* Tips */}
          <div className="bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
              <Info size={14} className="text-[#C5A021]" /> Tips
            </p>
            {isSchool ? (
              <ul className="space-y-2">
                {[
                  "Browse the Teachers tab to find candidates.",
                  "Include a personal message to increase acceptance.",
                  "Invite teachers matching your open positions.",
                  "Follow up with accepted teachers promptly.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                    <span className="w-4 h-4 rounded-full bg-[#C5A021]/20 text-[#C5A021] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {[
                  "Keep your profile complete to attract schools.",
                  "Accepting invitations opens direct contact.",
                  "Check your department matches the invitation.",
                  "Respond promptly to pending invitations.",
                ].map((tip, i) => (
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
