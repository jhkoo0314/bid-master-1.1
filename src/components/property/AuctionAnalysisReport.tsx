"use client";

import * as React from "react";
import type { PropertyDetail } from "@/types/property";
import InfoTip from "@/components/common/InfoTip";
import SafetyMarginComparison from "@/components/report/SafetyMarginComparison";

// 간단한 클래스 병합 유틸
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * props.detail.analysisV12를 기준으로 렌더링
 * - FMV/Exit 2종 안전마진
 * - 총인수금액 vs FMV/Exit 비교 바
 * - 3단계 입찰전략
 */
export function AuctionAnalysisReport({
  detail,
}: {
  detail: PropertyDetail & { analysisV12?: any; bidStrategy?: any };
}) {
  const a = detail.analysisV12;
  if (!a) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4">
        <div className="text-lg font-semibold mb-2">경매분석 (v1.2)</div>
        <div className="text-sm text-zinc-500">
          분석 데이터가 없습니다. v1.2 매핑(mapSimulationToPropertyDetailV2) 후
          다시 시도하세요.
        </div>
      </div>
    );
  }

  const A = a.acquisition.total;
  const Vfmv = a.fmv.fairMarketValue;
  const Vexit = a.exit.exitPrice;
  const userBidPrice = a.acquisition.parts.bidPrice; // 사용자 입찰가

  // ✅ 사용자 입찰가 기준 안전마진 계산: FMV - 입찰가
  const userMosAmount = Vfmv - userBidPrice;
  const userMosRate = Vfmv > 0 ? userMosAmount / Vfmv : 0;

  const barMax = Math.max(A, Vfmv, Vexit);
  const pA = pctBar(A, barMax);
  const pF = pctBar(Vfmv, barMax);
  const pE = pctBar(Vexit, barMax);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* ✅ 새 안전마진 비교 3박스 삽입 */}
      <div className="col-span-3">
        <SafetyMarginComparison
          fmv={{
            amount: a.fmv.mosAmount,
            pct: a.fmv.mosRate ?? 0,
            referencePrice: Vfmv,
          }}
          exit={{
            amount: a.exit.mosAmount,
            pct: a.exit.mosRate ?? 0,
            referencePrice: Vexit,
          }}
          user={{
            amount: userMosAmount, // ✅ 실제 사용자 입찰가 기준 안전마진
            pct: userMosRate,
            referencePrice: Vfmv, // FMV를 참조가격으로 사용
            bidPrice: userBidPrice, // ✅ 입찰가 전달 (FMV 초과 판단용)
          }}
        />
      </div>

      {/* 3단계 입찰전략 */}
      <div className="col-span-3 bg-white border border-gray-300 rounded-lg p-4">
        <div className="pb-2 mb-2 border-b border-gray-200">
          <div className="text-base font-semibold">입찰전략 (3단계)</div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {a.bidStrategy.map((b: { stage: string; value: number }) => (
            <div key={b.stage} className="rounded-xl border p-3">
              <div className="text-sm text-zinc-500">{b.stage}</div>
              <div className="text-xl font-semibold">{formatKRW(b.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bar,
  tone,
}: {
  label: string;
  value: number;
  bar: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium">{formatKRW(value)}</span>
      </div>
      <div className="h-2 mt-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${bar}%` }}
        />
      </div>
    </div>
  );
}

function pctBar(v: number, max: number) {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((v / max) * 100)));
}
function formatKRW(v?: number) {
  if (v == null) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(v)}원`;
}
function fmtPct(r?: number) {
  if (r == null || !isFinite(r)) return "-";
  return `${(r * 100).toFixed(1)}%`;
}
