"use client";

import React from "react";
import { generateSimulation } from "@/app/actions/generate-simulation";

export interface FilterBarProps {
  onApply?: () => void;
  onReset?: () => void;
  onGenerateProperty?: (property: any) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onApply, onReset, onGenerateProperty }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateProperty = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    console.log("🏠 [매물 생성] AI 매물 생성 버튼 클릭");
    
    try {
      const property = await generateSimulation();
      console.log("✅ [매물 생성] AI 매물 생성 완료", property.basicInfo.caseNumber);
      onGenerateProperty?.(property);
    } catch (error) {
      console.error("❌ [에러] AI 매물 생성 실패", error);
      alert("매물 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <section className="w-full bg-white border-b border-black/5 sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center gap-3">
        <button
          aria-label="유형 필터"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 필터 열기: 유형");
          }}
        >
          유형
        </button>
        <button
          aria-label="권리유형 필터"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 필터 열기: 권리유형");
          }}
        >
          권리유형
        </button>
        <button
          aria-label="난이도 필터"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 필터 열기: 난이도");
          }}
        >
          난이도
        </button>
        <button
          aria-label="가격 필터"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log("👤 [사용자 액션] 필터 열기: 가격");
          }}
        >
          가격
        </button>
        <div className="ms-auto flex items-center gap-2">
          <button
            aria-label="AI 매물 생성"
            className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateProperty}
            disabled={isGenerating}
          >
            {isGenerating ? "생성 중..." : "AI 매물 생성"}
          </button>
          <button
            aria-label="필터 적용"
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] 필터 적용");
              onApply?.();
            }}
          >
            적용
          </button>
          <button
            aria-label="필터 초기화"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] 필터 초기화");
              onReset?.();
            }}
          >
            초기화
          </button>
        </div>
      </div>
    </section>
  );
};

export default FilterBar;


