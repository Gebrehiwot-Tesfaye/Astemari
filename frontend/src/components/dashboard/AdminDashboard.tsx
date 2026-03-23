"use client";
import {
  Users, Building2, Briefcase, Award, CheckCircle2, XCircle,
  MapPin, Clock, AlertCircle, FileText, TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#C5A021", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AdminDashboard() {
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
    staleTime: 30_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
    staleTime: 60_000,
  });

  const { data: pendingSchools, refetch: refetchPending } = useQuery({
    queryKey: ["pending-schools"],
    queryFn: async () => (await api.get("/admin/schools/pending")).data,
    staleTime: 30_000,
  });

  // Backend sends newest-first; reverse for charts (oldest→newest left→right)
  const registrations = [...(analytics?.registrations ?? [])].reverse();
  const departments = analytics?.departments ?? [];
  const applications = [...(analytics?.applications ?? [])].reverse();

  const topStats = [
    { label: "Total Users",  value: stats?.total_users ?? "—",        icon: Users,      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Teachers",     value: stats?.total_teachers ?? "—",     icon: Award,      color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Schools",      value: stats?.total_schools ?? "—",      icon: Building2,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Active Jobs",  value: stats?.active_jobs ?? "—",        icon: Briefcase,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Applications", value: stats?.total_applications ?? "—", icon: FileText,   color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Invitations",  value: stats?.total_invitations ?? "—",  icon: TrendingUp, color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-900/20" },
  ];

  const handleApprove = async (id: number) => {
    await api.patch(`/admin/schools/${id}/approve`);
    qc.invalidateQueries({ queryKey: ["pending-schools"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    refetchPending();
  };

  const handleReject = async (id: number) => {
    await api.patch(`/admin/schools/${id}/reject`);
    qc.invalidateQueries({ queryKey: ["pending-schools"] });
    refetchPending();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          Admin <span className="text-[#C5A021] italic">Dashboard</span>
        </h1>
        <p className="text-stone-500 dark:text-stone-400">Monitoring platform activity across Ethiopia.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {topStats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all group">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-4 uppercase tracking-wider">
            Registration Trends (12 months)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={registrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Legend />
              <Line type="monotone" dataKey="teachers" stroke="#C5A021" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-4 uppercase tracking-wider">
            Jobs by Department
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={departments} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {departments.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Applications bar */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-4 uppercase tracking-wider">
          Monthly Applications vs Jobs Posted
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={applications}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
            <YAxis stroke="#9ca3af" fontSize={10} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
            <Legend />
            <Bar dataKey="applications" name="Applications" fill="#C5A021" radius={[4, 4, 0, 0]} />
            <Bar dataKey="jobs_posted" name="Jobs Posted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Verifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" /> Pending School Verifications
            {pendingSchools?.length > 0 && (
              <span className="w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingSchools.length}
              </span>
            )}
          </h2>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {pendingSchools?.length ? pendingSchools.map((school: {
              id: number; school_name: string; address: string; created_at: string;
            }) => (
              <div key={school.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-white">{school.school_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {school.address || "—"}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(school.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(school.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => handleReject(school.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-stone-400 text-sm">No pending verifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
