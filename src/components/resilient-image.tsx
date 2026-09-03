"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";

const RETRY_DELAYS = [700, 1800];

type Props = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallbackSrc?: string;
  fallbackLabel?: string;
};

export function ResilientImage({ src, fallbackSrc, fallbackLabel = "Image unavailable", ...props }: Props) {
  const sources = useMemo(() => {
    const unique = [src, fallbackSrc].filter((value): value is string => Boolean(value));
    return Array.from(new Set(unique));
  }, [src, fallbackSrc]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setRetry(0);
    setFailed(false);
  }, [src, fallbackSrc]);

  const activeSrc = sources[sourceIndex] ?? "";

  if (!activeSrc || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream px-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
        {fallbackLabel}
      </div>
    );
  }

  return (
    <Image
      key={`${activeSrc}:${retry}`}
      {...props}
      src={activeSrc}
      onError={() => {
        // Preferred variants may not exist yet during a rollout. Fall back to
        // the known-good full image immediately instead of retrying a 404.
        if (sourceIndex + 1 < sources.length) {
          setSourceIndex((index) => index + 1);
          setRetry(0);
          return;
        }

        // Once on the known-good source, retry a couple of times with backoff.
        // This is specifically for transient Storage 429/edge failures.
        if (retry < RETRY_DELAYS.length) {
          const nextRetry = retry + 1;
          window.setTimeout(() => setRetry(nextRetry), RETRY_DELAYS[retry]);
          return;
        }

        setFailed(true);
      }}
    />
  );
}
