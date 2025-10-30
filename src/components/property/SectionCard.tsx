"use client";

import React, { useState } from "react";
import type { SectionCardProps } from "@/types/property";

export default function SectionCard({
  title,
  description,
  children,
  source,
  updatedAt,
  collapsible = true,
  defaultCollapsed = false,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);

  const toggle = () => {
    const next = !collapsed;
    // 👤 [사용자 액션] 섹션 접기/펼치기 로그
    console.log(
      `👤 [사용자 액션] 섹션 접기/펼치기: title=${title}, collapsed=${next}`
    );
    setCollapsed(next);
  };

  return (
    <section className="rounded-2xl shadow-sm border border-black/10 bg-white">
      <header className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#0B1220]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[#5B6475] leading-relaxed">{description}</p>
          ) : null}
          {(source || updatedAt) ? (
            <p className="mt-2 text-xs text-[#5B6475]">
              {source ? <span>출처: {source}</span> : null}
              {source && updatedAt ? <span className="mx-2">·</span> : null}
              {updatedAt ? <span>업데이트: {updatedAt}</span> : null}
            </p>
          ) : null}
        </div>
        {collapsible ? (
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 inline-flex items-center rounded-full border border-black/20 px-3 py-1 text-xs text-[#0B1220] hover:bg-gray-50"
            aria-expanded={!collapsed}
            aria-controls={`section-body-${title}`}
          >
            {collapsed ? "펼치기" : "접기"}
          </button>
        ) : null}
      </header>

      <div
        id={`section-body-${title}`}
        className={collapsed ? "hidden" : "block"}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </section>
  );
}
