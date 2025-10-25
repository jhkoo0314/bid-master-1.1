/**
 * Bid Master AI - 개발자 모드 토글 버튼
 */

"use client";

import { useSimulationStore } from "@/store/simulation-store";

export function DevModeToggle() {
  const { devMode, toggleDevMode } = useSimulationStore();

  return (
    <button
      onClick={toggleDevMode}
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        devMode.isDevMode
          ? "bg-yellow-500 text-black hover:bg-yellow-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
      title={devMode.isDevMode ? "개발자 모드 활성화" : "일반 모드"}
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">🔧</span>
        <span className="text-sm">
          {devMode.isDevMode ? "개발자 모드" : "일반 모드"}
        </span>
      </span>
    </button>
  );
}
