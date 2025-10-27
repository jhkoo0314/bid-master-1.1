/**
 * Bid Master AI - 수익 계산기
 * 경매 낙찰 후 예상 수익을 계산하는 로직
 */

export interface ProfitInput {
  appraisalValue: number; // 감정가
  minimumBidPrice: number; // 최저가
  expectedBidPrice: number; // 예상 낙찰가
  bankLoanRatio: number; // 은행대출 비율 (0-1)
  bankLoanAmount: number; // 은행대출 금액
  loanInterestRate: number; // 대출 이자율 (%)
  rightsToAssume: number; // 인수해야 할 보증금
  evictionCost: number; // 명도비 (이사비 및 관리비)
  remodelingCost: number; // 리모델링비 또는 기타 수리 비용
  legalFees: number; // 법무비
  brokerageFees: number; // 중개 비용 및 기타 명도 대행 비용
  holdingPeriod: number; // 보유 기간 (개월)
  monthlyExpenses: number; // 월별 지출 (대출이자 포함 전체지출비용)
  monthlyIncome: number; // 월별 수입 예상 (보증금 제외 월세 임대수입)
  expectedSalePrice: number; // 예상 매도가
  otherIncome: number; // 기타수입
}

export interface ProfitOutput {
  bidPrice: number; // 낙찰가
  bankLoanAmount: number; // 은행대출 금액
  acquisitionTax: number; // 취득세 (낙찰가의 1%)
  otherTaxes: number; // 기타(채권 금액 및 기타) (낙찰가의 0.15%)
  totalTaxes: number; // 세금 합계
  totalAcquisitionCosts: number; // 취득비용 합계
  selfCapital: number; // 총 자기자본 (은행대출 제외)
  actualInvestment: number; // 실제 투자금액 (총)
  monthlyExpenses: number; // 월별 지출
  monthlyIncome: number; // 월별 수입
  totalInterestCost: number; // 이자비용 (보유기간 동안)
  brokerageFees: number; // 중개수수료
  capitalGainsTax: number; // 양도세
  otherIncome: number; // 기타수입
  saleAmount: number; // 매도 금액
  totalInvestmentBeforeSale: number; // 매도 전까지 투입 금액
  netProfit: number; // 차익 (최종 수익)
  roi: number; // 투자수익률 (%)
  annualizedRoi: number; // 연환산 수익률 (%)
  breakEvenPrice: number; // 손익분기점
}

/**
 * 경매 수익을 계산합니다.
 *
 * @param input 수익 계산 입력값
 * @returns 수익 계산 결과
 */
export function calculateProfit(input: ProfitInput): ProfitOutput {
  console.log("💰 [수익 계산기] 수익 계산 시작");
  console.log(`  - 낙찰가: ${input.expectedBidPrice.toLocaleString()}원`);
  console.log(`  - 매도가: ${input.expectedSalePrice.toLocaleString()}원`);

  // 1. 낙찰가 및 대출 계산
  const bidPrice = input.expectedBidPrice;
  const bankLoanAmount = input.bankLoanAmount || Math.round(bidPrice * input.bankLoanRatio);
  const selfCapital = bidPrice - bankLoanAmount;

  console.log(`  - 은행대출: ${bankLoanAmount.toLocaleString()}원`);
  console.log(`  - 자기자본: ${selfCapital.toLocaleString()}원`);

  // 2. 세금 계산 (이미지 기준)
  const acquisitionTax = Math.round(bidPrice * 0.01); // 취득세 1%
  const otherTaxes = Math.round(bidPrice * 0.0015); // 기타 0.15%
  const totalTaxes = acquisitionTax + otherTaxes;

  console.log(`  - 취득세: ${acquisitionTax.toLocaleString()}원`);
  console.log(`  - 기타세금: ${otherTaxes.toLocaleString()}원`);

  // 3. 취득비용 합계
  const totalAcquisitionCosts = 
    input.rightsToAssume +
    input.evictionCost +
    input.remodelingCost +
    input.legalFees +
    input.brokerageFees;

  const actualInvestment = selfCapital + totalAcquisitionCosts;

  console.log(`  - 취득비용 합계: ${totalAcquisitionCosts.toLocaleString()}원`);
  console.log(`  - 실제 투자금액: ${actualInvestment.toLocaleString()}원`);

  // 4. 월별 현금흐름
  const monthlyExpenses = input.monthlyExpenses;
  const monthlyIncome = input.monthlyIncome;

  // 5. 이자비용 계산 (보유기간 동안)
  const monthlyInterestRate = input.loanInterestRate / 100 / 12;
  const totalInterestCost = Math.round(bankLoanAmount * monthlyInterestRate * input.holdingPeriod);

  console.log(`  - 총 이자비용: ${totalInterestCost.toLocaleString()}원`);

  // 6. 매도 관련 비용
  const saleAmount = input.expectedSalePrice;
  const brokerageFees = input.brokerageFees;
  
  // 양도세 계산 (간이 계산)
  const capitalGain = Math.max(0, saleAmount - bidPrice);
  const capitalGainsTax = Math.round(capitalGain * 0.3); // 30% 가정

  const otherIncome = input.otherIncome;

  // 7. 매도 전까지 투입 금액
  const totalInvestmentBeforeSale = 
    actualInvestment + 
    totalInterestCost + 
    (monthlyExpenses - monthlyIncome) * input.holdingPeriod;

  // 8. 차익 계산 (최종 수익)
  const netProfit = saleAmount - totalInvestmentBeforeSale - brokerageFees - capitalGainsTax + otherIncome;

  console.log(`  - 매도 전까지 투입금액: ${totalInvestmentBeforeSale.toLocaleString()}원`);
  console.log(`  - 차익: ${netProfit.toLocaleString()}원`);

  // 9. 투자수익률 계산
  const roi = (netProfit / actualInvestment) * 100;
  const annualizedRoi = (roi / input.holdingPeriod) * 12;

  console.log(`  - ROI: ${roi.toFixed(2)}%`);
  console.log(`  - 연환산 ROI: ${annualizedRoi.toFixed(2)}%`);

  // 10. 손익분기점 계산
  const breakEvenPrice = totalInvestmentBeforeSale + brokerageFees + capitalGainsTax - otherIncome;

  console.log(`  - 손익분기점: ${breakEvenPrice.toLocaleString()}원`);

  return {
    bidPrice,
    bankLoanAmount,
    acquisitionTax,
    otherTaxes,
    totalTaxes,
    totalAcquisitionCosts,
    selfCapital,
    actualInvestment,
    monthlyExpenses,
    monthlyIncome,
    totalInterestCost,
    brokerageFees,
    capitalGainsTax,
    otherIncome,
    saleAmount,
    totalInvestmentBeforeSale,
    netProfit,
    roi,
    annualizedRoi,
    breakEvenPrice,
  };
}

/**
 * 면적 기반으로 명도 비용을 추정합니다.
 *
 * @param areaPyeong 면적 (평)
 * @returns 예상 명도 비용 (원)
 */
export function estimateEvictionCost(areaPyeong: number): number {
  // 기본 비용 구조:
  // - 접수비: 100,000원
  // - 운반 및 보관료: 5톤 컨테이너 기준 (1,100,000원/대), 보관 3개월
  // - 노무비: 노무자 1인당 130,000원
  // - 사다리차: 350,000원 (기본)

  const baseProcessingFee = 100000; // 접수비
  const ladderTruckFee = 350000; // 사다리차

  // 면적에 따른 컨테이너 수 계산 (10평당 1대)
  const containerCount = Math.ceil(areaPyeong / 10);
  const containerFee = containerCount * 1100000;

  // 면적에 따른 노무자 수 계산 (5평당 1인)
  const laborCount = Math.ceil(areaPyeong / 5);
  const laborFee = laborCount * 130000;

  const total = baseProcessingFee + containerFee + laborFee + ladderTruckFee;

  console.log(
    `💰 [수익 계산기] 명도 비용 추정: ${areaPyeong}평 → ${total.toLocaleString()}원`
  );

  return total;
}

/**
 * 감정가 기준으로 최저가를 계산합니다.
 *
 * @param appraisalValue 감정가
 * @param ratio 비율 (0-1)
 * @returns 최저가
 */
export function calculateMinimumBidPrice(
  appraisalValue: number,
  ratio: number
): number {
  return Math.round(appraisalValue * ratio);
}

/**
 * 최저가 기준으로 입찰보증금을 계산합니다.
 *
 * @param minimumBidPrice 최저가
 * @returns 입찰보증금 (최저가의 10%)
 */
export function calculateBidDeposit(minimumBidPrice: number): number {
  return Math.round(minimumBidPrice * 0.1);
}
