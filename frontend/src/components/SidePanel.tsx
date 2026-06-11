import { useEffect, type ReactNode } from "react";

type SidePanelToggleProps = {
  open: boolean;
  onToggle: () => void;
  panelId: string;
};

export function SidePanelToggle({
  open,
  onToggle,
  panelId,
}: SidePanelToggleProps) {
  return (
    <button
      type="button"
      data-testid="note-detail-panel-toggle"
      aria-label="Note details"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      className="rounded-md border border-surface-muted bg-surface-card px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
    >
      {open ? "Hide details" : "Details"}
    </button>
  );
}

type SidePanelContentProps = {
  open: boolean;
  onClose: () => void;
  panelId: string;
  children: ReactNode;
};

export function SidePanelContent({
  open,
  onClose,
  panelId,
  children,
}: SidePanelContentProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector('[role="dialog"]')) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close note details"
          className="fixed inset-0 z-40 bg-text/20 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        id={panelId}
        hidden={!open}
        aria-hidden={!open}
        data-testid="note-detail-panel"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto border-l border-surface-muted bg-surface-card p-4 shadow-card motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:rounded-card lg:border lg:shadow-card"
      >
        {children}
      </aside>
    </>
  );
}
