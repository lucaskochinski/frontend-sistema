"use client";

/**
 * Imagem externa (Meta CDN, Google Drive, etc.) — usa <img> nativo
 * com referrerPolicy para evitar bloqueio do fbcdn.net.
 */
export default function ExternalImage({
  src,
  alt = "",
  className,
  style,
  onError,
  fallback = "/imagens/meta.png",
  ...rest
}) {
  const safeSrc = src && String(src).trim() ? String(src).trim() : fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={(e) => {
        if (onError) {
          onError(e);
          return;
        }
        const el = e.currentTarget;
        if (el.src !== fallback && typeof window !== "undefined") {
          el.src = fallback;
        }
      }}
      {...rest}
    />
  );
}
