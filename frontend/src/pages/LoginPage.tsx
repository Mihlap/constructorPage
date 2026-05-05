import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authLogin } from "../lib/api/client";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await authLogin({ email, password });
      setToken(token);
      navigate("/app/pages");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: 20, background: "white", borderRadius: 14 }}>
      <h1 style={{ marginTop: 0 }}>Вход</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
        <button disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, background: "#111827", color: "white", border: 0 }}>
          {loading ? "..." : "Войти"}
        </button>
      </form>
      <div style={{ marginTop: 16 }}>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </div>
    </div>
  );
}

