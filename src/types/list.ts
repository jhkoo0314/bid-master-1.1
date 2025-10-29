export type DifficultyLevel = "초급" | "중급" | "고급";

export interface PriceSummary {
  lowest: number;
  discountRate: number; // 0~1 비율
  deposit: number;
}

export interface CardCore {
  id: string;
  title: string; // 주소 축약
  thumbnail: string; // static or signed url
  price: PriceSummary;
  rightTypes: string[]; // 아이콘 매핑용
  difficulty: DifficultyLevel;
  region?: string;
  updatedAt: string; // ISO 문자열
}

export interface ListMetrics {
  activeUsers: number;
  simsToday: number;
  avgTries: number;
}

export interface ListPayload {
  items: CardCore[];
  metrics: ListMetrics;
  snapshotAt: string;
}

// 🧪 [테스트] 타입 로드 확인
// eslint-disable-next-line no-console
console.log("🧪 [테스트] list types loaded");
