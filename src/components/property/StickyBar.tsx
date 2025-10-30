"use client";

import React, { useEffect } from "react";
import type { StickyBarProps } from "@/types/property";

export default function StickyBar({ lowestPrice, nextAuctionDate, court, topRisk }: StickyBarProps) {
  useEffect(() => {
    console.log(
      `📊 [사용자 액션] Sticky 요약바 초기화: lowest=${lowestPrice}, next=${nextAuctionDate}, court=${court}`
    );
  }, [lowestPrice, nextAuctionDate, court]);

  return (
    <div
      className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-black/10"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-4">
        <div className="text-sm text-[#0B1220] font-semibold tabular-nums">
          최저가 {new Intl.NumberFormat("ko-KR").format(lowestPrice)}원
        </div>
        <div className="text-sm text-[#5B6475]">|
          <span className="ml-2">다음 입찰: {nextAuctionDate} · {court}</span>
        </div>
        {topRisk ? (
          <div className="ml-auto text-sm text-[#D93025] truncate max-w-[40%]" title={topRisk}>
            핵심 리스크: {topRisk}
          </div>
        ) : null}
      </div>
    </div>
  );
}
