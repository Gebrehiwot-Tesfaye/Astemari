"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MapPin, Briefcase, Loader2, X, Filter,
  ChevronDown, ChevronUp, Clock, DollarSign, SlidersHorizontal,
  ArrowUpDown, CheckCircle2, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Job, PaginatedResponse } from "@/types";

const LOCATIONS = ["Addis Ababa","Dire Dawa","Bahir Dar","Mekelle","Hawassa","Adama","Gondar","Jimma"];
const JOB_TYPES = ["Full-time","Part-time","Contract","Remote","Temporary"];
const DATE_RANGES = [
  { label: "Any time",   value: "" },
  { label: "Today",      value: "today" },
  { label: "This week",  value: "week" },
  { label: "This month", value: "month" },
];
const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
];

function FilterSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-stone-100 dark:border-[#8E6708]/15 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-3 text-sm font-bold text-stone-800 dark:text-stone-200 hover:text-[#C5A021] transition-colors">
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div onClick={onChange} className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
        checked ? "bg-[#C5A021] border-[#C5A021]" : "border-stone-300 dark:border-stone-600 group-hover:border-[#C5A021]"
      )}>
        {checked && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
      </div>
      <span className={cn("text-sm transition-colors", checked ? "text-stone-900 dark:text-white font-medium" : "text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white")}>
        {label}
      </span>
    </label>
  );
}

export default function JobsListing() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [search, setSearch] = useState("");
  const [depts, setDepts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ dept: true, location: true, type: true, date: false });
  const toggleSection = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const toggleArr = useCallback((arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }, []);

  const activeFilterCount = depts.length + locations.length + jobTypes.length + (dateRange ? 1 : 0);

  const { data: deptsData } = useQuery<{ departments: string[] }>({
    queryKey: ["public-departments"],
    queryFn: async () => (await api.get("/jobs/departments")).data,
    staleTime: 5 * 60 * 1000,
  });
  const DEPARTMENTS = deptsData?.departments ?? [];

  const { data, isLoading } = useQuery<PaginatedResponse<Job>>({
    queryKey: ["public-jobs", search, depts, locations, jobTypes, dateRange, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "active", page: String(page), size: "15" });
      if (search) params.set("search", search);
      depts.forEach(d => params.append("department", d));
      locations.forEach(l => params.append("location", l));
      jobTypes.forEach(t => params.append("job_type", t));
      if (dateRange) params.set("date_range", dateRange);
      if (sort) params.set("sort", sort);
      return (await api.get(`/jobs?${params}`)).data;
    },
  });

  const handleApply = (jobId: number) => {
    if (user) {
      router.push("/dashboard/jobs");
    } else {
      router.push(`/login?redirect=/dashboard/jobs&job=${jobId}`);
    }
  };

  const clearFilters = () => {
    setDepts([]); setLocations([]); setJobTypes([]); setDateRange(""); setSearch(""); setPage(1);
  };

  const FilterPanel = () => (
    <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40">
        <span className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#C5A021]" /> Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-[#C5A021] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-[#C5A021] font-bold hover:underline flex items-center gap-1">
            <X size={11} /> Clear all
          </button>
        )}
      </div>
      <div className="px-4 py-2">
        <FilterSection title="Department" open={openSections.dept} onToggle={() => toggleSection("dept")}>
          {DEPARTMENTS.map(d => (
            <CheckItem key={d} label={d} checked={depts.includes(d)} onChange={() => toggleArr(depts, d, setDepts)} />
          ))}
        </FilterSection>
        <FilterSection title="Location" open={openSections.location} onToggle={() => toggleSection("location")}>
          {LOCATIONS.map(l => (
            <CheckItem key={l} label={l} checked={locations.includes(l)} onChange={() => toggleArr(locations, l, setLocations)} />
          ))}
        </FilterSection>
        <FilterSection title="Job Type" open={openSections.type} onToggle={() => toggleSection("type")}>
          {JOB_TYPES.map(t => (
            <CheckItem key={t} label={t} checked={jobTypes.includes(t)} onChange={() => toggleArr(jobTypes, t, setJobTypes)} />
          ))}
        </FilterSection>
        <FilterSection title="Date Posted" open={openSections.date} onToggle={() => toggleSection("date")}>
          {DATE_RANGES.map(r => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div onClick={() => { setDateRange(r.value); setPage(1); }} className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                dateRange === r.value ? "border-[#C5A021] bg-[#C5A021]" : "border-stone-300 dark:border-stone-600 group-hover:border-[#C5A021]"
              )}>
                {dateRange === r.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className={cn("text-sm transition-colors", dateRange === r.value ? "text-stone-900 dark:text-white font-medium" : "text-stone-600 dark:text-stone-400")}>
                {r.label}
              </span>
            </label>
          ))}
        </FilterSection>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09]">
      {/* Hero header */}
      <div className="bg-[#221902] py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
        </div>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#C5A021]/40 text-3xl font-bold mb-1 select-none">ስራዎች</p>
          <h1 className="text-3xl font-bold text-white mb-2">Find Teaching Jobs</h1>
          <p className="text-stone-400 text-sm">{data?.total ?? 0} open positions across Ethiopia</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-2xl shadow-sm">
          <Search size={18} className="text-stone-400 flex-shrink-0" />
          <input type="text" placeholder="Job title, school, department, or keyword..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={15} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-2xl text-sm font-semibold text-stone-700 dark:text-stone-300 shadow-sm">
            <Filter size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <div className="flex items-center gap-2 px-3 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-2xl shadow-sm">
            <ArrowUpDown size={14} className="text-stone-400" />
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none font-medium">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Active chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {depts.map(d => (
            <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full border border-[#C5A021]/20">
              {d} <button onClick={() => toggleArr(depts, d, setDepts)}><X size={10} /></button>
            </span>
          ))}
          {locations.map(l => (
            <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800/30">
              <MapPin size={10} /> {l} <button onClick={() => toggleArr(locations, l, setLocations)}><X size={10} /></button>
            </span>
          ))}
          {jobTypes.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800/30">
              <Clock size={10} /> {t} <button onClick={() => toggleArr(jobTypes, t, setJobTypes)}><X size={10} /></button>
            </span>
          ))}
          {dateRange && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800/30">
              <Clock size={10} /> {DATE_RANGES.find(r => r.value === dateRange)?.label}
              <button onClick={() => setDateRange("")}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && <div className="lg:hidden mb-4"><FilterPanel /></div>}

      {/* Layout */}
      <div className="flex gap-6 items-start">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0 sticky top-24">
          <FilterPanel />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {data?.items?.map((job) => (
                  <div key={job.id} className="relative bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group overflow-hidden">
                    {/* Ethiopian flag stripe top */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                      <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 border border-[#C5A021]/20">
                        <Briefcase size={22} className="text-[#C5A021]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-bold text-[#221902] dark:text-white group-hover:text-[#C5A021] transition-colors">{job.title}</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400">{job.school_name}</p>
                          </div>
                          <span className="text-xs text-stone-400 flex items-center gap-1 flex-shrink-0">
                            <Clock size={11} /> {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full">{job.department}</span>
                      {job.location && (
                        <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded-full flex items-center gap-1">
                          <MapPin size={10} /> {job.location}
                        </span>
                      )}
                      {job.salary_range && (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
                          <DollarSign size={10} /> {job.salary_range}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">{job.description}</p>
                    )}
                    <button onClick={() => handleApply(job.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-50 dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl hover:bg-[#C5A021] hover:text-white hover:border-[#C5A021] transition-all">
                      Apply Now <ArrowRight size={12} />
                    </button>
                  </div>
                ))}

                {!data?.items?.length && (
                  <div className="col-span-2 py-20 text-center text-stone-400">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-lg">No jobs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {(data?.pages ?? 0) > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: data!.pages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                        page === i + 1 ? "bg-[#C5A021] text-white shadow-sm" : "bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 text-stone-500 hover:border-[#C5A021]/40")}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}


            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}