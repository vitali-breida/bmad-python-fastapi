import { Outlet } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { BuildInfo } from "../components/BuildInfo";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <AppNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
