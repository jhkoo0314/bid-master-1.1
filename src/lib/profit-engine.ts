import {
  ProfitInput,
  ProfitResult,
} from "./types";
import { DEFAULT_BROKER_FEE } from "./constants";
import { capBidPriceByPolicy } from "./bid-guard";

// 단순 이자 계산(보유기간 단리 근사). 필요 시 복리/원리금 분리로 확장
function computeInterest(
  principal: number,
  annualRate: number,
  months: number
) {
  if (!principal || !annualRate || !months) return 0;
  const monthlyRate = annualRate / 12;
  return Math.round(principal * (monthlyRate / 100) * months);
}

export function evaluateProfit(input: ProfitInput): ProfitResult {
  const {
    basis,
    rights,
    acq,
    valuation,
    holdingMonths,
    brokerFeeRate = DEFAULT_BROKER_FEE,
    exitMiscCost = 0,
    loanLTV = 0,
    interestRate = 0,
  } = input;

  // 1) 권장 입찰 상한(정책) 계산
  const bidCap = capBidPriceByPolicy(valuation.fmv, basis.lowestBid);
  const bidPrice = Math.min(acq.bidPrice, bidCap); // 사용자 입력이 상한 넘으면 캡

  // 2) 총인수금액
  const totalAcquisition =
    bidPrice +
    (rights.rightsCost || 0) +
    (rights.evictionCost || 0) +
    (acq.taxesAcq || 0) +
    (acq.closingFees || 0) +
    (acq.unpaidUtilities || 0) +
    (acq.renovation || 0);

  // 3) 매도 비용(중개수수료 등)
  const brokerFee = Math.round(valuation.exitPrice * brokerFeeRate);
  const exitCosts = brokerFee + exitMiscCost;

  // 4) 대출/이자
  const loanAmount = Math.round(bidPrice * (loanLTV / 100));
  const cashEquity = totalAcquisition - loanAmount;
  const interestCost = computeInterest(loanAmount, interestRate, holdingMonths);

  // 5) 손익
  const grossProfit = valuation.exitPrice - totalAcquisition;
  const netProfit = valuation.exitPrice - (totalAcquisition + exitCosts + interestCost);

  // 6) ROI(자기자본 기준) & 연환산
  const roiOnEquity = cashEquity > 0 ? netProfit / cashEquity : 0;
  const annualizedRoi =
    holdingMonths > 0 ? Math.pow(1 + roiOnEquity, 12 / holdingMonths) - 1 : 0;

  // 7) 안전마진
  const safetyMargin = valuation.fmv - totalAcquisition;

  // 8) 권장 입찰가 범위
  // 하한: 최저가의 100~102% 사이(낙찰가능성 보장용), 상한: 정책 cap
  const min = Math.max(basis.lowestBid, Math.round(basis.lowestBid * 1.00));
  const max = bidCap;

  return {
    totalAcquisition,
    grossProfit,
    netProfit,
    roiOnEquity,
    annualizedRoi,
    safetyMargin,
    recommendedBidRange: { min, max },
  };
}




