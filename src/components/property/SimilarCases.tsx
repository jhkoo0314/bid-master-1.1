"use client";

import React from "react";
import type { SimilarCase } from "@/types/property";

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

interface SimilarCasesProps {
  items?: SimilarCase[];
}

function formatCurrency(amount: number): string {
  return "₩" + amount.toLocaleString();
}

export default function SimilarCases({ items = [] }: SimilarCasesProps) {
  console.log("📋 [유사 낙찰 사례] 컴포넌트 렌더링", {
    itemsCount: items.length,
  });

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">최근 낙찰 사례</h3>
          <Badge tone="gray">참고 데이터</Badge>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          유사 낙찰 사례가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">최근 낙찰 사례</h3>
        <Badge tone="gray">참고 데이터</Badge>
      </div>
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-start justify-between gap-3 rounded-xl border p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {it.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                경쟁률 {it.rate} · 수익률 {it.roi}%
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold">{formatCurrency(it.won)}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{it.tag}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

