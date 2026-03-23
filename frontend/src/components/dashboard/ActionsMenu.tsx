"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Pencil, Trash2, Filter, ChevronDown, ChevronUp, MoreVertical, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "active", "inactive", "completed"];

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  pending: "bg-amber-500",
  inactive: "bg-red-500",
  completed: "bg-blue-500",
};

interface ActionsMenuProps {
  currentStatus?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  /** If provided with currentStatus, shows a submenu of statuses to pick from.
   *  If provided WITHOUT currentStatus, acts as a simple toggle button. */
  onStatusChange?: (s?: string) => void;
}

export default function ActionsMenu({ currentStatus, onView, onEdit, onDelete, onStatusChange }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Default: open below-right. If near bottom, open above.
    const menuHeight = 200; // approximate
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight + window.scrollY : rect.bottom + window.scrollY + 4;
    const left = rect.right - 176 + window.scrollX; // 176 = w-44
    setPos({ top, left });
  }, []);

  const handleOpen = () => {
    updatePos();
    setOpen(o => !o);
    setShowStatus(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const close = () => { setOpen(false); setShowStatus(false); };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-white"
      >
        <MoreVertical size={15} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-44 bg-white dark:bg-[#1a1200] border border-stone-200 dark:border-[#8E6708]/40 rounded-xl shadow-2xl overflow-hidden"
        >
          {onView && (
            <button onClick={() => { onView(); close(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#221902]/80 transition-colors">
              <Eye size={14} className="text-[#C5A021]" /> View Details
            </button>
          )}
          {onEdit && (
            <button onClick={() => { onEdit(); close(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#221902]/80 transition-colors">
              <Pencil size={14} className="text-blue-500" /> Edit
            </button>
          )}
          {onStatusChange && (
            currentStatus ? (
              // Submenu with status options
              <div>
                <button onClick={() => setShowStatus(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#221902]/80 transition-colors">
                  <span className="flex items-center gap-2.5"><Filter size={14} className="text-purple-500" /> Change Status</span>
                  {showStatus ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showStatus && (
                  <div className="border-t border-stone-100 dark:border-[#8E6708]/20">
                    {STATUSES.filter(s => s !== currentStatus).map(s => (
                      <button key={s} onClick={() => { onStatusChange(s); close(); }}
                        className="w-full flex items-center gap-2 px-6 py-2 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#221902]/80 capitalize transition-colors">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_DOT[s] ?? "bg-stone-400")} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Simple toggle button
              <button onClick={() => { onStatusChange(); close(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#221902]/80 transition-colors">
                <CheckCircle2 size={14} className="text-emerald-500" /> Toggle Status
              </button>
            )
          )}
          <div className="border-t border-stone-100 dark:border-[#8E6708]/20">
            <button onClick={() => { onDelete(); close(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
