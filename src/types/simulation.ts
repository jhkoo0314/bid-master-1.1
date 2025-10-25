/**
 * Bid Master AI - 경매 시뮬레이션 타입 정의
 * 마이옥션 사이트 데이터 구조를 참고하여 실제 경매와 동일한 형식으로 모사
 */

// ============================================
// 1. 기본 정보 (사건 기본 정보)
// ============================================

export interface CaseBasicInfo {
  caseNumber: string; // 사건번호 (예: "2025타경52051")
  court: string; // 관할법원 (예: "수원지방법원 경매2계")
  propertyType: string; // 물건종별 (예: "아파트", "상가", "토지")
  location: string; // 소재지 (전체 주소)
  locationShort: string; // 소재지 (간략 주소)
  marketValue: number; // 시장가 (원) - 실제 시장 거래가격
  appraisalValue: number; // 감정가 (원) - 법원 감정가
  minimumBidPrice: number; // 최저매각가격 (원) - 최저 입찰가
  startingBidPrice: number; // 입찰시작가 (원) - 실제 입찰 시작가격
  bidDeposit: number; // 입찰보증금 (원)
  claimAmount: number; // 청구금액 (원)
  debtor: string; // 채무자 이름 (예: "안OO")
  owner: string; // 소유자 이름 (예: "안OO")
  creditor: string; // 채권자 이름 (예: "주OOOOOOOO")
  auctionType: string; // 경매종류 (예: "부동산임의경매", "부동산강제경매")
  biddingMethod: string; // 입찰방법 (예: "기일입찰", "기간입찰")
  status: string; // 진행상태 (예: "진행", "유찰", "낙찰")
  daysUntilBid: number; // 입찰까지 남은 일수
}

// ============================================
// 2. 토지/건물 정보
// ============================================

export interface PropertyDetails {
  landArea: number; // 토지면적 (㎡)
  landAreaPyeong: number; // 토지면적 (평)
  buildingArea: number; // 건물면적 (㎡)
  buildingAreaPyeong: number; // 건물면적 (평)
  buildingType: string; // 건물 평형 (예: "48평형")
  structure: string; // 구조 (예: "철근콘크리트조")
  usage: string; // 용도 (예: "아파트", "근린생활시설")
  floor: string; // 층수 (예: "1층", "지상20층 중 1층")
}

// ============================================
// 3. 진행 일정
// ============================================

export interface AuctionSchedule {
  caseFiledDate: string; // 경매사건접수일 (YYYY-MM-DD)
  decisionDate: string; // 개시결정일 (YYYY-MM-DD)
  dividendDeadline: string; // 배당요구종기일 (YYYY-MM-DD)
  firstAuctionDate: string; // 최초경매일 (YYYY-MM-DD)
  currentAuctionDate: string; // 현재 매각기일 (YYYY-MM-DD)
}

// ============================================
// 4. 매각 일정 (회차별 입찰 이력)
// ============================================

export interface BiddingHistory {
  round: number; // 회차
  auctionDate: string; // 매각기일 (YYYY-MM-DD)
  minimumPrice: number; // 최저매각가격 (원)
  priceRatio: number; // 감정가 대비 비율 (%)
  result: "유찰" | "낙찰" | "진행"; // 결과
}

// ============================================
// 5. 권리 분석 (등기부 권리)
// ============================================

export type RightType =
  | "근저당권"
  | "가압류"
  | "전세권"
  | "지상권"
  | "임차권"
  | "압류"
  | "가등기"
  | "예고등기";

export interface RightRecord {
  id: string; // 고유 ID
  registrationDate: string; // 등기일 (YYYY-MM-DD)
  rightType: RightType; // 권리종류
  rightHolder: string; // 권리자 (예: "OO은행", "OOO")
  claimAmount: number; // 청구금액 (원) - 근저당권, 가압류 등
  isMalsoBaseRight: boolean; // 말소기준권리 여부 (엔진 계산)
  willBeExtinguished: boolean; // 소멸 여부 (엔진 계산)
  willBeAssumed: boolean; // 인수 여부 (엔진 계산)
  priority: number; // 우선순위 (1, 2, 3...)
  notes?: string; // 비고
}

// ============================================
// 6. 임차인 현황
// ============================================

export interface TenantRecord {
  id: string; // 고유 ID
  tenantName: string; // 점유자 이름 (예: "OOO")
  deposit: number; // 보증금 (원)
  monthlyRent: number; // 월세 (원)
  moveInDate: string; // 전입일 (YYYY-MM-DD)
  confirmationDate: string | null; // 확정일자 (YYYY-MM-DD) - 없으면 null
  hasDaehangryeok: boolean; // 대항력 유무 (엔진 계산)
  isSmallTenant: boolean; // 소액임차인 여부 (엔진 계산)
  priorityPaymentAmount: number; // 우선변제금액 (원) - 소액임차인인 경우
  willBeAssumed: boolean; // 인수 여부 (엔진 계산)
  notes?: string; // 비고
}

// ============================================
// 7. 주변 매각 사례
// ============================================

export interface SimilarSaleCase {
  saleDate: string; // 매각일자 (YYYY-MM-DD)
  similarSize: string; // 유사 평형 (예: "48평형")
  appraisalValue: number; // 감정가 (원)
  salePrice: number; // 낙찰가 (원)
  salePriceRatio: number; // 감정가 대비 매각가율 (%)
  location: string; // 소재지
}

// ============================================
// 8. 교육용 콘텐츠 (AI 생성)
// ============================================

export type DifficultyLevel = "초급" | "중급" | "고급";

export interface EducationalContent {
  difficulty: DifficultyLevel; // 난이도
  oneLiner: string; // 한 줄 요약 (20자 이내)
  coreAnalysis: {
    learningGoal: string; // 무엇을 배우는가
    keyPoints: string[]; // 주목할 포인트 (3-5개)
    risks: string[]; // 예상 리스크
    strategy: string; // 권장 입찰 전략
  };
  stepByStepGuide: {
    step1: string; // 권리분석 시작하기
    step2: string; // 임차인 현황 파악하기
    step3: string; // 입찰가 산정하기
    step4: string; // 리스크 체크
  };
  proTips: string[]; // 실전 팁 & 함정 주의
  legalTerms: Record<string, string>; // 법률 용어 설명 (용어: 설명)
}

// ============================================
// 9. 지역분석 정보
// ============================================

export interface RegionalAnalysis {
  court: {
    name: string; // 법원명 (예: "창원지방법원 밀양지원")
    code: string; // 법원코드 (예: "504-24")
    address: string; // 주소
    phone: string; // 대표전화
    biddingStartTime: string; // 입찰시작시간
    biddingEndTime: string; // 입찰마감시간
    openingTime: string; // 개찰시간
    jurisdiction: string; // 관할구역
  };
  registry: {
    name: string; // 등기소명
    phone: string; // 대표전화
    fax: string; // 팩스번호
    address: string; // 주소
  };
  taxOffice: {
    name: string; // 세무서명
    phone: string; // 대표전화
    fax: string; // 팩스번호
    address: string; // 주소
  };
  externalLinks: {
    name: string; // 링크명
    url: string; // 링크 URL
  }[];
}

// ============================================
// 10. 시뮬레이션 시나리오 (최상위 타입)
// ============================================

export interface SimulationScenario {
  id: string; // 고유 ID (UUID)
  type: "educational" | "simulation"; // 교육용 or 시뮬레이션용
  basicInfo: CaseBasicInfo; // 기본 정보
  propertyDetails: PropertyDetails; // 토지/건물 정보
  schedule: AuctionSchedule; // 진행 일정
  biddingHistory: BiddingHistory[]; // 매각 일정
  rights: RightRecord[]; // 권리 분석
  tenants: TenantRecord[]; // 임차인 현황
  similarSales: SimilarSaleCase[]; // 주변 매각 사례
  regionalAnalysis: RegionalAnalysis; // 지역분석 정보
  educationalContent?: EducationalContent; // 교육용 콘텐츠 (교육용인 경우만)
  createdAt: string; // 생성일시 (ISO 8601)
}

// ============================================
// 10. 권리분석 엔진 결과
// ============================================

export interface RightsAnalysisResult {
  malsoBaseRight: RightRecord | null; // 말소기준권리
  extinguishedRights: RightRecord[]; // 소멸되는 권리
  assumedRights: RightRecord[]; // 인수해야 할 권리
  totalAssumedAmount: number; // 인수 권리 총액 (원)
  assumedTenants: TenantRecord[]; // 인수해야 할 임차인
  totalTenantDeposit: number; // 인수 임차보증금 총액 (원)
  safetyMargin: number; // 안전 마진 (인수 권리 + 임차보증금)
  recommendedBidRange: {
    min: number; // 최소 입찰가 (원)
    max: number; // 최대 입찰가 (원)
    optimal: number; // 최적 입찰가 (원)
  };
}

// ============================================
// 11. 사용자 입찰 결과
// ============================================

export interface BidResult {
  scenarioId: string; // 시뮬레이션 ID
  userBidPrice: number; // 사용자 입찰가 (원)
  isSuccess: boolean; // 낙찰 성공 여부
  feedback: string; // 피드백 메시지
  analysis: RightsAnalysisResult; // 권리분석 결과
  profitAnalysis?: {
    expectedProfit: number; // 예상 수익 (원)
    roi: number; // 투자수익률 (%)
  };
}

// ============================================
// 12. 개발자 모드 상태
// ============================================

export interface DevModeState {
  isDevMode: boolean; // 개발자 모드 활성화 여부
  refreshCount: number; // 새로고침 횟수
  simulationCount: number; // 시뮬레이션 생성 횟수
  debugInfo?: {
    generationTime: number; // 생성 시간 (ms)
    tokenUsage: number; // 토큰 사용량
  };
}
