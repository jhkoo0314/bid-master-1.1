/**
 * Bid Master AI - Rights 레이어
 * 
 * 목적: 말소기준권리 판단, 권리 인수/소멸 판정, 임차인 대항력 분석
 * 참조 문서: docs/auction-engine-v0.1.md
 * 작성일: 2025-01-XX
 */

import {
  PropertySnapshot,
  RegisteredRight,
  RightAnalysisResult,
  Tenant,
} from "@/types/auction";
import {
  RIGHT_RULES,
  RightTypeKorean,
  RiskFlagKey,
} from "@/lib/constants.auction";

/**
 * R-Mode(현실형):
 * - 말소기준권리: 배당요구종기일 이전 설정된 최선순위 담보성 권리(근저당 등)를 우선 후보
 * - 등기부 순위(rankOrder)와 설정일(establishedAt)을 함께 참고(둘 중 하나만 있어도 작동)
 * - 말소기준권리보다 '선순위' 권리는 인수 대상(소멸 안 됨)으로 가정
 * - 임차인: 대항력(전입+점유)과 확정일자 여부에 따라 인수/배당 구분(간이 규칙)
 * - 세부 판례/예외는 v>0.1에서 확장
 */

function pickMalsoBaseRight(rights: RegisteredRight[], dividendDeadline?: string): RegisteredRight | null {
  console.log("⚖️ [권리분석] 말소기준권리 판단 시작", {
    rightsCount: rights.length,
    hasDividendDeadline: !!dividendDeadline,
    dividendDeadline,
  });

  if (!rights || rights.length === 0) {
    console.log("⚖️ [권리분석] 권리 없음 → 말소기준권리 없음");
    return null;
  }

  // 담보성 권리 우선 후보
  const collateral = new Set<RightTypeKorean>(["근저당권", "저당권", "담보가등기"]);
  const candidates = rights.filter(r => collateral.has(r.type));

  console.log("⚖️ [권리분석] 담보성 권리 후보 필터링", {
    totalRights: rights.length,
    collateralCandidates: candidates.length,
    candidateTypes: candidates.map(r => r.type),
  });

  // 배당요구종기일 이전 설정 + 가장 선순위
  const beforeDeadline = (r: RegisteredRight) => {
    if (!dividendDeadline || !r.establishedAt) return true;
    return r.establishedAt <= dividendDeadline;
  };

  const sorted = candidates
    .filter(beforeDeadline)
    .sort((a, b) => {
      const ra = a.rankOrder ?? 9999;
      const rb = b.rankOrder ?? 9999;
      if (ra !== rb) return ra - rb;
      const da = a.establishedAt ?? "9999-12-31";
      const db = b.establishedAt ?? "9999-12-31";
      return da.localeCompare(db);
    });

  const result = sorted[0] ?? null;

  if (result) {
    console.log("⚖️ [권리분석] 말소기준권리 판단 완료", {
      rightId: result.id,
      type: result.type,
      rankOrder: result.rankOrder,
      establishedAt: result.establishedAt,
      amount: result.amount?.toLocaleString(),
    });
  } else {
    console.log("⚖️ [권리분석] 말소기준권리 판별 불가 → 보수적(인수 확장) 가정");
  }

  return result;
}

function comparePriority(a: RegisteredRight, b: RegisteredRight): number {
  // a가 b보다 선순위이면 음수
  const ra = a.rankOrder ?? 9999;
  const rb = b.rankOrder ?? 9999;
  if (ra !== rb) return ra - rb;

  const da = a.establishedAt ?? "9999-12-31";
  const db = b.establishedAt ?? "9999-12-31";
  return da.localeCompare(db);
}

function assessTenantOpposability(t: Tenant): "strong" | "weak" | "none" {
  // 간이 규칙: 전입일 + 점유(여기서는 hasOpposability true로 대체) 있으면 strong
  if (t.hasOpposability) return "strong";
  // 전입 또는 확정일자 중 1개만 있거나, 사실상 임차 추정이면 weak
  if (t.moveInDate || t.fixedDate || t.isDefacto) return "weak";
  return "none";
}

export function analyzeRights(snapshot: PropertySnapshot): RightAnalysisResult {
  console.log("⚖️ [권리분석] 권리 분석 시작", {
    caseId: snapshot.caseId,
    rightsCount: snapshot.rights.length,
    tenantsCount: snapshot.tenants.length,
    hasDividendDeadline: !!snapshot.dividendDeadline,
  });

  const { rights, tenants, dividendDeadline } = snapshot;
  const notes: string[] = [];
  const riskFlags = new Set<RiskFlagKey>();

  const malsoBase = pickMalsoBaseRight(rights, dividendDeadline);
  if (malsoBase) {
    notes.push(`말소기준권리 후보: #${malsoBase.id} (${malsoBase.type})`);
    console.log("⚖️ [권리분석] 말소기준권리 확정", {
      rightId: malsoBase.id,
      type: malsoBase.type,
      amount: malsoBase.amount?.toLocaleString(),
    });
  } else {
    notes.push("말소기준권리 판별 불가 → 보수적(인수 확장) 가정");
  }

  // 1) 등기 권리 인수 판정
  console.log("⚖️ [권리분석] 등기 권리 인수 판정 시작", { rightsCount: rights.length });
  const rightFindings = rights.map(r => {
    // RIGHT_RULES에서 권리 규칙 조회
    const rule = RIGHT_RULES[r.type];
    let disposition: "소멸" | "인수" | "위험" = rule?.defaultDisposition ?? "소멸";
    
    // riskFlags 수집
    if (rule?.riskFlags) {
      rule.riskFlags.forEach(flag => riskFlags.add(flag));
    }

    // 말소기준권리와 선후순위 비교
    if (malsoBase) {
      // 말소기준권리가 있을 때: 선순위면 disposition을 "인수"로 전환
      const cmp = comparePriority(r, malsoBase);
      if (cmp < 0) {
        disposition = "인수";
      }
    } else {
      // 말소기준권리가 없을 때: disposition이 "소멸"이면 "위험"으로 전환
      if (disposition === "소멸") {
        disposition = "위험";
      }
    }

    // amountPolicy에 따른 금액 계산
    let amountAssumed = 0;
    let assumed = false;
    
    if (disposition !== "소멸") {
      assumed = true;
      const baseAmount = r.amount ?? 0;
      
      switch (rule?.amountPolicy) {
        case "금액전액":
          amountAssumed = baseAmount;
          break;
        case "추정":
          amountAssumed = Math.round(baseAmount * 0.5);
          break;
        case "시세감액":
          assumed = false; // 비용은 costs 레이어에서 가산
          amountAssumed = 0;
          break;
        case "금액없음":
          assumed = false;
          amountAssumed = 0;
          break;
        default:
          // amountPolicy가 없으면 기본적으로 금액전액 처리
          amountAssumed = baseAmount;
      }
    }

    // reason 생성
    let reason: string;
    if (rule?.note) {
      reason = rule.note;
    } else {
      switch (disposition) {
        case "인수":
          reason = malsoBase 
            ? "말소기준권리보다 선순위 → 인수"
            : "권리 규칙에 따라 인수";
          break;
        case "위험":
          reason = "비금전·불확실 권리로 위험 처리";
          break;
        default:
          reason = "후순위로 추정되어 소멸";
      }
    }

    console.log("⚖️ [권리분석] 권리 판정", {
      rightId: r.id,
      type: r.type,
      disposition,
      amountAssumed,
      reason,
    });

    return {
      rightId: r.id,
      type: r.type,
      disposition,
      assumed,
      reason,
      amountAssumed,
    };
  });

  const rightsAssumedCount = rightFindings.filter(f => f.assumed).length;
  const rightsAssumedAmount = rightFindings.reduce((sum, f) => sum + f.amountAssumed, 0);
  console.log("⚖️ [권리분석] 등기 권리 인수 판정 완료", {
    assumedCount: rightsAssumedCount,
    assumedAmount: rightsAssumedAmount.toLocaleString(),
    riskFlags: Array.from(riskFlags),
  });

  // 2) 임차인 인수 판정(간이 규칙)
  const tenantKinds = tenants.map(t => (t.type ?? "기타") as "주택임차권" | "상가임차권" | "기타");
  console.log("⚖️ [권리분석] 임차인 대항력 분석 시작", {
    tenantsCount: tenants.length,
    kinds: tenantKinds,
  });
  const tenantFindings = tenants.map(t => {
    // kind 필드 추가
    const kind = (t.type ?? "기타") as "주택임차권" | "상가임차권" | "기타";
    
    // 상가임차권일 경우 "상가임차" riskFlag 추가
    if (kind === "상가임차권") {
      riskFlags.add("상가임차");
    }

    // 대항력 판정
    const opp = assessTenantOpposability(t);
    let assumed = false;
    let factor = 0;
    let reason = "대항력 약함/배당으로 소멸 가정";

    // 인수 판정 로직 수정
    if (opp === "strong") {
      assumed = true;
      factor = 1.0;
      reason = "대항력 강함(전입+점유) → 보증금 인수";
    } else if (opp === "weak") {
      assumed = true;
      // 상가임차권이면 0.6, 아니면 0.5
      factor = kind === "상가임차권" ? 0.6 : 0.5;
      reason = "대항력 불명확 → 보수적 일부 인수(교육용 규칙)";
    } else {
      // "none"
      assumed = false;
      factor = 0;
      reason = "대항력 약함/배당으로 소멸 가정";
    }

    // depositAssumed 계산
    const depositAssumed = assumed ? Math.round(t.deposit * factor) : 0;

    console.log("⚖️ [권리분석] 임차인 판정", {
      tenantId: t.id,
      kind,
      opposability: opp,
      assumed,
      deposit: t.deposit.toLocaleString(),
      depositAssumed: depositAssumed.toLocaleString(),
      reason,
    });

    return {
      tenantId: t.id,
      kind,
      opposability: opp,
      assumed,
      reason,
      depositAssumed,
    };
  });

  const tenantsAssumedCount = tenantFindings.filter(f => f.assumed).length;
  const tenantsAssumedAmount = tenantFindings.reduce((sum, f) => sum + f.depositAssumed, 0);
  console.log("⚖️ [권리분석] 임차인 대항력 분석 완료", {
    assumedCount: tenantsAssumedCount,
    assumedAmount: tenantsAssumedAmount.toLocaleString(),
    kinds: tenantFindings.map(f => f.kind),
  });

  // 3) 특수 권리 riskFlags 추가
  for (const f of rightFindings) {
    if (f.type === "유치권") riskFlags.add("유치권");
    if (f.type === "법정지상권") riskFlags.add("법정지상권");
    if (f.type === "분묘기지권") riskFlags.add("분묘");
    if (
      f.type === "소유권이전청구권가등기" ||
      f.type === "가등기" ||
      f.type === "예고등기" ||
      f.type === "가처분"
    ) {
      riskFlags.add("소유권분쟁");
    }
  }

  // 임차다수 플래그 추가
  if (tenants.length >= 3) {
    riskFlags.add("임차다수");
  }

  // 합산
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
  const rightsSum = sum(rightFindings.map((f) => f.amountAssumed));
  const tenantsSum = sum(tenantFindings.map((f) => f.depositAssumed));
  const assumedRightsAmountRaw = rightsSum + tenantsSum;

  // 0원 방지 레이어
  let assumedRightsAmount = assumedRightsAmountRaw;
  if (assumedRightsAmountRaw === 0) {
    // 감정가의 1% 또는 최소 300만원 중 큰 값 사용
    const appraisal = snapshot.appraisal ?? 0;
    const fallback1 = Math.round(appraisal * 0.01);
    const fallback2 = 3_000_000;
    assumedRightsAmount = Math.max(fallback1, fallback2);
    console.warn("⚠️ [권리분석] 인수권리금액이 0원 → Fallback 적용", {
      assumedRightsAmountRaw: 0,
      appraisal: appraisal.toLocaleString(),
      fallback1: fallback1.toLocaleString(),
      fallback2: fallback2.toLocaleString(),
      applied: assumedRightsAmount.toLocaleString(),
    });
    notes.push(
      `인수권리금액 0원 → Fallback 적용: ${assumedRightsAmount.toLocaleString()}원 (감정가의 1% 또는 최소 300만원 중 큰 값)`
    );
  } else {
    notes.push(
      `인수 권리 합계: 등기권리 ${rightsSum.toLocaleString()}원 + 임차 ${tenantsSum.toLocaleString()}원 = ${assumedRightsAmount.toLocaleString()}원`
    );
  }

  console.log("⚖️ [권리분석] 권리 분석 완료", {
    malsoBaseRightId: malsoBase?.id || null,
    assumedRightsAmount: assumedRightsAmount.toLocaleString(),
    rightsAssumed: rightsSum.toLocaleString(),
    tenantsAssumed: tenantsSum.toLocaleString(),
    riskFlags: Array.from(riskFlags),
    notesCount: notes.length,
  });

  return {
    malsoBase,
    assumedRightsAmount,
    tenantFindings,
    rightFindings,
    riskFlags: Array.from(riskFlags),
    notes,
  };
}

