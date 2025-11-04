/**
 * Bid Master AI - 매물 상세보기 페이지
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SimulationScenario } from "@/types/simulation";
import { useSimulationStore } from "@/store/simulation-store";
import { generateProperty } from "@/app/actions/generate-property";
// ✅ v0.1 엔진 기반으로 교체
import { auctionEngine } from "@/lib/auction-engine";
import type { PropertySnapshot } from "@/types/auction";
import { mapSimulationToSnapshot } from "@/lib/auction/mappers";
import { AuctionAnalysisModal } from "@/components/AuctionAnalysisModal";
import { submitWaitlist } from "@/app/actions/submit-waitlist";
import Link from "next/link";

// 매물별 동적 단계별 가이드 생성 함수
function generateDynamicStepGuide(property: SimulationScenario): {
  [key: string]: string;
} {
  console.log("🔍 [동적 가이드] 매물별 단계별 가이드 생성:", property.id);

  const { basicInfo, rights, tenants, propertyDetails } = property;
  const hasComplexRights = rights && rights.length > 2;
  const hasTenants = tenants && tenants.length > 0;
  const hasSmallTenants = tenants && tenants.some((t) => t.isSmallTenant);
  const hasMultipleMortgages =
    rights && rights.filter((r) => r.rightType === "근저당권").length > 1;
  const isApartment = propertyDetails?.usage === "아파트";
  const isOffice = propertyDetails?.usage === "오피스텔";
  const isCommercial = propertyDetails?.usage === "상가";

  // 권리 유형별 특성 분석
  const rightTypes = rights?.map((r) => r.rightType) || [];
  const hasMortgage = rightTypes.includes("근저당권");
  const hasMortgageRight = rightTypes.includes("저당권");
  const hasSeizure =
    rightTypes.includes("압류") || rightTypes.includes("가압류");
  const hasPledge = rightTypes.includes("담보가등기");
  const hasChonse = rightTypes.includes("전세권");
  const hasOwnershipTransfer = rightTypes.includes("소유권이전청구권가등기");
  const hasInjunction = rightTypes.includes("가처분");
  const hasTenantRights = rightTypes.includes("주택상가임차권");
  const hasHousingTenantRights = rightTypes.includes("주택임차권");
  const hasCommercialTenantRights = rightTypes.includes("상가임차권");
  const hasLien = rightTypes.includes("유치권");
  const hasSurfaceRights = rightTypes.includes("법정지상권");
  const hasTombRights = rightTypes.includes("분묘기지권");

  const guide: { [key: string]: string } = {};

  // 1단계: 권리분석 (권리 유형별 특성에 따라 다름)
  if (hasMultipleMortgages) {
    guide.step1 = `다중 근저당권이 설정된 복잡한 권리구조입니다. 
    • 말소기준권리(${
      rights?.find((r) => r.isMalsoBaseRight)?.rightType || "근저당권"
    }) 확인
    • 각 근저당권의 설정일자와 청구금액 비교
    • 배당순위에 따른 권리 소멸/인수 여부 파악
    • 권리분석 전문가 상담 권장`;
  } else if (hasSeizure) {
    guide.step1 = `압류/가압류가 설정된 매물입니다.
    • 압류/가압류의 설정일자와 청구금액 확인
    • 강제집행 절차의 진행 상황 파악
    • 압류/가압류 해제 가능성 검토
    • 법원의 압류/가압류 해제 신청 필요`;
  } else if (hasChonse) {
    guide.step1 = `전세권이 설정된 매물입니다.
    • 전세권의 설정일자와 전세금 확인
    • 전세권의 우선순위 파악 (근저당권보다 우선)
    • 전세권 인수 시 전세금 반환 의무
    • 전세권 해제 가능성 검토`;
  } else if (hasOwnershipTransfer) {
    guide.step1 = `소유권이전청구권가등기가 설정된 매물입니다.
    • 소유권이전청구권의 설정일자와 청구금액 확인
    • 가등기의 효력과 본등기 가능성 검토
    • 소유권이전청구권의 우선순위 파악
    • 권리자와의 협의 필요`;
  } else if (hasInjunction) {
    guide.step1 = `가처분이 설정된 매물입니다.
    • 가처분의 설정일자와 청구금액 확인
    • 가처분의 목적과 효력 파악
    • 가처분 해제 가능성 검토
    • 법원의 가처분 해제 신청 필요`;
  } else if (hasLien) {
    guide.step1 = `유치권이 설정된 매물입니다.
    • 유치권의 설정일자와 청구금액 확인
    • 유치권의 대상물과 효력 파악
    • 유치권 인수 시 유치물 반환 의무
    • 유치권 해제 가능성 검토`;
  } else if (hasSurfaceRights) {
    guide.step1 = `법정지상권이 설정된 매물입니다.
    • 법정지상권의 설정일자와 청구금액 확인
    • 지상권의 범위와 효력 파악
    • 지상권 인수 시 지상권자와의 협의 필요
    • 지상권 해제 가능성 검토`;
  } else if (hasTombRights) {
    guide.step1 = `분묘기지권이 설정된 매물입니다.
    • 분묘기지권의 설정일자와 청구금액 확인
    • 분묘의 위치와 범위 파악
    • 분묘기지권 인수 시 분묘 보존 의무
    • 분묘기지권 해제 가능성 검토`;
  } else if (hasMortgageRight) {
    guide.step1 = `저당권이 설정된 매물입니다.
    • 저당권의 설정일자와 청구금액 확인
    • 저당권의 우선순위와 배당 가능성 파악
    • 저당권 인수 시 채무 인수 의무
    • 저당권 해제 가능성 검토`;
  } else if (hasHousingTenantRights) {
    guide.step1 = `주택임차권이 설정된 매물입니다.
    • 주택임차권의 설정일자와 청구금액 확인
    • 주택임대차보호법에 따른 권리 보호 범위 파악
    • 주택임차권 인수 시 임차인 보호 의무
    • 주택임차권 해제 가능성 검토`;
  } else if (hasCommercialTenantRights) {
    guide.step1 = `상가임차권이 설정된 매물입니다.
    • 상가임차권의 설정일자와 청구금액 확인
    • 상가임대차보호법에 따른 권리 보호 범위 파악
    • 상가임차권 인수 시 임차인 보호 의무
    • 상가임차권 해제 가능성 검토`;
  } else if (hasComplexRights) {
    guide.step1 = `다양한 권리가 설정된 매물입니다.
    • 근저당권 외 다른 권리들(${rights
      ?.map((r) => r.rightType)
      .join(", ")}) 확인
    • 각 권리의 인수/소멸 여부 파악
    • 권리자별 청구금액과 배당 가능성 검토`;
  } else {
    guide.step1 = `단순한 권리구조의 매물입니다.
    • 근저당권 1개만 설정된 안전한 구조
    • 권리분석이 상대적으로 간단
    • 입찰 시 권리 인수 부담 최소화`;
  }

  // 2단계: 임차인 현황 (임차인 유무에 따라 다름)
  if (hasTenants) {
    const tenantCount = tenants?.length || 0;
    const smallTenantCount =
      tenants?.filter((t) => t.isSmallTenant).length || 0;
    const daehangryeokCount =
      tenants?.filter((t) => t.hasDaehangryeok).length || 0;

    guide.step2 = `임차인이 ${tenantCount}명 거주 중입니다.
    • 소액임차인 ${smallTenantCount}명 (우선변제 대상)
    • 대항력 보유 임차인 ${daehangryeokCount}명
    • 총 인수비용: ${tenants
      ?.reduce((sum, t) => sum + t.deposit, 0)
      .toLocaleString("ko-KR")}원
    • 임차인 인수 시 추가 비용 고려 필요`;

    if (hasSmallTenants) {
      guide.step2 += `\n    ⚠️ 소액임차인 우선변제로 인한 추가 비용 발생 가능`;
    }
  } else {
    guide.step2 = `임차인이 없는 깨끗한 매물입니다.
    • 인수 시 추가 비용 없음
    • 즉시 입주 또는 재임대 가능
    • 투자 리스크 최소화`;
  }

  // 3단계: 입찰가 산정 (매물 유형에 따라 다름)
  const basePrice = basicInfo.minimumBidPrice || 0;
  const appraisalPrice = basicInfo.appraisalValue || 0;
  const discountRate = Math.round((1 - basePrice / appraisalPrice) * 100);

  if (isApartment) {
    guide.step3 = `아파트 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.15).toLocaleString(
      "ko-KR"
    )}원 (최저가 +15%)
    • 아파트 특성상 안정적인 투자 가능
    • 관리비 및 입주민 규정 확인 필요`;
  } else if (isOffice) {
    guide.step3 = `오피스텔 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.2).toLocaleString(
      "ko-KR"
    )}원 (최저가 +20%)
    • 상업용 관리비 고려 필요
    • 용도변경 제한사항 확인`;
  } else if (isCommercial) {
    guide.step3 = `상가 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.25).toLocaleString(
      "ko-KR"
    )}원 (최저가 +25%)
    • 상권 분석 및 임대수익률 검토 필요
    • 용도변경 가능성 확인`;
  } else {
    guide.step3 = `일반 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.1).toLocaleString(
      "ko-KR"
    )}원 (최저가 +10%)
    • 매물 특성에 맞는 활용 방안 검토`;
  }

  // 4단계: 리스크 체크 (매물별 특성에 따라 다름)
  const risks = [];
  if (hasComplexRights) risks.push("복잡한 권리구조");
  if (hasTenants) risks.push("임차인 인수 부담");
  if (hasSmallTenants) risks.push("소액임차인 우선변제");
  if (discountRate < 20) risks.push("낮은 할인율");

  if (risks.length > 0) {
    guide.step4 = `주의해야 할 리스크 요소들:
    • ${risks.join(", ")}
    • 입찰 전 현장 답사 필수
    • 권리분석 전문가 상담 권장
    • 충분한 자금 확보 필요`;
  } else {
    guide.step4 = `상대적으로 안전한 매물입니다.
    • 단순한 권리구조
    • 임차인 부담 없음
    • 적정 할인율
    • 신중한 입찰 전략 수립`;
  }

  console.log("✅ [동적 가이드] 생성 완료:", guide);
  return guide;
}

// 매물별 동적 핵심분석 생성 함수
function generateDynamicCoreAnalysis(property: SimulationScenario): {
  keyPoints: string[];
  risks: string[];
} {
  console.log("🔍 [동적 핵심분석] 매물별 핵심분석 생성:", property.id);

  const { basicInfo, rights, tenants, propertyDetails } = property;
  const hasComplexRights = rights && rights.length > 2;
  const hasTenants = tenants && tenants.length > 0;
  const hasSmallTenants = tenants && tenants.some((t) => t.isSmallTenant);
  const hasMultipleMortgages =
    rights && rights.filter((r) => r.rightType === "근저당권").length > 1;
  const isApartment = propertyDetails?.usage === "아파트";
  const isOffice = propertyDetails?.usage === "오피스텔";
  const isCommercial = propertyDetails?.usage === "상가";
  const discountRate = Math.round(
    (1 - (basicInfo.minimumBidPrice || 0) / (basicInfo.appraisalValue || 1)) *
      100
  );

  // 권리 유형별 특성 분석
  const rightTypes = rights?.map((r) => r.rightType) || [];
  const hasMortgage = rightTypes.includes("근저당권");
  const hasMortgageRight = rightTypes.includes("저당권");
  const hasSeizure =
    rightTypes.includes("압류") || rightTypes.includes("가압류");
  const hasPledge = rightTypes.includes("담보가등기");
  const hasChonse = rightTypes.includes("전세권");
  const hasOwnershipTransfer = rightTypes.includes("소유권이전청구권가등기");
  const hasInjunction = rightTypes.includes("가처분");
  const hasTenantRights = rightTypes.includes("주택상가임차권");
  const hasHousingTenantRights = rightTypes.includes("주택임차권");
  const hasCommercialTenantRights = rightTypes.includes("상가임차권");
  const hasLien = rightTypes.includes("유치권");
  const hasSurfaceRights = rightTypes.includes("법정지상권");
  const hasTombRights = rightTypes.includes("분묘기지권");

  const keyPoints: string[] = [];
  const risks: string[] = [];

  // 매물 유형별 핵심 포인트
  if (isApartment) {
    keyPoints.push("아파트 경매의 안정성과 관리비 부담 검토 필요");
    keyPoints.push("입주민 규정 및 주차장 사용권 확인 필수");
  } else if (isOffice) {
    keyPoints.push("오피스텔의 상업용 관리비와 용도변경 제한사항 주의");
    keyPoints.push("임대수익률과 상권 분석이 투자 성공의 핵심");
  } else if (isCommercial) {
    keyPoints.push("상가의 상권 분석과 유동인구 조사가 필수");
    keyPoints.push("임대료 수준과 용도변경 가능성 검토 필요");
  }

  // 권리 유형별 핵심 포인트
  if (hasSeizure) {
    keyPoints.push("압류/가압류 해제 절차와 비용 검토 필요");
    keyPoints.push("강제집행 절차의 진행 상황과 해제 가능성 파악");
  } else if (hasChonse) {
    keyPoints.push("전세권의 우선순위와 전세금 반환 의무 확인");
    keyPoints.push("전세권 해제 절차와 비용 검토 필요");
  } else if (hasOwnershipTransfer) {
    keyPoints.push("소유권이전청구권의 효력과 본등기 가능성 검토");
    keyPoints.push("권리자와의 협의 및 해제 절차 필요");
  } else if (hasInjunction) {
    keyPoints.push("가처분의 목적과 효력, 해제 가능성 검토");
    keyPoints.push("법원의 가처분 해제 신청 절차 필요");
  } else if (hasLien) {
    keyPoints.push("유치권의 대상물과 효력, 인수 시 반환 의무 확인");
    keyPoints.push("유치권 해제 절차와 비용 검토 필요");
  } else if (hasSurfaceRights) {
    keyPoints.push("법정지상권의 범위와 효력, 지상권자와의 협의 필요");
    keyPoints.push("지상권 해제 절차와 비용 검토 필요");
  } else if (hasTombRights) {
    keyPoints.push("분묘기지권의 범위와 분묘 보존 의무 확인");
    keyPoints.push("분묘기지권 해제 절차와 비용 검토 필요");
  } else if (hasMortgageRight) {
    keyPoints.push("저당권의 우선순위와 배당 가능성 확인");
    keyPoints.push("저당권 인수 시 채무 인수 의무와 비용 검토 필요");
  } else if (hasHousingTenantRights) {
    keyPoints.push("주택임대차보호법에 따른 임차인 보호 범위 확인");
    keyPoints.push("주택임차권 인수 시 임차인 보호 의무와 비용 검토 필요");
  } else if (hasCommercialTenantRights) {
    keyPoints.push("상가임대차보호법에 따른 임차인 보호 범위 확인");
    keyPoints.push("상가임차권 인수 시 임차인 보호 의무와 비용 검토 필요");
  } else if (hasMultipleMortgages) {
    keyPoints.push("다중 근저당권의 배당순위와 말소기준권리 분석 중요");
    keyPoints.push("각 근저당권의 설정일자와 청구금액 비교 필수");
  } else if (hasComplexRights) {
    keyPoints.push("다양한 권리 유형의 인수/소멸 여부 파악 필요");
    keyPoints.push("권리자별 청구금액과 배당 가능성 검토");
  } else {
    keyPoints.push("단순한 권리구조로 상대적으로 안전한 투자");
  }

  // 임차인 관련 핵심 포인트
  if (hasTenants) {
    const tenantCount = tenants?.length || 0;
    const smallTenantCount =
      tenants?.filter((t) => t.isSmallTenant).length || 0;
    keyPoints.push(`임차인 ${tenantCount}명의 인수 비용 고려 필요`);

    if (hasSmallTenants) {
      keyPoints.push(
        `소액임차인 ${smallTenantCount}명의 우선변제 비용 추가 발생`
      );
    }
  } else {
    keyPoints.push("임차인 부담이 없는 깨끗한 매물");
  }

  // 할인율별 핵심 포인트
  if (discountRate > 30) {
    keyPoints.push("높은 할인율로 투자 기회가 좋지만 숨겨진 리스크 주의");
  } else if (discountRate < 20) {
    keyPoints.push("낮은 할인율로 안전하지만 수익성 제한적");
  } else {
    keyPoints.push("적정 할인율로 균형잡힌 투자 기회");
  }

  // 권리 유형별 리스크 분석
  if (hasSeizure) {
    risks.push("압류/가압류 해제 절차의 복잡성과 비용 발생 가능");
    risks.push("강제집행 절차로 인한 추가 시간과 비용 소요");
  } else if (hasChonse) {
    risks.push("전세권 해제 시 전세금 반환 의무로 인한 추가 비용");
    risks.push("전세권의 우선순위로 인한 배당 순위 영향");
  } else if (hasOwnershipTransfer) {
    risks.push("소유권이전청구권의 본등기 가능성으로 인한 권리 충돌");
    risks.push("권리자와의 협의 실패 시 법적 분쟁 가능성");
  } else if (hasInjunction) {
    risks.push("가처분 해제 절차의 복잡성과 법원 신청 비용");
    risks.push("가처분의 목적에 따른 추가 제약사항 발생 가능");
  } else if (hasLien) {
    risks.push("유치권 해제 시 유치물 반환 의무로 인한 추가 비용");
    risks.push("유치권의 대상물 확인 및 반환 절차의 복잡성");
  } else if (hasSurfaceRights) {
    risks.push("법정지상권 해제 시 지상권자와의 협의 실패 가능성");
    risks.push("지상권의 범위와 효력으로 인한 사용 제약");
  } else if (hasTombRights) {
    risks.push("분묘기지권 해제 시 분묘 보존 의무로 인한 제약");
    risks.push("분묘의 위치와 범위로 인한 사용 제한");
  } else if (hasMortgageRight) {
    risks.push("저당권 인수 시 채무 인수 의무로 인한 추가 비용");
    risks.push("저당권의 우선순위로 인한 배당 순위 영향");
  } else if (hasHousingTenantRights) {
    risks.push("주택임대차보호법에 따른 임차인 보호 의무로 인한 제약");
    risks.push("주택임차권 해제 시 임차인 보호 비용 발생 가능");
  } else if (hasCommercialTenantRights) {
    risks.push("상가임대차보호법에 따른 임차인 보호 의무로 인한 제약");
    risks.push("상가임차권 해제 시 임차인 보호 비용 발생 가능");
  } else if (hasComplexRights) {
    risks.push("복잡한 권리구조로 인한 추가 분석 비용 발생 가능");
  }

  if (hasTenants) {
    risks.push("임차인 인수 비용으로 인한 예상보다 높은 투자금 필요");
  }
  if (hasSmallTenants) {
    risks.push("소액임차인 우선변제로 인한 추가 비용 발생");
  }
  if (discountRate > 30) {
    risks.push("높은 할인율의 원인 파악 필요 (숨겨진 하자 등)");
  }
  if (discountRate < 20) {
    risks.push("낮은 할인율로 인한 수익성 제한");
  }

  console.log("✅ [동적 핵심분석] 생성 완료:", { keyPoints, risks });
  return { keyPoints, risks };
}

// 매물별 동적 실전팁 생성 함수
function generateDynamicProTips(property: SimulationScenario): string[] {
  console.log("🔍 [동적 실전팁] 매물별 실전팁 생성:", property.id);

  const { basicInfo, rights, tenants, propertyDetails } = property;
  const hasComplexRights = rights && rights.length > 2;
  const hasTenants = tenants && tenants.length > 0;
  const hasSmallTenants = tenants && tenants.some((t) => t.isSmallTenant);
  const hasMultipleMortgages =
    rights && rights.filter((r) => r.rightType === "근저당권").length > 1;
  const isApartment = propertyDetails?.usage === "아파트";
  const isOffice = propertyDetails?.usage === "오피스텔";
  const isCommercial = propertyDetails?.usage === "상가";
  const discountRate = Math.round(
    (1 - (basicInfo.minimumBidPrice || 0) / (basicInfo.appraisalValue || 1)) *
      100
  );

  // 권리 유형별 특성 분석
  const rightTypes = rights?.map((r) => r.rightType) || [];
  const hasMortgage = rightTypes.includes("근저당권");
  const hasMortgageRight = rightTypes.includes("저당권");
  const hasSeizure =
    rightTypes.includes("압류") || rightTypes.includes("가압류");
  const hasPledge = rightTypes.includes("담보가등기");
  const hasChonse = rightTypes.includes("전세권");
  const hasOwnershipTransfer = rightTypes.includes("소유권이전청구권가등기");
  const hasInjunction = rightTypes.includes("가처분");
  const hasTenantRights = rightTypes.includes("주택상가임차권");
  const hasHousingTenantRights = rightTypes.includes("주택임차권");
  const hasCommercialTenantRights = rightTypes.includes("상가임차권");
  const hasLien = rightTypes.includes("유치권");
  const hasSurfaceRights = rightTypes.includes("법정지상권");
  const hasTombRights = rightTypes.includes("분묘기지권");

  const tips: string[] = [];

  // 매물 유형별 실전팁
  if (isApartment) {
    tips.push("아파트는 관리비와 입주민 규정을 꼼꼼히 확인하세요");
    tips.push("주차장 사용권과 대지권 비율을 확인하여 추가 비용을 파악하세요");
  } else if (isOffice) {
    tips.push(
      "오피스텔은 상업용 관리비가 일반 아파트보다 높으니 미리 확인하세요"
    );
    tips.push("용도변경 제한사항을 확인하여 활용 방안을 검토하세요");
  } else if (isCommercial) {
    tips.push("상가는 상권 분석과 유동인구 조사가 투자 성공의 핵심입니다");
    tips.push("임대료 수준과 용도변경 가능성을 현장에서 직접 확인하세요");
  }

  // 권리 유형별 실전팁
  if (hasSeizure) {
    tips.push("압류/가압류 해제를 위해 법원에 해제 신청을 제출하세요");
    tips.push("압류/가압류 해제 비용을 입찰가에 반영하세요");
  } else if (hasChonse) {
    tips.push(
      "전세권은 근저당권보다 우선순위가 높으니 전세금 반환 비용을 고려하세요"
    );
    tips.push("전세권 해제 시 전세권자와의 협의가 필요합니다");
  } else if (hasOwnershipTransfer) {
    tips.push("소유권이전청구권가등기의 본등기 가능성을 확인하세요");
    tips.push("권리자와의 협의를 통해 해제 가능성을 검토하세요");
  } else if (hasInjunction) {
    tips.push("가처분 해제를 위해 법원에 해제 신청을 제출하세요");
    tips.push("가처분의 목적과 효력을 정확히 파악하세요");
  } else if (hasLien) {
    tips.push("유치권의 대상물을 확인하고 반환 의무를 파악하세요");
    tips.push("유치권 해제 시 유치물 반환 절차를 준비하세요");
  } else if (hasSurfaceRights) {
    tips.push("법정지상권의 범위와 효력을 정확히 파악하세요");
    tips.push("지상권자와의 협의를 통해 해제 가능성을 검토하세요");
  } else if (hasTombRights) {
    tips.push("분묘의 위치와 범위를 확인하고 보존 의무를 파악하세요");
    tips.push("분묘기지권 해제 시 분묘 보존 방안을 준비하세요");
  } else if (hasMortgageRight) {
    tips.push("저당권의 우선순위와 배당 가능성을 정확히 파악하세요");
    tips.push("저당권 인수 시 채무 인수 의무와 비용을 미리 계산하세요");
  } else if (hasHousingTenantRights) {
    tips.push("주택임대차보호법에 따른 임차인 보호 범위를 확인하세요");
    tips.push("주택임차권 인수 시 임차인 보호 의무와 비용을 고려하세요");
  } else if (hasCommercialTenantRights) {
    tips.push("상가임대차보호법에 따른 임차인 보호 범위를 확인하세요");
    tips.push("상가임차권 인수 시 임차인 보호 의무와 비용을 고려하세요");
  } else if (hasMultipleMortgages) {
    tips.push(
      "다중 근저당권은 말소기준권리를 먼저 파악하고 배당순위를 확인하세요"
    );
    tips.push(
      "각 근저당권의 설정일자와 청구금액을 비교하여 인수 여부를 결정하세요"
    );
  } else if (hasComplexRights) {
    tips.push("다양한 권리 유형의 인수/소멸 여부를 명확히 파악하세요");
    tips.push("권리분석 전문가와 상담하여 정확한 분석을 받으세요");
  } else {
    tips.push("단순한 권리구조이므로 상대적으로 안전한 투자가 가능합니다");
  }

  // 임차인 관련 실전팁
  if (hasTenants) {
    const tenantCount = tenants?.length || 0;
    const totalDeposit = tenants?.reduce((sum, t) => sum + t.deposit, 0) || 0;
    tips.push(
      `임차인 ${tenantCount}명의 총 보증금 ${totalDeposit.toLocaleString(
        "ko-KR"
      )}원을 인수 비용으로 고려하세요`
    );

    if (hasSmallTenants) {
      const smallTenantCount =
        tenants?.filter((t) => t.isSmallTenant).length || 0;
      tips.push(
        `소액임차인 ${smallTenantCount}명의 우선변제 비용이 추가로 발생할 수 있습니다`
      );
    }
  } else {
    tips.push("임차인이 없는 깨끗한 매물로 즉시 입주 또는 재임대가 가능합니다");
  }

  // 할인율별 실전팁
  if (discountRate > 30) {
    tips.push("높은 할인율의 원인을 파악하여 숨겨진 하자가 없는지 확인하세요");
    tips.push("현장 답사를 통해 매물의 실제 상태를 직접 확인하세요");
  } else if (discountRate < 20) {
    tips.push(
      "낮은 할인율로 안전하지만 수익성을 고려한 입찰가 산정이 필요합니다"
    );
  } else {
    tips.push("적정 할인율로 균형잡힌 투자 기회입니다");
  }

  // 일반적인 실전팁
  tips.push("입찰 전 현장 답사를 통해 매물의 실제 상태를 확인하세요");
  tips.push("권리분석 전문가와 상담하여 정확한 분석을 받으세요");
  tips.push("충분한 자금을 확보하여 예상보다 높은 입찰가에 대비하세요");

  console.log("✅ [동적 실전팁] 생성 완료:", tips);
  return tips;
}

// 매물별 동적 상세리포트 생성 함수
function generateDynamicDetailedReport(property: SimulationScenario): {
  [key: string]: string;
} {
  console.log("🔍 [동적 상세리포트] 매물별 상세리포트 생성:", property.id);

  const { basicInfo, rights, tenants, propertyDetails } = property;
  const hasComplexRights = rights && rights.length > 2;
  const hasTenants = tenants && tenants.length > 0;
  const hasSmallTenants = tenants && tenants.some((t) => t.isSmallTenant);
  const hasMultipleMortgages =
    rights && rights.filter((r) => r.rightType === "근저당권").length > 1;
  const isApartment = propertyDetails?.usage === "아파트";
  const isOffice = propertyDetails?.usage === "오피스텔";
  const isCommercial = propertyDetails?.usage === "상가";
  const discountRate = Math.round(
    (1 - (basicInfo.minimumBidPrice || 0) / (basicInfo.appraisalValue || 1)) *
      100
  );

  // 권리 유형별 특성 분석
  const rightTypes = rights?.map((r) => r.rightType) || [];
  const hasMortgage = rightTypes.includes("근저당권");
  const hasMortgageRight = rightTypes.includes("저당권");
  const hasSeizure =
    rightTypes.includes("압류") || rightTypes.includes("가압류");
  const hasPledge = rightTypes.includes("담보가등기");
  const hasChonse = rightTypes.includes("전세권");
  const hasOwnershipTransfer = rightTypes.includes("소유권이전청구권가등기");
  const hasInjunction = rightTypes.includes("가처분");
  const hasTenantRights = rightTypes.includes("주택상가임차권");
  const hasHousingTenantRights = rightTypes.includes("주택임차권");
  const hasCommercialTenantRights = rightTypes.includes("상가임차권");
  const hasLien = rightTypes.includes("유치권");
  const hasSurfaceRights = rightTypes.includes("법정지상권");
  const hasTombRights = rightTypes.includes("분묘기지권");

  const report: { [key: string]: string } = {};

  // 매물 유형별 상세리포트
  if (isApartment) {
    report.apartment = `아파트 경매의 특성상 안정적인 투자가 가능하지만, 
    관리비와 입주민 규정을 꼼꼼히 확인해야 합니다. 
    주차장 사용권과 대지권 비율을 확인하여 추가 비용을 파악하고, 
    입주민 규정을 확인하여 사용 제한사항을 파악하세요.`;
  } else if (isOffice) {
    report.office = `오피스텔은 상업용 관리비가 일반 아파트보다 높으므로 
    관리비 부담을 미리 확인해야 합니다. 
    용도변경 제한사항을 확인하여 활용 방안을 검토하고, 
    임대수익률과 상권 분석이 투자 성공의 핵심입니다.`;
  } else if (isCommercial) {
    report.commercial = `상가는 상권 분석과 유동인구 조사가 투자 성공의 핵심입니다. 
    임대료 수준과 용도변경 가능성을 현장에서 직접 확인하고, 
    상권의 변화와 유동인구 패턴을 분석하여 투자 가치를 판단하세요.`;
  }

  // 권리 유형별 상세리포트
  if (hasSeizure) {
    report.seizure = `압류/가압류가 설정된 매물입니다. 
    압류/가압류의 설정일자와 청구금액을 확인하고, 
    강제집행 절차의 진행 상황을 파악해야 합니다. 
    압류/가압류 해제를 위해 법원에 해제 신청을 제출하고, 
    해제 비용을 입찰가에 반영해야 합니다.`;
  } else if (hasChonse) {
    report.chonse = `전세권이 설정된 매물입니다. 
    전세권의 설정일자와 전세금을 확인하고, 
    전세권의 우선순위를 파악해야 합니다 (근저당권보다 우선). 
    전세권 인수 시 전세금 반환 의무가 있으므로 전세금 반환 비용을 고려하고, 
    전세권 해제 시 전세권자와의 협의가 필요합니다.`;
  } else if (hasOwnershipTransfer) {
    report.ownershipTransfer = `소유권이전청구권가등기가 설정된 매물입니다. 
    소유권이전청구권의 설정일자와 청구금액을 확인하고, 
    가등기의 효력과 본등기 가능성을 검토해야 합니다. 
    소유권이전청구권의 우선순위를 파악하고, 
    권리자와의 협의를 통해 해제 가능성을 검토해야 합니다.`;
  } else if (hasInjunction) {
    report.injunction = `가처분이 설정된 매물입니다. 
    가처분의 설정일자와 청구금액을 확인하고, 
    가처분의 목적과 효력을 파악해야 합니다. 
    가처분 해제를 위해 법원에 해제 신청을 제출하고, 
    가처분의 목적에 따른 추가 제약사항을 고려해야 합니다.`;
  } else if (hasLien) {
    report.lien = `유치권이 설정된 매물입니다. 
    유치권의 설정일자와 청구금액을 확인하고, 
    유치권의 대상물과 효력을 파악해야 합니다. 
    유치권 인수 시 유치물 반환 의무가 있으므로 유치물 반환 절차를 준비하고, 
    유치권 해제 시 유치물 반환 절차를 준비해야 합니다.`;
  } else if (hasSurfaceRights) {
    report.surfaceRights = `법정지상권이 설정된 매물입니다. 
    법정지상권의 설정일자와 청구금액을 확인하고, 
    지상권의 범위와 효력을 파악해야 합니다. 
    지상권 인수 시 지상권자와의 협의가 필요하므로, 
    지상권자와의 협의를 통해 해제 가능성을 검토해야 합니다.`;
  } else if (hasTombRights) {
    report.tombRights = `분묘기지권이 설정된 매물입니다. 
    분묘기지권의 설정일자와 청구금액을 확인하고, 
    분묘의 위치와 범위를 파악해야 합니다. 
    분묘기지권 인수 시 분묘 보존 의무가 있으므로, 
    분묘기지권 해제 시 분묘 보존 방안을 준비해야 합니다.`;
  } else if (hasMortgageRight) {
    report.mortgageRight = `저당권이 설정된 매물입니다. 
    저당권의 설정일자와 청구금액을 확인하고, 
    저당권의 우선순위와 배당 가능성을 파악해야 합니다. 
    저당권 인수 시 채무 인수 의무가 있으므로, 
    저당권 해제 시 채무 인수 비용을 고려해야 합니다.`;
  } else if (hasHousingTenantRights) {
    report.housingTenantRights = `주택임차권이 설정된 매물입니다. 
    주택임차권의 설정일자와 청구금액을 확인하고, 
    주택임대차보호법에 따른 권리 보호 범위를 파악해야 합니다. 
    주택임차권 인수 시 임차인 보호 의무가 있으므로, 
    주택임차권 해제 시 임차인 보호 비용을 고려해야 합니다.`;
  } else if (hasCommercialTenantRights) {
    report.commercialTenantRights = `상가임차권이 설정된 매물입니다. 
    상가임차권의 설정일자와 청구금액을 확인하고, 
    상가임대차보호법에 따른 권리 보호 범위를 파악해야 합니다. 
    상가임차권 인수 시 임차인 보호 의무가 있으므로, 
    상가임차권 해제 시 임차인 보호 비용을 고려해야 합니다.`;
  } else if (hasMultipleMortgages) {
    report.mortgage = `다중 근저당권이 설정된 복잡한 권리구조입니다. 
    말소기준권리를 먼저 파악하고 배당순위를 확인해야 합니다. 
    각 근저당권의 설정일자와 청구금액을 비교하여 인수 여부를 결정하고, 
    권리분석 전문가와 상담하여 정확한 분석을 받으세요.`;
  } else if (hasComplexRights) {
    report.rights = `다양한 권리가 설정된 매물입니다. 
    각 권리의 인수/소멸 여부를 명확히 파악하고, 
    권리자별 청구금액과 배당 가능성을 검토해야 합니다. 
    권리분석 전문가와 상담하여 정확한 분석을 받으세요.`;
  } else {
    report.simple = `단순한 권리구조의 매물입니다. 
    근저당권 1개만 설정된 안전한 구조로 권리분석이 상대적으로 간단합니다. 
    입찰 시 권리 인수 부담이 최소화되어 상대적으로 안전한 투자가 가능합니다.`;
  }

  console.log("✅ [동적 상세리포트] 생성 완료:", report);
  return report;
}

// 단계별 가이드 제목 함수
function getStepTitle(stepKey: string): string {
  const titles: { [key: string]: string } = {
    step1: "권리분석 시작하기",
    step2: "임차인 현황 파악하기",
    step3: "입찰가 산정하기",
    step4: "리스크 체크",
  };

  return titles[stepKey] || stepKey;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { educationalProperties, devMode } = useSimulationStore();

  // 토글 상태 관리
  const [showRisks, setShowRisks] = useState(false);
  const [showProTips, setShowProTips] = useState(false);
  const [showLegalTerms, setShowLegalTerms] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState(false);
  const [showCoreAnalysis, setShowCoreAnalysis] = useState(false);
  const [showSpecification, setShowSpecification] = useState(false);
  const [activeTab, setActiveTab] = useState<"education">("education");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showAuctionAnalysisModal, setShowAuctionAnalysisModal] =
    useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [property, setProperty] = useState<SimulationScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightsAnalysis, setRightsAnalysis] = useState<any>(null);

  // 대기자 명단 제출 함수
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("📧 [경매리포트] 대기자 명단 제출:", waitlistForm);

      // submitWaitlist 함수를 사용하여 구글 시트에 저장
      const result = await submitWaitlist(
        waitlistForm.name,
        waitlistForm.email
      );

      if (result.success) {
        console.log("✅ [경매리포트] 구글 시트 저장 성공");
        alert("서비스가 정식출시되면 알려드리겠습니다. 감사합니다");
        setShowWaitlistModal(false);
        setWaitlistForm({ name: "", email: "" });
      } else {
        console.error("❌ [경매리포트] 구글 시트 저장 실패:", result.message);
        alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("❌ [경매리포트] 대기자 명단 제출 실패:", error);
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    console.log("매물 상세보기 페이지 로드:", propertyId);

    if (!propertyId) {
      setError("매물 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    const loadProperty = async () => {
      try {
        // 먼저 스토어에서 매물 찾기
        const foundProperty = educationalProperties.find(
          (p) => p.id === propertyId
        );

        if (foundProperty) {
          console.log("매물 정보 찾음:", foundProperty);
          setProperty(foundProperty);

          // ✅ 개발자 모드에서 엔진 실행
          if (devMode.isDevMode) {
            console.log("🔍 [개발자 모드] 엔진 실행");
            const snapshot = mapSimulationToSnapshot(foundProperty);
            const engineResult = auctionEngine({
              snapshot: snapshot as PropertySnapshot,
              userBidPrice: foundProperty.basicInfo.minimumBidPrice || 0,
              exitPriceHint: foundProperty.basicInfo.marketValue,
              options: { devMode: true, logPrefix: `🏛️ [LEGACY:${propertyId}]` },
            });
            setRightsAnalysis(engineResult);
            console.log("엔진 결과:", engineResult);
          }
        } else {
          console.log("매물을 찾을 수 없음, 새로 생성:", propertyId);
          // 매물을 찾을 수 없으면 새로 생성 (초급으로 생성)
          const newProperty = await generateProperty("초급");
          console.log("새로 생성된 매물:", newProperty);
          setProperty(newProperty);

          // ✅ 개발자 모드에서 엔진 실행
          if (devMode.isDevMode) {
            console.log("🔍 [개발자 모드] 엔진 실행");
            const snapshot = mapSimulationToSnapshot(newProperty);
            const engineResult = auctionEngine({
              snapshot: snapshot as PropertySnapshot,
              userBidPrice: newProperty.basicInfo.minimumBidPrice || 0,
              exitPriceHint: newProperty.basicInfo.marketValue,
              options: { devMode: true, logPrefix: `🏛️ [LEGACY:${propertyId}]` },
            });
            setRightsAnalysis(engineResult);
            console.log("엔진 결과:", engineResult);
          }
        }
      } catch (err) {
        console.error("매물 로드 실패:", err);
        setError("매물 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId, educationalProperties, devMode.isDevMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "매물을 찾을 수 없습니다"}
            </h1>
            <p className="text-gray-600 mb-6">
              요청하신 매물 정보를 불러올 수 없습니다.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { basicInfo, educationalContent } = property;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 max-w-6xl py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← 메인으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">매물 상세 정보</h1>
          <p className="text-gray-600 mt-2">
            경매 매물의 상세 정보와 교육 포인트를 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 매물 기본 정보 */}
          <div className="lg:col-span-2">
            {/* 사건 기본정보 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h2 className="text-xl font-bold">사건 기본정보</h2>
                <p className="text-black text-xs">조회수: 1,026</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">소재지</span>
                      <span className="font-medium text-right max-w-xs">
                        {basicInfo.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">경매 종류</span>
                      <span className="font-medium">
                        {basicInfo.auctionType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">물건 종류</span>
                      <span className="font-medium">
                        {basicInfo.propertyType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">경매 대상</span>
                      <span className="font-medium">토지 및 건물일괄매각</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">입찰 방법</span>
                      <span className="font-medium">
                        {basicInfo.biddingMethod}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">토지 면적</span>
                      <span className="font-medium">
                        {property.propertyDetails?.landAreaPyeong || 0}평
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">건물 면적</span>
                      <span className="font-medium">
                        {property.propertyDetails?.buildingAreaPyeong || 0}평
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">감정가</span>
                      <span className="font-bold text-blue-600">
                        {basicInfo.appraisalValue?.toLocaleString("ko-KR") ||
                          "0"}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">최저가</span>
                      <span className="font-bold text-red-600">
                        ↓{" "}
                        {Math.round(
                          (1 -
                            basicInfo.minimumBidPrice /
                              basicInfo.appraisalValue) *
                            100
                        )}
                        %{" "}
                        {basicInfo.minimumBidPrice?.toLocaleString("ko-KR") ||
                          "0"}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">입찰 보증금</span>
                      <span className="font-medium">
                        (10%){" "}
                        {Math.round(
                          (basicInfo.minimumBidPrice || 0) * 0.1
                        ).toLocaleString("ko-KR")}
                        원
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">채무/소유자</span>
                      <span className="font-medium">
                        {basicInfo.debtor} / {basicInfo.owner}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">채권자</span>
                      <span className="font-medium">{basicInfo.creditor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">청구 금액</span>
                      <span className="font-medium">
                        {basicInfo.claimAmount?.toLocaleString("ko-KR") || "0"}
                        원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 진행일정 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">진행 일정</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-900">경과</th>
                        <th className="text-left py-2 text-gray-900">진행</th>
                        <th className="text-left py-2 text-gray-900">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 text-gray-700">1일</td>
                        <td className="py-2 text-gray-700">경매 사건 접수</td>
                        <td className="py-2 text-gray-700">
                          {property.schedule?.caseFiledDate || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">6일</td>
                        <td className="py-2 text-gray-700">개시 결정일</td>
                        <td className="py-2 text-gray-700">
                          {property.schedule?.decisionDate || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">97일</td>
                        <td className="py-2 text-gray-700">배당 요구 종기일</td>
                        <td className="py-2 text-gray-700">
                          {property.schedule?.dividendDeadline || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">418일</td>
                        <td className="py-2 text-gray-700">최초 경매일</td>
                        <td className="py-2 text-gray-700">
                          {property.schedule?.firstAuctionDate || "정보 없음"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 매각일정 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">매각 일정</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-900 w-16">
                          경과
                        </th>
                        <th className="text-left py-2 text-gray-900 w-16">
                          회차
                        </th>
                        <th className="text-left py-2 text-gray-900 w-32">
                          매각기일
                        </th>
                        <th className="text-left py-2 text-gray-900 w-40">
                          최저가
                        </th>
                        <th className="text-left py-2 text-gray-900 w-20">
                          비율
                        </th>
                        <th className="text-left py-2 text-gray-900 w-24">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.biddingHistory?.map((bid, index) => (
                        <tr key={index}>
                          <td className="py-2 text-gray-700">
                            {bid.round === 1
                              ? "417일"
                              : bid.round === 2
                              ? "501일"
                              : bid.round === 3
                              ? "543일"
                              : bid.round === 4
                              ? "585일"
                              : "627일"}
                          </td>
                          <td className="py-2 text-gray-700">{bid.round}</td>
                          <td className="py-2 text-gray-700">
                            {new Date(bid.auctionDate).toLocaleDateString(
                              "ko-KR"
                            )}
                          </td>
                          <td className="py-2 text-gray-700">
                            {bid.minimumPrice.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2 text-gray-700">
                            {bid.priceRatio}%
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                bid.result === "진행"
                                  ? "bg-blue-100 text-blue-800"
                                  : bid.result === "유찰"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {bid.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 감정평가현황 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">감정 평가 현황</h3>
                <p className="text-black text-xs">
                  [감정원 : 경남감정 / 가격시점 : 2024.02.22]
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">목록</th>
                        <th className="text-left py-2">주소</th>
                        <th className="text-left py-2">구조/용도/대지권</th>
                        <th className="text-left py-2">면적</th>
                        <th className="text-left py-2">감정가</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">1</td>
                        <td className="py-2">{basicInfo.location}</td>
                        <td className="py-2">
                          {property.propertyDetails?.structure ||
                            "철근콘크리트조"}{" "}
                          / {property.propertyDetails?.usage || "아파트"}
                        </td>
                        <td className="py-2">
                          {property.propertyDetails?.landAreaPyeong || 0}평
                        </td>
                        <td className="py-2">
                          {basicInfo.appraisalValue?.toLocaleString("ko-KR") ||
                            "0"}
                          원
                        </td>
                        <td className="py-2 text-gray-600">
                          본건은 아파트로 현황은 거주용임
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 임차인현황 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">임차인 현황</h3>
                <p className="text-black text-xs">
                  [말소기준권리 : 2014. 8. 28.근저당권. 설정, 배당요구종기일 :
                  2024/05/14]
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      주택임대차보호법 기준
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                      상가임대차보호법 기준
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">임차인</th>
                        <th className="text-left py-2">용도/점유</th>
                        <th className="text-left py-2">전입일자</th>
                        <th className="text-left py-2">확정일자</th>
                        <th className="text-left py-2">배당요구일</th>
                        <th className="text-left py-2">보증금/월세</th>
                        <th className="text-left py-2">대항력</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.tenants?.map((tenant, index) => (
                        <tr key={tenant.id}>
                          <td className="py-2">{tenant.tenantName}</td>
                          <td className="py-2">본건전체</td>
                          <td className="py-2">{tenant.moveInDate}</td>
                          <td className="py-2">
                            {tenant.confirmationDate || "미상"}
                          </td>
                          <td className="py-2">X</td>
                          <td className="py-2">
                            {tenant.deposit.toLocaleString("ko-KR")}[월]
                            {tenant.monthlyRent.toLocaleString("ko-KR")}
                          </td>
                          <td className="py-2">
                            {tenant.hasDaehangryeok ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                O
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                X
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-sm text-gray-600">
                            {tenant.isSmallTenant ? "소액임차인 우선변제" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>매각물건명세서비고:</strong> 권리신고 없어
                    임대차관계 불분명
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>현황조사서기타:</strong> 현장에서 직원을 만나
                    서류제출 안내장을 주었으며 차후 서류는 제출한다고 하며 본건
                    임차관계내용은 전입세대열람내역 및 상가건물임대차현황서를
                    바탕으로 작성된 내용임
                  </p>
                </div>
              </div>
            </div>

            {/* 토지등기부 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">토지 등기부</h3>
                <p className="text-black text-xs">등기부상 권리 현황</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">순위</th>
                        <th className="text-left py-2">권리종류</th>
                        <th className="text-left py-2">권리자</th>
                        <th className="text-left py-2">등기일</th>
                        <th className="text-left py-2">청구금액</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.rights?.map((right, index) => (
                        <tr key={right.id}>
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                right.rightType === "근저당권"
                                  ? "bg-blue-100 text-blue-800"
                                  : right.rightType === "저당권"
                                  ? "bg-blue-100 text-blue-800"
                                  : right.rightType === "압류"
                                  ? "bg-red-100 text-red-800"
                                  : right.rightType === "가압류"
                                  ? "bg-orange-100 text-orange-800"
                                  : right.rightType === "담보가등기"
                                  ? "bg-purple-100 text-purple-800"
                                  : right.rightType === "전세권"
                                  ? "bg-green-100 text-green-800"
                                  : right.rightType === "소유권이전청구권가등기"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : right.rightType === "가처분"
                                  ? "bg-pink-100 text-pink-800"
                                  : right.rightType === "주택임차권"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : right.rightType === "상가임차권"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : right.rightType === "유치권"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : right.rightType === "법정지상권"
                                  ? "bg-teal-100 text-teal-800"
                                  : right.rightType === "분묘기지권"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {right.rightType}
                            </span>
                          </td>
                          <td className="py-2">{right.rightHolder}</td>
                          <td className="py-2">{right.registrationDate}</td>
                          <td className="py-2">
                            {right.claimAmount.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2">
                            {right.isMalsoBaseRight && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                말소기준권리
                              </span>
                            )}
                            {right.willBeAssumed && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                인수
                              </span>
                            )}
                            {right.willBeExtinguished && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                소멸
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 권리 유형별 설명 */}
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    권리 유형별 설명
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-100 rounded"></span>
                      <span>근저당권: 채권 담보</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-100 rounded"></span>
                      <span>저당권: 채권 담보</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-100 rounded"></span>
                      <span>압류: 강제집행</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-orange-100 rounded"></span>
                      <span>가압류: 임시보전</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-purple-100 rounded"></span>
                      <span>담보가등기: 담보설정</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-100 rounded"></span>
                      <span>전세권: 전세금 담보</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-indigo-100 rounded"></span>
                      <span>소유권이전청구권가등기</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-pink-100 rounded"></span>
                      <span>가처분: 임시처분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-cyan-100 rounded"></span>
                      <span>주택임차권: 주택 임차</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-cyan-100 rounded"></span>
                      <span>상가임차권: 상가 임차</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-yellow-100 rounded"></span>
                      <span>유치권: 유치물권</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-teal-100 rounded"></span>
                      <span>법정지상권: 법정권리</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-100 rounded"></span>
                      <span>분묘기지권: 분묘권리</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 예상배당표 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">예상배당표</h3>
                <p className="text-black text-xs">
                  경매 매각대금 배당 순서 및 예상 금액
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>매각대금:</strong>{" "}
                    {basicInfo.minimumBidPrice?.toLocaleString("ko-KR") || "0"}
                    원 (최저가 기준)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">순위</th>
                        <th className="text-left py-2">권리자</th>
                        <th className="text-left py-2">권리종류</th>
                        <th className="text-left py-2">청구금액</th>
                        <th className="text-left py-2">예상배당</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.rights?.map((right, index) => (
                        <tr key={right.id}>
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">{right.rightHolder}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                right.rightType === "근저당권"
                                  ? "bg-blue-100 text-blue-800"
                                  : right.rightType === "저당권"
                                  ? "bg-blue-100 text-blue-800"
                                  : right.rightType === "압류"
                                  ? "bg-red-100 text-red-800"
                                  : right.rightType === "가압류"
                                  ? "bg-orange-100 text-orange-800"
                                  : right.rightType === "담보가등기"
                                  ? "bg-purple-100 text-purple-800"
                                  : right.rightType === "전세권"
                                  ? "bg-green-100 text-green-800"
                                  : right.rightType === "소유권이전청구권가등기"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : right.rightType === "가처분"
                                  ? "bg-pink-100 text-pink-800"
                                  : right.rightType === "주택임차권"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : right.rightType === "상가임차권"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : right.rightType === "유치권"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : right.rightType === "법정지상권"
                                  ? "bg-teal-100 text-teal-800"
                                  : right.rightType === "분묘기지권"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {right.rightType}
                            </span>
                          </td>
                          <td className="py-2">
                            {right.claimAmount.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2 font-bold text-green-600">
                            {right.willBeAssumed
                              ? right.claimAmount.toLocaleString("ko-KR") + "원"
                              : "0원"}
                          </td>
                          <td className="py-2">
                            {right.willBeAssumed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                배당
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                소멸
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* 임차인 우선변제 */}
                      {property.tenants
                        ?.filter((t) => t.isSmallTenant)
                        .map((tenant, index) => (
                          <tr
                            key={`tenant-${tenant.id}`}
                            className="bg-yellow-50"
                          >
                            <td className="py-2">-</td>
                            <td className="py-2">{tenant.tenantName}</td>
                            <td className="py-2">소액임차인</td>
                            <td className="py-2">
                              {tenant.priorityPaymentAmount.toLocaleString(
                                "ko-KR"
                              )}
                              원
                            </td>
                            <td className="py-2 font-bold text-yellow-600">
                              {tenant.priorityPaymentAmount.toLocaleString(
                                "ko-KR"
                              )}
                              원
                            </td>
                            <td className="py-2">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                우선변제
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>참고:</strong> 실제 배당은 매각대금에 따라 달라질 수
                    있습니다. 소액임차인은 우선변제를 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 지역분석 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-100 text-black px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">지역분석</h3>
                <p className="text-black text-xs">
                  관할 법원, 등기소, 세무서 정보
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 법원 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      법원
                    </h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.court.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ({property.regionalAnalysis.court.code})
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {property.regionalAnalysis.court.address}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">입찰시작시간:</span>{" "}
                          {property.regionalAnalysis.court.biddingStartTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">입찰마감시간:</span>{" "}
                          {property.regionalAnalysis.court.biddingEndTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">개찰시간:</span>{" "}
                          {property.regionalAnalysis.court.openingTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.court.phone}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {property.regionalAnalysis.court.jurisdiction}
                      </p>
                    </div>
                  </div>

                  {/* 등기소 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      등기소
                    </h4>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.registry.name}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.registry.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">팩스:</span>{" "}
                          {property.regionalAnalysis.registry.fax}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {property.regionalAnalysis.registry.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 세무서 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      세무서
                    </h4>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.taxOffice.name}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.taxOffice.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">팩스:</span>{" "}
                          {property.regionalAnalysis.taxOffice.fax}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {property.regionalAnalysis.taxOffice.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 외부 링크 */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    관련 링크
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {property.regionalAnalysis.externalLinks.map(
                      (link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
                        >
                          <div className="text-sm font-medium text-gray-700">
                            {link.name}
                          </div>
                        </a>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => {
                    console.log("📚 [교육포인트] 탭 클릭");
                    setActiveTab("education");
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium relative transition-all duration-300 ease-in-out transform text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  style={{
                    transform: "translateY(0)",
                  }}
                >
                  📚 교육 포인트
                </button>
              </div>
            </div>

            {/* 교육 포인트 탭 */}
            {activeTab === "education" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📚 교육 포인트
                </h3>

                {/* 매물별 교육포인트 간략 설명 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="text-blue-600 mr-2">💡</span>이 매물의 핵심
                    학습 포인트
                  </h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    {property && (
                      <>
                        {/* 매물 유형별 핵심 포인트 */}
                        {property.propertyDetails?.usage === "아파트" && (
                          <p>
                            <strong>아파트 경매:</strong> 안정적인 투자 매물로,
                            관리비와 입주민 규정을 꼼꼼히 확인해야 합니다.
                          </p>
                        )}
                        {property.propertyDetails?.usage === "오피스텔" && (
                          <p>
                            <strong>오피스텔 경매:</strong> 상업용 관리비와
                            용도변경 제한사항을 반드시 검토해야 합니다.
                          </p>
                        )}
                        {property.propertyDetails?.usage === "상가" && (
                          <p>
                            <strong>상가 경매:</strong> 상권 분석과 임대수익률을
                            중점적으로 검토해야 합니다.
                          </p>
                        )}

                        {/* 권리 복잡도에 따른 포인트 */}
                        {property.rights && property.rights.length > 2 && (
                          <p>
                            <strong>복잡한 권리구조:</strong> 다중 근저당권이나
                            다양한 권리가 설정되어 있어 신중한 분석이
                            필요합니다.
                          </p>
                        )}

                        {/* 임차인 관련 포인트 */}
                        {property.tenants && property.tenants.length > 0 && (
                          <p>
                            <strong>임차인 인수:</strong>{" "}
                            {property.tenants.length}명의 임차인이 거주 중이어서
                            인수 비용을 고려해야 합니다.
                            {property.tenants.some((t) => t.isSmallTenant) &&
                              " 특히 소액임차인 우선변제로 인한 추가 비용이 발생할 수 있습니다."}
                          </p>
                        )}

                        {/* 할인율에 따른 포인트 */}
                        {(() => {
                          const discountRate = Math.round(
                            (1 -
                              (property.basicInfo.minimumBidPrice || 0) /
                                (property.basicInfo.appraisalValue || 1)) *
                              100
                          );
                          if (discountRate > 30) {
                            return (
                              <p>
                                <strong>높은 할인율:</strong> {discountRate}%의
                                높은 할인율로 투자 기회가 좋지만, 숨겨진
                                리스크가 있을 수 있습니다.
                              </p>
                            );
                          } else if (discountRate < 20) {
                            return (
                              <p>
                                <strong>낮은 할인율:</strong> {discountRate}%의
                                낮은 할인율로 안전하지만 수익성은 제한적일 수
                                있습니다.
                              </p>
                            );
                          } else {
                            return (
                              <p>
                                <strong>적정 할인율:</strong> {discountRate}%의
                                적정 할인율로 균형잡힌 투자 기회입니다.
                              </p>
                            );
                          }
                        })()}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 매각물건명세 */}
                  <div>
                    <button
                      onClick={() => setShowSpecification(!showSpecification)}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        📋 매각물건명세서
                      </h4>
                      <span className="text-gray-600">
                        {showSpecification ? "▲" : "▼"}
                      </span>
                    </button>
                    {showSpecification && (
                      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">🚧</div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            서비스 준비중 입니다
                          </h4>
                          <p className="text-gray-600 text-sm">
                            매각물건명세 기능은 현재 개발 중입니다.
                            <br />곧 만나보실 수 있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 매물별 맞춤 가이드 */}
                  <div>
                    <button
                      onClick={() => setShowStepGuide(!showStepGuide)}
                      className="flex items-center justify-between w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        📋 매물별 맞춤 가이드
                      </h4>
                      <span className="text-yellow-600">
                        {showStepGuide ? "▲" : "▼"}
                      </span>
                    </button>
                    {showStepGuide && (
                      <div className="mt-3 space-y-2">
                        {Object.entries(
                          educationalContent?.stepByStepGuide ||
                            generateDynamicStepGuide(property)
                        ).map(([key, value], index) => (
                          <div
                            key={key}
                            className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r"
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">
                              {index + 1}단계: {getStepTitle(key)}
                            </p>
                            <p className="text-xs text-gray-600 whitespace-pre-line">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 핵심 분석 */}
                  <div>
                    <button
                      onClick={() => setShowCoreAnalysis(!showCoreAnalysis)}
                      className="flex items-center justify-between w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        🔍 핵심 분석
                      </h4>
                      <span className="text-blue-600">
                        {showCoreAnalysis ? "▲" : "▼"}
                      </span>
                    </button>
                    {showCoreAnalysis && (
                      <div className="mt-3 space-y-2">
                        {(
                          educationalContent?.coreAnalysis?.keyPoints ||
                          generateDynamicCoreAnalysis(property).keyPoints
                        ).map((point, index) => (
                          <div
                            key={index}
                            className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r"
                          >
                            <p className="text-sm text-gray-700 font-medium">
                              {point}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 예상 리스크 */}
                  <div>
                    <button
                      onClick={() => setShowRisks(!showRisks)}
                      className="flex items-center justify-between w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        ⚠️ 예상 리스크
                      </h4>
                      <span className="text-red-600">
                        {showRisks ? "▲" : "▼"}
                      </span>
                    </button>
                    {showRisks && (
                      <div className="mt-3 space-y-2">
                        {(
                          educationalContent?.coreAnalysis?.risks ||
                          generateDynamicCoreAnalysis(property).risks
                        ).map((risk, index) => (
                          <div
                            key={index}
                            className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r"
                          >
                            <p className="text-sm text-gray-700 font-medium">
                              {risk}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 실전 팁 */}
                  <div>
                    <button
                      onClick={() => setShowProTips(!showProTips)}
                      className="flex items-center justify-between w-full p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">🎯 실전 팁</h4>
                      <span className="text-indigo-600">
                        {showProTips ? "▲" : "▼"}
                      </span>
                    </button>
                    {showProTips && (
                      <div className="mt-3 space-y-2">
                        {(
                          educationalContent?.proTips ||
                          generateDynamicProTips(property)
                        ).map((tip, index) => (
                          <div
                            key={index}
                            className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r"
                          >
                            <p className="text-sm text-gray-700 font-medium">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="block w-full px-4 py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                다른 매물 보기
              </Link>
            </div>
          </div>
        </div>

        {/* 대기자 명단 수집 모달 */}
        {showWaitlistModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📊 경매분석 리포트
                  </h3>
                  <button
                    onClick={() => setShowWaitlistModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    경매분석 리포트는 현재 개발 중입니다.
                    <br />
                    <strong>서비스가 정식출시되면 알려드리겠습니다.</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    아래 정보를 입력해주시면 출시 시 가장 먼저 알려드리겠습니다.
                  </p>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={waitlistForm.name}
                      onChange={(e) =>
                        setWaitlistForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="홍길동"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      이메일 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={waitlistForm.email}
                      onChange={(e) =>
                        setWaitlistForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWaitlistModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "제출 중..." : "알림 신청"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 경매분석 상세 리포트 팝업 모달 */}
        <AuctionAnalysisModal
          isOpen={showAuctionAnalysisModal}
          onClose={() => setShowAuctionAnalysisModal(false)}
          property={property}
        />
      </div>
    </div>
  );
}
