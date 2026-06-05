import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { ApiError } from "../api/errors";
import { BuildInfo } from "./BuildInfo";

type LoginFormProps = {
  loginMutation: UseMutationResult<
    void,
    unknown,
    { username: string; password: string }
  >;
  onLoginSuccess?: () => void;
};

function loginErrorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return "Cannot reach the API. Is uvicorn running on port 8000?";
  }
  if (err instanceof ApiError) {
    return err.message;
  }
  return "Sign in failed";
}

export function LoginForm({ loginMutation, onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          onLoginSuccess?.();
        },
        onError: (err) => {
          setError(loginErrorMessage(err));
        },
      },
    );
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50"
      data-testid="login-app"
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Username is case-sensitive (e.g. <code className="font-mono">admin</code>).
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-3">
        <BuildInfo />
      </footer>
    </div>
  );
}
