"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Use raf to set visible after mount, avoiding sync setState in effect
    const raf = requestAnimationFrame(() => {
      setVisible(true);
      mountedRef.current = true;
    });

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "border-emerald-200 bg-emerald-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        bgColors[type]
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      {icons[type]}
      <span className="text-sm font-medium text-slate-700">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 rounded p-0.5 text-slate-400 hover:text-slate-600"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
