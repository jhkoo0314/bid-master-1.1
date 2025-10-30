import React from "react";
import type { PriceSummary } from "@/types/property";

interface SummaryHeaderProps {
  caseId: string;
  meta: { address: string; type: string; area_pyeong?: number; area_m2?: number };
  price: PriceSummary;
  nextAuction: { date: string; court: string };
}

function formatArea(meta: SummaryHeaderProps["meta"]) {
  const parts: string[] = [];
  if (meta.area_pyeong) parts.push(`${meta.area_pyeong}평`);
  if (meta.area_m2) parts.push(`${meta.area_m2}㎡`);
  return parts.join(" · ");
}

export default function SummaryHeader({ caseId, meta, price, nextAuction }: SummaryHeaderProps) {
  console.log(`🏠 [매물 상세] 페이지 요약 표시: caseId=${caseId}`);

  const discountLabel = `${Math.round(price.discountRate * 100)}%↓`;
  const statusBadge =
    price.status === "confirmed"
      ? "bg-black text-white"
      : price.status === "estimated"
      ? "bg-gray-900/70 text-white"
      : "bg-gray-200 text-gray-700";

  return (
    <div className="rounded-2xl shadow-sm border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#0B1220]">사건 {caseId}</h2>
          <p className="mt-1 text-sm text-[#5B6475] truncate">
            {meta.address} · {meta.type}
            {meta.area_pyeong || meta.area_m2 ? ` · ${formatArea(meta)}` : ""}
          </p>
        </div>
        {price.status === "estimated" ? null : (
          <span className={`px-2.5 py-1 rounded-full text-xs ${statusBadge}`}>
            {price.status === "confirmed" ? "확정" : "준비중"}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="감정가" value={price.appraised} subtitle="원" />
        <SummaryCard title="최저가" value={price.lowest} subtitle={discountLabel} />
        <SummaryCard title="입찰보증금" value={price.deposit} subtitle="10% 기준" />
        <SummaryCard title="다음 입찰" value={nextAuction.date} subtitle={nextAuction.court} />
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="text-xs text-[#5B6475]">{title}</div>
      <div className="mt-1 text-base font-semibold text-[#0B1220] tabular-nums">
        {typeof value === "number" ? new Intl.NumberFormat("ko-KR").format(value) : value}
      </div>
      {subtitle ? <div className="mt-0.5 text-xs text-[#5B6475]">{subtitle}</div> : null}
    </div>
  );
}


