"use client";

import React from "react";
import type { RiskFlagKey } from "@/lib/constants.auction";
import InfoTip from "@/components/common/InfoTip";

interface RiskBadgeProps {
  flag: RiskFlagKey;
  variant?: "default" | "compact";
}

/**
 * 위험 배지 설명 텍스트
 */
const RISK_FLAG_DESCRIPTIONS: Record<RiskFlagKey, { title: string; description: string }> = {
  소유권분쟁: {
    title: "소유권분쟁",
    description: "압류, 가처분, 소유권이전청구권가등기, 가등기, 예고등기 등으로 인한 소유권 분쟁 가능성이 있습니다.",
  },
  상가임차: {
    title: "상가임차",
    description: "상가임차권이 등기되어 있어 인수해야 할 보증금이 발생할 수 있으며, 명도 과정이 복잡할 수 있습니다.",
  },
  유치권: {
    title: "유치권",
    description: "유치권이 등기되어 있어 명도 비용이 추가로 발생할 수 있습니다. 유치권은 법률상 강력한 권리입니다.",
  },
  법정지상권: {
    title: "법정지상권",
    description: "법정지상권이 등기되어 있어 건물의 소유권에 제약이 있을 수 있으며, 명도 비용이 추가로 발생할 수 있습니다.",
  },
  분묘: {
    title: "분묘기지권",
    description: "분묘기지권이 등기되어 있어 매물 사용에 제약이 있을 수 있으며, 명도 비용이 추가로 발생할 수 있습니다.",
  },
  배당불명확: {
    title: "배당불명확",
    description: "배당 요구나 배당 순위가 불명확하여 인수 금액 계산에 불확실성이 있습니다.",
  },
  임차다수: {
    title: "임차다수",
    description: "임차인이 3명 이상으로 명도 과정이 복잡하고 비용이 증가할 수 있습니다.",
  },
};

/**
 * 위험 배지 색상 정의
 */
const RISK_FLAG_COLORS: Record<RiskFlagKey, { bg: string; text: string; border: string }> = {
  소유권분쟁: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
  },
  상가임차: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  유치권: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  법정지상권: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  분묘: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  배당불명확: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  임차다수: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
};

/**
 * 위험 배지 컴포넌트
 * 
 * 리포트에서 위험 요소를 시각적으로 표시합니다.
 */
export default function RiskBadge({ flag, variant = "default" }: RiskBadgeProps) {
  const colors = RISK_FLAG_COLORS[flag];
  const description = RISK_FLAG_DESCRIPTIONS[flag];

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
      >
        {flag}
        <InfoTip title={description.title} description={description.description} />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className="text-xs font-medium">{flag}</span>
      <InfoTip title={description.title} description={description.description} />
    </div>
  );
}

/**
 * 위험 배지 목록 컴포넌트
 */
export function RiskBadgeList({ flags }: { flags: RiskFlagKey[] }) {
  if (flags.length === 0) {
    return (
      <div className="text-sm text-gray-500">위험 요소가 없습니다.</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, index) => (
        <RiskBadge key={index} flag={flag} />
      ))}
    </div>
  );
}

