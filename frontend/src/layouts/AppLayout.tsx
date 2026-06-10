import { Outlet } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { BuildInfo } from "../components/BuildInfo";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-surface-card focus-visible:px-4 focus-visible:py-2 focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Skip to main content
      </a>

      <header className="border-b border-surface-muted bg-surface-card shadow-card">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <AppNav />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8"
      >
        <Outlet />
      </main>

      <footer className="border-t border-surface-muted bg-surface-card px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
