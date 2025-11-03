"use client";

import React from "react";

interface ActionButtonsProps {
  onViewRecommended?: () => void;
  onStartPractice?: () => void;
}

export default function ActionButtons({
  onViewRecommended,
  onStartPractice,
}: ActionButtonsProps) {
  const handleViewRecommended = () => {
    console.log("👤 [사용자 액션] 추천 입찰가 보기 버튼 클릭");
    if (onViewRecommended) {
      onViewRecommended();
    } else {
      // 기본 동작: DecisionPanel로 스크롤
      const decisionPanel = document.querySelector(
        '[data-section="decision-panel"]'
      );
      if (decisionPanel) {
        decisionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleStartPractice = () => {
    console.log("👤 [사용자 액션] 이 물건으로 연습하기 버튼 클릭");
    if (onStartPractice) {
      onStartPractice();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleViewRecommended}
        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        추천 입찰가 보기
      </button>
      <button
        onClick={handleStartPractice}
        className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        이 물건으로 연습하기
      </button>
    </div>
  );
}

