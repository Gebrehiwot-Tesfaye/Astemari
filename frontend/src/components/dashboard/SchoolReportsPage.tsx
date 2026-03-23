"use client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import {
  Download, TrendingUp, Briefcase, CheckCircle2, FileText,
  BarChart2, PieChart as PieIcon, Users, Mail, Send,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const COLORS = ["#C5A021","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#84cc16"];
const card = "bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm";
const tHead = "text-xs font-bold text-stone-400 uppercase tracking-wide";

type Tab = "overview" | "jobs" | "applications" | "invitations" | "departments";

const DATE_RANGES = [
  { label: "All",           value: "all" },
  { label: "Today",         value: "today" },
  { label: "Last 7 Days",   value: "7d" },
  { label: "Last Month",    value: "1m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last Year",     value: "1y" },
];

function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">{label}</p>
      <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{value}</h3>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-[#C5A021]/10 hover:text-[#C5A021] transition-colors">
      <Download size={13} /> Export CSV
    </button>
  );
}

export default function SchoolReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [dateRange, setDateRange] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["school-analytics", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ date_range: dateRange });
      return (await api.get(`/schools/me/analytics?${params}`)).data;
    },
    staleTime: 60_000,
  });

  const summary = data?.summary ?? {};
  const jobStatus: { name: string; value: number }[] = data?.job_status ?? [];
  const appStatus: { name: string; value: number }[] = data?.app_status ?? [];
  const invStatus: { name: string; value: number }[] = data?.inv_status ?? [];
  const departments: { name: string; value: number }[] = data?.departments ?? [];
  const topJobs: { name: string; applications: number }[] = data?.top_jobs ?? [];
  const trend: { name: string; jobs_posted: number; applications: number; accepted: number }[] = data?.trend ?? [];
  const recentApps: {
    id: number; teacher_name: string; teacher_department: string | null;
    job_title: string; status: string; applied_at: string | null;
  }[] = data?.recent_applications ?? [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",     label: "Overview",     icon: BarChart2 },
    { id: "jobs",         label: "Jobs",         icon: Briefcase },
    { id: "applications", label: "Applications", icon: FileText },
    { id: "invitations",  label: "Invitations",  icon: Mail },
    { id: "departments",  label: "Departments",  icon: PieIcon },
  ];

  const statusColor: Record<string, string> = {
    pending:  "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    accepted: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    rejected: "bg-red-50 dark:bg-red-900/20 text-red-500",
    active:   "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    closed:   "bg-stone-100 dark:bg-stone-800 text-stone-500",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-[#C5A021]" size={24} /> Reports &amp; Analytics
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Your school's recruitment performance</p>
        </div>
        <button onClick={() => exportCSV("school-report.csv", recentApps as unknown as Record<string, unknown>[])}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Tabs + date range */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              tab === t.id
                ? "bg-white dark:bg-stone-700 text-[#C5A021] shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            )}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
        <div className="ml-auto pl-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 font-semibold">
            {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#C5A021] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total Jobs"    value={summary.total_jobs ?? 0}         icon={Briefcase}    color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" sub={`${summary.active_jobs ?? 0} active`} />
                <SummaryCard label="Applications"  value={summary.total_applications ?? 0} icon={Users}        color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                <SummaryCard label="Accepted"      value={summary.accepted_applications ?? 0} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" sub={`${summary.acceptance_rate ?? 0}% rate`} />
                <SummaryCard label="Invitations"   value={summary.total_invitations ?? 0}  icon={Send}         color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" sub={`${summary.accepted_invitations ?? 0} accepted`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Activity Trend</p>
                    <ExportBtn onClick={() => exportCSV("trend.csv", trend as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                      <Line type="monotone" dataKey="jobs_posted"  name="Jobs Posted"  stroke="#C5A021" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="applications" name="Applications" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="accepted"     name="Accepted"     stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Jobs by Department</p>
                    <ExportBtn onClick={() => exportCSV("departments.csv", departments as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={departments} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Recent applications table */}
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Recent Applications</p>
                  <ExportBtn onClick={() => exportCSV("recent-applications.csv", recentApps as unknown as Record<string, unknown>[])} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                      <th className={`text-left py-2 px-3 ${tHead}`}>Teacher</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Job</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Applied</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                      {recentApps.slice(0, 8).map(a => (
                        <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-white">
                            {a.teacher_name}
                            {a.teacher_department && <span className="ml-2 px-1.5 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-[10px] font-bold rounded-full">{a.teacher_department}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500">{a.job_title}</td>
                          <td className="py-2.5 px-3 text-stone-400 text-xs">{a.applied_at ? formatDate(a.applied_at) : "—"}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider", statusColor[a.status] ?? "bg-stone-100 text-stone-500")}>{a.status}</span>
                          </td>
                        </tr>
                      ))}
                      {!recentApps.length && <tr><td colSpan={4} className="py-8 text-center text-stone-400 text-sm">No applications yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── JOBS ── */}
          {tab === "jobs" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total Jobs"  value={summary.total_jobs ?? 0}  icon={Briefcase}   color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
                <SummaryCard label="Active"      value={summary.active_jobs ?? 0} icon={TrendingUp}  color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
                <SummaryCard label="Applications" value={summary.total_applications ?? 0} icon={Users} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                <SummaryCard label="Accept Rate" value={`${summary.acceptance_rate ?? 0}%`} icon={CheckCircle2} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Job Status Breakdown</p>
                    <ExportBtn onClick={() => exportCSV("job-status.csv", jobStatus as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={jobStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {jobStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Jobs Posted per Period</p>
                    <ExportBtn onClick={() => exportCSV("jobs-trend.csv", trend as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Bar dataKey="jobs_posted" name="Jobs Posted" fill="#C5A021" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Top Jobs by Applications</p>
                  <ExportBtn onClick={() => exportCSV("top-jobs.csv", topJobs as unknown as Record<string, unknown>[])} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topJobs} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={160} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Bar dataKey="applications" name="Applications" fill="#3b82f6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ── */}
          {tab === "applications" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total"    value={summary.total_applications ?? 0}    icon={FileText}    color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                <SummaryCard label="Pending"  value={summary.pending_applications ?? 0}  icon={TrendingUp}  color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
                <SummaryCard label="Accepted" value={summary.accepted_applications ?? 0} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
                <SummaryCard label="Rate"     value={`${summary.acceptance_rate ?? 0}%`} icon={BarChart2}   color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Application Status</p>
                    <ExportBtn onClick={() => exportCSV("app-status.csv", appStatus as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={appStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {appStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Applications vs Accepted</p>
                    <ExportBtn onClick={() => exportCSV("apps-trend.csv", trend as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                      <Line type="monotone" dataKey="applications" stroke="#C5A021" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="accepted"     stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">All Applications</p>
                  <ExportBtn onClick={() => exportCSV("applications.csv", recentApps as unknown as Record<string, unknown>[])} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                      <th className={`text-left py-2 px-3 ${tHead}`}>Teacher</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Department</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Job</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Applied</th>
                      <th className={`text-left py-2 px-3 ${tHead}`}>Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                      {recentApps.map(a => (
                        <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-white">{a.teacher_name}</td>
                          <td className="py-2.5 px-3 text-stone-500">{a.teacher_department || "—"}</td>
                          <td className="py-2.5 px-3 text-stone-500">{a.job_title}</td>
                          <td className="py-2.5 px-3 text-stone-400 text-xs">{a.applied_at ? formatDate(a.applied_at) : "—"}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider", statusColor[a.status] ?? "bg-stone-100 text-stone-500")}>{a.status}</span>
                          </td>
                        </tr>
                      ))}
                      {!recentApps.length && <tr><td colSpan={5} className="py-8 text-center text-stone-400 text-sm">No applications yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── INVITATIONS ── */}
          {tab === "invitations" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SummaryCard label="Total Sent"  value={summary.total_invitations ?? 0}    icon={Send}        color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" />
                <SummaryCard label="Accepted"    value={summary.accepted_invitations ?? 0} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
                <SummaryCard label="Accept Rate" value={summary.total_invitations ? `${Math.round((summary.accepted_invitations / summary.total_invitations) * 100)}%` : "0%"} icon={TrendingUp} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Invitation Status Breakdown</p>
                  <ExportBtn onClick={() => exportCSV("inv-status.csv", invStatus as unknown as Record<string, unknown>[])} />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={invStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {invStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={card}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className={`text-left py-2 px-3 ${tHead}`}>Status</th>
                    <th className={`text-right py-2 px-3 ${tHead}`}>Count</th>
                    <th className={`text-right py-2 px-3 ${tHead}`}>% of Total</th>
                  </tr></thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                    {invStatus.map((r, i) => (
                      <tr key={r.name} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-2.5 px-3 font-medium capitalize" style={{ color: COLORS[i % COLORS.length] }}>{r.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">{r.value}</td>
                        <td className="py-2.5 px-3 text-right text-stone-500">{summary.total_invitations ? ((r.value / summary.total_invitations) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    {!invStatus.length && <tr><td colSpan={3} className="py-8 text-center text-stone-400 text-sm">No invitations yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DEPARTMENTS ── */}
          {tab === "departments" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Jobs by Department</p>
                    <ExportBtn onClick={() => exportCSV("departments.csv", departments as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={departments} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value">
                        {departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={card}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Department Distribution</p>
                    <ExportBtn onClick={() => exportCSV("departments.csv", departments as unknown as Record<string, unknown>[])} />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departments} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={120} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Bar dataKey="value" name="Jobs" fill="#C5A021" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Department Detail</p>
                  <ExportBtn onClick={() => exportCSV("departments.csv", departments as unknown as Record<string, unknown>[])} />
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className={`text-left py-2 px-3 ${tHead}`}>Department</th>
                    <th className={`text-right py-2 px-3 ${tHead}`}>Jobs</th>
                    <th className={`text-right py-2 px-3 ${tHead}`}>% of Total</th>
                  </tr></thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                    {departments.map((d, i) => (
                      <tr key={d.name} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          {d.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">{d.value}</td>
                        <td className="py-2.5 px-3 text-right text-stone-500">{summary.total_jobs ? ((d.value / summary.total_jobs) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    {!departments.length && <tr><td colSpan={3} className="py-8 text-center text-stone-400 text-sm">No data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
