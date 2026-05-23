"use client";

import { useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import s from "../adminShared.module.css";
import c from "./configuracoes.module.css";
import { apiFetch } from "@/lib/hooko-session";

function readSyncTime(settings) {
  const raw = settings?.DAILY_SYNC_TIME;
  if (!raw) return "03:00";
  if (typeof raw === "string") return raw.slice(0, 5);
  if (typeof raw === "object" && raw.time) return String(raw.time).slice(0, 5);
  return "03:00";
}

export default function AdminConfiguracoesPage() {
  const [syncTime, setSyncTime] = useState("03:00");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [err, setErr] = useState("");

  const loadSettings = useCallback(async () => {
    setErr("");
    try {
      const data = await apiFetch("/api/admin/settings");
      setSyncTime(readSyncTime(data?.settings));
      setLoaded(true);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar configurações");
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function onSubmit(e) {
    e.preventDefault();
    setFlash("");
    setErr("");
    setBusy(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { DAILY_SYNC_TIME: syncTime },
        }),
      });
      setFlash(`Sincronização diária agendada para ${syncTime} (UTC).`);
      await loadSettings();
    } catch (e2) {
      setErr(e2?.message || "Falha ao guardar configurações");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${s.page} ${c.formPage}`}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Configurações</h1>
        <p className={s.lede}>Parâmetros globais do motor — sincronização Meta e jobs BullMQ.</p>
      </header>

      {err ? <p className={s.err}>{err}</p> : null}

      {!loaded ? (
        <div className={c.skeletonBlock}>
          <Skeleton height={120} width="100%" rounded={16} />
          <Skeleton height={48} width="100%" rounded={13} style={{ marginTop: "1rem" }} />
        </div>
      ) : (
        <form className={c.card} onSubmit={onSubmit}>
          <div className={c.field}>
            <label className={c.label} htmlFor="cron-sync">
              Horário de sincronização automática (cron job)
            </label>
            <input
              id="cron-sync"
              className={c.timeInput}
              type="time"
              value={syncTime}
              onChange={(e) => setSyncTime(e.target.value)}
              step={60}
            />
            <p className={c.hint}>
              Mapeia para <span className={s.mono}>DAILY_SYNC_TIME</span> na API (UTC). Ao guardar, o job diário é
              reagendado.
            </p>
          </div>
          <button type="submit" className={c.btnPlatinum} disabled={busy}>
            {busy ? "A guardar…" : "Salvar configurações do sistema"}
          </button>
          {flash ? <p className={c.success}>{flash}</p> : null}
        </form>
      )}
    </div>
  );
}
