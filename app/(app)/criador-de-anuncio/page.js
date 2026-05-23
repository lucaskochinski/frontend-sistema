"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import ExternalImage from "@/components/ExternalMedia/ExternalImage";

const CTA_OPTIONS = [
  { value: "SHOP_NOW", label: "Comprar agora" },
  { value: "LEARN_MORE", label: "Saiba mais" },
  { value: "SIGN_UP", label: "Cadastrar-se" },
  { value: "DOWNLOAD", label: "Baixar" },
  { value: "CONTACT_US", label: "Fale conosco" },
  { value: "BOOK_TRAVEL", label: "Reservar agora" },
];

function ratioFromAspect(aspectRatio) {
  const a = String(aspectRatio || "");
  if (a.startsWith("9:") || a === "9:16") return "story";
  return "square";
}

function CriadorAnuncioInner() {
  const searchParams = useSearchParams();
  const formatoId = searchParams.get("formato");

  const [productName, setProductName] = useState("");
  const [baseCreativeId, setBaseCreativeId] = useState("");
  const [importedAds, setImportedAds] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [pageName, setPageName] = useState("Sua Marca / Produto");
  const [primaryText, setPrimaryText] = useState(
    "Monte aqui a copy do anúncio e veja o preview estilo post patrocinado da Meta.",
  );
  const [headline, setHeadline] = useState("Frete Grátis Hoje + 15% OFF");
  const [cta, setCta] = useState("SHOP_NOW");
  const [ratio, setRatio] = useState("square");
  const [displayLink, setDisplayLink] = useState("loja.exemplo.com.br");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadAds() {
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;
        const res = await apiFetch(`/api/dashboard/insights?organizationId=${orgId}&limit=30`);
        setImportedAds(Array.isArray(res?.items) ? res.items : []);
      } catch {
        setImportedAds([]);
      }
    }
    loadAds();
  }, []);

  useEffect(() => {
    if (!formatoId) {
      setSelectedFormat(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orgId = getStoredOrganizationId();
        const qs = orgId ? `?organizationId=${orgId}` : "";
        const res = await apiFetch(`/api/dashboard/creative-formats${qs}`);
        const tpl = (res?.templateLibrary || []).find((t) => t.id === formatoId);
        if (cancelled || !tpl) return;
        setSelectedFormat(tpl);
        setRatio(ratioFromAspect(tpl.aspectRatio));
        if (tpl.name && !productName) setProductName(tpl.name.split(" ").slice(0, 3).join(" "));
      } catch {
        if (!cancelled) setSelectedFormat(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatoId]);

  const baseAd = importedAds.find((a) => a.adId === baseCreativeId);

  const applyBaseCreative = (adId) => {
    const ad = importedAds.find((a) => a.adId === adId);
    if (!ad) return;
    setBaseCreativeId(adId);
    if (ad.adName) setPageName(ad.adName.split(" · ")[0] || ad.adName);
    if (ad.aiAnalysis?.headline) setHeadline(String(ad.aiAnalysis.headline));
    if (ad.aiAnalysis?.primaryText) setPrimaryText(String(ad.aiAnalysis.primaryText));
  };

  const handleGenerateAiCopy = () => {
    setGenerating(true);
    setTimeout(() => {
      const product = productName.trim() || "seu produto";
      const formatHint = selectedFormat ? ` no formato “${selectedFormat.name}”` : "";
      setPrimaryText(
        `Você ainda está perdendo vendas com criativos genéricos para ${product}? 💸\n\nRascunho${formatHint}: gancho direto + prova social + CTA claro. Ajuste e publique no Meta. 👇`,
      );
      setHeadline(`${product} — resultado em 60s`);
      setCta("LEARN_MORE");
      setGenerating(false);
    }, 1500);
  };

  const getCtaLabel = (val) => {
    const found = CTA_OPTIONS.find((opt) => opt.value === val);
    return found ? found.label : "Saiba mais";
  };

  return (
    <div className={styles.page}>
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap}>
              <svg className={styles.topIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" opacity="0.4" />
                <path d="M19 11l-8 8-4-4 8-8 4 4zM16 8l-3.5 3.5" />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Criador de Anúncio</h1>
              <p className={styles.topHint}>
                Simulador de post patrocinado Meta — monte copy, headline e CTA. Não publica na Meta; exporta o rascunho
                para você gravar ou subir manualmente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoBox}>
        <p>
          <strong>O que faz:</strong> preview do anúncio + assistente de texto (IA simulada por enquanto).{" "}
          <strong>Formatos → Biblioteca</strong> escolhe o modelo (UGC, gancho, etc.).{" "}
          <strong>Formatos → Meta importados</strong> só agrupa o que já importou — abra o anúncio lá para ver vídeo e
          métricas. Aqui você opcionalmente usa um importado só como base de copy.
        </p>
        {selectedFormat ? (
          <p className={styles.infoFormat}>
            Formato ativo: <strong>{selectedFormat.name}</strong> ({selectedFormat.aspectRatio})
            {" · "}
            <Link href="/formatos">Trocar formato</Link>
          </p>
        ) : null}
      </div>

      <div className={styles.workspace}>
        <div className={styles.editorPane}>
          <h2 className={styles.sectionTitle}>Configurações do Criativo</h2>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Produto / Oferta</label>
            <input
              type="text"
              className={styles.input}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Curso Capital Prime, Suplemento X…"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Criativo base (importado — opcional)</label>
            <select
              className={`${styles.input} ${styles.select}`}
              value={baseCreativeId}
              onChange={(e) => applyBaseCreative(e.target.value)}
            >
              <option value="">Nenhum — rascunho do zero</option>
              {importedAds.map((ad) => (
                <option key={ad.adId} value={ad.adId}>
                  {ad.adName}
                  {ad.campaignName ? ` — ${ad.campaignName}` : ""}
                </option>
              ))}
            </select>
            {baseAd ? (
              <Link href={`/criativo/${baseAd.adId}`} className={styles.baseCreativeLink}>
                Ver anúncio importado (métricas e vídeo)
              </Link>
            ) : null}
            {importedAds.length === 0 ? (
              <p className={styles.fieldHint}>
                Nenhum criativo importado.{" "}
                <Link href="/criativo/biblioteca">Importar na biblioteca</Link>
              </p>
            ) : null}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nome do Perfil / Página</label>
            <input type="text" className={styles.input} value={pageName} onChange={(e) => setPageName(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Texto Principal (Primary Copy)</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Título (Headline)</label>
            <input type="text" className={styles.input} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Link de Destino / Exibição</label>
            <input type="text" className={styles.input} value={displayLink} onChange={(e) => setDisplayLink(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Chamada para Ação (CTA)</label>
            <select className={`${styles.input} ${styles.select}`} value={cta} onChange={(e) => setCta(e.target.value)}>
              {CTA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Proporção da Mídia (Preview)</label>
            <div className={styles.ratioRow}>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btn} ${styles.ratioBtn} ${ratio === "square" ? styles.ratioBtnActive : ""}`}
                onClick={() => setRatio("square")}
              >
                Feed (1:1 Quadrado)
              </button>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btn} ${styles.ratioBtn} ${ratio === "story" ? styles.ratioBtnActive : ""}`}
                onClick={() => setRatio("story")}
              >
                Stories / Reels (9:16)
              </button>
            </div>
          </div>

          <button type="button" onClick={handleGenerateAiCopy} disabled={generating} className={styles.btnPrimary} style={{ marginTop: "1rem" }}>
            {generating ? "Gerando com IA Hooko…" : "Gerar copy com IA (rascunho)"}
          </button>
        </div>

        <div className={styles.previewPane}>
          <h2 className={styles.previewTitle}>Simulação em Tempo Real</h2>

          <div className={styles.facebookCard}>
            <div className={styles.cardTop}>
              <div className={styles.pageAvatar}>{pageName ? pageName.slice(0, 2).toUpperCase() : "HK"}</div>
              <div className={styles.pageDetails}>
                <p className={styles.pageName}>{pageName || "Sua Marca"}</p>
                <div className={styles.sponsoredLabel}>
                  <span>Patrocinado</span>
                </div>
              </div>
            </div>

            <div className={styles.postBody}>{primaryText || "Insira a copy do anúncio…"}</div>

            <div className={`${styles.mediaContainer} ${ratio === "story" ? styles.ratioStory : styles.ratioSquare}`}>
              {baseAd?.thumbnailUrl ? (
                <ExternalImage src={baseAd.thumbnailUrl} alt="" className={styles.mediaPreviewImg} />
              ) : (
                <div className={styles.mediaPlaceholder}>
                  <p className={styles.mediaPlaceholderTitle}>
                    {selectedFormat ? selectedFormat.name : "Área do criativo"}
                  </p>
                  <p className={styles.mediaPlaceholderSub}>
                    Aspecto {ratio === "story" ? "9:16" : "1:1"}
                    {selectedFormat?.durationSec ? ` · ~${selectedFormat.durationSec}s` : ""}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.cardBottom}>
              <div className={styles.headlineWrap}>
                <span className={styles.displayLink}>{displayLink || "link.com"}</span>
                <p className={styles.adHeadline}>{headline || "Título do Anúncio"}</p>
              </div>
              <button type="button" className={styles.ctaButton}>
                {getCtaLabel(cta)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CriadorAnuncioPage() {
  return (
    <Suspense fallback={<p className={styles.loadingFallback}>A carregar criador…</p>}>
      <CriadorAnuncioInner />
    </Suspense>
  );
}
