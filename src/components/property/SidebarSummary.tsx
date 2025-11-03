"use client";

import React from "react";
import type { SidebarSummaryProps, RightRow } from "@/types/property";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "green" | "orange" | "red" | "blue" | "gray";
}

function Badge({ children, tone = "gray" }: BadgeProps) {
  const map: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function formatCurrency(amount: number): string {
  return "₩" + amount.toLocaleString();
}

// 리스크 레벨 칩 색상 매핑
function riskTone(level: "high" | "mid" | "low"): "red" | "orange" | "green" {
  return level === "high" ? "red" : level === "mid" ? "orange" : "green";
}

// 권리유형에서 리스크 정보 추출 (13가지 권리 유형 모두 처리)
function extractRisksFromRights(rights: RightRow[]) {
  console.log("🔍 [사이드바 요약] 권리 분석 시작", {
    rightsCount: rights.length,
  });

  const riskMap: Map<string, { level: "high" | "mid" | "low"; detail: string }> =
    new Map();

  rights.forEach((right) => {
    const type = right.type;

    // 권리 유형별 리스크 레벨 결정 (13가지 모두 처리)
    let level: "high" | "mid" | "low" = "low";
    let detail = "";

    // 1. 근저당권 (고위험)
    if (type.includes("근저당")) {
      level = "high";
      detail = right.claim
        ? `채권최고액 ${(right.claim / 100_000_000).toFixed(1)}억`
        : "설정 1건, 말소 예정이나 확인 필요";
    }
    // 2. 저당권 (고위험)
    else if (type.includes("저당권") && !type.includes("근저당")) {
      level = right.claim && right.claim > 100_000_000 ? "high" : "mid";
      detail = right.claim
        ? `채권최고액 ${(right.claim / 100_000_000).toFixed(1)}억, 인수 가능성 낮음`
        : "설정 1건";
    }
    // 3. 압류 (고위험)
    else if (type === "압류") {
      level = "high";
      detail = right.claim
        ? `압류 금액 ${formatCurrency(right.claim)}`
        : "법원 강제집행권";
    }
    // 4. 가압류 (중위험)
    else if (type === "가압류") {
      level = "mid";
      detail = right.claim
        ? `가압류 금액 ${formatCurrency(right.claim)}`
        : "미리 압류하는 권리";
    }
    // 5. 담보가등기 (중위험)
    else if (type === "담보가등기") {
      level = "mid";
      detail = right.claim
        ? `담보 금액 ${formatCurrency(right.claim)}`
        : "담보를 위한 가등기";
    }
    // 6. 소유권이전청구권가등기 (고위험)
    else if (
      type.includes("소유권이전") ||
      type.includes("소유권이전청구권") ||
      type.includes("소유권이전가등기")
    ) {
      level = "high";
      detail = right.claim
        ? `청구금액 ${formatCurrency(right.claim)}`
        : "소유권 이전 청구권 가등기";
    }
    // 7. 전세권 (중위험)
    else if (type.includes("전세권")) {
      level = "mid";
      detail = right.claim
        ? `보증금 ${formatCurrency(right.claim)}`
        : "설정 있음";
    }
    // 8. 주택임차권 (중위험, 대항력 있으면 고위험)
    else if (type.includes("주택임차권") || (type.includes("임차") && type.includes("주택"))) {
      level = right.note?.includes("대항력") ? "high" : "mid";
      detail = right.note || right.claim
        ? `보증금 ${right.claim ? formatCurrency(right.claim) : ""} ${right.note || ""}`.trim()
        : "주택 임차인 점유";
    }
    // 9. 상가임차권 (중위험, 대항력 있으면 고위험)
    else if (type.includes("상가임차권") || (type.includes("임차") && type.includes("상가"))) {
      level = right.note?.includes("대항력") ? "high" : "mid";
      detail = right.note || right.claim
        ? `보증금 ${right.claim ? formatCurrency(right.claim) : ""} ${right.note || ""}`.trim()
        : "상가 임차인 점유";
    }
    // 10. 가처분 (중위험)
    else if (type === "가처분") {
      level = "mid";
      detail = right.claim
        ? `가처분 금액 ${formatCurrency(right.claim)}`
        : "임시 처분권";
    }
    // 11. 유치권 (저위험)
    else if (type === "유치권") {
      level = "low";
      detail = right.claim
        ? `유치권 금액 ${formatCurrency(right.claim)}`
        : "신고 없음";
    }
    // 12. 법정지상권 (저위험)
    else if (type === "법정지상권") {
      level = "low";
      detail = "법적으로 인정되는 지상권";
    }
    // 13. 분묘기지권 (저위험)
    else if (type === "분묘기지권") {
      level = "low";
      detail = "분묘 보호권";
    }
    // 기타 임차/임대 관련 (중위험, 대항력 있으면 고위험)
    else if (type.includes("임차") || type.includes("임대")) {
      level = right.note?.includes("대항력") ? "high" : "mid";
      detail = right.note || "임차인 점유";
    }
    // 기타 가등기, 예고등기 등 (저위험)
    else if (type.includes("가등기") || type.includes("예고등기")) {
      level = "low";
      detail = "등기 보전";
    }
    // 기타 미분류 (기본값: 저위험)
    else {
      level = "low";
      detail = right.claim
        ? `청구금액 ${formatCurrency(right.claim)}`
        : "기타 권리";
    }

    // 동일한 권리 유형이 여러 개인 경우 가장 높은 리스크 레벨로 업데이트
    const existing = riskMap.get(type);
    const levelOrder = { high: 3, mid: 2, low: 1 };
    if (!existing || levelOrder[level] > levelOrder[existing.level]) {
      riskMap.set(type, { level, detail });
      console.log(`  - 권리 유형: ${type}, 리스크: ${level}, 상세: ${detail}`);
    }
  });

  const result = Array.from(riskMap.entries()).map(([label, { level, detail }]) => ({
    level,
    label,
    detail,
  }));

  console.log(`✅ [사이드바 요약] 권리 분석 완료: ${result.length}개 권리 유형 식별`);
  return result;
}

export default function SidebarSummary({
  rights,
  bidRange,
  roi,
  tip,
}: SidebarSummaryProps) {
  console.log("📊 [사이드바 요약] 컴포넌트 렌더링", {
    rightsCount: rights.length,
    bidRange,
    roi,
  });

  const risks = extractRisksFromRights(rights);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          핵심 요약
        </h3>

        {/* 리스크 요약 */}
        <div className="space-y-2 mb-4">
          {risks.length > 0 ? (
            risks.slice(0, 3).map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Badge tone={riskTone(risk.level)}>{risk.label}</Badge>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">{risk.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">등기된 권리 없음</p>
          )}
        </div>

        {/* 권장 입찰가 범위 */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-1">권장 입찰가 범위</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(bidRange.min)} ~ {formatCurrency(bidRange.max)}
          </p>
          {bidRange.optimal && (
            <p className="text-xs text-gray-500 mt-1">
              최적가: {formatCurrency(bidRange.optimal)}
            </p>
          )}
        </div>

        {/* 예상 수익률 */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-1">예상 수익률</p>
          <p className="text-lg font-semibold text-blue-600">{roi.toFixed(1)}%</p>
        </div>

        {/* 팁 */}
        {tip && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-900">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

