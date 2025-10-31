"use client";

import React from "react";
import type { RegionInfo } from "@/types/property";

interface RegionPanelProps {
  region: RegionInfo;
}

export default function RegionPanel({ region }: RegionPanelProps) {
  return (
    <div className="rounded-2xl shadow-sm border border-black/10 bg-white p-5">
      <h3 className="text-base font-semibold text-[#0B1220]">지역/기관 정보</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <OrgCard title="법원" org={region.court} />
        <OrgCard title="등기소" org={region.registry} />
        <OrgCard title="세무서" org={region.taxOffice} />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-[#0B1220]">주요 링크</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {region.links
            .filter((l) => l.group === "primary")
            .map((link, idx) => (
              <a
                key={`primary-${idx}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  console.log(
                    `🔗 [외부 링크] 클릭: ${link.label} -> ${link.url}`
                  )
                }
                className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50 flex items-center justify-center text-center"
              >
                {link.label}
              </a>
            ))}
        </div>
        {region.links.some((l) => l.group === "more") ? (
          <details className="mt-2">
            <summary className="text-xs text-[#5B6475] cursor-pointer">
              추가 링크 보기
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {region.links
                .filter((l) => l.group === "more")
                .map((link, idx) => (
                  <a
                    key={`more-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      console.log(
                        `🔗 [외부 링크] 클릭: ${link.label} -> ${link.url}`
                      )
                    }
                    className="text-xs rounded-full border border-black/20 px-3 py-1 hover:bg-gray-50 flex items-center justify-center text-center"
                  >
                    {link.label}
                  </a>
                ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function OrgCard({ title, org }: { title: string; org: RegionInfo["court"] }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="text-xs text-[#5B6475]">{title}</div>
      <div className="mt-1 text-sm font-semibold text-[#0B1220]">
        {org.name}
      </div>
      {org.address ? (
        <div className="mt-0.5 text-xs text-[#5B6475]">{org.address}</div>
      ) : null}
      <div className="mt-1 text-xs text-[#5B6475]">{org.phone || "-"}</div>
      {org.open ? (
        <div className="mt-1 text-xs text-[#5B6475]">
          {org.open.bidStart || org.open.bidEnd ? (
            <span>
              입찰 {org.open.bidStart || "-"}~{org.open.bidEnd || "-"}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
