"use client";
import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, CheckCircle2, User, GraduationCap, Briefcase, FileText,
  ChevronRight, ChevronLeft, Phone, MapPin, DollarSign, BookOpen,
  Building2, Globe, Hash, Users, School, Check, Upload, X,
  Download, Trash2, Plus,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const TEACHER_STEPS = [
  { id: 1, label: "Personal Info", icon: User, desc: "Your basic details" },
  { id: 2, label: "Teaching", icon: GraduationCap, desc: "Subject & experience" },
  { id: 3, label: "Preferences", icon: MapPin, desc: "Location & salary" },
  { id: 4, label: "Documents", icon: FileText, desc: "CV & certificates" },
];
const SCHOOL_STEPS = [
  { id: 1, label: "School Info", icon: School, desc: "Basic information" },
  { id: 2, label: "Details", icon: Building2, desc: "Type & level" },
  { id: 3, label: "About", icon: BookOpen, desc: "Description & history" },
  { id: 4, label: "Verification", icon: FileText, desc: "License & contact" },
];
const DEPARTMENTS = [
  "Mathematics","English","Science","Biology","Chemistry","Physics",
  "History","Geography","Amharic","Art","Music","PE","ICT","Other",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");

function fileUrl(path: string) {
  // path is like "uploads/cv/abc.pdf"
  return `${API_BASE}/${path}`;
}

interface UploadZoneProps {
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  icon: React.ElementType;
  files: File[];
  onFiles: (files: File[]) => void;
}

function UploadZone({ label, hint, accept, multiple, icon: Icon, files, onFiles }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-stone-200 dark:border-[#8E6708]/30 rounded-2xl p-6 text-center hover:border-[#C5A021]/60 transition-colors cursor-pointer group"
      >
        <Icon size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-600 group-hover:text-[#C5A021] transition-colors" />
        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{label}</p>
        <p className="text-xs text-stone-400 mt-1">{hint}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A021]/10 text-[#C5A021] rounded-lg text-xs font-semibold">
          <Upload size={12} /> Choose File{multiple ? "s" : ""}
        </div>
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={e => {
            const picked = Array.from(e.target.files || []);
            onFiles(multiple ? [...files, ...picked] : picked);
            e.target.value = "";
          }} />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-[#221902]/60 border border-amber-200 dark:border-[#8E6708]/30 rounded-lg text-xs">
              <span className="truncate text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Upload size={11} className="text-[#C5A021] shrink-0" />
                {f.name}
              </span>
              <button type="button" onClick={() => onFiles(files.filter((_, j) => j !== i))} className="ml-2 text-stone-400 hover:text-red-500">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SavedFileRowProps {
  path: string;
  label?: string;
  icon: React.ElementType;
  onDelete: (path: string) => void;
  deleting: boolean;
}

function SavedFileRow({ path, label, icon: Icon, onDelete, deleting }: SavedFileRowProps) {
  const name = label || path.split("/").pop() || path;
  const url = fileUrl(path);
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 min-w-0">
        <Icon size={14} className="shrink-0" />
        <span className="truncate font-medium">{name}</span>
        <span className="text-emerald-500 shrink-0 hidden sm:inline">— saved</span>
      </div>
      <div className="flex items-center gap-1 ml-3 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-[#C5A021] hover:bg-[#C5A021]/10 transition-colors"
          title="Download / View"
        >
          <Download size={14} />
        </a>
        <button
          type="button"
          onClick={() => onDelete(path)}
          disabled={deleting}
          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
          title="Delete"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function ProfileBuilder() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isTeacher = user?.role === "teacher";
  const STEPS = isTeacher ? TEACHER_STEPS : SCHOOL_STEPS;

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [extraCertFiles, setExtraCertFiles] = useState<File[][]>([]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: serverProfile, isLoading } = useQuery<AnyRecord>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await api.get(isTeacher ? "/teachers/me" : "/schools/me");
      return res.data;
    },
    staleTime: 0,
  });

  const p = serverProfile || {};

  // Sync form from server data (only once, or when profile first loads)
  const [form, setForm] = useState<AnyRecord>({});
  const syncedRef = useRef(false);

  useEffect(() => {
    if (serverProfile && !syncedRef.current) {
      syncedRef.current = true;
      setForm({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        phone: p.phone || "",
        address: p.address || "",
        department: p.department || "",
        salary_expectation: p.salary_expectation ? String(p.salary_expectation) : "",
        preferred_location: p.preferred_location || "",
        work_experience: p.work_experience || "",
        school_name: p.school_name || "",
        representative_name: p.representative_name || "",
        website: p.website || "",
        description: p.description || "",
        school_type: p.school_type || "",
        school_level: p.school_level || "",
        founded_year: p.founded_year ? String(p.founded_year) : "",
        license_number: p.license_number || "",
        email: p.email || "",
        number_of_students: p.number_of_students ? String(p.number_of_students) : "",
        number_of_teachers: p.number_of_teachers ? String(p.number_of_teachers) : "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProfile]);

  const set = (k: string, v: string) => setForm((f: AnyRecord) => ({ ...f, [k]: v }));

  const buildPayload = (): AnyRecord => {
    if (isTeacher) {
      const out: AnyRecord = {};
      if (form.first_name) out.first_name = form.first_name;
      if (form.last_name) out.last_name = form.last_name;
      if (form.phone) out.phone = form.phone;
      if (form.address) out.address = form.address;
      if (form.department) out.department = form.department;
      if (form.work_experience) out.work_experience = form.work_experience;
      if (form.preferred_location) out.preferred_location = form.preferred_location;
      if (form.salary_expectation) out.salary_expectation = parseFloat(form.salary_expectation);
      return out;
    } else {
      const out: AnyRecord = {};
      if (form.school_name) out.school_name = form.school_name;
      if (form.representative_name) out.representative_name = form.representative_name;
      if (form.phone) out.phone = form.phone;
      if (form.address) out.address = form.address;
      if (form.website) out.website = form.website;
      if (form.description) out.description = form.description;
      if (form.school_type) out.school_type = form.school_type;
      if (form.school_level) out.school_level = form.school_level;
      if (form.founded_year) out.founded_year = parseInt(form.founded_year);
      if (form.license_number) out.license_number = form.license_number;
      if (form.email) out.email = form.email;
      if (form.number_of_students) out.number_of_students = parseInt(form.number_of_students);
      if (form.number_of_teachers) out.number_of_teachers = parseInt(form.number_of_teachers);
      return out;
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Save profile fields
      await api.put(isTeacher ? "/teachers/me" : "/schools/me", buildPayload());

      // 2. Upload files
      if (isTeacher) {
        const allCerts = [...certFiles, ...extraCertFiles.flat()];
        if (cvFiles.length > 0 || allCerts.length > 0) {
          const fd = new FormData();
          cvFiles.forEach(f => fd.append("cv", f));
          allCerts.forEach(f => fd.append("documents", f));
          await api.post("/teachers/me/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // School: upload license file if selected
        if (cvFiles.length > 0) {
          const fd = new FormData();
          fd.append("license", cvFiles[0]);
          await api.post("/schools/me/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }
    },
    onSuccess: async () => {
      // Clear pending file selections
      setCvFiles([]);
      setCertFiles([]);
      setExtraCertFiles([]);
      // Force re-fetch so SavedFileRow updates immediately
      await qc.refetchQueries({ queryKey: ["my-profile"] });
      showToast("Profile saved successfully!", true);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(msg || "Failed to save. Please try again.", false);
    },
  });

  const handleDelete = async (path: string) => {
    setDeletingPath(path);
    try {
      if (isTeacher) {
        await api.delete(`/teachers/me/document?path=${encodeURIComponent(path)}`);
      } else {
        await api.delete("/schools/me/license");
      }
      await qc.refetchQueries({ queryKey: ["my-profile"] });
      showToast("File deleted.", true);
    } catch {
      showToast("Failed to delete file.", false);
    } finally {
      setDeletingPath(null);
    }
  };

  // Progress based on filled profile fields
  const calcProgress = () => {
    if (!serverProfile) return Math.round((step / STEPS.length) * 100);
    if (isTeacher) {
      const fields = [p.first_name, p.last_name, p.phone, p.department, p.work_experience, p.preferred_location, p.salary_expectation, p.cv_path];
      const filled = fields.filter(Boolean).length;
      return Math.round((filled / fields.length) * 100);
    } else {
      const fields = [p.school_name, p.representative_name, p.phone, p.school_type, p.school_level, p.description, p.founded_year, p.license_number, p.license_file_path];
      const filled = fields.filter(Boolean).length;
      return Math.round((filled / fields.length) * 100);
    }
  };
  const progress = calcProgress();

  const isProfileSaved = !!serverProfile && (isTeacher ? !!p.first_name : !!p.school_name);

  const inputCls = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/60 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all placeholder:text-stone-400 text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5";

  // Parse saved documents from comma-separated string
  const savedDocs: string[] = p.additional_documents
    ? String(p.additional_documents).split(",").filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[#C5A021]" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2",
          toast.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          {isTeacher ? "Build Your Profile" : "School Profile"}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
          {isTeacher ? "A complete profile increases your chances by 3×." : "Help teachers learn about your school."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm p-5 sticky top-6">
            <div className="flex flex-col items-center mb-6 pb-5 border-b border-stone-100 dark:border-[#8E6708]/20">
              <div className="relative w-20 h-20 mb-3">
                <svg className="-rotate-90 w-20 h-20">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-stone-100 dark:text-stone-800" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#C5A021" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                    strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-stone-900 dark:text-white">{progress}%</span>
              </div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Profile Complete</p>
            </div>
            <div className="space-y-2">
              {STEPS.map((s) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <button key={s.id} onClick={() => setStep(s.id)}
                    className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                      active ? "bg-[#221902] text-white shadow-sm" : "text-stone-400 hover:bg-stone-50 dark:hover:bg-[#221902]/40")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      active ? "bg-[#C5A021] text-white" : done ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-stone-100 dark:bg-stone-800 text-stone-400")}>
                      {done ? <Check size={14} /> : <s.icon size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-bold truncate", active ? "text-white" : "")}>{s.label}</p>
                      <p className={cn("text-[10px] truncate", active ? "text-stone-300" : "text-stone-400")}>{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-stone-100 dark:border-[#8E6708]/20">
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all disabled:opacity-60 text-sm"
              >
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isProfileSaved ? "Update Profile" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-200 dark:border-[#8E6708]/25 shadow-sm overflow-hidden">
            {/* Step header */}
            <div className="px-8 py-6 border-b border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A021]/10 flex items-center justify-center">
                  {(() => { const S = STEPS[step - 1]; return <S.icon size={20} className="text-[#C5A021]" />; })()}
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 dark:text-white">{STEPS[step - 1].label}</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{STEPS[step - 1].desc}</p>
                </div>
                <div className="ml-auto text-xs text-stone-400 font-medium">Step {step} of {STEPS.length}</div>
              </div>
            </div>

            <div className="p-8">
              {/* TEACHER STEP 1 */}
              {isTeacher && step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}><User size={12} /> First Name</label>
                    <input value={form.first_name || ""} onChange={e => set("first_name", e.target.value)} placeholder="Abebe" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><User size={12} /> Last Name</label>
                    <input value={form.last_name || ""} onChange={e => set("last_name", e.target.value)} placeholder="Kebede" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Phone size={12} /> Phone Number</label>
                    <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+251 9XX XXX XXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><MapPin size={12} /> Address</label>
                    <input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Addis Ababa, Ethiopia" className={inputCls} />
                  </div>
                </div>
              )}

              {/* TEACHER STEP 2 */}
              {isTeacher && step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}><GraduationCap size={12} /> Department / Subject</label>
                    <select value={form.department || ""} onChange={e => set("department", e.target.value)} className={inputCls}>
                      <option value="">Select your subject</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><Briefcase size={12} /> Work Experience</label>
                    <textarea rows={6} value={form.work_experience || ""} onChange={e => set("work_experience", e.target.value)}
                      placeholder="Describe your teaching experience..." className={cn(inputCls, "resize-none")} />
                  </div>
                </div>
              )}

              {/* TEACHER STEP 3 */}
              {isTeacher && step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}><MapPin size={12} /> Preferred Location</label>
                    <input value={form.preferred_location || ""} onChange={e => set("preferred_location", e.target.value)} placeholder="e.g. Addis Ababa" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><DollarSign size={12} /> Salary Expectation (ETB/month)</label>
                    <input type="number" value={form.salary_expectation || ""} onChange={e => set("salary_expectation", e.target.value)} placeholder="e.g. 15000" className={inputCls} />
                  </div>
                  <div className="md:col-span-2 p-5 bg-[#C5A021]/5 rounded-xl border border-[#C5A021]/20">
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">💡 Tip</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Teachers who specify a preferred location receive 2× more relevant invitations.</p>
                  </div>
                </div>
              )}

              {/* TEACHER STEP 4 — Documents */}
              {isTeacher && step === 4 && (
                <div className="space-y-6">
                  {/* CV */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <FileText size={12} /> CV / Resume
                    </p>
                    {p.cv_path ? (
                      <SavedFileRow
                        path={String(p.cv_path)}
                        icon={FileText}
                        onDelete={handleDelete}
                        deleting={deletingPath === p.cv_path}
                      />
                    ) : (
                      <UploadZone
                        label="Upload CV / Resume"
                        hint="PDF, DOCX up to 10MB"
                        accept=".pdf,.doc,.docx"
                        icon={FileText}
                        files={cvFiles}
                        onFiles={setCvFiles}
                      />
                    )}
                    {/* Allow replacing CV even if one exists */}
                    {p.cv_path && cvFiles.length === 0 && (
                      <button
                        type="button"
                        className="text-xs text-[#C5A021] hover:underline flex items-center gap-1"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,.doc,.docx";
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            if (files.length) setCvFiles(files);
                          };
                          input.click();
                        }}
                      >
                        <Upload size={11} /> Replace CV
                      </button>
                    )}
                    {cvFiles.length > 0 && (
                      <ul className="space-y-1">
                        {cvFiles.map((f, i) => (
                          <li key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-[#221902]/60 border border-amber-200 dark:border-[#8E6708]/30 rounded-lg text-xs">
                            <span className="truncate text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                              <Upload size={11} className="text-[#C5A021] shrink-0" /> {f.name}
                            </span>
                            <button type="button" onClick={() => setCvFiles(cvFiles.filter((_, j) => j !== i))} className="ml-2 text-stone-400 hover:text-red-500">
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Degree / Certificates */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <GraduationCap size={12} /> Degree &amp; Certificates
                    </p>
                    <UploadZone
                      label="Upload Degree / Certificate"
                      hint="JPG, PNG, PDF up to 10MB"
                      accept=".pdf,.jpg,.jpeg,.png"
                      icon={GraduationCap}
                      files={certFiles}
                      onFiles={setCertFiles}
                    />
                    {savedDocs.map((docPath, i) => (
                      <SavedFileRow
                        key={i}
                        path={docPath}
                        icon={GraduationCap}
                        onDelete={handleDelete}
                        deleting={deletingPath === docPath}
                      />
                    ))}
                  </div>

                  {/* Extra certificate slots */}
                  {extraCertFiles.map((files, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          <GraduationCap size={12} /> Additional Certificate {idx + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => setExtraCertFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                      <UploadZone
                        label="Upload Certificate"
                        hint="JPG, PNG, PDF up to 10MB"
                        accept=".pdf,.jpg,.jpeg,.png"
                        icon={GraduationCap}
                        files={files}
                        onFiles={f => setExtraCertFiles(prev => prev.map((p, i) => i === idx ? f : p))}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setExtraCertFiles(prev => [...prev, []])}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#C5A021]/40 text-[#C5A021] rounded-xl text-xs font-semibold hover:border-[#C5A021] hover:bg-[#C5A021]/5 transition-all"
                  >
                    <Plus size={14} /> Add Additional Certificate
                  </button>
                </div>
              )}

              {/* SCHOOL STEP 1 */}
              {!isTeacher && step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}><School size={12} /> School Name</label>
                    <input value={form.school_name || ""} onChange={e => set("school_name", e.target.value)} placeholder="Addis International School" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><User size={12} /> Representative Name</label>
                    <input value={form.representative_name || ""} onChange={e => set("representative_name", e.target.value)} placeholder="Full name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Phone size={12} /> Phone</label>
                    <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+251 11 XXX XXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><MapPin size={12} /> Address</label>
                    <input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Addis Ababa, Ethiopia" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Globe size={12} /> Website</label>
                    <input value={form.website || ""} onChange={e => set("website", e.target.value)} placeholder="https://yourschool.edu.et" className={inputCls} />
                  </div>
                </div>
              )}

              {/* SCHOOL STEP 2 */}
              {!isTeacher && step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}><Building2 size={12} /> School Type</label>
                    <select value={form.school_type || ""} onChange={e => set("school_type", e.target.value)} className={inputCls}>
                      <option value="">Select type</option>
                      {["Private","Government","International","NGO","Faith-based"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><GraduationCap size={12} /> School Level</label>
                    <select value={form.school_level || ""} onChange={e => set("school_level", e.target.value)} className={inputCls}>
                      <option value="">Select level</option>
                      {["Kindergarten","Primary","Secondary","Preparatory","K-12"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><Users size={12} /> Number of Students</label>
                    <input type="number" value={form.number_of_students || ""} onChange={e => set("number_of_students", e.target.value)} placeholder="e.g. 500" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Users size={12} /> Number of Teachers</label>
                    <input type="number" value={form.number_of_teachers || ""} onChange={e => set("number_of_teachers", e.target.value)} placeholder="e.g. 40" className={inputCls} />
                  </div>
                </div>
              )}

              {/* SCHOOL STEP 3 */}
              {!isTeacher && step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}><BookOpen size={12} /> School Description</label>
                    <textarea rows={5} value={form.description || ""} onChange={e => set("description", e.target.value)}
                      placeholder="Tell teachers about your school's mission, values..." className={cn(inputCls, "resize-none")} />
                  </div>
                  <div>
                    <label className={labelCls}><Hash size={12} /> Founded Year</label>
                    <input type="number" value={form.founded_year || ""} onChange={e => set("founded_year", e.target.value)} placeholder="e.g. 1995" className={inputCls} />
                  </div>
                </div>
              )}

              {/* SCHOOL STEP 4 */}
              {!isTeacher && step === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}><Hash size={12} /> License Number</label>
                    <input value={form.license_number || ""} onChange={e => set("license_number", e.target.value)} placeholder="MOE-XXXX-XXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Globe size={12} /> Contact Email</label>
                    <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="info@school.edu.et" className={inputCls} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <FileText size={12} /> School License Document
                    </p>
                    {p.license_file_path && cvFiles.length === 0 ? (
                      <>
                        <SavedFileRow
                          path={String(p.license_file_path)}
                          icon={FileText}
                          onDelete={handleDelete}
                          deleting={deletingPath === p.license_file_path}
                        />
                        <button
                          type="button"
                          className="text-xs text-[#C5A021] hover:underline flex items-center gap-1"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.jpg,.jpeg,.png";
                            input.onchange = (e) => {
                              const files = Array.from((e.target as HTMLInputElement).files || []);
                              if (files.length) setCvFiles(files);
                            };
                            input.click();
                          }}
                        >
                          <Upload size={11} /> Replace License
                        </button>
                      </>
                    ) : (
                      <UploadZone
                        label="Upload School License"
                        hint="PDF, JPG, PNG up to 10MB"
                        accept=".pdf,.jpg,.jpeg,.png"
                        icon={FileText}
                        files={cvFiles}
                        onFiles={setCvFiles}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="px-8 py-5 border-t border-stone-100 dark:border-[#8E6708]/20 bg-stone-50/50 dark:bg-[#221902]/40 flex items-center justify-between">
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 border border-stone-200 dark:border-[#8E6708]/30 text-stone-600 dark:text-stone-400 font-semibold rounded-xl hover:bg-stone-100 dark:hover:bg-[#221902]/60 transition-all disabled:opacity-30 text-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="flex items-center gap-2">
                {STEPS.map(s => (
                  <div key={s.id} className={cn("h-1.5 rounded-full transition-all duration-300",
                    step === s.id ? "w-6 bg-[#C5A021]" : step > s.id ? "w-3 bg-[#C5A021]/50" : "w-3 bg-stone-200 dark:bg-stone-700")} />
                ))}
              </div>
              {step < STEPS.length ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all text-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all disabled:opacity-60 text-sm"
                >
                  {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isProfileSaved ? "Update Profile" : "Save Profile"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
