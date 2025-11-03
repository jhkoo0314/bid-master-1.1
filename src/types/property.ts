/**
 * Bid Master AI - 매물 상세 페이지 타입 정의
 * 프리미엄 실전 매뉴얼 톤앤매너에 맞는 데이터 구조
 */

// ============================================
// 0. 안전마진 계산 타입 (auction-engine 사용)
// ============================================

export interface AcquisitionBreakdown {
  bidPrice: number;
  rights: number;
  taxes: number;
  costs: number;
  financing: number;
  penalty: number;
  misc: number;
  total: number; // A
}

export interface SafetyMargin {
  label: "FMV" | "EXIT" | "USER";
  amount: number;         // 원 단위
  pct: number;            // 0.294 -> 29.4%
  referencePrice: number; // 시세값
}

export interface CalcResult {
  acquisition: AcquisitionBreakdown;
  prices: { fmv: number; exit: number };
  margins: {
    fmv: SafetyMargin;
    exit: SafetyMargin;
    user: SafetyMargin;
  };
}

// ============================================
// 1. 기본 타입 정의
// ============================================

export type Money = number; // KRW(원), 프런트는 formatCurrency로 표시

export type Status = 'confirmed' | 'estimated' | 'pending';

export type Severity = 'low' | 'mid' | 'high';

// ============================================
// 2. 가격 요약 정보
// ============================================

export interface PriceSummary {
  appraised: Money;            // 감정가
  lowest: Money;               // 최저가
  discountRate: number;        // 0.30 => 30%
  deposit: Money;              // 입찰보증금
  status: Status;              // 확정/추정/준비중
  updatedAt: string;           // ISO
}

// ============================================
// 3. 다음 경매 정보
// ============================================

export interface NextAuction {
  date: string;                // YYYY-MM-DD
  court: string;               // 법원명
  status: 'scheduled' | 'canceled' | 'tbd';
}

// ============================================
// 4. 리스크 항목
// ============================================

export interface RiskItem {
  title: string;               // 리스크 제목
  cause: string;               // 원인
  impact: string;              // 영향
  action: string;              // 조치방안
  severity: Severity;          // 심각도
  basis?: string;              // 근거
}

// ============================================
// 5. 일정 항목
// ============================================

export interface ScheduleItem {
  day: string;                 // 일정명
  title: string;               // 제목
  date: string;                // YYYY-MM-DD
  note?: string;               // 비고
}

// ============================================
// 6. 권리 행
// ============================================

export interface RightRow {
  order: number;               // 순위
  type: string;                // 권리종류
  holder: string;              // 권리자
  date: string;                // 등기일 (YYYY-MM-DD)
  claim: Money;                // 청구금액
  note?: string;               // 비고
}

// ============================================
// 7. 배당 행
// ============================================

export interface PayoutRow {
  order: number;               // 순위
  holder: string;              // 권리자
  type: string;                // 권리종류
  claim: Money;                // 청구금액
  expected: Money;             // 예상배당
  remark?: string;             // 비고
}

// ============================================
// 8. 기관 정보
// ============================================

export interface Org {
  name: string;                // 기관명
  phone?: string;              // 전화번호
  address?: string;            // 주소
  open?: {                     // 운영시간
    bidStart?: string;         // 입찰시작시간
    bidEnd?: string;           // 입찰마감시간
  };
}

// ============================================
// 9. 지역 정보
// ============================================

export interface RegionInfo {
  court: Org;                  // 법원
  registry: Org;               // 등기소
  taxOffice: Org;              // 세무서
  links: Array<{               // 링크 목록
    label: string;             // 링크명
    url: string;               // URL
    group: 'primary' | 'more'; // 우선/추가 그룹
  }>;
}

// ============================================
// 10. 학습 요약
// ============================================

export interface LearnSummary {
  title: string;               // 제목
  bullets: string[];           // 요약 5줄
  state: 'preview' | 'locked' | 'comingSoon';
}

// ============================================
// 11. 매물 상세 정보 (최상위 타입)
// ============================================

export interface PropertyDetail {
  caseId: string;              // 사건번호
  meta: {                      // 기본 메타데이터
    address: string;           // 소재지
    type: string;              // 물건종류
    area_pyeong?: number;      // 면적(평)
    area_m2?: number;          // 면적(㎡)
  };
  price: PriceSummary;         // 가격 요약
  nextAuction: NextAuction;    // 다음 경매
  risks: RiskItem[];           // 핵심 리스크
  schedules: ScheduleItem[];    // 사건/매각 일정
  rights: RightRow[];          // 등기부 권리
  payout: {                    // 배당 정보
    base: Money;               // 기준 금액
    rows: PayoutRow[];         // 배당 행
    note: string;              // 비고
  };
  region: RegionInfo;          // 지역 정보
  learn: {                     // 학습 모듈
    rights: LearnSummary;      // 권리분석 리포트
    analysis: LearnSummary;    // 경매분석 리포트
  };
  snapshotAt: string;          // 데이터 스냅샷 기준시각 (ISO)
}

// ============================================
// 12. 기존 SimulationScenario와의 매핑을 위한 유틸리티 타입
// ============================================

export interface PropertyMappingContext {
  simulation: any;             // SimulationScenario 타입 (순환 참조 방지)
  analysisResult?: any;        // RightsAnalysisResult 타입
}

// ============================================
// 13. API 응답 타입
// ============================================

export interface PropertyApiResponse {
  success: boolean;
  data?: PropertyDetail;
  error?: string;
  snapshotAt: string;
}

// ============================================
// 14. 컴포넌트 Props 타입
// ============================================

export interface SectionCardProps {
  title: string;
  description?: string;        // 왜 중요한가
  children: React.ReactNode;
  source?: string;             // 출처
  updatedAt?: string;          // 업데이트일
  collapsible?: boolean;       // 접기/펼치기 가능
  defaultCollapsed?: boolean;  // 기본 접힘 상태
}

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: Status;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export interface StickyBarProps {
  lowestPrice: Money;
  nextAuctionDate: string;
  court: string;
  topRisk?: string;
}

export interface DecisionPanelProps {
  recommendedRange: {
    min: Money;
    max: Money;
  };
  risks: RiskItem[];
  onViewRights?: () => void;
  onViewPayout?: () => void;
  onDownloadChecklist?: () => void;
}

export interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  loading?: boolean;
  emptyMessage?: string;
}

// ============================================
// 15. 툴팁/모달 타입
// ============================================

export interface TooltipContent {
  title: string;
  description: string;
  formula?: string;
  example?: string;
}

export interface ModalContent {
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// 16. 사이드바 컴포넌트 타입
// ============================================

/**
 * 유사 낙찰 사례
 */
export interface SimilarCase {
  id: string;                    // 고유 ID
  title: string;                 // 제목 (예: "송파구 ○○ 오피스텔")
  won: number;                   // 낙찰가 (원)
  rate: string;                  // 경쟁률 (예: "5:1")
  roi: number;                   // 수익률 (%)
  tag: string;                   // 시간 태그 (예: "최근 1개월 낙찰", "3개월 전 낙찰")
}

/**
 * 권장 입찰가 범위
 */
export interface RecommendedBidRange {
  min: Money;                    // 최소 권장 입찰가
  max: Money;                    // 최대 권장 입찰가
  optimal?: Money;               // 최적 입찰가 (선택)
}

/**
 * 사이드바 요약 컴포넌트 Props
 */
export interface SidebarSummaryProps {
  aiMarketPrice?: {
    min: number;
    max: number;
    confidence: number;
  };
  rights: RightRow[];            // 권리 목록
  bidRange: RecommendedBidRange; // 권장 입찰가 범위
  roi: number;                   // 예상 수익률 (%)
  tip?: string;                  // 추천 팁
}

