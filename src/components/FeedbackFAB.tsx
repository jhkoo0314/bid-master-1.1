"use client";

import React, { useState } from "react";

interface FeedbackFABProps {
  onFeedbackClick: () => void;
}

export default function FeedbackFAB({ onFeedbackClick }: FeedbackFABProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => {
          console.log("💬 [피드백 FAB] 피드백 모달 열기 요청");
          onFeedbackClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative flex items-center justify-center
          w-14 h-14 rounded-full shadow-lg
          bg-black text-white
          hover:bg-gray-800 hover:scale-110
          active:scale-95
          transition-all duration-300 ease-out
          hover:shadow-2xl
          focus:outline-none focus:ring-4 focus:ring-gray-300
        `}
        aria-label="피드백 남기기"
      >
        {/* 말풍선 아이콘 */}
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        {/* 호버 시 나타나는 툴팁 */}
        <div
          className={`
            absolute right-full mr-3 px-3 py-2
            bg-gray-900 text-white text-sm font-medium
            rounded-lg shadow-lg
            whitespace-nowrap
            transition-all duration-300 ease-out
            pointer-events-none
            ${
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-2"
            }
          `}
        >
          피드백 남기기
          {/* 툴팁 화살표 */}
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>

        {/* 펄스 애니메이션 (선택사항) */}
        <div className="absolute inset-0 rounded-full bg-black animate-ping opacity-20"></div>
      </button>
    </div>
  );
}
