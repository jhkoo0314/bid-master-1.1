import { Difficulty } from "./types";

// 난이도 가중치
export const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  easy: 0.6,
  medium: 0.3,
  hard: 0.1,
};

// 난이도별 FMV 할인율 범위(감정가 대비)
export const FMV_DISCOUNT_RANGE: Record<Difficulty, [number, number]> = {
  easy: [-0.03, +0.02],    // -3% ~ +2%
  medium: [-0.10, -0.05],  // -10% ~ -5%
  hard: [-0.18, -0.10],    // -18% ~ -10%
};

// 난이도별 권리비용/명도비용 가이드(감정가 비율 기반 기본 밴드)
export const RIGHTS_COST_RANGE: Record<Difficulty, [number, number]> = {
  easy: [0.00, 0.03],   // 0~3%
  medium: [0.02, 0.06], // 2~6%
  hard: [0.05, 0.12],   // 5~12%
};

export const EVICTION_COST_RANGE: Record<Difficulty, [number, number]> = {
  easy: [0.00, 0.005],  // 0~0.5%
  medium: [0.002, 0.01],
  hard: [0.005, 0.02],
};

// 기본 중개수수료율
export const DEFAULT_BROKER_FEE = 0.007; // 0.7%



