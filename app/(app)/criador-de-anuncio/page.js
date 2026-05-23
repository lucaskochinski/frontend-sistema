"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";

const CTA_OPTIONS = [
  { value: "SHOP_NOW", label: "Comprar agora" },
  { value: "LEARN_MORE", label: "Saiba mais" },
  { value: "SIGN_UP", label: "Cadastrar-se" },
  { value: "DOWNLOAD", label: "Baixar" },
  { value: "CONTACT_US", label: "Fale conosco" },
  { value: "BOOK_TRAVEL", label: "Reservar agora" }
];

export default function CriadorAnuncioPage() {
  const [productName, setProductName] = useState("");
  const [baseCreativeId, setBaseCreativeId] = useState("");
  const [importedAds, setImportedAds] = useState([]);
  const [pageName, setPageName] = useState("Sua Marca / Produto");
  const [primaryText, setPrimaryText] = useState("O criativo perfeito para os seus anúncios está a um clique de distância. Preencha os campos ao lado e visualize em tempo real a estrutura do seu post patrocinado! 🚀🔥");
  const [headline, setHeadline] = useState("Frete Grátis Hoje + 15% OFF");
  const [cta, setCta] = useState("SHOP_NOW");
  const [ratio, setRatio] = useState("square"); // 'square' ou 'story'
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

  const applyBaseCreative = (adId) => {
    const ad = importedAds.find((a) => a.adId === adId);
    if (!ad) return;
    setBaseCreativeId(adId);
    if (ad.adName) setPageName(ad.adName.split(" · ")[0] || ad.adName);
    if (ad.aiAnalysis?.headline) setHeadline(String(ad.aiAnalysis.headline));
    if (ad.aiAnalysis?.primaryText) setPrimaryText(String(ad.aiAnalysis.primaryText));
  };

  // Simulação de geração de cópia com Inteligência Artificial
  const handleGenerateAiCopy = () => {
    setGenerating(true);
    setTimeout(() => {
      const product = productName.trim() || "seu produto";
      setPrimaryText(
        `Você ainda está perdendo vendas com criativos genéricos para ${product}? 💸\n\nCom base no criativo selecionado, testamos um gancho direto + prova social + CTA claro. Ajuste o texto e publique no Meta em minutos. 👇`
      );
      setHeadline(`Análise ${product} — resultado em 60s`);
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
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap}>
              <svg
                className={styles.topIconSvg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" opacity="0.4" />
                <path d="M19 11l-8 8-4-4 8-8 4 4zM16 8l-3.5 3.5" />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Criador de Anúncio</h1>
              <p className={styles.topHint}>
                Crie copys, títulos, configure CTAs e visualize o design exato do seu anúncio Meta Ads patrocinado em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.workspace}>
        {/* Editor Form Panel (Esquerda) */}
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
            <label className={styles.label}>Criativo base (importado)</label>
            <select
              className={`${styles.input} ${styles.select}`}
              value={baseCreativeId}
              onChange={(e) => applyBaseCreative(e.target.value)}
            >
              <option value="">Selecione um criativo da biblioteca…</option>
              {importedAds.map((ad) => (
                <option key={ad.adId} value={ad.adId}>
                  {ad.adName}
                  {ad.campaignName ? ` — ${ad.campaignName}` : ""}
                </option>
              ))}
            </select>
            {importedAds.length === 0 ? (
              <p className={styles.fieldHint}>
                Nenhum criativo importado.{" "}
                <Link href="/criativo/biblioteca">Importar na biblioteca</Link>
              </p>
            ) : null}
          </div>

          {/* Nome da Página */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nome do Perfil / Página</label>
            <input
              type="text"
              className={styles.input}
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="Ex: Minha Loja Virtual"
            />
          </div>

          {/* Texto Principal */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Texto Principal (Primary Copy)</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              placeholder="Escreva a copy principal do anúncio que aparecerá no topo do post..."
            />
          </div>

          {/* Título Principal */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Título (Headline)</label>
            <input
              type="text"
              className={styles.input}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ex: Compre 1 Leve 2 + Frete Grátis"
            />
          </div>

          {/* Link de exibição */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Link de Destino / Exibição</label>
            <input
              type="text"
              className={styles.input}
              value={displayLink}
              onChange={(e) => setDisplayLink(e.target.value)}
              placeholder="Ex: meusite.com.br"
            />
          </div>

          {/* CTA Selector */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Chamada para Ação (CTA)</label>
            <select
              className={`${styles.input} ${styles.select}`}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            >
              {CTA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>

          {/* Proporção Visualizer */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Proporção da Mídia (Preview)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className={`${styles.btnPrimary} ${styles.btn}`}
                style={{
                  flex: 1,
                  background: ratio === "square" ? "rgba(212,175,55,0.2)" : "rgba(0,0,0,0.2)",
                  borderColor: ratio === "square" ? "#d4af37" : "rgba(255,255,255,0.1)",
                  color: "#ffffff"
                }}
                onClick={() => setRatio("square")}
              >
                Feed (1:1 Quadrado)
              </button>
              <button
                className={`${styles.btnPrimary} ${styles.btn}`}
                style={{
                  flex: 1,
                  background: ratio === "story" ? "rgba(212,175,55,0.2)" : "rgba(0,0,0,0.2)",
                  borderColor: ratio === "story" ? "#d4af37" : "rgba(255,255,255,0.1)",
                  color: "#ffffff"
                }}
                onClick={() => setRatio("story")}
              >
                Stories / Reels (9:16)
              </button>
            </div>
          </div>

          {/* IA Assistente Trigger */}
          <button
            onClick={handleGenerateAiCopy}
            disabled={generating}
            className={styles.btnPrimary}
            style={{ marginTop: "1rem" }}
          >
            {generating ? "🪄 Gerando com IA Hooko..." : "🪄 Gerar Copy Otimizada com IA"}
          </button>
        </div>

        {/* Live Simulator Preview (Direita) */}
        <div className={styles.previewPane}>
          <h2 className={styles.previewTitle}>Simulação em Tempo Real</h2>

          <div className={styles.facebookCard}>
            {/* Top Bar of the ad */}
            <div className={styles.cardTop}>
              <div className={styles.pageAvatar}>
                {pageName ? pageName.slice(0, 2).toUpperCase() : "HK"}
              </div>
              <div className={styles.pageDetails}>
                <p className={styles.pageName}>{pageName || "Sua Marca"}</p>
                <div className={styles.sponsoredLabel}>
                  <span>Patrocinado</span>
                </div>
              </div>
            </div>

            {/* Main Primary Text */}
            <div className={styles.postBody}>
              {primaryText || "Insira a copy do anúncio na área de edição..."}
            </div>

            {/* Media Area */}
            <div
              className={`${styles.mediaContainer} ${
                ratio === "story" ? styles.ratioStory : styles.ratioSquare
              }`}
            >
              <div className={styles.mediaPlaceholder}>
                <svg
                  className={styles.mediaIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
                <p className={styles.mediaPlaceholderTitle}>
                  Área do Criativo (Aspecto {ratio === "story" ? "9:16" : "1:1"})
                </p>
                <p style={{ fontSize: "0.72rem", margin: 0, opacity: 0.7 }}>
                  O vídeo UGC ou criativo dinâmico renderizará aqui
                </p>
              </div>
            </div>

            {/* Ad Headline & CTA bar */}
            <div className={styles.cardBottom}>
              <div className={styles.headlineWrap}>
                <span className={styles.displayLink}>{displayLink || "link.com"}</span>
                <p className={styles.adHeadline}>{headline || "Título do Anúncio"}</p>
              </div>
              <button className={styles.ctaButton}>{getCtaLabel(cta)}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
