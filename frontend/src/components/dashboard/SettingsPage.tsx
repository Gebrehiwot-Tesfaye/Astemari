"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2, Moon, Sun, Globe, Bell, Shield,
  Eye, EyeOff, CheckCircle2, XCircle, User, Palette, Languages
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useAppContext();
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [emailNotif, setEmailNotif] = useState(true);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  const pwMutation = useMutation({
    mutationFn: () => api.post("/auth/change-password", {
      current_password: passwords.current,
      new_password: passwords.newPw,
    }),
    onSuccess: () => {
      setPasswords({ current: "", newPw: "", confirm: "" });
      setPwError("");
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 4000);
    },
    onError: (err: any) => {
      setPwSuccess(false);
      const detail = err?.response?.data?.detail;
      setPwError(typeof detail === "string" ? detail : "Failed to change password. Check your current password.");
    },
  });

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/80 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm placeholder:text-stone-400";

  const pwValid = passwords.current && passwords.newPw && passwords.newPw === passwords.confirm && passwords.newPw.length >= 6;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-[#221902] px-6 py-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 flex">
          <div className="flex-1 bg-[#078930]" /><div className="flex-1 bg-[#C5A021]" /><div className="flex-1 bg-[#DA121A]" />
        </div>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C5A021]/20 border-2 border-[#C5A021]/40 flex items-center justify-center text-[#C5A021] font-bold text-2xl flex-shrink-0">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-stone-400 text-sm mt-0.5">{user?.email} · <span className="capitalize">{user?.role}</span></p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Appearance */}
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/15">
            <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center">
              <Palette size={16} className="text-[#C5A021]" />
            </div>
            <h2 className="font-bold text-[#221902] dark:text-white">Appearance</h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">Choose your preferred theme</p>
            <div className="grid grid-cols-2 gap-3">
              {(["light", "dark"] as const).map((th) => (
                <button key={th} onClick={() => setTheme(th)}
                  className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    theme === th
                      ? "border-[#C5A021] bg-[#C5A021]/5 dark:bg-[#C5A021]/10"
                      : "border-stone-100 dark:border-[#8E6708]/20 hover:border-stone-200 dark:hover:border-[#8E6708]/40")}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                    theme === th ? "bg-[#221902] text-[#C5A021]" : "bg-stone-100 dark:bg-white/5 text-stone-400")}>
                    {th === "light" ? <Sun size={18} /> : <Moon size={18} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn("text-sm font-semibold", theme === th ? "text-[#221902] dark:text-white" : "text-stone-400")}>
                      {th === "light" ? "Light" : "Dark"}
                    </p>
                    <p className="text-[10px] text-stone-400">{th === "light" ? "Clean & bright" : "Easy on eyes"}</p>
                  </div>
                  {theme === th && <div className="w-2 h-2 rounded-full bg-[#C5A021] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/15">
            <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center">
              <Languages size={16} className="text-[#C5A021]" />
            </div>
            <h2 className="font-bold text-[#221902] dark:text-white">Language</h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">Select your display language</p>
            <div className="grid grid-cols-2 gap-3">
              {(["en", "am"] as const).map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    language === lang
                      ? "border-[#C5A021] bg-[#C5A021]/5 dark:bg-[#C5A021]/10"
                      : "border-stone-100 dark:border-[#8E6708]/20 hover:border-stone-200 dark:hover:border-[#8E6708]/40")}>
                  <span className="text-2xl">{lang === "en" ? "🇺🇸" : "🇪🇹"}</span>
                  <div className="flex-1 text-left">
                    <p className={cn("text-sm font-semibold", language === lang ? "text-[#221902] dark:text-white" : "text-stone-400")}>
                      {lang === "en" ? "English" : "አማርኛ"}
                    </p>
                    <p className="text-[10px] text-stone-400">{lang === "en" ? "English" : "Amharic"}</p>
                  </div>
                  {language === lang && <div className="w-2 h-2 rounded-full bg-[#C5A021] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/15">
            <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center">
              <Bell size={16} className="text-[#C5A021]" />
            </div>
            <h2 className="font-bold text-[#221902] dark:text-white">Notifications</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Email Notifications", desc: "Job matches, invitations, and updates", state: emailNotif, toggle: () => setEmailNotif(!emailNotif) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-stone-50 dark:bg-white/5">
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.desc}</p>
                </div>
                <button onClick={item.toggle}
                  className={cn("w-12 h-6 rounded-full relative transition-colors flex-shrink-0",
                    item.state ? "bg-[#C5A021]" : "bg-stone-200 dark:bg-stone-700")}>
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                    item.state ? "right-1" : "left-1")} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/15">
            <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center">
              <Shield size={16} className="text-[#C5A021]" />
            </div>
            <h2 className="font-bold text-[#221902] dark:text-white">Change Password</h2>
          </div>
          <div className="p-5">
            {pwSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm mb-4">
                <CheckCircle2 size={15} /> Password changed successfully.
              </div>
            )}
            {pwError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4">
                <XCircle size={15} /> {pwError}
              </div>
            )}
            <div className="space-y-3">
              {([
                { label: "Current Password", key: "current" as const },
                { label: "New Password", key: "newPw" as const },
                { label: "Confirm New Password", key: "confirm" as const },
              ]).map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw[key] ? "text" : "password"}
                      value={passwords[key]}
                      onChange={e => {
                        setPasswords(p => ({ ...p, [key]: e.target.value }));
                        setPwError("");
                        setPwSuccess(false);
                      }}
                      className={inputClass + " pr-10"}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              {passwords.newPw && passwords.newPw.length < 6 && (
                <p className="text-xs text-amber-500">Password must be at least 6 characters</p>
              )}
              {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
                <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>
              )}

              <button
                onClick={() => pwMutation.mutate()}
                disabled={!pwValid || pwMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all disabled:opacity-50 text-sm mt-1 shadow-md shadow-[#C5A021]/20">
                {pwMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
