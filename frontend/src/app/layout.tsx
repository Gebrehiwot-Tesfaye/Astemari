import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ChatBot from "@/components/ChatBot";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Astemari — Ethiopia's Teacher Job Platform",
  description: "Connecting passionate teachers with top schools across Ethiopia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('astemari-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-50 antialiased transition-colors duration-200">
        <Providers>{children}<ChatBot /></Providers>
      </body>
    </html>
  );
}
