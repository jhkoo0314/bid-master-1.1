/**
 * Bid Master AI - 수익 계산기
 * 경매 낙찰 후 예상 수익을 계산하는 로직
 */

export interface ProfitInput {
  appraisalValue: number; // 감정가
  minimumBidPrice: number; // 최저가
  expectedBidPrice: number; // 예상 낙찰가
  rightsToAssume: number; // 인수 권리 총액
  evictionCost: number; // 명도 비용
  remodelingCost: number; // 리모델링 비용
  holdingPeriod: number; // 보유 기간 (개월)
  expectedSalePrice: number; // 예상 매도가
}

export interface ProfitOutput {
  totalInvestment: number; // 총 투자금액
  expectedRevenue: number; // 예상 매도 수익
  netProfit: number; // 순수익
  roi: number; // 투자수익률 (%)
  annualizedRoi: number; // 연환산 수익률 (%)
  breakdownCosts: {
    bidPrice: number;
    rights: number;
    eviction: number;
    remodeling: number;
    acquisitionTax: number; // 취득세 (약 4.6%)
    registrationTax: number; // 등록세 포함
  };
  breakdownRevenue: {
    salePrice: number;
    capitalGainsTax: number; // 양도소득세 (간이 계산)
    netRevenue: number; // 세후 매도가
  };
  breakEvenPrice: number; // 손익분기점 (최소 매도가)
}

/**
 * 경매 수익을 계산합니다.
 *
 * @param input 수익 계산 입력값
 * @returns 수익 계산 결과
 */
export function calculateProfit(input: ProfitInput): ProfitOutput {
  console.log("💰 [수익 계산기] 수익 계산 시작");
  console.log(`  - 예상 낙찰가: ${input.expectedBidPrice.toLocaleString()}원`);
  console.log(`  - 예상 매도가: ${input.expectedSalePrice.toLocaleString()}원`);

  // 1. 비용 계산
  const bidPrice = input.expectedBidPrice;
  const rights = input.rightsToAssume;
  const eviction = input.evictionCost;
  const remodeling = input.remodelingCost;

  // 취득세 계산 (낙찰가의 약 4.6% - 주택 기준)
  // 실제로는 주택 종류, 면적, 보유 주택 수에 따라 다름
  const acquisitionTax = Math.round(bidPrice * 0.046);

  // 등록세는 취득세에 포함되어 있음 (지방교육세 0.4% 포함)
  const registrationTax = 0;

  const totalInvestment =
    bidPrice +
    rights +
    eviction +
    remodeling +
    acquisitionTax +
    registrationTax;

  console.log(`  - 총 투자금액: ${totalInvestment.toLocaleString()}원`);

  // 2. 수익 계산
  const salePrice = input.expectedSalePrice;

  // 양도소득세 간이 계산 (실제로는 보유 기간, 다주택 여부 등에 따라 복잡함)
  // 여기서는 간단히 양도차익의 30%로 가정 (1년 미만 보유 시 높은 세율)
  const capitalGain = Math.max(0, salePrice - bidPrice);
  const capitalGainsTax =
    input.holdingPeriod < 12
      ? Math.round(capitalGain * 0.4) // 1년 미만: 40%
      : Math.round(capitalGain * 0.3); // 1년 이상: 30%

  const netRevenue = salePrice - capitalGainsTax;

  console.log(`  - 세후 매도가: ${netRevenue.toLocaleString()}원`);

  // 3. 순수익 계산
  const netProfit = netRevenue - totalInvestment;

  console.log(`  - 순수익: ${netProfit.toLocaleString()}원`);

  // 4. 투자수익률 계산
  const roi = (netProfit / totalInvestment) * 100;

  // 5. 연환산 수익률 계산
  const annualizedRoi = (roi / input.holdingPeriod) * 12;

  console.log(`  - ROI: ${roi.toFixed(2)}%`);
  console.log(`  - 연환산 ROI: ${annualizedRoi.toFixed(2)}%`);

  // 6. 손익분기점 계산
  const breakEvenPrice = totalInvestment + capitalGainsTax;

  console.log(`  - 손익분기점: ${breakEvenPrice.toLocaleString()}원`);

  return {
    totalInvestment,
    expectedRevenue: netRevenue,
    netProfit,
    roi,
    annualizedRoi,
    breakdownCosts: {
      bidPrice,
      rights,
      eviction,
      remodeling,
      acquisitionTax,
      registrationTax,
    },
    breakdownRevenue: {
      salePrice,
      capitalGainsTax,
      netRevenue,
    },
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
