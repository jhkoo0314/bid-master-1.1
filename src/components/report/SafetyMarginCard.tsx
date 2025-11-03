"use client";

import React from "react";
import InfoTip from "@/components/common/InfoTip";

// ✅ FMV/Exit/User MoS 단일 카드
type Props = {
  title: string;
  amount: number;
  pct: number;
  referencePriceLabel: "FMV" | "Exit";
  referencePrice: number;
  tooltip?: string;
  isOverFMV?: boolean; // ✅ FMV 초과 여부
};

// ✅ 금액/퍼센트 포맷 함수 그대로 유지
const fmtWon = (v: number) =>
  v.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });

const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

export default function SafetyMarginCard({
  title,
  amount,
  pct, // 0.266 → 26.6%
  referencePriceLabel,
  referencePrice,
  tooltip,
  isOverFMV = false,
}: Props) {
  const isNeg = amount < 0;
  const color =
    amount === 0
      ? "text-foreground"
      : isNeg
      ? "text-rose-600"
      : "text-emerald-600";

  // ✅ FMV 초과 경고 라벨
  const WarningBadge = () =>
    isOverFMV ? (
      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
        🔥 FMV 초과 입찰
      </span>
    ) : null;

  return (
    <div className="rounded-2xl border p-2.5 md:p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          {title}
          {tooltip && (
            <InfoTip
              title={title === "FMV 기준" ? "FMV 기준 안전마진" : title}
              description={
                title === "FMV 기준"
                  ? "FMV(공정시세)에서 총인수금액을 뺀 값입니다.\n\n" +
                    "• FMV: 현재 시장 가치를 반영한 공정시세\n" +
                    "• 계산식: FMV − 총인수금액(A)\n" +
                    "• 의미: 즉시 매각 가정 시의 안전마진\n\n" +
                    "이는 현재 시세 기준으로 투자 시 얼마나 여유가 있는지를 보여주는 지표입니다."
                  : tooltip
              }
            />
          )}
          <WarningBadge />
        </div>
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
