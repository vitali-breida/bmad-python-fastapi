import { Link } from "react-router-dom";

type BreadcrumbsProps = {
  noteTitle: string;
};

export function Breadcrumbs({ noteTitle }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
      <Link
        to="/notes"
        className="transition-colors hover:text-text focus-visible:rounded-sm"
      >
        Notes
      </Link>
      <span className="mx-2" aria-hidden="true">
        ›
      </span>
      <span className="font-medium text-text">{noteTitle}</span>
    </nav>
  );
}
