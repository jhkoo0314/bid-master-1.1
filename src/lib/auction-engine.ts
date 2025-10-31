// 예) 입찰 결과/리포트 계산부
import { calcAuctionMetrics, formatKRW } from "@/lib/auction-engine";

const result = calcAuctionMetrics({
  marketValue: property.basicInfo.marketValue, // 또는 estimate 값
  bidPrice: userBidPrice,      // 숫자 or "1,234,567원" 모두 허용
  rights: totalAssumedRights,
  taxes: totalTaxesAndFees,
  capex: repairCost,
  eviction: evictionCost,
  carrying: carryingCost,
  contingency: contingencyCost,
});

// 바인딩
const A = formatKRW(result.totalAcquisition);
const M = formatKRW(result.safetyMargin);
const safetyRatePct = (result.safetyRate * 100).toFixed(1) + "%";
const [minBid, maxBid] = [formatKRW(result.recommendedMin), formatKRW(result.recommendedMax)];
