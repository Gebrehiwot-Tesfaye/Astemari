"use client";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, ShieldCheck, GraduationCap, ArrowRight, Search, MapPin, Send } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

// Ethiopic/Ge'ez alphabet characters used as decorative elements
const GEEZ = ["ሀ","ለ","ሐ","መ","ሠ","ረ","ሰ","ቀ","በ","ተ","ነ","አ","ከ","ወ","ዘ","የ","ደ","ጀ","ገ","ጠ","ጰ","ጸ","ፀ","ፈ","ፐ"];



export default function LandingPage() {
  const { t } = useAppContext();

  const stats = [
    { label: t("home.stats.schools"), value: "500+", geez: "ት/ቤቶች" },
    { label: t("home.stats.jobs"),    value: "1.2k",  geez: "ስራዎች"  },
    { label: t("home.stats.apps"),    value: "15k",   geez: "ማመልከቻ" },
    { label: t("home.stats.match"),   value: "98%",   geez: "ስኬት"   },
  ];

  const features = [
    { icon: TrendingUp,    title: t("home.features.1.title"), desc: t("home.features.1.desc"), color: "#078930" },
    { icon: ShieldCheck,   title: t("home.features.2.title"), desc: t("home.features.2.desc"), color: "#C5A021" },
    { icon: GraduationCap, title: t("home.features.3.title"), desc: t("home.features.3.desc"), color: "#DA121A" },
  ];

  return (
    <div className="bg-white dark:bg-[#0c0a09] overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ethiopian flag stripe accent — top */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#078930]" />
          <div className="flex-1 bg-[#C5A021]" />
          <div className="flex-1 bg-[#DA121A]" />
        </div>

        {/* Floating Ge'ez characters background — sizes are deterministic to avoid hydration mismatch */}
        <div className="absolute inset-0 -z-10 overflow-hidden select-none pointer-events-none">
          {GEEZ.map((ch, i) => (
            <span key={i} className="absolute text-[#C5A021] font-bold opacity-[0.04] dark:opacity-[0.07]"
              style={{
                fontSize: `${30 + (i * 17) % 60}px`,
                top: `${(i * 37) % 100}%`,
                left: `${(i * 43 + 5) % 100}%`,
                transform: `rotate(${(i % 3 - 1) * 12}deg)`,
              }}>
              {ch}
            </span>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 dark:from-[#0c0a09]/80 dark:via-[#0c0a09]/60 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-6 h-0.5 bg-[#078930] rounded" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-widest uppercase bg-[#C5A021]/10 text-[#8E6708] dark:text-[#C5A021] border border-[#C5A021]/25 rounded-full">
              {t("home.badge")}
            </span>
            <span className="w-6 h-0.5 bg-[#DA121A] rounded" />
          </div>

          {/* Ge'ez decorative word */}
          <p className="text-[#C5A021]/40 dark:text-[#C5A021]/30 text-5xl font-bold mb-2 tracking-widest select-none">
            አስተማሪ
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#221902] dark:text-white leading-[1.1] mb-4">
            {t("home.title.1")}{" "}
            <span className="text-[#C5A021] italic">{t("home.title.2")}</span>
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-300 mb-8 leading-relaxed max-w-xl mx-auto">
            {t("home.desc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-all shadow-md shadow-[#C5A021]/25 text-sm">
              {t("nav.getstarted")} <ArrowRight size={16} />
            </Link>
            <Link href="/jobs"
              className="inline-flex items-center gap-2 px-7 py-3 border-2 border-[#221902]/20 dark:border-white/20 text-[#221902] dark:text-white font-bold rounded-xl hover:border-[#C5A021]/50 transition-all text-sm">
              {t("nav.jobs")}
            </Link>
            <a href="https://t.me/astemarimatch1" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all text-sm shadow-md shadow-sky-500/20">
              <Send size={15} /> Join Community
            </a>
          </div>
        </div>
      </section>

      {/* ── Search bar ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-[#221902] rounded-2xl shadow-lg border border-stone-100 dark:border-[#8E6708]/30 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10">
            <Search size={16} className="text-stone-400 flex-shrink-0" />
            <input type="text" placeholder={t("home.search.placeholder")}
              className="bg-transparent w-full focus:outline-none text-sm text-stone-900 dark:text-white placeholder:text-stone-400" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10">
            <MapPin size={16} className="text-stone-400 flex-shrink-0" />
            <select className="bg-transparent w-full focus:outline-none text-sm appearance-none text-stone-700 dark:text-stone-300">
              <option>Addis Ababa</option><option>Dire Dawa</option>
              <option>Bahir Dar</option><option>Adama</option><option>Mekelle</option>
            </select>
          </div>
          <Link href="/jobs"
            className="bg-[#C5A021] text-white font-bold rounded-xl py-2.5 hover:bg-[#8E6708] transition-colors flex items-center justify-center text-sm shadow-md shadow-[#C5A021]/20">
            {t("home.search.button")}
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="py-10 border-y border-stone-100 dark:border-[#8E6708]/20 bg-stone-50 dark:bg-[#221902]/50">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-[#221902] dark:text-white mb-0.5">{s.value}</p>
              <p className="text-[#C5A021] font-bold text-sm mb-0.5">{s.geez}</p>
              <p className="text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ── Ethiopian Image Gallery Section ──
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#221902] relative overflow-hidden">
        {/* Ethiopian flag stripe top */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#078930]" />
          <div className="flex-1 bg-[#C5A021]" />
          <div className="flex-1 bg-[#DA121A]" />
        </div>

        {/* Ge'ez alphabet floating bg */}
        <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
          {["ሀ","ለ","ሐ","መ","ሠ","ረ","ሰ","ቀ","በ","ተ","ነ","አ","ከ","ወ","ዘ","የ"].map((ch, i) => (
            <span key={i} className="absolute text-[#C5A021] font-bold opacity-[0.06]"
              style={{
                fontSize: `${(i % 4) * 20 + 40}px`,
                top: `${(i * 53) % 100}%`,
                left: `${(i * 67 + 3) % 100}%`,
                transform: `rotate(${(i % 5 - 2) * 8}deg)`,
              }}>
              {ch}
            </span>
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#078930]" />
              <span className="text-[#C5A021] text-2xl font-bold">ትምህርት</span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#DA121A]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Education Across Ethiopia
            </h2>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              Connecting passionate teachers with schools that need them — from Addis Ababa to every corner of Ethiopia.
            </p>
          </div>

          {/* Masonry-style grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">

            {/* Large feature image — spans 2 cols + 2 rows */}
            <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group">
              <Image src="/hero-classroom.jpg" alt="Ethiopian classroom" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="600px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-[#C5A021] text-xl font-bold">ክፍል ውስጥ</span>
                <p className="text-white/80 text-xs mt-0.5">Inside the Classroom</p>
              </div>
              {/* Ethiopian flag corner accent */}
              <div className="absolute top-3 right-3 flex flex-col gap-0.5">
                <div className="w-6 h-1 bg-[#078930] rounded" />
                <div className="w-6 h-1 bg-[#C5A021] rounded" />
                <div className="w-6 h-1 bg-[#DA121A] rounded" />
              </div>
            </div>

            {/* Teacher at board — tall */}
            <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden group">
              <Image src="/eth-teacher-board.jpg" alt="Teacher at blackboard" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="300px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-3">
                <span className="text-[#C5A021] text-lg font-bold">መምህር</span>
                <p className="text-white/80 text-xs">Teacher</p>
              </div>
            </div>

            {/* Happy kids */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden group">
              <Image src="/eth-kids-smile.jpg" alt="Happy school children" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="300px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <span className="text-[#C5A021] text-sm font-bold">ተማሪዎች</span>
              </div>
            </div>

            {/* Teacher with student */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden group">
              <Image src="/hero-teacher.jpg" alt="Teacher with students" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="300px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <span className="text-[#C5A021] text-sm font-bold">ትምህርት</span>
              </div>
            </div>

            {/* Reading */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden group">
              <Image src="/eth-reading.jpg" alt="Children reading" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="300px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <span className="text-[#C5A021] text-sm font-bold">ማንበብ</span>
              </div>
            </div>

            {/* Teacher helping */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden group">
              <Image src="/eth-teacher-help.jpg" alt="Teacher helping student" fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="300px" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#221902]/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <span className="text-[#C5A021] text-sm font-bold">ድጋፍ</span>
              </div>
            </div>

          </div>

          {/* Ge'ez alphabet showcase strip */}
          <div className="mt-8 py-4 px-6 bg-white/5 rounded-2xl border border-[#C5A021]/20 overflow-hidden">
            <p className="text-center text-[#C5A021]/60 text-[10px] uppercase tracking-widest mb-3 font-bold">የግዕዝ ፊደላት — Ge&apos;ez Alphabet</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {["ሀ ሁ ሂ ሃ","ለ ሉ ሊ ላ","ሐ ሑ ሒ ሓ","መ ሙ ሚ ማ","ሠ ሡ ሢ ሣ","ረ ሩ ሪ ራ","ሰ ሱ ሲ ሳ","ቀ ቁ ቂ ቃ","በ ቡ ቢ ባ","ተ ቱ ቲ ታ","ነ ኑ ኒ ና","አ ኡ ኢ ኣ"].map((group, i) => (
                <span key={i} className="text-white/50 text-sm font-mono tracking-wider hover:text-[#C5A021] transition-colors cursor-default">
                  {group}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ethiopian flag stripe bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#DA121A]" />
          <div className="flex-1 bg-[#C5A021]" />
          <div className="flex-1 bg-[#078930]" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0c0a09]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-4xl font-bold text-[#221902] dark:text-white mb-3">
              {t("home.features.title")}{" "}
              <span className="text-[#C5A021] italic">{t("home.features.title.highlight")}</span>
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{t("home.features.desc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-stone-100 dark:border-[#8E6708]/25 bg-stone-50 dark:bg-[#221902]/60 hover:border-[#C5A021]/40 hover:shadow-md transition-all group">
                {/* Top color bar matching Ethiopian flag colors */}
                <div className="h-1 w-12 rounded-full mb-4 transition-all group-hover:w-20" style={{ backgroundColor: f.color }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: `${f.color}18` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-bold text-[#221902] dark:text-white mb-2">{f.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 bg-[#221902] relative overflow-hidden">
        {/* Ethiopian flag stripes as vertical side accents */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
          <div className="flex-1 bg-[#078930]" />
          <div className="flex-1 bg-[#C5A021]" />
          <div className="flex-1 bg-[#DA121A]" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1.5 flex flex-col">
          <div className="flex-1 bg-[#DA121A]" />
          <div className="flex-1 bg-[#C5A021]" />
          <div className="flex-1 bg-[#078930]" />
        </div>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #C5A021 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-[#C5A021]/50 text-3xl font-bold mb-2 select-none">ወደ አስተማሪ እንኳን ደህና መጡ</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">{t("home.cta.title")}</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/register"
              className="px-8 py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors shadow-lg text-sm">
              {t("home.cta.button1")}
            </Link>
            <a href="https://t.me/astemarimatch1" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors text-sm">
              <Send size={15} /> Join Telegram
            </a>
            <Link href="/about"
              className="px-8 py-3 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-sm">
              {t("home.cta.button2")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
