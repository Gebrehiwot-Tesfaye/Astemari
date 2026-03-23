"use client";
import { Menu, Moon, Sun, Globe, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";
import NotificationBell from "@/components/shared/NotificationBell";
import { cn } from "@/lib/utils";


interface Props { onMenuClick: () => void; }

export default function DashboardHeader({ onMenuClick }: Props) {
  const { user } = useAuthStore();
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-[#221902]/80 border-b border-stone-200 dark:border-[#8E6708]/30 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t("header.welcome")}{" "}
          <span className="font-semibold text-stone-900 dark:text-white">
            {user?.email?.split("@")[0]}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <Globe size={18} />
            <span className="text-xs font-bold uppercase hidden sm:inline">{language}</span>
            <ChevronDown size={13} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
              {(["en", "am"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLanguage(l); setLangOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors",
                    language === l ? "font-bold text-[#C5A021]" : "text-stone-700 dark:text-stone-300"
                  )}
                >
                  {l === "en" ? "🇺🇸 English" : "🇪🇹 አማርኛ"}
                </button>
              ))}
            </div>
          )}
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}
