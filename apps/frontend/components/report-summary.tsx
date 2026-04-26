"use client";

import { usePretextParagraph } from "./use-pretext-paragraph";

type ReportSummaryProps = {
  summary: string;
};

const SUMMARY_FONT = '500 15px "Manrope"';
const SUMMARY_LINE_HEIGHT = 28;
const SUMMARY_MIN_LINES = 4;

export function ReportSummary({ summary }: ReportSummaryProps) {
  const { containerRef, metrics } = usePretextParagraph({
    text: summary,
    font: SUMMARY_FONT,
    lineHeight: SUMMARY_LINE_HEIGHT,
    minLines: SUMMARY_MIN_LINES,
  });

  return (
    <div
      ref={containerRef}
      className="mt-5"
      data-pretext-ready={metrics.ready ? "true" : "false"}
      data-pretext-lines={metrics.lineCount}
    >
      <p
        className="text-[15px] leading-7 text-base-content/66"
        style={{ minHeight: `${metrics.height}px` }}
      >
        {summary}
      </p>
    </div>
  );
}
