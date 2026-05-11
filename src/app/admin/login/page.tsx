"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Ошибка входа");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-xl">
        <h1 className="text-lg font-semibold tracking-tight mb-1">Админка</h1>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Вход только для операторов обменника.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
              Логин
            </label>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated-2)] px-3 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
              Пароль
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated-2)] px-3 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          {error && (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[var(--accent)] text-[#11151f] font-semibold text-sm disabled:opacity-40"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
      <Link
        href="/"
        className="mt-8 text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
      >
        ← На главную
      </Link>
    </div>
  );
}
