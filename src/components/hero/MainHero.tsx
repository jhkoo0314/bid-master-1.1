"use client";

import React from "react";

export interface MainHeroProps {
  onStart?: () => void;
}

export const MainHero: React.FC<MainHeroProps> = ({ onStart }) => {
  // eslint-disable-next-line no-console
  console.log("👤 [사용자 액션] MainHero mounted");

  return (
    <section className="w-full bg-[#F7F9FC] border-b border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0B1220]">AI로 무한 생성되는 실전 경매 훈련장</h1>
        <p className="mt-3 text-[#5B6475]">탐색·학습·실습을 1스크롤에서 완결하세요. 익명 실습, 무료 시작.</p>
        <div className="mt-6">
          <a
            href="#list-anchor"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] 실전 경매 훈련 시작 클릭");
              onStart?.();
            }}
            className="inline-flex items-center rounded-xl bg-blue-600 text-white px-5 py-3 hover:bg-blue-700 transition"
          >
            실전 경매 훈련 시작
          </a>
        </div>
        <div className="mt-4 text-xs text-[#5B6475]">데이터 스냅샷 기준은 페이지 하단에서 확인할 수 있습니다.</div>
      </div>
    </section>
  );
};

export default MainHero;


