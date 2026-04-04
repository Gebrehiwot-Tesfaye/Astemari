"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
type Language = "en" | "am";

interface AppContextType {
  theme: Theme;
  language: Language;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // ── Navbar ──────────────────────────────────────────────────────────────
    "nav.jobs": "Find Jobs",
    "nav.teachers": "Teachers",
    "nav.schools": "Schools",
    "nav.about": "About Us",
    "nav.signin": "Sign In",
    "nav.getstarted": "Get Started",
    "nav.dashboard": "Dashboard",
    "nav.telegram": "Telegram",
    "nav.telegram.join": "Join Telegram",
    "nav.signout": "Sign Out",
    "nav.lang.switch": "አማርኛ",

    // ── Footer ───────────────────────────────────────────────────────────────
    "footer.tagline": "Empowering Ethiopian education by connecting the best teachers with the finest schools.",
    "footer.teachers": "For Teachers",
    "footer.teachers.browse": "Browse Jobs",
    "footer.teachers.profile": "Create Profile",
    "footer.teachers.resources": "Teaching Resources",
    "footer.schools": "For Schools",
    "footer.schools.post": "Post a Job",
    "footer.schools.find": "Find Teachers",
    "footer.schools.register": "Register School",
    "footer.support": "Support",
    "footer.support.contact": "Contact Us",
    "footer.support.faq": "FAQ",
    "footer.support.telegram": "Telegram Community",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",

    // ── Sidebar ──────────────────────────────────────────────────────────────
    "sidebar.overview": "Overview",
    "sidebar.profile": "My Profile",
    "sidebar.school_profile": "School Profile",
    "sidebar.jobs": "Job Search",
    "sidebar.post_job": "Post a Job",
    "sidebar.manage_jobs": "Manage Jobs",
    "sidebar.applications": "Applications",
    "sidebar.invitations": "Invitations",
    "sidebar.settings": "Settings",
    "sidebar.staff": "Staff Management",
    "sidebar.schools": "Schools",
    "sidebar.teachers": "Teachers",
    "sidebar.activity": "Activity Log",
    "sidebar.analytics": "Analytics",
    "sidebar.signout": "Sign Out",

    // ── Dashboard Header ──────────────────────────────────────────────────────
    "header.welcome": "Welcome back,",
    "header.notifications": "Notifications",
    "header.no_notifications": "No notifications yet",

    // ── Home page ────────────────────────────────────────────────────────────
    "home.badge": "✨ Ethiopia's #1 Teacher Network",
    "home.title.1": "Empowering",
    "home.title.2": "Ethiopian Teachers",
    "home.desc": "Connecting passionate teachers with top-tier schools across Ethiopia. Build your professional profile and get matched with the perfect opportunity.",
    "home.search.placeholder": "Subject or Grade Level",
    "home.search.button": "Search Jobs",
    "home.stats.schools": "Partner Schools",
    "home.stats.jobs": "Active Jobs",
    "home.stats.apps": "Applications",
    "home.stats.match": "Match Rate",
    "home.features.title": "Everything you need to",
    "home.features.title.highlight": "succeed",
    "home.features.desc": "We've built a comprehensive ecosystem that handles everything from profile building to interview scheduling.",
    "home.features.1.title": "Smart Matching",
    "home.features.1.desc": "Our AI-powered algorithm matches your skills and experience with the most relevant job openings.",
    "home.features.2.title": "Verified Schools",
    "home.features.2.desc": "Every school on our platform undergoes a rigorous verification process to ensure quality and reliability.",
    "home.features.3.title": "Career Tracking",
    "home.features.3.desc": "Monitor your applications, track your progress, and manage your professional growth in one place.",
    "home.cta.title": "Ready to start your next chapter in education?",
    "home.cta.button1": "Create Free Account",
    "home.cta.button2": "About Us",

    // ── About page ───────────────────────────────────────────────────────────
    "about.title": "About Astemari",
    "about.subtitle": "Bridging the gap between talented teachers and quality schools across Ethiopia.",

    // ── Jobs page ────────────────────────────────────────────────────────────
    "jobs.title": "Find Teaching Jobs",
    "jobs.subtitle": "Browse hundreds of teaching opportunities across Ethiopia.",
    "jobs.search": "Search jobs...",
    "jobs.filter.all": "All Jobs",
    "jobs.filter.dept": "Department",
    "jobs.apply": "Apply Now",
    "jobs.no_results": "No jobs found",

    // ── Schools page ─────────────────────────────────────────────────────────
    "schools.title": "Partner Schools",
    "schools.subtitle": "Discover top schools hiring teachers across Ethiopia.",
    "schools.search": "Search schools...",
    "schools.no_results": "No schools found",

    // ── Auth ─────────────────────────────────────────────────────────────────
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.confirm_password": "Confirm Password",
    "auth.role": "I am a",
    "auth.role.teacher": "Teacher",
    "auth.role.school": "School",
    "auth.forgot": "Forgot password?",
    "auth.no_account": "Don't have an account?",
    "auth.have_account": "Already have an account?",
    "auth.signing_in": "Signing in...",
    "auth.creating": "Creating account...",

    // ── Dashboard ────────────────────────────────────────────────────────────
    "dashboard.overview": "Overview",
    "dashboard.profile": "My Profile",
    "dashboard.jobs": "Job Search",
    "dashboard.activity": "Activity Log",
    "dashboard.analytics": "Analytics",
    "dashboard.settings": "Settings",
    "dashboard.logout": "Sign Out",

    // ── Settings ─────────────────────────────────────────────────────────────
    "settings.title": "Settings",
    "settings.desc": "Customize your experience on Astemari.",
    "settings.theme": "Theme",
    "settings.language": "Language",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.en": "English",
    "settings.am": "Amharic (አማርኛ)",
    "settings.notifications": "Notifications",
    "settings.email_notif": "Email Notifications",
    "settings.email_notif_desc": "Receive updates about new jobs and messages.",
    "settings.security": "Security",
    "settings.change_password": "Change Password",
    "settings.sign_out": "Sign Out",

    // ── Teacher dashboard ────────────────────────────────────────────────────
    "teacher.welcome": "Welcome back",
    "teacher.subtitle": "Here's what's happening with your job search today.",
    "teacher.stats.active_apps": "Active Applications",
    "teacher.stats.profile_completion": "Profile Completion",
    "teacher.stats.job_matches": "Job Matches",
    "teacher.stats.profile_views": "Profile Views",
    "teacher.recommended": "Recommended for You",
    "teacher.view_all": "View All",
    "teacher.complete_profile": "Complete Your Profile",
    "teacher.complete_profile_desc": "85% complete. Add your teaching certifications to reach 100%.",
    "teacher.finish_profile": "Finish Profile",
    "teacher.recent_activity": "Recent Activity",
    "teacher.days_ago": "days ago",

    // ── School dashboard ─────────────────────────────────────────────────────
    "school.welcome": "School Dashboard",
    "school.subtitle": "Manage your recruitment and school profile.",
    "school.post_job": "Post New Job",
    "school.stats.active_jobs": "Active Job Posts",
    "school.stats.total_apps": "Total Applications",
    "school.stats.shortlisted": "Shortlisted",
    "school.stats.profile_views": "Profile Views",
    "school.recent_apps": "Recent Applications",
    "school.applicant": "Applicant",
    "school.role": "Role",
    "school.experience": "Experience",
    "school.status": "Status",
    "school.manage_jobs": "Manage All Jobs",
    "school.tip.title": "Recruitment Tip",
    "school.tip.desc": "Schools with complete profiles and detailed job descriptions receive 40% more qualified applications.",
    "school.tip.cta": "Improve Your Profile",

    // ── Admin dashboard ──────────────────────────────────────────────────────
    "admin.total_users": "Total Users",
    "admin.teachers": "Teachers",
    "admin.schools": "Schools",
    "admin.jobs": "Total Jobs",
    "admin.applications": "Applications",
    "admin.welcome": "Welcome back, Administrator. Monitoring platform activity.",
  },

  am: {
    // ── Navbar ──────────────────────────────────────────────────────────────
    "nav.jobs": "ስራ ይፈልጉ",
    "nav.teachers": "አስተማሪዎች",
    "nav.schools": "ትምህርት ቤቶች",
    "nav.about": "ስለ እኛ",
    "nav.signin": "ይግቡ",
    "nav.getstarted": "ይጀምሩ",
    "nav.dashboard": "ዳሽቦርድ",
    "nav.telegram": "ቴሌግራም",
    "nav.telegram.join": "ቴሌግራም ይቀላቀሉ",
    "nav.signout": "ውጣ",
    "nav.lang.switch": "English",

    // ── Footer ───────────────────────────────────────────────────────────────
    "footer.tagline": "ምርጥ መምህራንን ከምርጥ ትምህርት ቤቶች ጋር በማገናኘት የኢትዮጵያን ትምህርት ማብቃት።",
    "footer.teachers": "ለመምህራን",
    "footer.teachers.browse": "ስራዎችን ያስሱ",
    "footer.teachers.profile": "መገለጫ ይፍጠሩ",
    "footer.teachers.resources": "የማስተማር ሀብቶች",
    "footer.schools": "ለትምህርት ቤቶች",
    "footer.schools.post": "ስራ ይለጥፉ",
    "footer.schools.find": "መምህራን ያግኙ",
    "footer.schools.register": "ትምህርት ቤት ይመዝግቡ",
    "footer.support": "ድጋፍ",
    "footer.support.contact": "ያግኙን",
    "footer.support.faq": "ተደጋጋሚ ጥያቄዎች",
    "footer.support.telegram": "የቴሌግራም ማህበረሰብ",
    "footer.rights": "መብቶች ሁሉ የተጠበቁ ናቸው።",
    "footer.privacy": "የግላዊነት ፖሊሲ",
    "footer.terms": "የአገልግሎት ውሎች",

    // ── Sidebar ──────────────────────────────────────────────────────────────
    "sidebar.overview": "አጠቃላይ እይታ",
    "sidebar.profile": "የእኔ መገለጫ",
    "sidebar.school_profile": "የትምህርት ቤት መገለጫ",
    "sidebar.jobs": "ስራ ፍለጋ",
    "sidebar.post_job": "ስራ ይለጥፉ",
    "sidebar.manage_jobs": "ስራዎችን ያስተዳድሩ",
    "sidebar.applications": "ማመልከቻዎች",
    "sidebar.invitations": "ግብዣዎች",
    "sidebar.settings": "ቅንብሮች",
    "sidebar.staff": "የሰራተኞች አስተዳደር",
    "sidebar.schools": "ትምህርት ቤቶች",
    "sidebar.teachers": "መምህራን",
    "sidebar.activity": "የእንቅስቃሴ መዝገብ",
    "sidebar.analytics": "ትንታኔ",
    "sidebar.signout": "ውጣ",

    // ── Dashboard Header ──────────────────────────────────────────────────────
    "header.welcome": "እንኳን ደህና መጡ,",
    "header.notifications": "ማሳወቂያዎች",
    "header.no_notifications": "ምንም ማሳወቂያ የለም",

    // ── Home page ────────────────────────────────────────────────────────────
    "home.badge": "✨ የኢትዮጵያ ቁጥር 1 የመምህራን አውታረ መረብ",
    "home.title.1": "ማብቃት",
    "home.title.2": "ኢትዮጵያውያን መምህራንን",
    "home.desc": "በኢትዮጵያ ውስጥ ያሉ ምርጥ ትምህርት ቤቶችን ከስሜታዊ መምህራን ጋር ማገናኘት።",
    "home.search.placeholder": "የትምህርት አይነት ወይም የክፍል ደረጃ",
    "home.search.button": "ስራ ፈልግ",
    "home.stats.schools": "አጋር ትምህርት ቤቶች",
    "home.stats.jobs": "ንቁ ስራዎች",
    "home.stats.apps": "ማመልከቻዎች",
    "home.stats.match": "የመመሳሰል መጠን",
    "home.features.title": "ለስኬት የሚያስፈልግዎ",
    "home.features.title.highlight": "ሁሉ",
    "home.features.desc": "ከመገለጫ ግንባታ እስከ ቃለ መጠይቅ መርሐግብር ድረስ ሁሉንም ነገር የሚያስተናግድ አጠቃላይ ሥነ-ምህዳር ገንብተናል።",
    "home.features.1.title": "ስማርት ማዛመድ",
    "home.features.1.desc": "የእኛ በ AI የተደገፈ አልጎሪዝም የእርስዎን ችሎታ ከስራ ክፍት ቦታዎች ጋር ያዛምዳል።",
    "home.features.2.title": "የተረጋገጡ ትምህርት ቤቶች",
    "home.features.2.desc": "በእኛ መድረክ ላይ ያለ እያንዳንዱ ትምህርት ቤት ጥብቅ የማረጋገጫ ሂደት ያልፋል።",
    "home.features.3.title": "የስራ ክትትል",
    "home.features.3.desc": "ማመልከቻዎችዎን ይቆጣጠሩ እና ሙያዊ እድገትዎን ያስተዳድሩ።",
    "home.cta.title": "በትምህርት ውስጥ ቀጣዩን ምዕራፍዎን ለመጀመር ዝግጁ ነዎት?",
    "home.cta.button1": "ነፃ መለያ ይፍጠሩ",
    "home.cta.button2": "ስለ እኛ",

    // ── About page ───────────────────────────────────────────────────────────
    "about.title": "ስለ አስተማሪ",
    "about.subtitle": "በኢትዮጵያ ውስጥ ችሎታ ያላቸው መምህራን እና ጥራት ያላቸው ትምህርት ቤቶች መካከል ያለውን ክፍተት መሙላት።",

    // ── Jobs page ────────────────────────────────────────────────────────────
    "jobs.title": "የማስተማር ስራዎችን ያግኙ",
    "jobs.subtitle": "በኢትዮጵያ ውስጥ በመቶዎች የሚቆጠሩ የማስተማር እድሎችን ያስሱ።",
    "jobs.search": "ስራዎችን ይፈልጉ...",
    "jobs.filter.all": "ሁሉም ስራዎች",
    "jobs.filter.dept": "ክፍል",
    "jobs.apply": "አሁን ያመልክቱ",
    "jobs.no_results": "ምንም ስራ አልተገኘም",

    // ── Schools page ─────────────────────────────────────────────────────────
    "schools.title": "አጋር ትምህርት ቤቶች",
    "schools.subtitle": "በኢትዮጵያ ውስጥ መምህራን የሚቀጥሩ ምርጥ ትምህርት ቤቶችን ያግኙ።",
    "schools.search": "ትምህርት ቤቶችን ይፈልጉ...",
    "schools.no_results": "ምንም ትምህርት ቤት አልተገኘም",

    // ── Auth ─────────────────────────────────────────────────────────────────
    "auth.login": "ይግቡ",
    "auth.register": "መለያ ይፍጠሩ",
    "auth.email": "የኢሜል አድራሻ",
    "auth.password": "የይለፍ ቃል",
    "auth.confirm_password": "የይለፍ ቃልን ያረጋግጡ",
    "auth.role": "እኔ ነኝ",
    "auth.role.teacher": "መምህር",
    "auth.role.school": "ትምህርት ቤት",
    "auth.forgot": "የይለፍ ቃል ረሱ?",
    "auth.no_account": "መለያ የለዎትም?",
    "auth.have_account": "አስቀድሞ መለያ አለዎት?",
    "auth.signing_in": "በመግባት ላይ...",
    "auth.creating": "መለያ በመፍጠር ላይ...",

    // ── Dashboard ────────────────────────────────────────────────────────────
    "dashboard.overview": "አጠቃላይ እይታ",
    "dashboard.profile": "የእኔ መገለጫ",
    "dashboard.jobs": "ስራ ፍለጋ",
    "dashboard.activity": "የእንቅስቃሴ መዝገብ",
    "dashboard.analytics": "ትንታኔ",
    "dashboard.settings": "ቅንብሮች",
    "dashboard.logout": "ውጣ",

    // ── Settings ─────────────────────────────────────────────────────────────
    "settings.title": "ቅንብሮች",
    "settings.desc": "በአስተማሪ ላይ ያለዎትን ተሞክሮ ያብጁ።",
    "settings.theme": "ገጽታ",
    "settings.language": "ቋንቋ",
    "settings.light": "ብርሃን",
    "settings.dark": "ጨለማ",
    "settings.en": "እንግሊዝኛ",
    "settings.am": "አማርኛ",
    "settings.notifications": "ማሳወቂያዎች",
    "settings.email_notif": "የኢሜል ማሳወቂያዎች",
    "settings.email_notif_desc": "ስለ አዲስ ስራዎች እና መልዕክቶች ዝመናዎችን ይቀበሉ።",
    "settings.security": "ደህንነት",
    "settings.change_password": "የይለፍ ቃል ቀይር",
    "settings.sign_out": "ውጣ",

    // ── Teacher dashboard ────────────────────────────────────────────────────
    "teacher.welcome": "እንኳን ደህና መጡ",
    "teacher.subtitle": "የዛሬው የሥራ ፍለጋዎ ሁኔታ ይኸውና።",
    "teacher.stats.active_apps": "ንቁ ማመልከቻዎች",
    "teacher.stats.profile_completion": "የመገለጫ ሙላት",
    "teacher.stats.job_matches": "የሥራ ግጥሚያዎች",
    "teacher.stats.profile_views": "የመገለጫ እይታዎች",
    "teacher.recommended": "ለእርስዎ የሚመከሩ",
    "teacher.view_all": "ሁሉንም ይመልከቱ",
    "teacher.complete_profile": "መገለጫዎን ያጠናቅቁ",
    "teacher.complete_profile_desc": "85% ተጠናቋል። 100% ለመድረስ የማስተማር የምስክር ወረቀቶችዎን ያክሉ።",
    "teacher.finish_profile": "መገለጫውን ጨርስ",
    "teacher.recent_activity": "የቅርብ ጊዜ እንቅስቃሴ",
    "teacher.days_ago": "ቀናት በፊት",

    // ── School dashboard ─────────────────────────────────────────────────────
    "school.welcome": "የትምህርት ቤት ዳሽቦርድ",
    "school.subtitle": "ቅጥርዎን እና የትምህርት ቤት መገለጫዎን ያስዳድሩ።",
    "school.post_job": "አዲስ ስራ ይለጥፉ",
    "school.stats.active_jobs": "ንቁ የሥራ ልጥፎች",
    "school.stats.total_apps": "ጠቅላላ ማመልከቻዎች",
    "school.stats.shortlisted": "ለቃለ መጠይቅ የተመረጡ",
    "school.stats.profile_views": "የመገለጫ እይታዎች",
    "school.recent_apps": "የቅርብ ጊዜ ማመልከቻዎች",
    "school.applicant": "አመልካች",
    "school.role": "ሚና",
    "school.experience": "ልምድ",
    "school.status": "ሁኔታ",
    "school.manage_jobs": "ሁሉንም ስራዎች ያስተዳድሩ",
    "school.tip.title": "የቅጥር ምክር",
    "school.tip.desc": "የተሟላ መገለጫ ያላቸው ትምህርት ቤቶች 40% የበለጠ ብቁ ማመልከቻዎችን ያገኛሉ።",
    "school.tip.cta": "መገለጫዎን ያሻሽሉ",

    // ── Admin dashboard ──────────────────────────────────────────────────────
    "admin.total_users": "ጠቅላላ ተጠቃሚዎች",
    "admin.teachers": "መምህራን",
    "admin.schools": "ትምህርት ቤቶች",
    "admin.jobs": "ጠቅላላ ስራዎች",
    "admin.applications": "ማመልከቻዎች",
    "admin.welcome": "እንኳን ደህና መጡ አስተዳዳሪ። የመድረክ እንቅስቃሴን በመከታተል ላይ።",
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("astemari-theme") as Theme | null;
    const savedLang = localStorage.getItem("astemari-lang") as Language | null;
    if (saved) applyTheme(saved);
    if (savedLang) setLanguageState(savedLang);
  }, []);

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("astemari-theme", t);
  };

  const setTheme = (t: Theme) => applyTheme(t);

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem("astemari-lang", l);
    document.documentElement.lang = l;
  };

  const t = (key: string) => translations[language][key] ?? key;

  return (
    <AppContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
