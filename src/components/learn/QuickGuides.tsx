"use client";

import React from "react";

export const QuickGuides: React.FC = () => {
  const presets = [
    { id: "beginner", label: "입문(초급+아파트)" },
    { id: "profit", label: "수익형(상가+권리 단순)" },
    { id: "practice", label: "연습강화(중·고급 혼합)" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-lg font-semibold">빠른 학습 프리셋</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] guide_preset_apply", p.id);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[#5B6475]">왜 이 조합인가: 안정적 난이도, 핵심 개념 반복에 유리합니다.</p>
    </section>
  );
};

export default QuickGuides;




