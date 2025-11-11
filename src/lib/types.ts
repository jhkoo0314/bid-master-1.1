export type Difficulty = "easy" | "medium" | "hard";

export interface PropertyBasis {
  appraisedPrice: number;   // 감정가
  lowestBid: number;        // 최저가
  regionFactor?: number;    // 지역 계수 (기본 1.0)
}

export interface RightsProfile {
  difficulty: Difficulty;
  rightsCost: number;       // 인수 권리 총액(보증금/선순위 등)
  evictionCost: number;     // 명도비용
  notes?: string[];
}

export interface AcquisitionCosts {
  bidPrice: number;         // 입찰가(낙찰가 가정)
  taxesAcq: number;         // 취득세/등록면허세/교육세 등
  closingFees: number;      // 등기/법무/인지 등
  unpaidUtilities?: number; // 체납관리비/공과금
  renovation?: number;      // 수리비
}

export interface Valuation {
  fmv: number;              // 시장가(보수적 FMV)
  exitPrice: number;        // 매도 예상가(= 기본 FMV, 조정 가능)
}

export interface ProfitInput {
  basis: PropertyBasis;
  rights: RightsProfile;
  acq: AcquisitionCosts;
  valuation: Valuation;
  holdingMonths: number;    // 보유기간(월)
  brokerFeeRate?: number;   // 매도 중개수수료율(기본 0.5~0.9%)
  exitMiscCost?: number;    // 잔금/청소 등 소액
  loanLTV?: number;         // LTV
  interestRate?: number;    // 연이자율(%)
}

export interface ProfitResult {
  totalAcquisition: number; // 총인수금액
  grossProfit: number;      // 매도금액 - 총인수금액
  netProfit: number;        // 순이익(이자/매도비용 반영)
  roiOnEquity: number;      // ROI(자기자본 기준)
  annualizedRoi: number;    // 연환산 ROI
  safetyMargin: number;     // 안전마진 = FMV - 총인수금액
  recommendedBidRange: { min: number; max: number };
}




