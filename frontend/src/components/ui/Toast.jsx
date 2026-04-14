import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X } from 'lucide-react';

let toastId = 0;
const listeners = new Set();

export function showToast(message, options = {}) {
  const id = ++toastId;
  const toast = { id, message, ...options };
  listeners.forEach((fn) => fn(toast));
  return id;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      if (!toast.persistent) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration || 5000);
      }
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="flex items-center gap-3 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-right">
          <CheckCircle size={18} />
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.onUndo && (
            <button
              onClick={() => { toast.onUndo(); dismiss(toast.id); }}
              className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-medium hover:bg-white/30"
            >
              Desfazer
            </button>
          )}
          <button onClick={() => dismiss(toast.id)} className="ml-1 text-white/70 hover:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
