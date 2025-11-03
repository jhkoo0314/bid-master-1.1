"use client";

import React from "react";

// ✅ FMV/Exit/User MoS 단일 카드
type Props = {
  title: string;
  amount: number;
  pct: number;
  referencePriceLabel: "FMV" | "Exit";
  referencePrice: number;
  tooltip?: string;
};

// ✅ 금액/퍼센트 포맷 함수 그대로 유지
const fmtWon = (v: number) =>
  v.toLocaleString("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

export default function SafetyMarginCard({
  title,
  amount,
  pct, // 0.266 → 26.6%
  referencePriceLabel,
  referencePrice,
  tooltip,
}: Props) {
  const isNeg = amount < 0;
  const color =
    amount === 0 ? "text-foreground" : isNeg ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="rounded-2xl border p-2.5 md:p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{title}</div>
        {tooltip && (
          <span
            className="text-muted-foreground text-xs cursor-help"
            title={tooltip}
          >
            ℹ️</span>
        )}
      </div>
      <div className={`text-xl md:text-2xl font-semibold ${color}`}>
        {amount >= 0 ? "+" : ""}
        {fmtWon(amount)}{" "}
        <span className="ml-1 text-xs">{`(${fmtPct(pct)})`}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        참조가격 {referencePriceLabel}:{" "}
        <span className="font-medium">{fmtWon(referencePrice)}</span>
      </div>
    </div>
  );
}

