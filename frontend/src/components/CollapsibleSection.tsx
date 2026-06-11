import { useId, useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  contentClassName?: string;
};

const panelSurfaceClass =
  "rounded-card border border-surface-muted bg-surface-card shadow-card";

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  className = "",
  contentClassName = "",
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const baseId = useId();
  const contentId = `${baseId}-content`;

  const toggle = () => setExpanded((value) => !value);

  return (
    <div className={`${panelSurfaceClass} ${className}`.trim()}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 p-4 text-left text-sm font-medium text-text"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true" className="text-text-muted">
          {expanded ? "−" : "+"}
        </span>
      </button>
      <div
        id={contentId}
        hidden={!expanded}
        className={`border-t border-surface-muted px-4 pb-4 pt-3 motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
