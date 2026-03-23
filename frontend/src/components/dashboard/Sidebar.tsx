"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, Search, Briefcase, Users, School,
  Mail, Activity, BarChart3, Settings, LogOut, X, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAppContext } from "@/context/AppContext";

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { t } = useAppContext();

  const teacherNav = [
    { href: "/dashboard",              label: t("sidebar.overview"),     icon: LayoutDashboard },
    { href: "/dashboard/profile",      label: t("sidebar.profile"),      icon: User },
    { href: "/dashboard/jobs",         label: t("sidebar.jobs"),         icon: Search },
    { href: "/dashboard/applications", label: t("sidebar.applications"), icon: Briefcase },
    { href: "/dashboard/invitations",  label: t("sidebar.invitations"),  icon: Mail },
    { href: "/dashboard/settings",     label: t("sidebar.settings"),     icon: Settings },
  ];

  const schoolNav = [
    { href: "/dashboard",              label: t("sidebar.overview"),       icon: LayoutDashboard },
    { href: "/dashboard/profile",      label: t("sidebar.school_profile"), icon: School },
    { href: "/dashboard/jobs",         label: t("sidebar.manage_jobs"),    icon: Search },
    { href: "/dashboard/teachers",     label: t("sidebar.teachers"),       icon: GraduationCap },
    { href: "/dashboard/applications", label: t("sidebar.applications"),   icon: Users },
    { href: "/dashboard/invitations",  label: t("sidebar.invitations"),    icon: Mail },
    { href: "/dashboard/reports",      label: "Reports",                   icon: BarChart3 },
    { href: "/dashboard/settings",     label: t("sidebar.settings"),       icon: Settings },
  ];

  const adminNav = [
    { href: "/dashboard",              label: t("sidebar.overview"),      icon: LayoutDashboard },
    { href: "/dashboard/users",        label: t("sidebar.staff"),         icon: Users },
    { href: "/dashboard/schools",      label: t("sidebar.schools"),       icon: School },
    { href: "/dashboard/teachers",     label: t("sidebar.teachers"),      icon: GraduationCap },
    { href: "/dashboard/manage-jobs",  label: t("sidebar.manage_jobs"),   icon: Briefcase },
    { href: "/dashboard/applications", label: t("sidebar.applications"),  icon: Mail },
    { href: "/dashboard/invitations",  label: t("sidebar.invitations"),   icon: Mail },
    { href: "/dashboard/activity",     label: t("sidebar.activity"),      icon: Activity },
    { href: "/dashboard/analytics",    label: t("sidebar.analytics"),     icon: BarChart3 },
    { href: "/dashboard/settings",     label: t("sidebar.settings"),      icon: Settings },
  ];

  const navItems =
    user?.role === "admin" ? adminNav :
    user?.role === "school" ? schoolNav :
    teacherNav;

  const handleLogout = () => {
    clearAuth();
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-[#8E6708]/30">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-100 dark:border-[#8E6708]/40 bg-white dark:bg-[#221902] flex items-center justify-center shadow-sm">
            <Image src="/logo.png" alt="Astemari" width={32} height={32} className="object-contain p-0.5" />
          </div>
          <span className="text-[#221902] dark:text-white">Astemari</span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 text-stone-400 hover:text-stone-600">
          <X size={20} />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] border border-[#C5A021]/20">
          {user?.role || "user"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[#221902] text-[#C5A021] shadow-sm"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#221902]/60 hover:text-[#221902] dark:hover:text-white"
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-stone-200 dark:border-[#8E6708]/30">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-stone-100 dark:bg-[#221902]/60 border border-stone-200 dark:border-[#8E6708]/20">
          <div className="w-8 h-8 rounded-full bg-[#C5A021]/20 flex items-center justify-center text-[#C5A021] font-bold text-sm">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{user?.email}</p>
            <p className="text-xs text-stone-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={17} /> {t("sidebar.signout")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-[#221902]/80 border-r border-stone-200 dark:border-[#8E6708]/30 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative w-64 flex flex-col bg-white dark:bg-[#221902] border-r border-stone-200 dark:border-[#8E6708]/30 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
