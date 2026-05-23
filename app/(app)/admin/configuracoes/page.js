"use client";

import { useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import s from "../adminShared.module.css";
import c from "./configuracoes.module.css";
import { apiFetch } from "@/lib/hooko-session";

const SETTINGS = [
  {
    id: "daily-sync",
    title: "Sincronização automática Meta",
    explain: (
      <>
        <p>
          Define o horário em que o worker BullMQ executa o job diário de rollup de insights da Meta. Em cada execução,
          a API consolida métricas do dia anterior (gasto, impressões, conversões) para todos os anúncios importados.
        </p>
        <p>
          O valor é guardado como <span className={s.mono}>DAILY_SYNC_TIME</span> na base de dados. Ao salvar, o job
          repeatable antigo é removido e um novo é agendado — sem precisar reiniciar o servidor.
        </p>
        <ul className={c.explainList}>
          <li>Fuso horário: <strong>UTC</strong> (ajuste conforme o seu fuso local).</li>
          <li>Worker necessário: <span className={s.mono}>npm run worker:daily-sync</span></li>
          <li>Recomendado: madrugada, quando a Meta já fechou o dia anterior.</li>
        </ul>
      </>
    ),
    fieldKey: "DAILY_SYNC_TIME",
  },
];

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
        <p className={s.lede}>
          Parâmetros globais do motor HOOKO — jobs agendados, sincronização Meta e filas BullMQ. Cada opção tem uma
          explicação à esquerda e o controlo à direita.
        </p>
      </header>

      {err ? <p className={s.err}>{err}</p> : null}

      {!loaded ? (
        <div className={c.skeletonBlock}>
          <Skeleton height={160} width="100%" rounded={16} />
          <Skeleton height={48} width="100%" rounded={13} style={{ marginTop: "1rem" }} />
        </div>
      ) : (
        <form className={c.stack} onSubmit={onSubmit}>
          {SETTINGS.map((setting) => (
            <section key={setting.id} className={c.splitCard} aria-labelledby={`setting-${setting.id}`}>
              <div className={c.splitExplain}>
                <h2 id={`setting-${setting.id}`} className={c.splitTitle}>
                  {setting.title}
                </h2>
                <div className={c.explainBody}>{setting.explain}</div>
              </div>

              <div className={c.splitControl}>
                <label className={c.field} htmlFor="cron-sync">
                  <span className={c.label}>Horário (UTC)</span>
                  <input
                    id="cron-sync"
                    className={c.timeInput}
                    type="time"
                    value={syncTime}
                    onChange={(e) => setSyncTime(e.target.value)}
                    step={60}
                  />
                  <p className={c.hint}>
                    Ex.: <span className={s.mono}>03:00</span> UTC ≈ 00:00 em Brasília (sem horário de verão).
                  </p>
                </label>
              </div>
            </section>
          ))}

          <div className={c.actions}>
            <button type="submit" className={c.btnPlatinum} disabled={busy}>
              {busy ? "A guardar…" : "Salvar configurações do sistema"}
            </button>
            {flash ? <p className={c.success}>{flash}</p> : null}
          </div>
        </form>
      )}
    </div>
  );
}
