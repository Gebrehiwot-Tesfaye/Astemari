"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, MapPin, BookOpen, Briefcase, Calendar,
  Filter, X, FileText, Paperclip, DollarSign,
  ChevronRight, ExternalLink, User
} from "lucide-react";
import api from "@/lib/api";

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  department: string | null;
  address: string | null;
  preferred_location: string | null;
  work_experience: string | null;
  phone: string | null;
  profile_picture: string | null;
  salary_expectation: string | null;
  status: string;
  created_at: string;
  cv_path?: string | null;
  additional_documents?: string | null;
}

const EXPERIENCE_OPTIONS = [
  { label: "Any Experience", value: "" },
  { label: "0–2 years", value: "0-2" },
  { label: "3–5 years", value: "3-5" },
  { label: "6–10 years", value: "6-10" },
  { label: "10+ years", value: "10+" },
];

function experienceYears(workExp: string | null): number {
  if (!workExp) return 0;
  const match = workExp.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function matchesExperience(teacher: Teacher, filter: string): boolean {
  if (!filter) return true;
  const yrs = experienceYears(teacher.work_experience);
  if (filter === "0-2") return yrs <= 2;
  if (filter === "3-5") return yrs >= 3 && yrs <= 5;
  if (filter === "6-10") return yrs >= 6 && yrs <= 10;
  if (filter === "10+") return yrs >= 10;
  return true;
}

export default function TeachersListing() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const SIZE = 12;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), size: String(SIZE) };
      if (search) params.search = search;
      if (department) params.department = department;
      if (location) params.location = location;
      const res = await api.get("/teachers/public", { params });
      setTeachers(res.data.items);
      setTotal(res.data.total);
      setDepartments(res.data.departments || []);
    } catch {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [page, department, location, search]);

  useEffect(() => { fetchTeachers(); }, [page, department, location]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchTeachers(); }, 400);
  }

  function clearFilters() {
    setSearch(""); setDepartment(""); setLocation(""); setExperience(""); setPage(1);
  }

  const filtered = experience ? teachers.filter(t => matchesExperience(t, experience)) : teachers;
  const hasFilters = !!(search || department || location || experience);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09]">
      {/* Header */}
      <div className="bg-[#221902] py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
        </div>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#C5A021]/40 text-3xl font-bold mb-1 select-none">አስተማሪዎች</p>
          <h1 className="text-3xl font-bold text-white mb-2">Browse Teachers</h1>
          <p className="text-stone-400 text-sm">Find qualified Ethiopian teachers across all departments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + filter bar */}
        <div className="bg-white dark:bg-[#221902] rounded-2xl shadow border border-stone-100 dark:border-[#8E6708]/30 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10">
              <Search size={16} className="text-stone-400 flex-shrink-0" />
              <input value={search} onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by name or department..."
                className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
              {search && (
                <button type="button" onClick={() => handleSearchChange("")}>
                  <X size={14} className="text-stone-400 hover:text-stone-600" />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 hover:border-[#C5A021]/50 transition-colors">
              <Filter size={15} /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-[#C5A021]" />}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 block">Department</label>
                <select value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 block">Location</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl">
                  <MapPin size={14} className="text-stone-400 flex-shrink-0" />
                  <input value={location} onChange={e => { setLocation(e.target.value); setPage(1); }}
                    placeholder="City or region..."
                    className="bg-transparent w-full focus:outline-none text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 block">Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none">
                  {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button type="button" onClick={clearFilters}
                  className="sm:col-span-3 flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#DA121A] transition-colors w-fit">
                  <X size={13} /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          {loading ? "Loading..." : `${total} teacher${total !== 1 ? "s" : ""} found`}
        </p>

        {/* Cards — full width list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#221902] rounded-2xl p-5 animate-pulse h-44 border border-stone-100 dark:border-[#8E6708]/20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No teachers found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(teacher => (
              <TeacherCard key={teacher.id} teacher={teacher} onClick={() => setSelected(teacher)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > SIZE && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 hover:border-[#C5A021]/50 transition-colors text-stone-700 dark:text-stone-300">
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400">
              Page {page} of {Math.ceil(total / SIZE)}
            </span>
            <button disabled={page >= Math.ceil(total / SIZE)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 hover:border-[#C5A021]/50 transition-colors text-stone-700 dark:text-stone-300">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Full-screen detail modal */}
      {selected && (
        <TeacherModal
          teacher={selected}
          onClose={() => setSelected(null)}
          onInvite={() => router.push("/login")}
        />
      )}
    </div>
  );
}

/* ── Summary card (grid cell) ── */
function TeacherCard({ teacher, onClick }: { teacher: Teacher; onClick: () => void }) {
  const initials = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase();
  const yrs = experienceYears(teacher.work_experience);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "";

  return (
    <button onClick={onClick}
      className="relative w-full text-left bg-white dark:bg-[#221902] rounded-2xl border border-stone-200 dark:border-[#8E6708]/20 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 p-5 group flex flex-col gap-3 overflow-hidden">
      {/* Ethiopian flag stripe top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 flex">
        <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
      </div>
      {/* Top row: avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#C5A021]/10 flex items-center justify-center">
          {teacher.profile_picture ? (
            <Image src={`${apiBase}/${teacher.profile_picture}`} alt={teacher.first_name} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-[#C5A021] font-bold text-lg">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#221902] dark:text-white text-sm truncate">
            {teacher.first_name} {teacher.last_name}
          </h3>
          {teacher.department && (
            <p className="text-[#C5A021] text-xs font-medium truncate">{teacher.department}</p>
          )}
        </div>
        <ChevronRight size={16} className="text-stone-300 group-hover:text-[#C5A021] transition-colors flex-shrink-0" />
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        {teacher.preferred_location && (
          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            <MapPin size={11} /> {teacher.preferred_location}
          </span>
        )}
        {yrs > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            <Briefcase size={11} /> {yrs}+ yrs
          </span>
        )}
        {teacher.salary_expectation && (
          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            <DollarSign size={11} /> ETB {Number(teacher.salary_expectation).toLocaleString()}
          </span>
        )}
        {teacher.address && (
          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            <User size={11} /> {teacher.address}
          </span>
        )}
      </div>

      {/* Experience preview */}
      {teacher.work_experience && (
        <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-2 leading-relaxed">
          {teacher.work_experience}
        </p>
      )}
    </button>
  );
}

/* ── Full-screen detail modal ── */
function TeacherModal({ teacher, onClose, onInvite }: {
  teacher: Teacher;
  onClose: () => void;
  onInvite: () => void;
}) {
  const initials = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase();
  const yrs = experienceYears(teacher.work_experience);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "";

  const additionalDocs = teacher.additional_documents
    ? teacher.additional_documents.split(",").filter(Boolean)
    : [];

  function docName(path: string) {
    return path.split("/").pop() ?? path;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c0a09] overflow-y-auto flex flex-col
        rounded-3xl max-h-[90vh]">

        {/* Top accent */}
        <div className="h-1 flex flex-shrink-0">
          <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 transition-colors">
          <X size={16} className="text-stone-600 dark:text-stone-300" />
        </button>

        {/* Hero section */}
        <div className="bg-[#221902] px-6 pt-8 pb-6 flex-shrink-0">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-[#C5A021]/20 flex items-center justify-center border-2 border-[#C5A021]/30">
              {teacher.profile_picture ? (
                <Image src={`${apiBase}/${teacher.profile_picture}`} alt={teacher.first_name} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <span className="text-[#C5A021] font-bold text-3xl">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-bold text-white">
                {teacher.first_name} {teacher.last_name}
              </h2>
              {teacher.department && (
                <p className="text-[#C5A021] font-semibold mt-0.5">{teacher.department}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {teacher.preferred_location && (
                  <span className="flex items-center gap-1.5 text-xs text-stone-300">
                    <MapPin size={13} /> {teacher.preferred_location}
                  </span>
                )}
                {yrs > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-stone-300">
                    <Briefcase size={13} /> {yrs}+ years experience
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-stone-300">
                  <Calendar size={13} /> Joined {new Date(teacher.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-6">

          {/* Quick info pills */}
          <div className="flex flex-wrap gap-2">
            {teacher.address && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-white/5 rounded-xl text-xs text-stone-600 dark:text-stone-300">
                <MapPin size={12} className="text-[#C5A021]" /> {teacher.address}
              </span>
            )}
            {teacher.salary_expectation && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#078930]/10 rounded-xl text-xs text-[#078930] font-semibold">
                <DollarSign size={12} /> ETB {Number(teacher.salary_expectation).toLocaleString()} / month
              </span>
            )}
          </div>

          {/* Work experience */}
          {teacher.work_experience && (
            <div>
              <h3 className="text-sm font-bold text-[#221902] dark:text-white mb-2 flex items-center gap-2">
                <Briefcase size={15} className="text-[#C5A021]" /> Work Experience
              </h3>
              <div className="bg-stone-50 dark:bg-white/5 rounded-xl p-4 text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                {teacher.work_experience}
              </div>
            </div>
          )}

          {/* CV */}
          {teacher.cv_path && (
            <div>
              <h3 className="text-sm font-bold text-[#221902] dark:text-white mb-2 flex items-center gap-2">
                <FileText size={15} className="text-[#C5A021]" /> CV / Resume
              </h3>
              <a href={`${apiBase}/${teacher.cv_path}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10 hover:border-[#C5A021]/50 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[#C5A021]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-[#C5A021]" />
                </div>
                <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">{docName(teacher.cv_path)}</span>
                <ExternalLink size={14} className="text-stone-400 group-hover:text-[#C5A021] transition-colors flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Additional documents */}
          {additionalDocs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#221902] dark:text-white mb-2 flex items-center gap-2">
                <Paperclip size={15} className="text-[#C5A021]" /> Attachments ({additionalDocs.length})
              </h3>
              <div className="space-y-2">
                {additionalDocs.map((doc, i) => (
                  <a key={i} href={`${apiBase}/${doc}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10 hover:border-[#C5A021]/50 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-stone-200 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Paperclip size={15} className="text-stone-500 dark:text-stone-400" />
                    </div>
                    <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">{docName(doc)}</span>
                    <ExternalLink size={14} className="text-stone-400 group-hover:text-[#C5A021] transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky invite button */}
        <div className="sticky bottom-0 p-4 bg-white dark:bg-[#0c0a09] border-t border-stone-100 dark:border-white/10 flex-shrink-0">
          <button onClick={onInvite}
            className="w-full py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors text-sm shadow-lg shadow-[#C5A021]/25">
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
