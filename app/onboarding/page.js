"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/Skeleton/Skeleton";
import styles from "./page.module.css";

const USE_MOCK = true;
/** Skeleton no boot da página (card central). */
const INITIAL_LOAD_MS = 1500;
/** Simulação OAuth Meta / Drive. */
const MOCK_CONNECT_MS = 1200;

const mockOnboardingData = {
  user_name: "Lucas",
  plan: {
    name: "HOOKO Pro",
    creative_limit: 50,
    transcription_minutes: 120,
  },
};

function BootSkeleton() {
  return (
    <div className={styles.skShell}>
      <div style={{ width: "38%" }}>
        <Skeleton className={styles.skLineSm} />
      </div>
      <div style={{ width: "92%" }}>
        <Skeleton className={styles.skLineMd} />
      </div>
      <Skeleton className={styles.skBox} />
      <Skeleton className={styles.skBtn} />
      <div className={styles.skProg}>
        <Skeleton className={styles.skDot} />
        <Skeleton className={styles.skDot} />
        <Skeleton className={styles.skDot} />
      </div>
    </div>
  );
}

function themeForStep(step) {
  if (step === 2) return "meta";
  if (step === 3) return "drive";
  return "gold";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [bootLoading, setBootLoading] = useState(true);
  const [data, setData] = useState(null);

  const [step, setStep] = useState(1);

  const [metaConnecting, setMetaConnecting] = useState(false);
  const [metaDone, setMetaDone] = useState(false);

  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveDone, setDriveDone] = useState(false);

  useEffect(() => {
    if (!USE_MOCK) {
      setData(mockOnboardingData);
      setBootLoading(false);
      return;
    }
    setBootLoading(true);
    const t = window.setTimeout(() => {
      setData(mockOnboardingData);
      setBootLoading(false);
    }, INITIAL_LOAD_MS);
    return () => window.clearTimeout(t);
  }, []);

  function mockMetaConnect() {
    if (metaDone || metaConnecting) return;
    setMetaConnecting(true);
    window.setTimeout(() => {
      setMetaConnecting(false);
      setMetaDone(true);
    }, MOCK_CONNECT_MS);
  }

  function mockDriveConnect() {
    if (driveDone || driveConnecting) return;
    setDriveConnecting(true);
    window.setTimeout(() => {
      setDriveConnecting(false);
      setDriveDone(true);
    }, MOCK_CONNECT_MS);
  }

  const theme = themeForStep(step);
  const progressPct = ((step - 1) / 2) * 100;
  const name = data?.user_name?.trim()?.length ? data.user_name : "Cliente";
  const plan = data?.plan;

  return (
    <main className={styles.root} data-theme={theme}>
      <div className={styles.shell} aria-busy={bootLoading}>
        {bootLoading || !data ?
          <BootSkeleton />
        : <>
            <p className={styles.progressLabel} aria-live="polite">
              Primeiro acesso · passo {step} de 3
            </p>
            <div className={styles.progressWrap}>
              <div className={styles.progressLineBg}>
                <div className={styles.progressLineFill} style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className={styles.dots} role="tablist" aria-label="Progresso do onboarding">
              {[1, 2, 3].map((i) => (
                <span key={i} className={`${styles.dot} ${step === i ? styles.dotActive : ""}`} />
              ))}
            </div>

            <div className={styles.cardRail}>
              <div key={step} className={styles.stepPane} role="tabpanel">
                {step === 1 ?
                  <>
                    <p className={styles.eyebrow}>{`Olá, ${name}`}</p>
                    <h1 className={styles.title}>Bem-vindo ao HOOKO. Seu arsenal está pronto.</h1>
                    <article className={styles.planCard}>
                      <p className={styles.planName}>{plan?.name ?? "Plano HOOKO"} · Ativo</p>
                      <span className={styles.planBadge}>Subscrição pronta</span>
                      <ul className={styles.features}>
                        <li className={styles.feature}>
                          <span className={styles.featureIcon} aria-hidden>
                            ◆
                          </span>
                          <span>
                            <strong>Limite de criativos</strong>{" "}
                            <span className={styles.featureMuted}>
                              até {plan?.creative_limit ?? "—"} importações mensais conforme plano.
                            </span>
                          </span>
                        </li>
                        <li className={styles.feature}>
                          <span className={styles.featureIcon} aria-hidden>
                            ♪
                          </span>
                          <span>
                            <strong>Transcrição em vídeo</strong>{" "}
                            <span className={styles.featureMuted}>
                              {plan?.transcription_minutes ?? "—"} minutos mensais incluídos.
                            </span>
                          </span>
                        </li>
                        <li className={styles.feature}>
                          <span className={styles.featureIcon} aria-hidden>
                            ✧
                          </span>
                          <span>
                            <strong>Insights de IA</strong>{" "}
                            <span className={styles.featureMuted}>
                              Scores por gancho, oferta, prova social, CTA e harmonia vídeo/texto nos criativos
                              importados.
                            </span>
                          </span>
                        </li>
                      </ul>
                    </article>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnGold}
                        onClick={() => setStep(2)}
                      >
                        Configurar Integrações →
                      </button>
                    </div>
                  </>
                : step === 2 ?
                  <>
                    <p className={styles.eyebrow}>Fonte de dados</p>
                    <h1 className={styles.title}>Conecte sua conta Meta Ads</h1>
                    <p className={styles.sub}>
                      Precisamos de acesso de leitura para importar seus anúncios e métricas.
                    </p>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnMeta}
                        onClick={mockMetaConnect}
                        disabled={metaConnecting || metaDone}
                      >
                        <span className={styles.btnMetaLogo}>
                          <Image
                            src="/imagens/meta.png"
                            alt=""
                            width={160}
                            height={160}
                            className={styles.btnMetaLogoImg}
                            priority
                          />
                        </span>
                        {metaConnecting ? "A ligar conta…" : metaDone ? "Meta Ads — conta ligada" : "Conectar Meta Ads"}
                      </button>
                      {metaDone ?
                        <div className={styles.connectedRow}>
                          <span className={styles.badgeOk}>
                            <span className={styles.badgeDot} aria-hidden />
                            Conectado com sucesso
                          </span>
                        </div>
                      : null}
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={!metaDone}
                        onClick={() => setStep(3)}
                      >
                        Avançar →
                      </button>
                    </div>
                  </>
                : <>
                    <p className={styles.eyebrow}>Armazenamento</p>
                    <h1 className={styles.title}>Armazenamento Inteligente</h1>
                    <p className={styles.sub}>
                      Conecte o Google Drive para armazenarmos os vídeos importados e não sobrecarregarmos sua rede.
                    </p>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnDrive}
                        onClick={mockDriveConnect}
                        disabled={driveConnecting || driveDone}
                      >
                        <span className={styles.btnDriveLogo}>
                          <Image
                            src="/imagens/google-drive.png"
                            alt=""
                            width={160}
                            height={160}
                            className={styles.btnDriveLogoImg}
                          />
                        </span>
                        {driveConnecting ? "A ligar conta…"
                        : driveDone ? "Google Drive — conta ligada"
                        : "Conectar Google Drive"}
                      </button>
                      {driveDone ?
                        <div className={styles.connectedRow}>
                          <span className={styles.badgeOk}>
                            <span className={styles.badgeDot} aria-hidden />
                            Conectado com sucesso
                          </span>
                        </div>
                      : null}
                      {driveDone ?
                        <button
                          type="button"
                          className={`${styles.btnGold} ${styles.btnGoldLg}`}
                          onClick={() => router.push("/inicio")}
                        >
                          Ir para o Dashboard
                        </button>
                      : null}
                    </div>
                  </>
                }
              </div>
            </div>
          </>
        }
      </div>
    </main>
  );
}
