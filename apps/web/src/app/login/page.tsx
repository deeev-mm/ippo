"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Footprints } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import styles from "./page.module.css";

export default function LoginPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api.login(name, password);
      setUser(user);
      router.replace(user.role === "parent" ? "/parent/dashboard" : "/child/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.logo}>
        <Footprints size={40} aria-hidden="true" />
      </div>
      <p className={`brand ${styles.brand}`}>ippo</p>
      <p className={styles.tagline}>毎日、いっぽずつ。</p>

      <form className={`card ${styles.card}`} onSubmit={onSubmit}>
        <div className={styles.demoBox}>
          デモ：おとな <code>parent</code> / こども <code>taro</code>・<code>hanako</code>
          <br />
          パスワードはどれも <code>demo1234</code>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="field">
          <label htmlFor="name">なまえ</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btnBlock" disabled={busy}>
          {busy ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
