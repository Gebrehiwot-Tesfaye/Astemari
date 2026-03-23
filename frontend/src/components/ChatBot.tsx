"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { role: "bot" | "user"; text: string; }

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I am Astemari Bot. How can I help you with your teaching career or school hiring today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key");

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are Astemari Bot, a helpful assistant for Astemari.com — a job matching platform for teachers and schools in Ethiopia. Help teachers find jobs and schools find qualified teachers. Be professional, encouraging, and knowledgeable about the Ethiopian education system.\n\nUser: ${userMessage}`,
              }],
            }],
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("Gemini API error:", data);
        throw new Error(data?.error?.message || "API error");
      }
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || "I'm sorry, I'm having trouble connecting right now. Please try again later.";
      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "I encountered an error. Please check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Chat window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#C5A021] p-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Astemari Bot</h3>
                <p className="text-[10px] text-white/70">Online & Ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-stone-950">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "user" ? "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300" : "bg-[#C5A021]/10 text-[#C5A021]"
                )}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-[#C5A021] text-white rounded-tr-none"
                    : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-100 dark:border-stone-700 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#C5A021]/10 text-[#C5A021] flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-stone-800 p-3 rounded-2xl rounded-tl-none border border-stone-100 dark:border-stone-700 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-[#C5A021]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A021]/30 transition-all placeholder:text-stone-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#C5A021] text-white p-2.5 rounded-xl hover:bg-[#a8871a] disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-[#C5A021] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#a8871a] transition-all hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
