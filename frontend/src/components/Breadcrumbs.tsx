import { Link } from "react-router-dom";

type BreadcrumbsProps = {
  noteTitle: string;
};

export function Breadcrumbs({ noteTitle }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <Link to="/notes" className="hover:text-gray-700">
        Notes
      </Link>
      <span className="mx-2">›</span>
      <span className="font-medium text-gray-900">{noteTitle}</span>
    </nav>
  );
}
