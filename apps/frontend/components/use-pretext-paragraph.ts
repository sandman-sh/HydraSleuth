"use client";

import { layout, prepare } from "@chenglou/pretext";
import { useEffect, useRef, useState } from "react";

type UsePretextParagraphOptions = {
  text: string;
  font: string;
  lineHeight: number;
  letterSpacing?: number;
  minLines?: number;
};

type ParagraphMetrics = {
  height: number;
  lineCount: number;
  ready: boolean;
};

const preparedParagraphCache = new Map<string, ReturnType<typeof prepare>>();

function getPreparedParagraph(text: string, font: string, letterSpacing: number) {
  const cacheKey = [text, font, letterSpacing].join("::");
  const cached = preparedParagraphCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const prepared = prepare(text, font, { letterSpacing });
  preparedParagraphCache.set(cacheKey, prepared);
  return prepared;
}

export function usePretextParagraph({
  text,
  font,
  lineHeight,
  letterSpacing = 0,
  minLines = 0,
}: UsePretextParagraphOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [metrics, setMetrics] = useState<ParagraphMetrics>({
    height: minLines * lineHeight,
    lineCount: minLines,
    ready: false,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateWidth = (nextWidth: number) => {
      const roundedWidth = Math.max(0, Math.round(nextWidth));
      setWidth((currentWidth) => (currentWidth === roundedWidth ? currentWidth : roundedWidth));
    };

    updateWidth(node.clientWidth);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      updateWidth(entry?.contentRect.width ?? node.clientWidth);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fallbackHeight = minLines * lineHeight;

    if (!text.trim() || width <= 0) {
      setMetrics({
        height: fallbackHeight,
        lineCount: minLines,
        ready: false,
      });
      return;
    }

    if (typeof document === "undefined" || typeof Intl === "undefined" || !("Segmenter" in Intl)) {
      setMetrics({
        height: fallbackHeight,
        lineCount: minLines,
        ready: false,
      });
      return;
    }

    const measureParagraph = async () => {
      if ("fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Fall through and let Pretext try current font metrics.
        }
      }

      if (cancelled) {
        return;
      }

      try {
        const prepared = getPreparedParagraph(text, font, letterSpacing);
        const nextLayout = layout(prepared, width, lineHeight);
        const nextLineCount = Math.max(nextLayout.lineCount, minLines);
        const nextHeight = Math.max(nextLayout.height, fallbackHeight);

        if (!cancelled) {
          setMetrics({
            height: nextHeight,
            lineCount: nextLineCount,
            ready: true,
          });
        }
      } catch {
        if (!cancelled) {
          setMetrics({
            height: fallbackHeight,
            lineCount: minLines,
            ready: false,
          });
        }
      }
    };

    void measureParagraph();

    return () => {
      cancelled = true;
    };
  }, [font, letterSpacing, lineHeight, minLines, text, width]);

  return { containerRef, metrics };
}
