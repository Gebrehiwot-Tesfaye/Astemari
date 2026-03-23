"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Sun, Globe, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";

const BRAND = "#C5A021";
const BRAND_DARK = "#221902";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const { theme, setTheme, language, setLanguage, t } = useAppContext();

  useEffect(() => { setMounted(true); }, []);

  const isLoggedIn = mounted && !!user;

  const navLinks = [
    { href: "/jobs",    label: t("nav.jobs") },
    { href: "/schools", label: t("nav.schools") },
    { href: "/about",   label: t("nav.about") },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#221902]/95 backdrop-blur-md border-b border-stone-200 dark:border-[#8E6708]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-100 dark:border-[#8E6708]/40 bg-white dark:bg-[#221902] flex items-center justify-center shadow-sm">
            <Image src="/logo.png" alt="Astemari" width={32} height={32} className="object-contain p-0.5" />
          </div>
          <span className="text-[#221902] dark:text-white">Astemari</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn("text-sm font-medium transition-colors",
                isActive(l.href)
                  ? "text-[#C5A021]"
                  : "text-stone-600 dark:text-stone-300 hover:text-[#221902] dark:hover:text-white")}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Telegram */}
          <a href="https://t.me/astemarimatch" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors">
            <Send size={14} /> {t("nav.telegram")}
          </a>

          <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />

          {/* Theme */}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 text-stone-500 hover:text-[#221902] dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Language */}
          <button onClick={() => setLanguage(language === "en" ? "am" : "en")}
            className="flex items-center gap-1 px-2 py-1.5 text-stone-500 hover:text-[#221902] dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg transition-colors text-xs font-bold"
            aria-label="Toggle language">
            <Globe size={15} />
            <span className="uppercase">{language}</span>
          </button>

          <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />

          {isLoggedIn ? (
            <>
              <Link href="/dashboard"
                className="px-3 py-1.5 text-sm font-semibold text-[#C5A021] border border-[#C5A021]/50 rounded-lg hover:bg-[#C5A021]/10 transition-colors">
                {t("nav.dashboard")}
              </Link>
              <button onClick={clearAuth}
                className="px-3 py-1.5 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                {t("nav.signout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-[#221902] dark:hover:text-white transition-colors">
                {t("nav.signin")}
              </Link>
              <Link href="/register"
                className="px-4 py-1.5 text-sm font-bold bg-[#C5A021] text-white rounded-lg hover:bg-[#8E6708] transition-colors shadow-sm">
                {t("nav.getstarted")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-stone-500 dark:text-stone-400 rounded-lg">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2 text-stone-700 dark:text-stone-300" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-200 dark:border-[#8E6708]/30 bg-white dark:bg-[#221902] px-4 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={cn("block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(l.href) ? "bg-[#C5A021]/10 text-[#C5A021]" : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5")}>
              {l.label}
            </Link>
          ))}
          <a href="https://t.me/astemarimatch" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-sky-600 dark:text-sky-400">
            <Send size={15} /> {t("nav.telegram.join")}
          </a>
          <button onClick={() => setLanguage(language === "en" ? "am" : "en")}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 w-full">
            <Globe size={15} /> {language === "en" ? "አማርኛ" : "English"}
          </button>
          <div className="pt-2 flex flex-col gap-2 border-t border-stone-100 dark:border-white/10 mt-2">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="block text-center py-2.5 bg-[#C5A021] text-white rounded-lg text-sm font-bold">
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="block text-center py-2.5 border border-stone-200 dark:border-white/20 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t("nav.signin")}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}
                  className="block text-center py-2.5 bg-[#C5A021] text-white rounded-lg text-sm font-bold">
                  {t("nav.getstarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
