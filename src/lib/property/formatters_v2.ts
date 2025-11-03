import type { PropertyDetail } from "@/types/property";
import type { SimulationScenario } from "@/types/simulation";
import type { AuctionEvalResult } from "@/lib/auction-engine";

/**
 * v1.2 평가 결과 타입 (auction-engine.ts가 반환)
 * 필요한 최소 필드만 정의해 의존성 최소화
 */
export interface AuctionEvaluationResult {
  // 총 인수금액 A = B + R + T + C + E + K + U
  totalAcquisition: number;
  components: {
    bidPrice: number; // B
    rights: number; // R (권리+임차보증 등)
    taxes: number; // T
    capex: number; // C
    eviction: number; // E
    carrying: number; // K
    contingency: number; // U
  };
  // FMV(공정시세) 기준 안전마진
  fmv: {
    fairMarketValue: number; // V_fmv
    marginAmount: number; // MoS_fmv = V_fmv - A
    marginRate: number; // MoS_fmv / V_fmv
  };
  // Exit(예상 매각가) 기준 안전마진
  exit: {
    exitPrice: number; // V_exit
    holdMonths?: number; // 보유기간(개월) - 선택
    marginAmount: number; // MoS_exit = V_exit - A
    marginRate: number; // MoS_exit / V_exit
    roi?: number; // 기대 단순 ROI (옵션)
    irr?: number; // 기대 IRR (옵션)
  };
  // 3단계 입찰전략 (공격/중립/보수)
  bidStrategy: Array<{ stage: "공격적" | "중립" | "보수적"; value: number }>;
}

/** 숫자 → 1만원 단위 반올림 */
function round1e4(n: number) {
  const unit = 10_000;
  return Math.round((n ?? 0) / unit) * unit;
}

/** 안전마진 라벨링/색상 유틸 */
function mosLabel(amount: number) {
  if (amount > 0) return { label: "플러스", tone: "text-emerald-600" };
  if (amount < 0) return { label: "마이너스", tone: "text-rose-600" };
  return { label: "보합", tone: "text-zinc-500" };
}

/**
 * auction-engine.ts의 AuctionEvalResult를 AuctionEvaluationResult로 변환
 */
export function convertAuctionEvalToEvaluationResult(
  evalResult: AuctionEvalResult,
  exitHoldMonths?: number
): AuctionEvaluationResult {
  console.log(
    "🔄 [v1.2 매핑] AuctionEvalResult → AuctionEvaluationResult 변환 시작"
  );

  const { margin, strategy, costBreakdown } = evalResult;

  return {
    totalAcquisition: margin.totalAcquisition,
    components: {
      bidPrice: costBreakdown.bidPrice,
      rights: costBreakdown.rights,
      taxes: costBreakdown.taxes,
      capex: costBreakdown.capex,
      eviction: costBreakdown.eviction,
      carrying: costBreakdown.carrying,
      contingency: costBreakdown.contingency,
    },
    fmv: {
      fairMarketValue: margin.fmv,
      marginAmount: margin.mos_fmv,
      marginRate: margin.fmv > 0 ? margin.mos_fmv / margin.fmv : 0,
    },
    exit: {
      exitPrice: margin.exitPrice,
      holdMonths: exitHoldMonths,
      marginAmount: margin.mos_exit,
      marginRate: margin.exitPrice > 0 ? margin.mos_exit / margin.exitPrice : 0,
      roi: margin.roi_exit,
      // IRR은 별도 계산 필요 시 추가
    },
    bidStrategy: strategy.map((s: { stage: string; value: number }) => ({
      stage:
        s.stage === "conservative"
          ? "보수적"
          : s.stage === "neutral"
          ? "중립"
          : "공격적",
      value: s.value,
    })),
  };
}

/**
 * v1.2 매핑: SimulationScenario + AuctionEvalResult → PropertyDetail
 * - 기존 v1.1 구조는 유지하고, 새 필드를 추가한다.
 * - 기존 mapSimulationToPropertyDetail은 보존. 이 함수는 병행 사용을 권장.
 */
export function mapSimulationToPropertyDetailV2(
  sim: SimulationScenario,
  evalResult: AuctionEvalResult | AuctionEvaluationResult,
  exitHoldMonths?: number
): PropertyDetail {
  // AuctionEvalResult인 경우 변환
  const convertedEvalResult: AuctionEvaluationResult =
    "margin" in evalResult
      ? convertAuctionEvalToEvaluationResult(evalResult, exitHoldMonths)
      : evalResult;
  // ── 기존 v1.1 변환이 이미 있다면 먼저 호출해서 베이스를 만든 뒤, v1.2 필드만 주입하는 패턴을 추천합니다.
  //    만약 기존 mapSimulationToPropertyDetail을 그대로 쓰고 있다면 아래 try/catch 블록을 활용하세요.
  let base: PropertyDetail;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const legacy = require("./formatters") as {
      mapSimulationToPropertyDetail: (s: SimulationScenario) => PropertyDetail;
    };
    base = legacy.mapSimulationToPropertyDetail(sim);
  } catch {
    // 최소 베이스 객체 (필요 필드만 채움)
    base = {
      caseId: sim.basicInfo.caseNumber,
      meta: {
        address: sim.basicInfo.location,
        type: sim.basicInfo.propertyType,
        area_pyeong: sim.propertyDetails?.buildingAreaPyeong,
        area_m2: sim.propertyDetails?.buildingArea,
      },
      price: {
        appraised: sim.basicInfo.appraisalValue,
        lowest: sim.basicInfo.minimumBidPrice,
        discountRate:
          sim.basicInfo.appraisalValue > 0
            ? 1 -
              (sim.basicInfo.minimumBidPrice || 0) /
                sim.basicInfo.appraisalValue
            : 0,
        deposit: sim.basicInfo.bidDeposit,
        status: "estimated",
        updatedAt: new Date().toISOString(),
      },
      nextAuction: {
        date: sim.schedule.currentAuctionDate,
        court: sim.basicInfo.court,
        status: "scheduled",
      },
      rights: [],
      payout: {
        base: sim.basicInfo.minimumBidPrice,
        rows: [],
        note: "실제 배당은 낙찰대금에 따라 변동됩니다.",
      },
      region: {
        court: {
          name: "",
          phone: "",
          address: "",
          open: { bidStart: "", bidEnd: "" },
        },
        registry: { name: "", phone: "", address: "" },
        taxOffice: { name: "", phone: "", address: "" },
        links: [],
      },
      learn: {
        rights: { title: "권리분석 리포트", bullets: [], state: "locked" },
        analysis: { title: "경매분석 리포트", bullets: [], state: "locked" },
      },
      schedules: [],
      risks: [],
      snapshotAt: new Date().toISOString(),
    };
  }

  // ── v1.2 필드 주입
  const { totalAcquisition, components, fmv, exit, bidStrategy } =
    convertedEvalResult;

  // price 확장: estimatedMarket(FMV 중심값) 추가
  base.price = {
    ...base.price,
    estimatedMarket: fmv.fairMarketValue, // ✅ v1.2: UI에서 시세표시용
  } as PropertyDetail["price"] & { estimatedMarket?: number };

  // v1.2 분석 블록 추가
  const fmvTone = mosLabel(fmv.marginAmount);
  const exitTone = mosLabel(exit.marginAmount);

  const analysisV12 = {
    title: "경매분석 (v1.2)",
    fmv: {
      fairMarketValue: round1e4(fmv.fairMarketValue),
      mosAmount: round1e4(fmv.marginAmount),
      mosRate: fmv.marginRate,
      toneClass: fmvTone.tone,
      toneLabel: fmvTone.label,
    },
    exit: {
      exitPrice: round1e4(exit.exitPrice),
      holdMonths: exit.holdMonths ?? 0,
      mosAmount: round1e4(exit.marginAmount),
      mosRate: exit.marginRate,
      roi: exit.roi ?? undefined,
      irr: exit.irr ?? undefined,
      toneClass: exitTone.tone,
      toneLabel: exitTone.label,
    },
    acquisition: {
      total: round1e4(totalAcquisition),
      parts: {
        bidPrice: round1e4(components.bidPrice),
        rights: round1e4(components.rights),
        taxes: round1e4(components.taxes),
        capex: round1e4(components.capex),
        eviction: round1e4(components.eviction),
        carrying: round1e4(components.carrying),
        contingency: round1e4(components.contingency),
      },
    },
    bidStrategy: bidStrategy.map((b) => ({
      stage: b.stage,
      value: round1e4(b.value),
    })),
  };

  // learn.analysis 요약도 v1.2 기준으로 교체/보강
  base.learn = {
    ...base.learn,
    analysis: {
      title: "경매분석 리포트 (v1.2)",
      bullets: [
        `FMV 안전마진: ${formatKRW(analysisV12.fmv.mosAmount)} (${pct(
          analysisV12.fmv.mosRate
        )})`,
        `Exit 안전마진: ${formatKRW(analysisV12.exit.mosAmount)} (${pct(
          analysisV12.exit.mosRate
        )})`,
        `총인수금액 A: ${formatKRW(analysisV12.acquisition.total)}`,
        `권리/세금/비용 포함 총합 반영`,
      ],
      state: "locked",
    },
  };

  // 새 분석 필드를 별도 네임스페이스로 추가 (detail.analysisV12)
  (base as any).analysisV12 = analysisV12;

  // bidStrategy를 루트에도 노출 (기존 컴포넌트 재사용성)
  (base as any).bidStrategy = analysisV12.bidStrategy;

  return base;
}

function formatKRW(v?: number) {
  if (v == null) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(v)}원`;
}
function pct(r?: number) {
  if (r == null || !isFinite(r)) return "-";
  return `${(r * 100).toFixed(1)}%`;
}
