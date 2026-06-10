import { NavLink } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
    isActive
      ? "bg-accent/10 text-accent"
      : "text-text-muted hover:bg-surface-muted hover:text-text"
  }`;

export function AppNav() {
  const logout = useLogout();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      <NavLink to="/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/notes" className={linkClass}>
        Notes
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        Settings
      </NavLink>
      <button
        type="button"
        onClick={logout}
        className="ml-auto rounded-md border border-surface-muted bg-surface-card px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        Log out
      </button>
    </nav>
  );
}
