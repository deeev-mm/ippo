"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // オフライン対応は付加機能のため、登録失敗はアプリの動作をブロックしない
    });
  }, []);

  return null;
}
