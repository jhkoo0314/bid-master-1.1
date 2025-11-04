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
  const collateralTypes = new Set(["mortgage", "pledge", "superiorEtc"]);
  const candidates = rights.filter(r => collateralTypes.has(r.type));

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
    let assumed = false;
    let reason = "후순위로 추정되어 소멸";

    if (!malsoBase) {
      // 말소기준 미판별 → 보수적: 담보성/특수권리는 인수로 가중
      const conservative = r.type === "liens" || r.type === "superiorEtc";
      assumed = conservative;
      reason = conservative ? "말소기준 불명확 → 특수/선순위 가능성으로 인수" : "말소 가능성";
    } else {
      // malsoBase보다 선순위면 인수
      const cmp = comparePriority(r, malsoBase);
      if (cmp < 0) {
        assumed = true;
        reason = "말소기준권리보다 선순위 → 인수";
      }
    }

    const amountAssumed = assumed ? (r.amount ?? 0) : 0;
    
    if (assumed) {
      console.log("⚖️ [권리분석] 권리 인수 판정", {
        rightId: r.id,
        type: r.type,
        amount: amountAssumed.toLocaleString(),
        reason,
      });
    }

    return { rightId: r.id, assumed, reason, amountAssumed };
  });

  const rightsAssumedCount = rightFindings.filter(f => f.assumed).length;
  const rightsAssumedAmount = rightFindings.reduce((sum, f) => sum + f.amountAssumed, 0);
  console.log("⚖️ [권리분석] 등기 권리 인수 판정 완료", {
    assumedCount: rightsAssumedCount,
    assumedAmount: rightsAssumedAmount.toLocaleString(),
  });

  // 2) 임차인 인수 판정(간이 규칙)
  console.log("⚖️ [권리분석] 임차인 대항력 분석 시작", { tenantsCount: tenants.length });
  const tenantFindings = tenants.map(t => {
    const opp = assessTenantOpposability(t);
    let assumed = false;
    let reason = "대항력 약함/배당으로 소멸 가정";

    if (opp === "strong") {
      assumed = true;
      reason = "대항력 강함(전입+점유) → 보증금 인수";
    } else if (opp === "weak") {
      // 종기/확정일자 등의 조합이 불충분 → 케이스에 따라 일부 인수 가능성
      // v0.1: 교육 목적상 보수적으로 50% 인수(추정) → 명확 데이터 있으면 개선
      assumed = true;
      reason = "대항력 불명확 → 보수적 일부 인수(교육용 규칙)";
    }

    const depositAssumed =
      assumed ? Math.round(t.deposit * (opp === "weak" ? 0.5 : 1.0)) : 0;

    console.log("⚖️ [권리분석] 임차인 대항력 판정", {
      tenantId: t.id,
      opposability: opp,
      assumed,
      deposit: t.deposit.toLocaleString(),
      depositAssumed: depositAssumed.toLocaleString(),
      reason,
    });

    return {
      tenantId: t.id,
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
  });

  // 합산
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const rightsSum = sum(rightFindings.map(f => f.amountAssumed));
  const tenantsSum = sum(tenantFindings.map(f => f.depositAssumed));
  const assumedRightsAmount = rightsSum + tenantsSum;

  notes.push(
    `인수 권리 합계: 등기권리 ${rightsSum.toLocaleString()}원 + 임차 ${tenantsSum.toLocaleString()}원 = ${assumedRightsAmount.toLocaleString()}원`
  );

  console.log("⚖️ [권리분석] 권리 분석 완료", {
    malsoBaseRightId: malsoBase?.id || null,
    assumedRightsAmount: assumedRightsAmount.toLocaleString(),
    rightsAssumed: rightsSum.toLocaleString(),
    tenantsAssumed: tenantsSum.toLocaleString(),
    notesCount: notes.length,
  });

  return {
    malsoBase,
    assumedRightsAmount,
    tenantFindings,
    rightFindings,
    notes,
  };
}

