"use client";

import React from "react";
import type { DecisionPanelProps, RiskItem } from "@/types/property";

function RiskBadge({ severity }: { severity: RiskItem["severity"] }) {
  const color =
    severity === "high"
      ? "#D93025"
      : severity === "mid"
      ? "#0E4ECF"
      : "#156F4B";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {severity}
    </span>
  );
}

export default function DecisionPanel({
  recommendedRange,
  risks,
  onViewRights,
  onViewPayout,
  onDownloadChecklist,
}: DecisionPanelProps) {
  const min = new Intl.NumberFormat("ko-KR").format(recommendedRange.min);
  const max = new Intl.NumberFormat("ko-KR").format(recommendedRange.max);

  return (
    <div className="rounded-2xl shadow-sm border border-black/10 bg-white p-5">
      <div className="flex items-center">
        <h3 className="text-base font-semibold text-[#0B1220]">
          낙찰가 가이드
        </h3>
      </div>
      <p className="mt-2 text-sm text-[#0B1220] tabular-nums">
        권장 입찰가 범위:{" "}
        <span className="font-semibold">
          {min}원 ~ {max}원
        </span>
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {risks.slice(0, 3).map((risk, idx) => {
          let bgColor = "bg-white";
          if (risk.severity === "high") bgColor = "!bg-[#FFD4D1]";
          else if (risk.severity === "mid") bgColor = "!bg-[#DFE6FF]";
          else if (risk.severity === "low") bgColor = "!bg-[#E3F7EC]";
          // 로그 추가
          console.log(
            `🎨 [낙찰가가이드] ${idx + 1}번 탭 bgColor: ${bgColor} (severity=${
              risk.severity
            })`
          );
          return (
            <div
              key={idx}
              className={`rounded-xl border border-black/10 ${bgColor} p-4`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="text-sm font-semibold text-[#0B1220] truncate"
                  title={risk.title}
                >
                  {risk.title}
                </div>
                <RiskBadge severity={risk.severity} />
              </div>
              <p className="mt-1 text-xs text-[#5B6475]">원인: {risk.cause}</p>
              <p className="mt-1 text-xs text-[#5B6475]">영향: {risk.impact}</p>
              <p className="mt-1 text-xs text-[#5B6475]">조치: {risk.action}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* 버튼 전체 제거: 버튼 텍스트도, 버튼 뼈대도 완전히 삭제 */}
      </div>
    </div>
  );
}
