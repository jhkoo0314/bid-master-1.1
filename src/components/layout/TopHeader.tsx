"use client";

import React from "react";

export interface TopHeaderProps {
  onWaitlistClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onWaitlistClick }) => {
  // 👤 [사용자 액션] 헤더 로드 로그
  // eslint-disable-next-line no-console
  console.log("👤 [사용자 액션] TopHeader mounted");

  return (
    <header className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold">Bid Master AI</span>
          <span className="text-sm text-gray-500">Fail fast, learn faster</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="/guide" className="text-gray-700 hover:text-black transition">실전 가이드</a>
          <a href="/calculator" className="text-gray-700 hover:text-black transition">수익 계산기</a>
          <a href="/terms-of-service" className="text-gray-700 hover:text-black transition">용어집</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            aria-label="사전 알림 신청"
            onClick={() => {
              // 👤 [사용자 액션] 사전 알림 클릭
              // eslint-disable-next-line no-console
              console.log("👤 [사용자 액션] 사전 알림 클릭");
              onWaitlistClick?.();
            }}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition"
          >
            사전 알림
          </button>
          <button
            aria-label="로그인(준비중)"
            className="rounded-xl border border-black/10 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            title="준비중"
          >
            로그인
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;




