"use client";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import {
  Download, TrendingUp, Users, Briefcase, CheckCircle2,
  FileText, BarChart2, PieChart as PieIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const COLORS = ["#C5A021","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#84cc16"];

type Tab = "overview"|"registrations"|"jobs"|"applications"|"departments"|"locations";

const DATE_RANGES = [
  { label: "All",           value: "all" },
  { label: "Today",         value: "today" },
  { label: "Last 7 Days",   value: "7d" },
  { label: "Last Month",    value: "1m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last Year",     value: "1y" },
  { label: "Last 2 Years",  value: "2y" },
  { label: "Last 5 Years",  value: "5y" },
];

function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportAll(data: {
  registrationsNewest: Record<string, unknown>[];
  applicationsNewest: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  jobStatus: Record<string, unknown>[];
  appStatus: Record<string, unknown>[];
  topLocations: Record<string, unknown>[];
  recentTeachers: Record<string, unknown>[];
  recentSchools: Record<string, unknown>[];
  summary: Record<string, unknown>;
}) {
  import("xlsx").then(XLSX => {
    const wb = XLSX.utils.book_new();
    const sheets: [string, Record<string, unknown>[]][] = [
      ["Registrations",      data.registrationsNewest],
      ["Applications",       data.applicationsNewest],
      ["Departments",        data.departments],
      ["Job Status",         data.jobStatus],
      ["Application Status", data.appStatus],
      ["Top Locations",      data.topLocations],
      ["Recent Teachers",    data.recentTeachers],
      ["Recent Schools",     data.recentSchools],
      ["Summary",            [data.summary]],
    ];
    sheets.forEach(([name, rows]) => {
      if (!rows.length) return;
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, "analytics-report.xlsx");
  });
}

const card = "bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm";
const tHead = "text-xs font-bold text-stone-400 uppercase tracking-wide";

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string|number; icon: React.ElementType; color: string; sub?: string;
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

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [dateRange, setDateRange] = useState("all");
  const [department, setDepartment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", dateRange, department],
    queryFn: async () => {
      const params = new URLSearchParams({ date_range: dateRange });
      if (department) params.set("department", department);
      return (await api.get(`/admin/analytics?${params}`)).data;
    },
    staleTime: 60_000,
  });

  const { data: deptData } = useQuery({
    queryKey: ["analytics-departments"],
    queryFn: async () => (await api.get("/admin/analytics/departments")).data,
    staleTime: 300_000,
  });

  // Backend sends newest-first; reverse for charts (oldest→newest left→right), tables use as-is
  const registrationsNewest: { key: string; name: string; teachers: number; schools: number }[] = data?.registrations ?? [];
  const applicationsNewest:  { key: string; name: string; applications: number; accepted: number; jobs_posted: number }[] = data?.applications ?? [];
  const registrationsChart = [...registrationsNewest].reverse();
  const applicationsChart  = [...applicationsNewest].reverse();

  const departments: { name: string; value: number; teacher_count: number; school_count: number }[] = data?.departments ?? [];
  const jobStatus:   { name: string; value: number }[] = data?.job_status    ?? [];
  const appStatus:   { name: string; value: number }[] = data?.app_status    ?? [];
  const topLocations:{ name: string; value: number }[] = data?.top_locations ?? [];
  const recentTeachers: { id: number; name: string; email: string; department: string; created_at: string }[] = data?.recent_teachers ?? [];
  const recentSchools:  { id: number; name: string; email: string; address: string; school_type: string; created_at: string }[] = data?.recent_schools ?? [];
  const summary = data?.summary ?? {};
  const dynamicDepts: string[] = deptData?.departments ?? [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",      label: "Overview",      icon: BarChart2 },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "jobs",          label: "Jobs",          icon: Briefcase },
    { id: "applications",  label: "Applications",  icon: FileText },
    { id: "departments",   label: "Departments",   icon: PieIcon },
    { id: "locations",     label: "Locations",     icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Analytics &amp; Reports</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">Real-time platform data</p>
        </div>
        <button onClick={() => exportAll({
            registrationsNewest: registrationsNewest as Record<string, unknown>[],
            applicationsNewest:  applicationsNewest  as Record<string, unknown>[],
            departments:         departments          as Record<string, unknown>[],
            jobStatus:           jobStatus            as Record<string, unknown>[],
            appStatus:           appStatus            as Record<string, unknown>[],
            topLocations:        topLocations         as Record<string, unknown>[],
            recentTeachers:      recentTeachers       as Record<string, unknown>[],
            recentSchools:       recentSchools        as Record<string, unknown>[],
            summary:             summary              as Record<string, unknown>,
          })}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
          <Download size={15} /> Export All
        </button>
      </div>

      {/* Single row: tabs on left, Date + Dept selects on right */}
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
        <div className="flex items-center gap-2 ml-auto pl-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 font-semibold">
            {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={department} onChange={e => setDepartment(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 font-semibold">
            <option value="">All Departments</option>
            {dynamicDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div>
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#C5A021] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard label="New Teachers"   value={summary.total_teachers ?? 0}    icon={Users}        color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                    <SummaryCard label="New Schools"    value={summary.total_schools ?? 0}     icon={Briefcase}    color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
                    <SummaryCard label="Active Jobs"    value={summary.active_jobs ?? 0}       icon={TrendingUp}   color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" sub={`${summary.total_jobs ?? 0} total`} />
                    <SummaryCard label="Accept Rate"    value={`${summary.acceptance_rate ?? 0}%`} icon={CheckCircle2} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" sub={`${summary.total_applications ?? 0} apps`} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={card}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Registration Trends</p>
                        <ExportBtn onClick={() => exportCSV("registrations.csv", registrationsNewest)} />
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={registrationsChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                          <Legend />
                          <Line type="monotone" dataKey="teachers" stroke="#C5A021" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="schools"  stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={card}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Jobs by Department</p>
                        <ExportBtn onClick={() => exportCSV("departments.csv", departments)} />
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
                    <div className={`${card} lg:col-span-2`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Applications vs Accepted vs Jobs Posted</p>
                        <ExportBtn onClick={() => exportCSV("applications.csv", applicationsNewest)} />
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={applicationsChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                          <Legend />
                          <Bar dataKey="applications" name="Applications" fill="#C5A021" radius={[4,4,0,0]} />
                          <Bar dataKey="accepted"     name="Accepted"     fill="#10b981" radius={[4,4,0,0]} />
                          <Bar dataKey="jobs_posted"  name="Jobs Posted"  fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REGISTRATIONS ── */}
              {tab === "registrations" && (
                <div className="space-y-6">
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Registrations Over Time</p>
                      <ExportBtn onClick={() => exportCSV("registrations.csv", registrationsNewest)} />
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={registrationsChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={10} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                        <Legend />
                        <Bar dataKey="teachers" name="Teachers" fill="#C5A021" radius={[4,4,0,0]} />
                        <Bar dataKey="schools"  name="Schools"  fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Detail table — newest first (data already newest-first from backend) */}
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Registration Detail (newest first)</p>
                      <ExportBtn onClick={() => exportCSV("registrations.csv", registrationsNewest)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className={`text-left py-2 px-3 ${tHead}`}>Period</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Teachers</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Schools</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {registrationsNewest.map((r, idx) => (
                            <tr key={`reg-${r.key}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                              <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white">{r.name}</td>
                              <td className="py-2.5 px-3 text-right text-[#C5A021] font-bold">{r.teachers}</td>
                              <td className="py-2.5 px-3 text-right text-blue-600 font-bold">{r.schools}</td>
                              <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-300 font-bold">{r.teachers + r.schools}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Recent teachers */}
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Recently Registered Teachers</p>
                      <ExportBtn onClick={() => exportCSV("recent-teachers.csv", recentTeachers)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className={`text-left py-2 px-3 ${tHead}`}>Name</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Email</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Department</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Joined</th>
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {recentTeachers.map((t, idx) => (
                            <tr key={`t-${t.id}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                              <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-white">{t.name}</td>
                              <td className="py-2.5 px-3 text-stone-500">{t.email}</td>
                              <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full">{t.department || "—"}</span></td>
                              <td className="py-2.5 px-3 text-stone-400 text-xs">{t.created_at ? formatDate(t.created_at) : "—"}</td>
                            </tr>
                          ))}
                          {!recentTeachers.length && <tr><td colSpan={4} className="py-8 text-center text-stone-400 text-sm">No teachers in this period</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Recent schools */}
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Recently Registered Schools</p>
                      <ExportBtn onClick={() => exportCSV("recent-schools.csv", recentSchools)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className={`text-left py-2 px-3 ${tHead}`}>School Name</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Email</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Location</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Type</th>
                          <th className={`text-left py-2 px-3 ${tHead}`}>Joined</th>
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {recentSchools.map((s, idx) => (
                            <tr key={`s-${s.id}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                              <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-white">{s.name}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.email}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.address || "—"}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.school_type || "—"}</td>
                              <td className="py-2.5 px-3 text-stone-400 text-xs">{s.created_at ? formatDate(s.created_at) : "—"}</td>
                            </tr>
                          ))}
                          {!recentSchools.length && <tr><td colSpan={5} className="py-8 text-center text-stone-400 text-sm">No schools in this period</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── JOBS ── */}
              {tab === "jobs" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={card}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Job Status Breakdown</p>
                        <ExportBtn onClick={() => exportCSV("job-status.csv", jobStatus)} />
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
                        <ExportBtn onClick={() => exportCSV("jobs-monthly.csv", applicationsNewest.map(a => ({ period: a.name, jobs_posted: a.jobs_posted })))} />
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={applicationsChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                          <Bar dataKey="jobs_posted" name="Jobs Posted" fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Job Status Detail</p>
                      <ExportBtn onClick={() => exportCSV("job-status.csv", jobStatus)} />
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                        <th className={`text-left py-2 px-3 ${tHead}`}>Status</th>
                        <th className={`text-right py-2 px-3 ${tHead}`}>Count</th>
                        <th className={`text-right py-2 px-3 ${tHead}`}>% of Total</th>
                      </tr></thead>
                      <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                        {jobStatus.map((r, i) => (
                          <tr key={`js-${r.name}-${i}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                            <td className="py-2.5 px-3 font-medium capitalize" style={{ color: COLORS[i % COLORS.length] }}>{r.name}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">{r.value}</td>
                            <td className="py-2.5 px-3 text-right text-stone-500">{summary.total_jobs ? ((r.value / summary.total_jobs) * 100).toFixed(1) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── APPLICATIONS ── */}
              {tab === "applications" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard label="Total"       value={summary.total_applications ?? 0}    icon={FileText}    color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                    <SummaryCard label="Pending"     value={summary.pending_applications ?? 0}  icon={TrendingUp}  color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
                    <SummaryCard label="Accepted"    value={summary.accepted_applications ?? 0} icon={CheckCircle2}color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
                    <SummaryCard label="Accept Rate" value={`${summary.acceptance_rate ?? 0}%`} icon={BarChart2}   color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={card}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Application Status</p>
                        <ExportBtn onClick={() => exportCSV("app-status.csv", appStatus)} />
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
                        <ExportBtn onClick={() => exportCSV("applications-monthly.csv", applicationsNewest)} />
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={applicationsChart}>
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
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Application Detail (newest first)</p>
                      <ExportBtn onClick={() => exportCSV("applications-monthly.csv", applicationsNewest)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          {["Period","Applications","Accepted","Jobs Posted","Accept Rate"].map(h => (
                            <th key={h} className={`text-left py-2 px-3 ${tHead}`}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {applicationsNewest.map((r, idx) => (
                            <tr key={`app-${r.key}-${idx}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                              <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white">{r.name}</td>
                              <td className="py-2.5 px-3 text-[#C5A021] font-bold">{r.applications}</td>
                              <td className="py-2.5 px-3 text-emerald-600 font-bold">{r.accepted}</td>
                              <td className="py-2.5 px-3 text-blue-600 font-bold">{r.jobs_posted}</td>
                              <td className="py-2.5 px-3 text-stone-500">{r.applications ? ((r.accepted / r.applications) * 100).toFixed(1) : 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                        <ExportBtn onClick={() => exportCSV("departments.csv", departments)} />
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={departments} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3} dataKey="value">
                            {departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={card}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Jobs vs Teachers by Department</p>
                        <ExportBtn onClick={() => exportCSV("departments.csv", departments)} />
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departments} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={90} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                          <Legend />
                          <Bar dataKey="value"         name="Jobs"     fill="#C5A021" radius={[0,4,4,0]} />
                          <Bar dataKey="teacher_count" name="Teachers" fill="#3b82f6" radius={[0,4,4,0]} />
                          <Bar dataKey="school_count"  name="Schools"  fill="#10b981" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Department Detail</p>
                      <ExportBtn onClick={() => exportCSV("departments.csv", departments)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className={`text-left py-2 px-3 ${tHead}`}>Department</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Jobs</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Teachers</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Schools</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>% Jobs</th>
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {departments.map((r, i) => {
                            const total = departments.reduce((s, d) => s + d.value, 0);
                            return (
                              <tr key={`dept-${r.name}-${i}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                                <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  {r.name}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">{r.value}</td>
                                <td className="py-2.5 px-3 text-right text-blue-600 font-bold">{r.teacher_count}</td>
                                <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">{r.school_count}</td>
                                <td className="py-2.5 px-3 text-right text-stone-500">{total ? ((r.value / total) * 100).toFixed(1) : 0}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── LOCATIONS ── */}
              {tab === "locations" && (
                <div className="space-y-6">
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Top Job Locations</p>
                      <ExportBtn onClick={() => exportCSV("locations.csv", topLocations)} />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topLocations}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                        <Bar dataKey="value" name="Jobs" fill="#C5A021" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Location Detail</p>
                      <ExportBtn onClick={() => exportCSV("locations.csv", topLocations)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100 dark:border-stone-800">
                          <th className={`text-left py-2 px-3 ${tHead}`}>Location</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>Jobs</th>
                          <th className={`text-right py-2 px-3 ${tHead}`}>% Share</th>
                        </tr></thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                          {topLocations.map((r, i) => {
                            const total = topLocations.reduce((s, l) => s + l.value, 0);
                            return (
                              <tr key={`loc-${r.name}-${i}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                                <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-white flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  {r.name}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-white">{r.value}</td>
                                <td className="py-2.5 px-3 text-right text-stone-500">{total ? ((r.value / total) * 100).toFixed(1) : 0}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}
