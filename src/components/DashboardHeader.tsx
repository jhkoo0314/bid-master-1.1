/**
 * Bid Master AI - 대시보드 헤더 컴포넌트
 * 사용자의 시뮬레이션 통계를 시각적으로 표시
 */

"use client";

import { useSimulationStore } from "@/store/simulation-store";
import { updateLevel } from "@/lib/point-calculator";

export function DashboardHeader() {
  const { devMode, dashboardStats, updateDashboardStats, resetDashboardStats } =
    useSimulationStore();

  // 레벨 계산 (v1.2 규정: L1(0-199), L2(200-499), L3(500-999), L4(1000-1999), L5(2000+))
  const levelInfo = updateLevel(dashboardStats.points);

  // 레벨 업데이트 로깅 (한 번만)
  if (dashboardStats.points > 0) {
    console.log("📊 [대시보드] 레벨 정보:", {
      레벨: `L${levelInfo.level}`,
      누적포인트: levelInfo.currentPoints,
      진행률: `${levelInfo.progressPercent.toFixed(1)}%`,
      다음레벨까지: levelInfo.nextLevelPoints > 0 ? `${levelInfo.nextLevelPoints}pt` : "최고 레벨",
    });
  }

  // 개발자 모드에서 통계 초기화
  const resetStats = () => {
    console.log("🔄 [대시보드] 통계 초기화");
    resetDashboardStats();
  };

  // 개발자 모드에서 테스트 데이터 추가
  const addTestData = () => {
    console.log("🧪 [대시보드] 테스트 데이터 추가");
    updateDashboardStats({
      points: 1250,
      xp: 850,
      accuracy: 0.78,
      roi: 0.12,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* 대시보드 제목 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>시뮬레이션 통계</span>
        </h3>

        {/* 개발자 모드 버튼들 */}
        {devMode.isDevMode && (
          <div className="flex gap-2">
            <button
              onClick={addTestData}
              className="px-2 py-1 text-xs bg-white text-blue-600 font-semibold border border-gray-200 shadow-sm rounded hover:bg-gray-50 transition-colors"
            >
              테스트 데이터
            </button>
            <button
              onClick={resetStats}
              className="px-2 py-1 text-xs bg-white text-gray-800 font-semibold border border-gray-200 shadow-sm rounded hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
          </div>
        )}
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 레벨 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800">레벨</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">L{levelInfo.level}</div>
          <div className="text-xs text-gray-600 mt-1">
            포인트: {levelInfo.currentPoints} / {levelInfo.maxPoints}
          </div>
        </div>

        {/* 포인트 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800">포인트</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {dashboardStats.points.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 mt-1">누적 점수</div>
        </div>

        {/* 정확도 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800">정확도</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(dashboardStats.accuracy * 100)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">예측 정확도</div>
        </div>

        {/* 수익률 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800">수익률</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(dashboardStats.roi * 100)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">평균 수익률</div>
        </div>
      </div>

      {/* 진행률 바 (레벨업까지) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>다음 레벨까지</span>
          <span>
            {levelInfo.currentPoints} / {levelInfo.maxPoints} 포인트
            {levelInfo.nextLevelPoints > 0 && ` (${levelInfo.nextLevelPoints}pt 남음)`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${levelInfo.progressPercent}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
