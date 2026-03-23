"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Moon, Sun, Globe, Bell, Shield, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [emailNotif, setEmailNotif] = useState(true);

  const pwMutation = useMutation({
    mutationFn: () => api.post("/auth/change-password", {
      current_password: passwords.current,
      new_password: passwords.newPw,
    }),
    onSuccess: () => setPasswords({ current: "", newPw: "", confirm: "" }),
  });

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-[#8E6708]/30 bg-stone-50 dark:bg-[#221902]/80 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A021]/40 focus:border-[#C5A021] transition-all text-sm placeholder:text-stone-400";

  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-[#221902]/60 rounded-2xl border border-stone-100 dark:border-[#8E6708]/20 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-[#8E6708]/15">
        <div className="w-8 h-8 rounded-lg bg-[#C5A021]/10 flex items-center justify-center">
          <Icon size={16} className="text-[#C5A021]" />
        </div>
        <h2 className="font-bold text-[#221902] dark:text-white text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#221902] dark:text-white">Settings</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Manage your account preferences.</p>
      </div>

      {/* Account info */}
      <div className="flex items-center gap-4 p-4 bg-[#221902] rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-[#C5A021]/20 border-2 border-[#C5A021]/40 flex items-center justify-center text-[#C5A021] font-bold text-lg flex-shrink-0">
          {user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.email}</p>
          <p className="text-xs text-stone-400 capitalize mt-0.5">{user?.role} · {user?.status}</p>
        </div>
      </div>

      {/* Appearance */}
      <Section title="Appearance" icon={Sun}>
        <div className="grid grid-cols-2 gap-3">
          {(["light", "dark"] as const).map((th) => (
            <button key={th} onClick={() => setTheme(th)}
              className={cn("flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                theme === th
                  ? "border-[#C5A021] bg-[#C5A021]/5 dark:bg-[#C5A021]/10"
                  : "border-stone-100 dark:border-[#8E6708]/20 hover:border-stone-200 dark:hover:border-[#8E6708]/40")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                theme === th ? "bg-[#221902] text-[#C5A021]" : "bg-stone-100 dark:bg-white/5 text-stone-400")}>
                {th === "light" ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <span className={cn("text-sm font-semibold", theme === th ? "text-[#221902] dark:text-white" : "text-stone-400")}>
                {th === "light" ? "Light" : "Dark"}
              </span>
              {theme === th && <div className="ml-auto w-2 h-2 rounded-full bg-[#C5A021]" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Language */}
      <Section title="Language" icon={Globe}>
        <div className="grid grid-cols-2 gap-3">
          {(["en", "am"] as const).map((lang) => (
            <button key={lang} onClick={() => setLanguage(lang)}
              className={cn("flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                language === lang
                  ? "border-[#C5A021] bg-[#C5A021]/5 dark:bg-[#C5A021]/10"
                  : "border-stone-100 dark:border-[#8E6708]/20 hover:border-stone-200 dark:hover:border-[#8E6708]/40")}>
              <span className="text-xl">{lang === "en" ? "🇺🇸" : "🇪🇹"}</span>
              <span className={cn("text-sm font-semibold", language === lang ? "text-[#221902] dark:text-white" : "text-stone-400")}>
                {lang === "en" ? "English" : "አማርኛ"}
              </span>
              {language === lang && <div className="ml-auto w-2 h-2 rounded-full bg-[#C5A021]" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">Email Notifications</p>
            <p className="text-xs text-stone-500 mt-0.5">Receive updates about new jobs and messages.</p>
          </div>
          <button onClick={() => setEmailNotif(!emailNotif)}
            className={cn("w-11 h-6 rounded-full relative transition-colors flex-shrink-0",
              emailNotif ? "bg-[#C5A021]" : "bg-stone-200 dark:bg-stone-700")}>
            <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
              emailNotif ? "right-1" : "left-1")} />
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={Shield}>
        {pwMutation.isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm mb-4">
            <CheckCircle2 size={15} /> Password changed successfully.
          </div>
        )}
        {pwMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4">
            <XCircle size={15} /> Incorrect current password.
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
                <input type={showPw[key] ? "text" : "password"} value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  className={inputClass + " pr-10"} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>
          )}
          <button onClick={() => pwMutation.mutate()}
            disabled={!passwords.current || !passwords.newPw || passwords.newPw !== passwords.confirm || pwMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#221902] text-[#C5A021] font-bold rounded-xl hover:bg-[#221902]/80 transition-all disabled:opacity-50 text-sm mt-1">
            {pwMutation.isPending && <Loader2 size={15} className="animate-spin" />}
            Update Password
          </button>
        </div>
      </Section>
    </div>
  );
}
