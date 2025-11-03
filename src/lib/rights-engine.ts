/**
 * src/lib/rights-engine.ts
 * 
 * 경매 권리 인수액 계산 엔진 (정밀 로직)
 * 
 * 주요 기능:
 * - 말소권리 제외 (근저당권, 저당권, 압류 등)
 * - 임차권 미배당 잔액만 인수 대상으로 계산
 * - 확률가중 권리 계산 (유치권, 법정지상권)
 * - 항상 인수 권리 처리 (지상권, 분묘기지권)
 * 
 * @version 1.1
 * @see docs/plancal.md
 */

export type RightType =
  | "근저당권" | "저당권" | "압류" | "가압류" | "담보가등기" | "소유권이전청구권가등기" | "가처분"
  | "전세권" | "주택임차권" | "상가임차권"
  | "유치권" | "법정지상권" | "지상권" | "분묘기지권"
  | "기타";

export interface BaseRight {
  type: RightType;
  amount?: number;
  hasDahang?: boolean;
  hasPriority?: boolean;
  distributed?: number;
  extinguishable?: boolean;
  likelihood?: number;
  note?: string;
}

export interface RightsEngineInput {
  rights: BaseRight[];
  tenantResidualFactor?: number;
  defaultLikelihood?: {
    유치권?: number;
    법정지상권?: number;
    분묘기지권?: number;
    지상권?: number;
  };
  debug?: boolean;
}

export interface RightsEngineOutput {
  assumableTotal: number;
  extinguishedTotal: number;
  disputedWeightedTotal: number;
  breakdown: {
    assumable: BaseRight[];
    extinguished: BaseRight[];
    disputed: (BaseRight & { weighted: number })[];
    tenants: (BaseRight & { residual: number })[];
  };
}

const EXTINGUISHED_SET: Set<RightType> = new Set([
  "근저당권", "저당권", "압류", "가압류", "담보가등기", "소유권이전청구권가등기", "가처분",
]);

const TENANT_SET: Set<RightType> = new Set([
  "전세권", "주택임차권", "상가임차권",
]);

const DISPUTED_SET: Set<RightType> = new Set([
  "유치권", "법정지상권",
]);

const ALWAYS_ASSUMABLE_SET: Set<RightType> = new Set([
  "지상권", "분묘기지권",
]);

const KRW = (v?: number) => Math.max(0, Math.floor(v ?? 0));

export function computeAssumableCost(input: RightsEngineInput): RightsEngineOutput {
  console.log("⚖️ [권리 인수 계산] rights-engine 엔진 시작");
  console.log(`  - 권리 개수: ${input.rights.length}개`);
  
  const {
    rights,
    tenantResidualFactor = 1.0,
    defaultLikelihood = { 유치권: 0.6, 법정지상권: 0.7, 분묘기지권: 1.0, 지상권: 1.0 },
    debug = false,
  } = input;

  const extinguished: BaseRight[] = [];
  const tenants: (BaseRight & { residual: number })[] = [];
  const disputed: (BaseRight & { weighted: number })[] = [];
  const assumable: BaseRight[] = [];

  for (const r of rights) {
    const amount = KRW(r.amount);
    const distributed = KRW(r.distributed);
    const explicitExtinguish = r.extinguishable === true;

    if (explicitExtinguish || EXTINGUISHED_SET.has(r.type)) {
      extinguished.push({ ...r, amount });
      continue;
    }

    if (TENANT_SET.has(r.type)) {
      const residual = Math.max(0, amount - distributed);
      const adjusted = Math.floor(residual * tenantResidualFactor);
      if (adjusted > 0) tenants.push({ ...r, amount, distributed, residual: adjusted });
      continue;
    }

    if (DISPUTED_SET.has(r.type)) {
      const base =
        r.type === "유치권" ? (defaultLikelihood.유치권 ?? 0.6)
        : r.type === "법정지상권" ? (defaultLikelihood.법정지상권 ?? 0.7)
        : 1.0;
      const likelihood = r.likelihood ?? base;
      const weighted = Math.floor(amount * Math.min(Math.max(likelihood, 0), 1));
      if (weighted > 0) disputed.push({ ...r, amount, weighted, likelihood });
      continue;
    }

    if (ALWAYS_ASSUMABLE_SET.has(r.type)) {
      assumable.push({ ...r, amount });
      continue;
    }

    extinguished.push({ ...r, amount });
  }

  const tenantsTotal = tenants.reduce((s, t) => s + KRW(t.residual), 0);
  const disputedTotal = disputed.reduce((s, d) => s + KRW(d.weighted), 0);
  const assumableTotal = assumable.reduce((s, a) => s + KRW(a.amount), 0) + tenantsTotal + disputedTotal;
  const extinguishedTotal = extinguished.reduce((s, e) => s + KRW(e.amount), 0);

  console.log("⚖️ [권리 인수 계산] 분류 결과:");
  console.log(`  - 말소 권리: ${extinguished.length}개 (${extinguishedTotal.toLocaleString()}원)`);
  console.log(`  - 임차권 미배당 잔액: ${tenants.length}개 (${tenantsTotal.toLocaleString()}원)`);
  console.log(`  - 확률가중 권리: ${disputed.length}개 (${disputedTotal.toLocaleString()}원)`);
  console.log(`  - 항상 인수 권리: ${assumable.length}개 (${assumable.reduce((s, a) => s + KRW(a.amount), 0).toLocaleString()}원)`);
  console.log(`  ✅ 총 인수 대상 금액: ${assumableTotal.toLocaleString()}원`);

  if (debug) {
    console.table([
      { key: "assumableTotal", value: assumableTotal },
      { key: "tenantsTotal(residual)", value: tenantsTotal },
      { key: "disputedWeightedTotal", value: disputedTotal },
      { key: "extinguishedTotal", value: extinguishedTotal },
    ]);
  }

  return {
    assumableTotal,
    extinguishedTotal,
    disputedWeightedTotal: disputedTotal,
    breakdown: { assumable, extinguished, disputed, tenants },
  };
}
