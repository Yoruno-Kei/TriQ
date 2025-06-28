import React from "react";
import { BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToggleSidebarButton({ sidebarOpen, toggleSidebar }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleSidebar();
      }}
      className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-all duration-300"
      aria-label={sidebarOpen ? "ログを閉じる" : "ログを表示"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sidebarOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <X className="w-7 h-7" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -180, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <BookOpen className="w-7 h-7" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
