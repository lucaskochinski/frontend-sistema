"use client";

/**
 * Vídeo externo (Meta CDN, etc.) — referrerPolicy no-referrer para fbcdn.
 */
export default function ExternalVideo({
  src,
  poster,
  className,
  onError,
  controls = true,
  playsInline = true,
  preload = "metadata",
  ...rest
}) {
  return (
    <video
      className={className}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      src={src || undefined}
      poster={poster || undefined}
      referrerPolicy="no-referrer"
      onError={onError}
      {...rest}
    />
  );
}
