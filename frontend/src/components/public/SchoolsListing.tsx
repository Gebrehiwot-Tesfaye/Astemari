"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Building2, MapPin, Users, Loader2, X, Filter,
  ChevronDown, ChevronUp, SlidersHorizontal, CheckCircle2,
  GraduationCap, ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { School, PaginatedResponse } from "@/types";

const LOCATIONS = ["Addis Ababa","Dire Dawa","Bahir Dar","Mekelle","Hawassa","Adama","Gondar","Jimma"];
const SCHOOL_TYPES = ["Private","Government","International","NGO","Faith-based"];
const SCHOOL_LEVELS = ["Kindergarten","Primary","Secondary","Preparatory","K-12"];

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

export default function SchoolsListing() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ location: true, type: true, level: true });
  const toggleSection = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const toggleArr = useCallback((arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }, []);

  const activeFilterCount = locations.length + types.length + levels.length;

  const { data, isLoading } = useQuery<PaginatedResponse<School>>({
    queryKey: ["public-schools", search, locations, types, levels, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (search) params.set("search", search);
      locations.forEach(l => params.append("location", l));
      types.forEach(t => params.append("school_type", t));
      levels.forEach(l => params.append("school_level", l));
      return (await api.get(`/schools?${params}`)).data;
    },
  });

  const clearFilters = () => { setLocations([]); setTypes([]); setLevels([]); setSearch(""); setPage(1); };

  const FilterPanel = () => (
    <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40">
        <span className="text-sm font-bold text-stone-800 dark:text-white flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#C5A021]" /> Filters
          {activeFilterCount > 0 && <span className="w-5 h-5 bg-[#C5A021] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>}
        </span>
        {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-[#C5A021] font-bold hover:underline flex items-center gap-1"><X size={11} /> Clear all</button>}
      </div>
      <div className="px-4 py-2">
        <FilterSection title="Location" open={openSections.location} onToggle={() => toggleSection("location")}>
          {LOCATIONS.map(l => <CheckItem key={l} label={l} checked={locations.includes(l)} onChange={() => toggleArr(locations, l, setLocations)} />)}
        </FilterSection>
        <FilterSection title="School Type" open={openSections.type} onToggle={() => toggleSection("type")}>
          {SCHOOL_TYPES.map(t => <CheckItem key={t} label={t} checked={types.includes(t)} onChange={() => toggleArr(types, t, setTypes)} />)}
        </FilterSection>
        <FilterSection title="School Level" open={openSections.level} onToggle={() => toggleSection("level")}>
          {SCHOOL_LEVELS.map(l => <CheckItem key={l} label={l} checked={levels.includes(l)} onChange={() => toggleArr(levels, l, setLevels)} />)}
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
          <p className="text-[#C5A021]/40 text-3xl font-bold mb-1 select-none">ት/ቤቶች</p>
          <h1 className="text-3xl font-bold text-white mb-2">Partner Schools</h1>
          <p className="text-stone-400 text-sm">{data?.total ?? 0} verified schools across Ethiopia</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-2xl shadow-sm">
          <Search size={18} className="text-stone-400 flex-shrink-0" />
          <input type="text" placeholder="Search by school name, location, or type..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          {search && <button onClick={() => setSearch("")}><X size={15} className="text-stone-400 hover:text-stone-600" /></button>}
        </div>
        <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/30 rounded-2xl text-sm font-semibold text-stone-700 dark:text-stone-300 shadow-sm">
          <Filter size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {locations.map(l => <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800/30"><MapPin size={10} /> {l} <button onClick={() => toggleArr(locations, l, setLocations)}><X size={10} /></button></span>)}
          {types.map(t => <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-xs font-bold rounded-full border border-[#C5A021]/20">{t} <button onClick={() => toggleArr(types, t, setTypes)}><X size={10} /></button></span>)}
          {levels.map(l => <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800/30"><GraduationCap size={10} /> {l} <button onClick={() => toggleArr(levels, l, setLevels)}><X size={10} /></button></span>)}
        </div>
      )}
      {mobileFiltersOpen && <div className="lg:hidden mb-4"><FilterPanel /></div>}
      <div className="flex gap-6 items-start">
        <div className="hidden lg:block w-56 flex-shrink-0 sticky top-24"><FilterPanel /></div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#C5A021]" /></div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {data?.items?.map((school) => (
                  <div key={school.id} className="relative bg-white dark:bg-[#221902]/60 p-5 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group overflow-hidden">
                    {/* Ethiopian flag stripe top */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                      <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0 border border-[#C5A021]/20">
                        <Building2 size={22} className="text-[#C5A021]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#221902] dark:text-white group-hover:text-[#C5A021] transition-colors truncate">{school.school_name}</h3>
                        {school.representative_name && <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{school.representative_name}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {school.school_level && <span className="px-2 py-0.5 bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] text-[10px] font-bold rounded-full uppercase tracking-wide">{school.school_level}</span>}
                      {school.school_type && <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold rounded-full uppercase tracking-wide">{school.school_type}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400 mb-3">
                      {school.address && <span className="flex items-center gap-1"><MapPin size={10} /> {school.address}</span>}
                      {school.number_of_teachers && <span className="flex items-center gap-1"><Users size={10} /> {school.number_of_teachers} teachers</span>}
                      {school.founded_year && <span className="flex items-center gap-1"><GraduationCap size={10} /> Est. {school.founded_year}</span>}
                    </div>
                    {school.description && <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{school.description}</p>}
                    <button onClick={() => user ? router.push("/dashboard/jobs") : router.push("/login")}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-50 dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl hover:bg-[#C5A021] hover:text-white hover:border-[#C5A021] transition-all">
                      View details <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
                {!data?.items?.length && (
                  <div className="col-span-2 py-20 text-center text-stone-400">
                    <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-lg">No schools found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                    {activeFilterCount > 0 && <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#C5A021] text-white text-sm font-bold rounded-xl hover:bg-[#8E6708] transition-colors">Clear Filters</button>}
                  </div>
                )}
              </div>
              {(data?.pages ?? 0) > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: data!.pages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all", page === i + 1 ? "bg-[#C5A021] text-white shadow-sm" : "bg-white dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/25 text-stone-500 hover:border-[#C5A021]/40")}>{i + 1}</button>
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
