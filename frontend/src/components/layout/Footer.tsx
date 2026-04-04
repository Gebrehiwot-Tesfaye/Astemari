"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Send } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function Footer() {
  const { t } = useAppContext();

  return (
    <footer className="border-t border-stone-200 dark:border-[#8E6708]/20 bg-[#221902] pt-14 pb-8 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 overflow-hidden border border-white/20 group-hover:scale-110 transition-transform">
                <Image src="/logo.png" alt="Astemari" width={36} height={36} className="object-contain p-0.5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Astemari<span className="text-[#C5A021]">.com</span>
              </span>
            </Link>
            <p className="text-sm text-stone-300 leading-relaxed">{t("footer.tagline")}</p>
            <div className="mt-5 flex gap-4">
              <a href="https://www.facebook.com/share/1AdZV14NmW/" target="_blank" rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#C5A021] transition-colors">
                <Facebook size={18} />
              </a>
              <a href="https://vm.tiktok.com/ZS982SqJaMJ1q-X2AeJ/" target="_blank" rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#C5A021] transition-colors">
                {/* TikTok SVG since lucide doesn't have it */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </a>
              <a href="https://t.me/astemarimatch1" target="_blank" rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#C5A021] transition-colors">
                <Send size={18} />
              </a>
            </div>
          </div>

          {/* For Teachers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-5">{t("footer.teachers")}</h3>
            <ul className="space-y-3">
              <li><Link href="/jobs" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.teachers.browse")}</Link></li>
              <li><Link href="/register" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.teachers.profile")}</Link></li>
              <li><Link href="/about" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.teachers.resources")}</Link></li>
            </ul>
          </div>

          {/* For Schools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-5">{t("footer.schools")}</h3>
            <ul className="space-y-3">
              <li><Link href="/dashboard/post-job" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.schools.post")}</Link></li>
              <li><Link href="/schools" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.schools.find")}</Link></li>
              <li><Link href="/register" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.schools.register")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-5">{t("footer.support")}</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.support.contact")}</Link></li>
              <li><Link href="/about" className="text-sm text-stone-300 hover:text-[#C5A021] transition-colors">{t("footer.support.faq")}</Link></li>
              <li>
                <a href="https://t.me/astemarimatch1" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-400 font-medium hover:text-sky-300 transition-colors">
                  <Send size={15} /> {t("footer.support.telegram")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Astemari Match. {t("footer.rights")}
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-xs text-stone-500 hover:text-[#C5A021] transition-colors">{t("footer.privacy")}</Link>
            <Link href="#" className="text-xs text-stone-500 hover:text-[#C5A021] transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
