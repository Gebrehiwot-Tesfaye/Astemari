import Image from "next/image";
import { Users, Building2, TrendingUp, GraduationCap } from "lucide-react";
export const metadata = { title: "About — Astemari" };

const cards = [
  { icon: Users, title: "Our Mission", desc: "To empower Ethiopian educators by providing a transparent, efficient, and professional job matching platform that benefits both teachers and schools." },
  { icon: Building2, title: "Our Vision", desc: "A future where every qualified teacher in Ethiopia finds the right school, and every school finds the right teacher — quickly and fairly." },
  { icon: TrendingUp, title: "Our Impact", desc: "Over 8,200 teachers placed, 450+ partner schools, and a 94% match satisfaction rate across all regions of Ethiopia." },
  { icon: GraduationCap, title: "Our Values", desc: "Transparency, professionalism, and equal opportunity for all educators regardless of location or background." },
];

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#0c0a09]">
      {/* Hero */}
      <section className="py-14 px-4 text-center bg-[#221902] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 60% 50%, #C5A021 0%, transparent 65%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-5 overflow-hidden">
            <Image src="/logo.png" alt="Astemari" width={48} height={48} className="object-contain p-1" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">About Astemari</h1>
          <p className="text-stone-300 text-base leading-relaxed">
            Ethiopia&apos;s leading platform connecting qualified teachers with schools that need them most.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((item) => (
            <div key={item.title}
              className="p-6 rounded-2xl border border-stone-100 dark:border-[#8E6708]/25 bg-stone-50 dark:bg-[#221902]/60 hover:border-[#C5A021]/40 hover:shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#C5A021]/10 flex items-center justify-center mb-4 group-hover:bg-[#C5A021]/20 transition-colors">
                <item.icon size={22} className="text-[#C5A021]" />
              </div>
              <h3 className="text-base font-bold text-[#221902] dark:text-white mb-2">{item.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-10 border-y border-stone-100 dark:border-[#8E6708]/20 bg-stone-50 dark:bg-[#221902]/50">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "8,200+", label: "Teachers Placed" },
            { value: "450+",   label: "Partner Schools" },
            { value: "94%",    label: "Match Satisfaction" },
            { value: "11",     label: "Regions Covered" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-[#221902] dark:text-white mb-1">{s.value}</p>
              <p className="text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider text-[11px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-[#221902] dark:text-white mb-3">Ready to join?</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Create your free account and start connecting today.</p>
          <a href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#C5A021] text-white font-bold rounded-xl hover:bg-[#8E6708] transition-colors shadow-md shadow-[#C5A021]/20 text-sm">
            Get Started Free
          </a>
        </div>
      </section>
    </div>
  );
}
