"use client";

import React from "react";
import InfoTip from "./InfoTip";

interface FMVDisplayProps {
  fairMarketValue: number; // 공정시세(FMV)
  min?: number; // FMV 최저 범위 (선택)
  max?: number; // FMV 최고 범위 (선택)
  auctionCenter?: number; // 경매가 가이드 (선택)
  showRange?: boolean; // 범위 표시 여부
  compact?: boolean; // 간결한 표시 모드
  className?: string; // 추가 CSS 클래스
}

export default function FMVDisplay({
  fairMarketValue,
  min,
  max,
  auctionCenter,
  showRange = false,
  compact = false,
  className = "",
}: FMVDisplayProps) {
  console.log("💰 [FMV 표시] FMV 컴포넌트 렌더링", {
    fairMarketValue,
    min,
    max,
    auctionCenter,
  });

  const hasRange =
    showRange && typeof min === "number" && typeof max === "number";
  const rangeText = hasRange
    ? `${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`
    : null;

  if (compact) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">공정시세(FMV):</span>
          <span className="font-semibold text-gray-900">
            {fairMarketValue.toLocaleString()}원
          </span>
          <InfoTip
            title="공정시세(FMV)"
            description={
              "안전마진 계산에 사용되는 공정시세. 감정가를 기준으로 지역/면적/연식/유형을 반영하여 산정."
            }
          />
        </div>
        {hasRange && (
          <div className="text-xs text-gray-500 mt-1">{rangeText}</div>
        )}
        {auctionCenter && (
          <div className="text-xs text-gray-500 mt-1">
            경매가 가이드: {auctionCenter.toLocaleString()}원
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-white border border-gray-300 ${className}`}>
      <div className="text-[11px] text-gray-600 flex items-center mb-1">
        공정시세(FMV)
        <InfoTip
          title="공정시세(FMV)"
          description={
            "안전마진 계산에 사용되는 공정시세. 감정가를 기준으로 지역/면적/연식/유형을 반영하여 산정."
          }
        />
      </div>
      <div className="font-semibold text-gray-900">
        {fairMarketValue.toLocaleString()}원
      </div>
      {hasRange && (
        <div className="text-[10px] text-gray-500 mt-1">{rangeText}</div>
      )}
      {auctionCenter && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-[10px] text-gray-600 flex items-center">
            경매가 가이드
            <InfoTip
              title="경매가 가이드"
              description={
                "입찰 전략 수립용 경매가 중심값. 공정시세 대비 평균 12% 할인 적용."
              }
            />
          </div>
          <div className="font-semibold text-gray-900 text-sm">
            {auctionCenter.toLocaleString()}원
          </div>
        </div>
      )}
    </div>
  );
}
