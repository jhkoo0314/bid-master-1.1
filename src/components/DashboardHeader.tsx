/**
 * Bid Master AI - 대시보드 헤더 컴포넌트
 * 사용자의 시뮬레이션 통계를 시각적으로 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/store/simulation-store";

interface DashboardStats {
  level: number;
  points: number;
  accuracy: number;
  roi: number;
}

export function DashboardHeader() {
  const { devMode } = useSimulationStore();
  const [stats, setStats] = useState<DashboardStats>({
    level: 1,
    points: 0,
    accuracy: 0,
    roi: 0,
  });

  // localStorage에서 통계 로드
  useEffect(() => {
    console.log("🎮 [대시보드] localStorage에서 통계 로드 시작");

    const loadStats = () => {
      try {
        const savedPoints = localStorage.getItem("dashboard_points");
        const savedXp = localStorage.getItem("dashboard_xp");
        const savedAccuracy = localStorage.getItem("dashboard_accuracy");
        const savedRoi = localStorage.getItem("dashboard_roi");

        const points = savedPoints ? Number(savedPoints) : 0;
        const xp = savedXp ? Number(savedXp) : 0;
        const accuracy = savedAccuracy ? Number(savedAccuracy) : 0;
        const roi = savedRoi ? Number(savedRoi) : 0;

        // 레벨 계산 (XP 100당 1레벨)
        const level = Math.floor(xp / 100) + 1;

        const newStats = {
          level,
          points,
          accuracy,
          roi,
        };

        setStats(newStats);
        console.log("🎮 [대시보드] 통계 로드 완료:", newStats);
      } catch (error) {
        console.error("❌ [대시보드] 통계 로드 실패:", error);
      }
    };

    loadStats();
  }, []);

  // 통계 업데이트 함수 (나중에 시뮬레이션 완료 시 호출)
  const updateStats = (
    newPoints: number,
    newXp: number,
    newAccuracy: number,
    newRoi: number
  ) => {
    console.log("📊 [대시보드] 통계 업데이트:", {
      newPoints,
      newXp,
      newAccuracy,
      newRoi,
    });

    const level = Math.floor(newXp / 100) + 1;
    const updatedStats = {
      level,
      points: newPoints,
      accuracy: newAccuracy,
      roi: newRoi,
    };

    setStats(updatedStats);

    // localStorage에 저장
    try {
      localStorage.setItem("dashboard_points", newPoints.toString());
      localStorage.setItem("dashboard_xp", newXp.toString());
      localStorage.setItem("dashboard_accuracy", newAccuracy.toString());
      localStorage.setItem("dashboard_roi", newRoi.toString());
      console.log("💾 [대시보드] localStorage에 통계 저장 완료");
    } catch (error) {
      console.error("❌ [대시보드] localStorage 저장 실패:", error);
    }
  };

  // 개발자 모드에서 통계 초기화
  const resetStats = () => {
    console.log("🔄 [대시보드] 통계 초기화");
    updateStats(0, 0, 0, 0);
  };

  // 개발자 모드에서 테스트 데이터 추가
  const addTestData = () => {
    console.log("🧪 [대시보드] 테스트 데이터 추가");
    updateStats(1250, 850, 0.78, 0.12);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* 대시보드 제목 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span>
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
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-medium text-gray-800">레벨</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            Lv.{stats.level}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            XP: {Math.floor((stats.level - 1) * 100)} / {stats.level * 100}
          </div>
        </div>

        {/* 포인트 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⭐</span>
            <span className="text-sm font-medium text-gray-800">포인트</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.points.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 mt-1">누적 점수</div>
        </div>

        {/* 정확도 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-medium text-gray-800">정확도</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(stats.accuracy * 100)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">예측 정확도</div>
        </div>

        {/* 수익률 카드 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-sm font-medium text-gray-800">수익률</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(stats.roi * 100)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">평균 수익률</div>
        </div>
      </div>

      {/* 진행률 바 (레벨업까지) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>다음 레벨까지</span>
          <span>
            {Math.floor((stats.level - 1) * 100)} / {stats.level * 100} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                (((stats.level - 1) * 100) / (stats.level * 100)) * 100
              )}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
