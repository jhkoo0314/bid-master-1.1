"use client";

import React from "react";
import type { DecisionPanelProps, RiskItem } from "@/types/property";

function RiskBadge({ severity }: { severity: RiskItem["severity"] }) {
  const color = severity === "high" ? "#D93025" : severity === "mid" ? "#0E4ECF" : "#156F4B";
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{severity}</span>;
}

export default function DecisionPanel({ recommendedRange, risks, onViewRights, onViewPayout, onDownloadChecklist }: DecisionPanelProps) {
  const min = new Intl.NumberFormat("ko-KR").format(recommendedRange.min);
  const max = new Intl.NumberFormat("ko-KR").format(recommendedRange.max);

  const onOpenFormula = () => {
    console.log(`📊 [사용자 액션] 산식 버튼 클릭: range_min=${recommendedRange.min}, range_max=${recommendedRange.max}`);
    alert("산식: 최저가 × 가중치 - 인수비용 (자세한 설명은 정식 서비스에서 제공됩니다)");
  };

  return (
    <div className="rounded-2xl shadow-sm border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0B1220]">낙찰가 가이드</h3>
        <button
          type="button"
          onClick={onOpenFormula}
          className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50"
        >
          산식 보기
        </button>
      </div>
      <p className="mt-2 text-sm text-[#0B1220] tabular-nums">
        권장 입찰가 범위: <span className="font-semibold">{min}원 ~ {max}원</span>
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {risks.slice(0, 3).map((risk, idx) => (
          <div key={idx} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#0B1220] truncate" title={risk.title}>{risk.title}</div>
              <RiskBadge severity={risk.severity} />
            </div>
            <p className="mt-1 text-xs text-[#5B6475]">원인: {risk.cause}</p>
            <p className="mt-1 text-xs text-[#5B6475]">영향: {risk.impact}</p>
            <p className="mt-1 text-xs text-[#5B6475]">조치: {risk.action}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            console.log("📄 [사용자 액션] 권리요약 보기 클릭");
            onViewRights?.();
          }}
          className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50"
        >
          권리요약 보기
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("📄 [사용자 액션] 배당요약 보기 클릭");
            onViewPayout?.();
          }}
          className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50"
        >
          배당요약 보기
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("📄 [사용자 액션] 현장체크리스트 다운로드 클릭");
            onDownloadChecklist?.();
          }}
          className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50"
        >
          현장체크리스트 다운로드
        </button>
      </div>
    </div>
  );
}
