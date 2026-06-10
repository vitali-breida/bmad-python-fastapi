import { useEffect } from "react";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({ message, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  return (
    <div
      data-testid="toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 rounded-md bg-text px-4 py-3 text-sm font-medium text-surface-card shadow-lg"
    >
      {message}
    </div>
  );
}
