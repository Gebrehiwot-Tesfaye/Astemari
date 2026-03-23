"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, MapPin, Briefcase, Send, Loader2, Filter, X,
  ChevronDown, ChevronUp, Clock, DollarSign, SlidersHorizontal,
  ArrowUpDown, CheckCircle2, LayoutList, LayoutGrid, Building2,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Job, PaginatedResponse } from "@/types";

const DEPARTMENTS = [
  "Mathematics","English","Science","Biology","Chemistry","Physics",
  "History","Geography","Amharic","Art","Music","PE","ICT","Other",
];
const LOCATIONS = ["Addis Ababa","Dire Dawa","Bahir Dar","Mekelle","Hawassa","Adama","Gondar","Jimma"];
const JOB_TYPES = ["Full-time","Part-time","Contract","Remote","Temporary"];
const DATE_RANGES = [
  { label: "Any time", value: "" },
  { label: "Today",    value: "today" },
  { label: "This week",  value: "week" },
  { label: "This month", value: "month" },
];
const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Salary: High", value: "salary_desc" },
  { label: "Salary: Low",  value: "salary_asc" },
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

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="py-20 text-center text-stone-400">
      <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
      <p className="font-medium text-lg">No jobs found</p>
      <p className="text-sm mt-1">Try adjusting your filters or search term</p>
      {hasFilters && (
        <button onClick={onClear} className="mt-4 px-5 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">
          Clear Filters
        </button>
      )}
    </div>
  );
}

/* ── Compact table-row for list view ── */
function JobListRow({ job, isTeacher, isSchool, applied, applyingId, coverLetter, onApplyClick, onCoverChange, onSubmit, onCancel, isPending, idx }: {
  job: Job; isTeacher: boolean; isSchool: boolean; applied: boolean;
  applyingId: number | null; coverLetter: string;
  onApplyClick: () => void; onCoverChange: (v: string) => void;
  onSubmit: () => void; onCancel: () => void; isPending: boolean; idx?: number;
}) {
  return (
    <div className={cn("group", idx !== undefined && idx % 2 !== 0 ? "bg-stone-50/60 dark:bg-[#221902]/30" : "bg-white dark:bg-transparent")}>
      <div className="flex items-center gap-5 px-4 py-3 border border-stone-200 dark:border-[#8E6708]/25 rounded-xl hover:border-[#C5A021]/40 hover:bg-amber-50/30 dark:hover:bg-[#221902]/80 transition-all">
        {/* Title + school — grows to fill available space */}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors truncate block">{job.title}</span>
          <span className="text-xs text-stone-400 truncate block">{job.school_name || "—"}</span>
        </div>
        {/* Department */}
        <span className="w-32 flex-shrink-0 hidden sm:block px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full text-center truncate">{job.department}</span>
        {/* Location */}
        {job.location ? (
          <span className="hidden md:flex w-28 flex-shrink-0 items-center gap-1 text-xs text-stone-500 dark:text-stone-400 truncate">
            <MapPin size={10} className="flex-shrink-0" />{job.location}
          </span>
        ) : <span className="hidden md:block w-28 flex-shrink-0 text-xs text-stone-300">—</span>}
        {/* Salary */}
        {job.salary_range ? (
          <span className="hidden lg:flex w-32 flex-shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            <DollarSign size={10} className="flex-shrink-0" />{job.salary_range}
          </span>
        ) : <span className="hidden lg:block w-32 flex-shrink-0 text-xs text-stone-300">—</span>}
        {/* Date */}
        <span className="hidden sm:flex w-24 flex-shrink-0 items-center gap-1 text-xs text-stone-400">
          <Clock size={10} />{formatDate(job.created_at)}
        </span>
        {/* Action */}
        {isTeacher && (
          <div className="w-20 flex-shrink-0 flex justify-end">
            {applied ? (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/30 cursor-not-allowed">
                <CheckCircle2 size={11} /> Applied
              </span>
            ) : (
              <button onClick={onApplyClick} className="px-3 py-1.5 bg-[#C5A021] text-white text-xs font-bold rounded-lg hover:bg-[#8E6708] transition-colors">
                Apply
              </button>
            )}
          </div>
        )}
        {isSchool && (
          <span className="w-20 flex-shrink-0 text-right px-2 py-1 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium capitalize">{job.status}</span>
        )}
      </div>
      {/* Inline cover letter form */}
      {isTeacher && applyingId === job.id && !applied && (
        <div className="mt-1 px-4 py-3 bg-stone-50 dark:bg-[#221902]/40 border border-stone-200 dark:border-[#8E6708]/20 rounded-xl space-y-2">
          <textarea rows={2} placeholder="Cover letter (optional)..." value={coverLetter}
            onChange={e => onCoverChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-[#8E6708]/30 rounded-lg bg-white dark:bg-[#221902]/60 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 resize-none" />
          <div className="flex gap-2">
            <button onClick={onSubmit} disabled={isPending}
              className="px-4 py-1.5 bg-[#C5A021] text-white text-xs font-bold rounded-lg hover:bg-[#8E6708] transition-colors disabled:opacity-60 flex items-center gap-1">
              {isPending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Submit
            </button>
            <button onClick={onCancel} className="px-3 py-1.5 border border-stone-200 dark:border-[#8E6708]/30 text-xs rounded-lg hover:bg-stone-100 dark:hover:bg-[#221902]/60 transition-colors text-stone-600 dark:text-stone-400">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsManager() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isTeacher = user?.role === "teacher";
  const isSchool  = user?.role === "school";

  // Filters (only used for teacher/admin view)
  const [search, setSearch] = useState("");
  const [depts, setDepts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list"|"card">("list");

  const [openSections, setOpenSections] = useState({ dept: true, location: true, type: true, date: true });
  const toggleSection = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  const { data: appliedJobIds } = useQuery<number[]>({
    queryKey: ["my-applied-job-ids"],
    queryFn: async () => (await api.get("/applications/my-job-ids")).data,
    enabled: isTeacher,
    staleTime: 60_000,
  });
  const appliedSet = new Set([...Array.from(appliedIds), ...(appliedJobIds || [])]);

  const toggleArr = useCallback((arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }, []);

  const activeFilterCount = depts.length + locations.length + jobTypes.length + (dateRange ? 1 : 0);

  // School users: fetch only their own jobs
  const { data: myJobs, isLoading: myJobsLoading } = useQuery<Job[]>({
    queryKey: ["my-jobs"],
    queryFn: async () => (await api.get("/jobs/my")).data,
    enabled: isSchool,
    staleTime: 30_000,
  });

  // Teacher/admin: paginated public job list
  const { data, isLoading } = useQuery<PaginatedResponse<Job>>({
    queryKey: ["jobs", search, depts, locations, jobTypes, dateRange, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "active", page: String(page), size: "12" });
      if (search) params.set("search", search);
      depts.forEach(d => params.append("department", d));
      locations.forEach(l => params.append("location", l));
      jobTypes.forEach(t => params.append("job_type", t));
      if (dateRange) params.set("date_range", dateRange);
      if (sort) params.set("sort", sort);
      const { data } = await api.get(`/jobs?${params}`);
      return data;
    },
    enabled: !isSchool,
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: number) => api.post("/applications", { job_id: jobId, cover_letter: coverLetter }),
    onSuccess: (_, jobId) => {
      setApplyingId(null);
      setCoverLetter("");
      setAppliedIds(s => new Set([...s, jobId]));
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["my-applied-job-ids"] });
    },
  });

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
          {DEPARTMENTS.map(d => <CheckItem key={d} label={d} checked={depts.includes(d)} onChange={() => toggleArr(depts, d, setDepts)} />)}
        </FilterSection>
        <FilterSection title="Location" open={openSections.location} onToggle={() => toggleSection("location")}>
          {LOCATIONS.map(l => <CheckItem key={l} label={l} checked={locations.includes(l)} onChange={() => toggleArr(locations, l, setLocations)} />)}
        </FilterSection>
        <FilterSection title="Job Type" open={openSections.type} onToggle={() => toggleSection("type")}>
          {JOB_TYPES.map(t => <CheckItem key={t} label={t} checked={jobTypes.includes(t)} onChange={() => toggleArr(jobTypes, t, setJobTypes)} />)}
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
              <span className={cn("text-sm transition-colors", dateRange === r.value ? "text-stone-900 dark:text-white font-medium" : "text-stone-600 dark:text-stone-400")}>{r.label}</span>
            </label>
          ))}
        </FilterSection>
      </div>
    </div>
  );

  /* ── School view: own jobs only ── */
  if (isSchool) {
    const jobs = myJobs ?? [];
    const filtered = search ? jobs.filter(j =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department ?? "").toLowerCase().includes(search.toLowerCase())
    ) : jobs;

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">My Job Posts</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">{filtered.length} position{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 rounded-2xl shadow-sm">
          <Search size={18} className="text-stone-400 flex-shrink-0" />
          <input type="text" placeholder="Search your jobs..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={15} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>

        {myJobsLoading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => setSearch("")} hasFilters={!!search} />
        ) : viewMode === "list" ? (
          /* List view: table header + rows */
          <div className="rounded-xl border border-stone-200 dark:border-[#8E6708]/25 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:flex items-center gap-5 px-4 py-2 bg-stone-50 dark:bg-[#221902]/40 border-b border-stone-200 dark:border-[#8E6708]/20 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              <span className="flex-1">Title</span>
              <span className="w-32 flex-shrink-0">Department</span>
              <span className="hidden md:block w-28 flex-shrink-0">Location</span>
              <span className="hidden lg:block w-32 flex-shrink-0">Salary</span>
              <span className="w-24 flex-shrink-0">Posted</span>
              <span className="w-20 flex-shrink-0 text-right">Status</span>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-[#8E6708]/10">
              {filtered.map((job, idx) => (
                <div key={job.id} className={cn("flex items-center gap-5 px-4 py-3 transition-colors group",
                  idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-stone-50/60 dark:bg-[#221902]/30",
                  "hover:bg-amber-50/40 dark:hover:bg-[#221902]/60")}>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors truncate block">{job.title}</span>
                    <span className="text-xs text-stone-400 sm:hidden">{job.department}</span>
                  </div>
                  <span className="hidden sm:block w-32 flex-shrink-0 px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full text-center truncate">{job.department}</span>
                  {job.location ? (
                    <span className="hidden md:flex w-28 flex-shrink-0 items-center gap-1 text-xs text-stone-500 dark:text-stone-400 truncate"><MapPin size={10} />{job.location}</span>
                  ) : <span className="hidden md:block w-28 flex-shrink-0 text-xs text-stone-300">—</span>}
                  {job.salary_range ? (
                    <span className="hidden lg:flex w-32 flex-shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate"><DollarSign size={10} />{job.salary_range}</span>
                  ) : <span className="hidden lg:block w-32 flex-shrink-0 text-xs text-stone-300">—</span>}
                  <span className="hidden sm:flex w-24 flex-shrink-0 items-center gap-1 text-xs text-stone-400"><Clock size={10} />{formatDate(job.created_at)}</span>
                  <span className={cn("w-20 flex-shrink-0 text-right text-xs font-bold capitalize",
                    job.status === "active" ? "text-emerald-600 dark:text-emerald-400" :
                    job.status === "pending" ? "text-amber-600 dark:text-amber-400" : "text-stone-400"
                  )}>{job.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Card view */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(job => (
              <div key={job.id} className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm hover:border-[#C5A021]/40 hover:shadow-md transition-all group flex flex-col overflow-hidden">
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20 flex-shrink-0">
                      <Building2 size={20} className="text-[#C5A021]" />
                    </div>
                    <span className={cn("text-xs font-bold capitalize px-2 py-1 rounded-lg",
                      job.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                      job.status === "pending" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                      "bg-stone-100 dark:bg-stone-800 text-stone-400"
                    )}>{job.status}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors leading-snug">{job.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="px-2.5 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full">{job.department}</span>
                      {job.location && <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded-full flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                      {job.salary_range && <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1"><DollarSign size={10} />{job.salary_range}</span>}
                    </div>
                    {job.description && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-3">{job.description}</p>}
                  </div>
                  <span className="text-xs text-stone-400 flex items-center gap-1"><Clock size={10} />{formatDate(job.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Teacher / Admin view ── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            {isTeacher ? "Job Search" : "Browse Jobs"}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">{data?.total ?? 0} positions found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300">
            <Filter size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
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
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 rounded-xl">
            <ArrowUpDown size={14} className="text-stone-400" />
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-stone-700 dark:text-stone-300 focus:outline-none font-medium">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 rounded-2xl shadow-sm">
        <Search size={18} className="text-stone-400 flex-shrink-0" />
        <input type="text" placeholder="Search by title, school, or keyword..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
        {search && <button onClick={() => setSearch("")}><X size={15} className="text-stone-400 hover:text-stone-600" /></button>}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
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

      {mobileFiltersOpen && <div className="lg:hidden"><FilterPanel /></div>}

      {/* Main layout */}
      <div className="flex gap-6 items-start">
        <div className="hidden lg:block w-56 flex-shrink-0 sticky top-6"><FilterPanel /></div>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
          ) : (
            <>
              {viewMode === "list" ? (
                /* ── LIST VIEW: table-like ── */
                <div className="rounded-xl border border-stone-200 dark:border-[#8E6708]/25 overflow-hidden">
                  {/* Column headers */}
                  <div className="hidden sm:flex items-center gap-5 px-4 py-2 bg-stone-50 dark:bg-[#221902]/40 border-b border-stone-200 dark:border-[#8E6708]/20 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    <span className="flex-1">Title / School</span>
                    <span className="w-32 flex-shrink-0">Department</span>
                    <span className="hidden md:block w-28 flex-shrink-0">Location</span>
                    <span className="hidden lg:block w-32 flex-shrink-0">Salary</span>
                    <span className="w-24 flex-shrink-0">Posted</span>
                    {isTeacher && <span className="w-20 flex-shrink-0 text-right">Action</span>}
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-[#8E6708]/10 bg-white dark:bg-[#221902]/60">
                    {data?.items?.map((job, idx) => (
                      <JobListRow key={job.id} job={job}
                        isTeacher={isTeacher} isSchool={false}
                        applied={appliedSet.has(job.id)}
                        applyingId={applyingId} coverLetter={coverLetter}
                        onApplyClick={() => setApplyingId(job.id)}
                        onCoverChange={setCoverLetter}
                        onSubmit={() => applyMutation.mutate(job.id)}
                        onCancel={() => setApplyingId(null)}
                        isPending={applyMutation.isPending}
                        idx={idx}
                      />
                    ))}
                  </div>
                  {!data?.items?.length && <EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0} />}
                </div>
              ) : (
                /* ── CARD VIEW ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data?.items?.map((job) => {
                    const applied = appliedSet.has(job.id);
                    return (
                      <div key={job.id} className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm hover:border-[#C5A021]/40 hover:shadow-md transition-all group flex flex-col overflow-hidden">
                        <div className="p-5 flex flex-col gap-3 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 flex items-center justify-center border border-[#C5A021]/20 flex-shrink-0">
                              <Briefcase size={20} className="text-[#C5A021]" />
                            </div>
                            <span className="text-xs text-stone-400 flex items-center gap-1 mt-1"><Clock size={10} />{formatDate(job.created_at)}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-[#C5A021] transition-colors leading-snug">{job.title}</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{job.school_name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              <span className="px-2.5 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full">{job.department}</span>
                              {job.location && <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded-full flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                              {job.salary_range && <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1"><DollarSign size={10} />{job.salary_range}</span>}
                            </div>
                            {job.description && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-3">{job.description}</p>}
                          </div>
                        </div>
                        {isTeacher && (
                          <div className="px-5 pb-5">
                            {applied ? (
                              <span className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/30 cursor-not-allowed">
                                <CheckCircle2 size={13} /> Applied
                              </span>
                            ) : applyingId === job.id ? (
                              <div className="space-y-2">
                                <textarea rows={2} placeholder="Cover letter (optional)..." value={coverLetter}
                                  onChange={e => setCoverLetter(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-stone-200 dark:border-[#8E6708]/30 rounded-xl bg-stone-50 dark:bg-[#221902]/60 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 resize-none" />
                                <div className="flex gap-2">
                                  <button onClick={() => applyMutation.mutate(job.id)} disabled={applyMutation.isPending}
                                    className="flex-1 py-2 bg-[#C5A021] text-white text-xs font-bold rounded-xl hover:bg-[#8E6708] transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
                                    {applyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                                  </button>
                                  <button onClick={() => setApplyingId(null)} className="px-3 py-2 border border-stone-200 dark:border-[#8E6708]/30 text-xs rounded-xl hover:bg-stone-50 dark:hover:bg-[#221902]/60 transition-colors text-stone-600 dark:text-stone-400">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setApplyingId(job.id)}
                                className="w-full py-2.5 bg-[#C5A021] text-white text-xs font-bold rounded-xl hover:bg-[#8E6708] transition-colors shadow-sm">
                                Apply Now
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!data?.items?.length && <div className="col-span-2"><EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0} /></div>}
                </div>
              )}

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
  );
}
