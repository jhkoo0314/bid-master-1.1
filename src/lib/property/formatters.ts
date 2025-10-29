import type { Money, PropertyDetail } from "@/types/property";
import type { SimulationScenario } from "@/types/simulation";

export function formatCurrency(value: Money): string {
  if (value == null) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

export function formatDiscountRate(rate: number): string {
  if (rate == null) return "-";
  return `${Math.round(rate * 100)}%↓`;
}

export function formatDate(value: string): string {
  if (!value) return "-";
  return value;
}

// 간단한 리스크 점수 계산 (0-100, 높을수록 위험)
function calculateRiskScore(sim: SimulationScenario): number {
  let score = 0;
  
  // 권리 개수에 따른 리스크 (권리가 많을수록 위험)
  score += Math.min(sim.rights.length * 10, 30);
  
  // 임차인 수에 따른 리스크
  const tenantCount = sim.tenants?.length || 0;
  score += Math.min(tenantCount * 5, 20);
  
  // 대항력 보유 임차인이 있으면 리스크 증가
  const tenantsWithDaehangryeok = sim.tenants?.filter(t => t.hasDaehangryeok).length || 0;
  score += tenantsWithDaehangryeok * 15;
  
  // 할인율이 높을수록 리스크 증가
  const appraisalValue = sim.basicInfo.appraisalValue || 0;
  const minimumBidPrice = sim.basicInfo.minimumBidPrice || 0;
  if (appraisalValue > 0) {
    const discountRate = (1 - minimumBidPrice / appraisalValue) * 100;
    score += Math.min(discountRate * 0.5, 25);
  }
  
  return Math.min(Math.round(score), 100);
}

export function mapSimulationToPropertyDetail(sim: SimulationScenario): PropertyDetail {
  console.log("🧪 [테스트] Simulation → PropertyDetail 매핑 시작", sim.id);
  const appraised = sim.basicInfo.appraisalValue;
  const lowest = sim.basicInfo.minimumBidPrice;
  const deposit = sim.basicInfo.bidDeposit;

  const detail: PropertyDetail = {
    caseId: sim.basicInfo.caseNumber,
    meta: {
      address: sim.basicInfo.location,
      type: sim.basicInfo.propertyType,
      area_pyeong: sim.propertyDetails.buildingAreaPyeong,
      area_m2: sim.propertyDetails.buildingArea,
    },
    price: {
      appraised,
      lowest,
      discountRate: appraised ? 1 - lowest / appraised : 0,
      deposit,
      status: "estimated",
      updatedAt: new Date().toISOString(),
    },
    nextAuction: {
      date: sim.schedule.currentAuctionDate,
      court: sim.basicInfo.court,
      status: "scheduled",
    },
    risks: sim.rights.slice(0, 3).map((r, idx) => ({
      title: `${r.rightType} 리스크`,
      cause: `${r.rightHolder} ${new Date(r.registrationDate).toISOString().slice(0, 10)}`,
      impact: `청구금액 ${formatCurrency(r.claimAmount)}`,
      action: "권리순위 및 인수/소멸 여부 검토",
      severity: idx === 0 ? "high" : idx === 1 ? "mid" : "low",
    })),
    schedules: [
      { day: "사건접수", title: "경매사건 접수", date: sim.schedule.caseFiledDate },
      { day: "개시결정", title: "경매개시 결정", date: sim.schedule.decisionDate },
      { day: "배당요구종기", title: "배당요구 종기", date: sim.schedule.dividendDeadline },
      { day: "1차 매각", title: "최초 매각기일", date: sim.schedule.firstAuctionDate },
      { day: "진행", title: "현재 매각기일", date: sim.schedule.currentAuctionDate },
    ],
    rights: sim.rights.map((r, idx) => ({
      order: idx + 1,
      type: r.rightType,
      holder: r.rightHolder,
      date: r.registrationDate,
      claim: r.claimAmount,
      note: r.isMalsoBaseRight ? "말소기준" : undefined,
    })),
    payout: {
      base: lowest,
      rows: sim.rights.map((r, idx) => ({
        order: idx + 1,
        holder: r.rightHolder,
        type: r.rightType,
        claim: r.claimAmount,
        expected: Math.max(0, Math.min(r.claimAmount, lowest - (idx * 10000000)))
      })),
      note: "실제 배당은 낙찰대금에 따라 변동됩니다.",
    },
    region: {
      court: { name: sim.basicInfo.court },
      registry: { name: "등기소" },
      taxOffice: { name: "세무서" },
      links: [],
    },
    learn: {
      rights: { 
        title: "권리분석 리포트", 
        bullets: [
          `총 ${sim.rights.length}개 권리 중 ${sim.rights.filter(r => r.willBeAssumed).length}개 인수 예정`,
          `말소기준권리: ${sim.rights.filter(r => r.isMalsoBaseRight).length}개`,
          `소멸 예정 권리: ${sim.rights.filter(r => r.willBeExtinguished).length}개`,
          `최우선권리 청구금액: ${formatCurrency(sim.rights[0]?.claimAmount || 0)}`,
          `권리순위별 리스크 분석 완료`
        ], 
        state: "locked" 
      },
      analysis: { 
        title: "경매분석 리포트", 
        bullets: [
          `감정가 대비 할인율: ${Math.round((1 - lowest / appraised) * 100)}%`,
          `권장 입찰가: ${formatCurrency(Math.round(lowest * 1.2))}`,
          `임차인 ${sim.tenants?.length || 0}명 중 소액임차인 ${sim.tenants?.filter(t => t.isSmallTenant).length || 0}명`,
          `대항력 보유 임차인: ${sim.tenants?.filter(t => t.hasDaehangryeok).length || 0}명`,
          `투자 리스크 점수: ${calculateRiskScore(sim)}/100`
        ], 
        state: "locked" 
      },
    },
    snapshotAt: new Date().toISOString(),
  };
  console.log("🧪 [테스트] Simulation → PropertyDetail 매핑 완료", sim.id);
  return detail;
}
