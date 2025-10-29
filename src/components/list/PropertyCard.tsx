"use client";

import React from "react";
import Image from "next/image";
import { CardCore } from "@/types/list";

export interface PropertyCardProps {
  item: CardCore & { isGenerated?: boolean };
  onOpen?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ item, onOpen }) => {
  // eslint-disable-next-line no-console
  console.log("🧪 [테스트] PropertyCard render", item.id);

  return (
    <article className="rounded-2xl shadow-sm border border-black/5 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-600">
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image src={item.thumbnail} alt={item.title} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover" />
        <div className="absolute left-2 top-2 rounded-full bg-black/70 text-white text-xs px-2 py-1">{item.difficulty}</div>
        {item.isGenerated && (
          <div className="absolute right-2 top-2 rounded-full bg-green-600 text-white text-xs px-2 py-1">
            AI 생성
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500">{item.region ?? ""}</div>
        <h3 className="mt-1 font-semibold text-[#0B1220] line-clamp-1">{item.title}</h3>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-[#5B6475]">최저가</div>
            <div className="font-semibold tabular-nums">{(item.price?.lowest || 0).toLocaleString()}원</div>
          </div>
          <div>
            <div className="text-xs text-[#5B6475]">할인율</div>
            <div className="font-semibold tabular-nums">{Math.round((item.price?.discountRate || 0) * 100)}%</div>
          </div>
          <div>
            <div className="text-xs text-[#5B6475]">보증금</div>
            <div className="font-semibold tabular-nums">{(item.price?.deposit || 0).toLocaleString()}원</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
          {(item.rightTypes || []).slice(0, 3).map((rt, index) => (
            <span key={`${item.id}-right-${index}-${rt}`} className="rounded-full border border-black/10 px-2 py-0.5">{rt}</span>
          ))}
        </div>
        <div className="mt-4">
          <a
            href={item.isGenerated ? `/simulation/${item.id}` : `/property/${item.id}`}
            onClick={(e) => {
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] 카드 열기", item.id, item.isGenerated ? "시뮬레이션" : "상세보기");
              onOpen?.(item.id);
            }}
            className="inline-flex items-center rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
          >
            {item.isGenerated ? "시뮬레이션 시작" : "자세히 보기"}
          </a>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;


