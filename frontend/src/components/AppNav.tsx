import { NavLink } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive
      ? "bg-indigo-100 text-indigo-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
        className="ml-auto rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Log out
      </button>
    </nav>
  );
}
