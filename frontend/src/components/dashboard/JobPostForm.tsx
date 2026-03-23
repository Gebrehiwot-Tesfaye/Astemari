"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2, CheckCircle2, Briefcase, MapPin, DollarSign,
  FileText, AlignLeft, ChevronRight, ArrowLeft, Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  "Mathematics", "Science", "English", "History", "Physical Education",
  "Arts", "ICT", "Social Studies", "Languages", "Biology", "Chemistry",
  "Physics", "Geography", "Amharic", "Music", "Other",
];
const LOCATIONS = [
  "Addis Ababa", "Dire Dawa", "Bahir Dar", "Mekelle", "Hawassa",
  "Adama", "Gondar", "Jimma", "Other",
];

const inputCls = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2";

export default function JobPostForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", department: "", description: "", requirements: "",
    salary_range: "", location: "",
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/jobs", form),
    onSuccess: () => router.push("/dashboard/jobs"),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const filled = Object.values(form).filter(Boolean).length;
  const progress = Math.round((filled / 6) * 100);

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-3 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-[#C5A021]" size={24} /> Post a New Job
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Fill in the details below to attract the right teachers.
          </p>
        </div>
        {/* Progress pill */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm">
          <div className="w-24 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#C5A021] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-stone-500">{progress}% complete</span>
        </div>
      </div>

      {mutation.isSuccess && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={18} /> Job posted successfully! Redirecting…
        </div>
      )}
      {mutation.isError && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400 font-semibold">
          Failed to post job. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main form — 2/3 width */}
        <div className="xl:col-span-2 space-y-5">
          {/* Basic info card */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Briefcase size={15} className="text-[#C5A021]" /> Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Job Title *</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="e.g. Senior Mathematics Teacher"
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Department *</label>
                  <select value={form.department} onChange={e => set("department", e.target.value)} className={inputCls}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <select value={form.location} onChange={e => set("location", e.target.value)} className={inputCls}>
                    <option value="">Select location</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}><DollarSign size={10} className="inline mr-1" />Salary Range</label>
                <input value={form.salary_range} onChange={e => set("salary_range", e.target.value)}
                  placeholder="e.g. 15,000 – 20,000 ETB/month"
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Description card */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <AlignLeft size={15} className="text-[#C5A021]" /> Job Description
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={5} value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Describe the role, day-to-day responsibilities, and what makes this position unique…"
                  className={cn(inputCls, "resize-none")} />
              </div>
              <div>
                <label className={labelCls}>Requirements</label>
                <textarea rows={4} value={form.requirements} onChange={e => set("requirements", e.target.value)}
                  placeholder="Required qualifications, years of experience, certifications…"
                  className={cn(inputCls, "resize-none")} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => mutation.mutate()}
              disabled={!form.title || !form.department || mutation.isPending}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 disabled:opacity-60 disabled:cursor-not-allowed">
              {mutation.isPending
                ? <><Loader2 size={17} className="animate-spin" /> Posting…</>
                : <><Sparkles size={17} /> Post Job</>}
            </button>
            <button onClick={() => router.back()}
              className="px-6 py-3.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
              Cancel
            </button>
          </div>
        </div>

        {/* Sidebar tips — 1/3 width */}
        <div className="space-y-5">
          {/* Checklist */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={14} className="text-[#C5A021]" /> Checklist
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Job title", done: !!form.title },
                { label: "Department", done: !!form.department },
                { label: "Location", done: !!form.location },
                { label: "Salary range", done: !!form.salary_range },
                { label: "Description", done: !!form.description },
                { label: "Requirements", done: !!form.requirements },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    item.done ? "bg-emerald-500" : "bg-stone-200 dark:bg-stone-700")}>
                    {item.done && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={cn("text-sm transition-colors",
                    item.done ? "text-stone-900 dark:text-white font-medium" : "text-stone-400")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#C5A021]/5 border border-[#C5A021]/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[#8E6708] dark:text-[#C5A021] uppercase tracking-wider mb-4">Tips for a great post</h3>
            <div className="space-y-3">
              {[
                "Be specific about the subject and grade level",
                "Mention salary to attract more applicants",
                "List required certifications clearly",
                "Describe your school culture briefly",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={13} className="text-[#C5A021] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick nav */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: "View my jobs", href: "/dashboard/jobs" },
                { label: "Browse teachers", href: "/dashboard/teachers" },
                { label: "View applications", href: "/dashboard/applications" },
              ].map(link => (
                <a key={link.href} href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group">
                  <span className="text-sm text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{link.label}</span>
                  <ChevronRight size={14} className="text-stone-300 group-hover:text-[#C5A021] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
