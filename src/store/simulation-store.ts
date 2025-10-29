/**
 * Bid Master AI - 시뮬레이션 상태 관리 (Zustand)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SimulationScenario, DevModeState } from "@/types/simulation";

interface DashboardStats {
  points: number;
  xp: number;
  accuracy: number;
  roi: number;
}

interface SimulationStore {
  // 현재 시뮬레이션
  currentScenario: SimulationScenario | null;
  setCurrentScenario: (scenario: SimulationScenario | null) => void;

  // 사용자 입찰가
  userBidPrice: number | null;
  setUserBidPrice: (price: number | null) => void;

  // 개발자 모드
  devMode: DevModeState;
  toggleDevMode: () => void;
  incrementRefreshCount: () => void;
  incrementSimulationCount: () => void;
  resetCounts: () => void;

  // 교육용 매물 목록 (메인 페이지)
  educationalProperties: SimulationScenario[];
  setEducationalProperties: (properties: SimulationScenario[]) => void;

  // 매물 데이터 저장소 (caseId로 조회)
  propertyCache: Map<string, SimulationScenario>;
  setPropertyCache: (caseId: string, scenario: SimulationScenario) => void;
  getPropertyFromCache: (caseId: string) => SimulationScenario | null;

  // 대시보드 통계
  dashboardStats: DashboardStats;
  updateDashboardStats: (stats: Partial<DashboardStats>) => void;
  resetDashboardStats: () => void;
}

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentScenario: null,
      userBidPrice: null,
      devMode: {
        isDevMode: false,
        refreshCount: 0,
        simulationCount: 0,
      },
      educationalProperties: [],
      propertyCache: new Map(),
      dashboardStats: {
        points: 0,
        xp: 0,
        accuracy: 0,
        roi: 0,
      },

      // 액션
      setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
      setUserBidPrice: (price) => set({ userBidPrice: price }),

      toggleDevMode: () =>
        set((state) => ({
          devMode: {
            ...state.devMode,
            isDevMode: !state.devMode.isDevMode,
          },
        })),

      incrementRefreshCount: () =>
        set((state) => ({
          devMode: {
            ...state.devMode,
            refreshCount: state.devMode.refreshCount + 1,
          },
        })),

      incrementSimulationCount: () =>
        set((state) => ({
          devMode: {
            ...state.devMode,
            simulationCount: state.devMode.simulationCount + 1,
          },
        })),

      resetCounts: () =>
        set((state) => ({
          devMode: {
            ...state.devMode,
            refreshCount: 0,
            simulationCount: 0,
          },
        })),

      setEducationalProperties: (properties) =>
        set({ educationalProperties: properties }),

      // 매물 캐시 액션
      setPropertyCache: (caseId, scenario) => {
        console.log(`💾 [캐시] 매물 데이터 저장: ${caseId}`);
        set((state) => {
          const newCache = new Map(state.propertyCache);
          newCache.set(caseId, scenario);
          return { propertyCache: newCache };
        });
      },

      getPropertyFromCache: (caseId) => {
        const state = get();
        const scenario = state.propertyCache.get(caseId);
        if (scenario) {
          console.log(`💾 [캐시] 매물 데이터 조회 성공: ${caseId}`);
        } else {
          console.log(`💾 [캐시] 매물 데이터 없음: ${caseId}`);
        }
        return scenario || null;
      },

      // 대시보드 통계 액션
      updateDashboardStats: (newStats) => {
        console.log("📊 [대시보드] Zustand store 통계 업데이트:", newStats);
        set((state) => ({
          dashboardStats: { ...state.dashboardStats, ...newStats },
        }));
      },

      resetDashboardStats: () => {
        console.log("🔄 [대시보드] Zustand store 통계 초기화");
        set({
          dashboardStats: {
            points: 0,
            xp: 0,
            accuracy: 0,
            roi: 0,
          },
        });
      },
    }),
    {
      name: "bid-master-storage", // LocalStorage 키
      partialize: (state) => ({
        devMode: state.devMode,
        dashboardStats: state.dashboardStats,
        // currentScenario와 userBidPrice는 세션 데이터이므로 저장하지 않음
      }),
    }
  )
);
