"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import s from "../adminShared.module.css";
import c from "./configuracoes.module.css";

const USE_MOCK = true;

export default function AdminConfiguracoesPage() {
  const [syncTime, setSyncTime] = useState("03:00");
  const [loaded, setLoaded] = useState(!USE_MOCK);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (!USE_MOCK) return undefined;
    const t = window.setTimeout(() => setLoaded(true), 640);
    return () => window.clearTimeout(t);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setFlash("");
    setBusy(true);
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 700));
      setFlash(`Configuração mock guardada: sincronização diária às ${syncTime} (UTC).`);
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <div className={`${s.page} ${c.formPage}`}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Configurações</h1>
        <p className={s.lede}>Parâmetros globais do motor — mock com USE_MOCK até integrar PUT /api/admin/settings.</p>
      </header>

      <span className={c.mockPill}>USE_MOCK = true</span>

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
            <p className={c.hint}>Referência alinhada a <span className={s.mono}>DAILY_SYNC_TIME</span> na API (UTC).</p>
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
