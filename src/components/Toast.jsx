import { useState, useEffect } from "react";

let triggerToast = null;
export const toast = (msg, type = "info") => triggerToast && triggerToast({ msg, type, id: Math.random().toString(36).slice(2, 9) });

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    triggerToast = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3200);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`toast flex items-center gap-3 px-5 py-3.5 rounded-lg text-sm font-semibold shadow-2xl animate-[slideIn_0.3s_ease] min-w-[280px] bg-white text-gray-900 border-l-4 pointer-events-auto dark:bg-darkSurface dark:text-gray-100 ${
            t.type === "success" 
              ? "border-success text-success" 
              : t.type === "error" 
                ? "border-danger text-danger" 
                : "border-info text-info"
          }`}
        >
          <span className="text-lg">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <div>{t.msg}</div>
        </div>
      ))}
    </div>
  );
}
