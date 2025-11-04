/**
 * Bid Master AI - Auction Engine v0.2 스모크 테스트
 * 
 * 목적: Phase 9 스모크 테스트 실행
 * - 다양한 매물유형 테스트 (아파트, 오피스텔, 근린주택 등)
 * - 다양한 권리유형 테스트 (근저당권, 담보가등기, 상가임차권 등)
 * - 위험 배지 생성 확인
 * - 0원 방지 레이어 동작 확인
 * - devMode 로그 확인
 * 
 * 실행 방법:
 * - Node.js 환경: `tsx src/lib/test/smoke-test.ts`
 * - 또는 Next.js 프로젝트에서 import하여 사용
 * 
 * 참조 문서: docs/auction-engine-v0.2.md 11절
 */

import { auctionEngine } from "@/lib/auction-engine";
import type { EngineInput } from "@/types/auction";
import type { PropertyTypeKorean } from "@/lib/constants.auction";

// ============================================
// 테스트 헬퍼 함수
// ============================================

function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}

function printTestHeader(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`🧪 ${title}`);
  console.log("=".repeat(80));
}

function printTestResult(result: any, testName: string) {
  console.log(`\n✅ ${testName} 테스트 완료`);
  console.log("📊 주요 결과:");
  console.log(`   - FMV: ${formatNumber(result.valuation.fmv)}원`);
  console.log(`   - 총인수금액: ${formatNumber(result.costs.totalAcquisition)}원`);
  console.log(`   - 안전마진 (FMV 기준): ${(result.safety.fmv.rate * 100).toFixed(2)}%`);
  console.log(`   - 위험 배지: [${result.riskFlags.join(", ") || "없음"}]`);
  console.log(`   - 엔진 버전: ${result.meta.engineVersion}`);
  console.log(`   - 인수권리금액: ${formatNumber(result.rights.assumedRightsAmount)}원`);
  
  if (result.riskFlags.length > 0) {
    console.log(`\n⚠️  위험 배지 상세:`);
    result.riskFlags.forEach((flag: string) => {
      console.log(`   - ${flag}`);
    });
  }
  
  if (result.rights.rightFindings.length > 0) {
    console.log(`\n⚖️  권리 판정:`);
    result.rights.rightFindings.forEach((f: any) => {
      console.log(`   - ${f.type}: ${f.disposition} (인수금액: ${formatNumber(f.amountAssumed)}원)`);
    });
  }
  
  if (result.rights.tenantFindings.length > 0) {
    console.log(`\n🏠 임차인 판정:`);
    result.rights.tenantFindings.forEach((f: any) => {
      console.log(`   - ${f.kind}: ${f.assumed ? "인수" : "소멸"} (인수금액: ${formatNumber(f.depositAssumed)}원)`);
    });
  }
}

// ============================================
// 테스트 케이스 1: 기본 샘플 (문서 11절 참고)
// ============================================

function testCase1_BasicSample() {
  printTestHeader("테스트 케이스 1: 기본 샘플 (근린주택 + 다양한 권리)");

  const snapshot = {
    caseId: "2025타경-0001",
    propertyType: "근린주택" as PropertyTypeKorean,
    appraisal: 900_000_000,
    minBid: 720_000_000,
    rights: [
      { id: "r1", type: "근저당권", amount: 300_000_000, rankOrder: 2, establishedAt: "2022-03-01" },
      { id: "r2", type: "담보가등기", amount: 80_000_000, rankOrder: 1, establishedAt: "2021-11-11" },
      { id: "r3", type: "예고등기" },
      { id: "r4", type: "상가임차권", amount: 50_000_000, rankOrder: 3 },
    ],
    tenants: [
      { id: "t1", type: "상가임차권", deposit: 50_000_000, hasOpposability: true },
      { id: "t2", type: "주택임차권", deposit: 30_000_000, moveInDate: "2023-01-10" },
    ],
  };

  const out = auctionEngine({
    snapshot: snapshot as any,
    userBidPrice: 760_000_000,
    options: { devMode: true, logPrefix: "🧪 [TEST-1]" },
  });

  printTestResult(out, "기본 샘플");
  
  // 검증
  console.log("\n🔍 검증:");
  console.log(`   ✓ 위험 배지 포함 여부: ${out.riskFlags.length > 0 ? "포함됨" : "없음"}`);
  console.log(`   ✓ 인수권리금액 0원 방지: ${out.rights.assumedRightsAmount > 0 ? "적용됨" : "0원 발견!"}`);
  console.log(`   ✓ 엔진 버전: ${out.meta.engineVersion === "v0.2" ? "정상" : "오류"}`);
  
  return out;
}

// ============================================
// 테스트 케이스 2: 다양한 매물유형 테스트
// ============================================

function testCase2_PropertyTypes() {
  printTestHeader("테스트 케이스 2: 다양한 매물유형 테스트");

  const propertyTypes: PropertyTypeKorean[] = [
    "아파트",
    "오피스텔",
    "단독주택",
    "근린주택",
  ];

  const results: any[] = [];

  propertyTypes.forEach((propertyType) => {
    console.log(`\n📦 매물유형: ${propertyType}`);
    
    const snapshot = {
      caseId: `2025타경-${propertyType}`,
      propertyType,
      appraisal: 800_000_000,
      minBid: 640_000_000,
      rights: [
        { id: "r1", type: "근저당권", amount: 200_000_000, rankOrder: 1 },
      ],
      tenants: [],
    };

    const out = auctionEngine({
      snapshot: snapshot as any,
      userBidPrice: 700_000_000,
      options: { devMode: false }, // 로그 생략
    });

    console.log(`   - FMV: ${formatNumber(out.valuation.fmv)}원`);
    console.log(`   - 총인수금액: ${formatNumber(out.costs.totalAcquisition)}원`);
    console.log(`   - 안전마진: ${(out.safety.fmv.rate * 100).toFixed(2)}%`);
    
    results.push({ propertyType, result: out });
  });

  return results;
}

// ============================================
// 테스트 케이스 3: 다양한 권리유형 테스트
// ============================================

function testCase3_RightTypes() {
  printTestHeader("테스트 케이스 3: 다양한 권리유형 테스트");

  const testCases = [
    {
      name: "근저당권 (담보성 권리)",
      rights: [
        { id: "r1", type: "근저당권", amount: 300_000_000, rankOrder: 1 },
      ],
      expectedFlags: [] as string[],
    },
    {
      name: "담보가등기 (담보성 권리)",
      rights: [
        { id: "r1", type: "담보가등기", amount: 100_000_000, rankOrder: 1 },
      ],
      expectedFlags: [] as string[],
    },
    {
      name: "압류 (소유권분쟁)",
      rights: [
        { id: "r1", type: "압류", amount: 50_000_000, rankOrder: 1 },
      ],
      expectedFlags: ["소유권분쟁"] as string[],
    },
    {
      name: "가등기 (소유권분쟁)",
      rights: [
        { id: "r1", type: "가등기", rankOrder: 1 },
      ],
      expectedFlags: ["소유권분쟁"] as string[],
    },
    {
      name: "유치권 (위험 권리)",
      rights: [
        { id: "r1", type: "유치권", amount: 30_000_000, rankOrder: 1 },
      ],
      expectedFlags: ["유치권"] as string[],
    },
    {
      name: "법정지상권 (위험 권리)",
      rights: [
        { id: "r1", type: "법정지상권", rankOrder: 1 },
      ],
      expectedFlags: ["법정지상권"] as string[],
    },
    {
      name: "분묘기지권 (위험 권리)",
      rights: [
        { id: "r1", type: "분묘기지권", rankOrder: 1 },
      ],
      expectedFlags: ["분묘"] as string[],
    },
  ];

  const results: any[] = [];

  testCases.forEach((testCase) => {
    console.log(`\n⚖️  ${testCase.name}`);
    
    const snapshot = {
      caseId: `2025타경-${testCase.name}`,
      propertyType: "아파트" as PropertyTypeKorean,
      appraisal: 500_000_000,
      minBid: 400_000_000,
      rights: testCase.rights,
      tenants: [],
    };

    const out = auctionEngine({
      snapshot: snapshot as any,
      userBidPrice: 450_000_000,
      options: { devMode: false },
    });

    const hasExpectedFlags = testCase.expectedFlags.every((flag) =>
      out.riskFlags.includes(flag)
    );
    
    console.log(`   - 위험 배지: [${out.riskFlags.join(", ") || "없음"}]`);
    console.log(`   - 예상 배지 일치: ${hasExpectedFlags ? "✓" : "✗"}`);
    console.log(`   - disposition: ${out.rights.rightFindings[0]?.disposition || "N/A"}`);
    
    results.push({ testCase, result: out, hasExpectedFlags });
  });

  return results;
}

// ============================================
// 테스트 케이스 4: 위험 배지 생성 확인
// ============================================

function testCase4_RiskFlags() {
  printTestHeader("테스트 케이스 4: 위험 배지 생성 확인");

  const testCases = [
    {
      name: "상가임차권 (상가임차 배지)",
      tenants: [
        { id: "t1", type: "상가임차권", deposit: 50_000_000, hasOpposability: true },
      ],
      expectedFlags: ["상가임차"] as string[],
    },
    {
      name: "임차다수 (3명 이상)",
      tenants: [
        { id: "t1", type: "주택임차권", deposit: 30_000_000 },
        { id: "t2", type: "주택임차권", deposit: 25_000_000 },
        { id: "t3", type: "주택임차권", deposit: 20_000_000 },
      ],
      expectedFlags: ["임차다수"] as string[],
    },
    {
      name: "소유권분쟁 (가등기 + 압류)",
      rights: [
        { id: "r1", type: "가등기", rankOrder: 1 },
        { id: "r2", type: "압류", amount: 50_000_000, rankOrder: 2 },
      ],
      tenants: [],
      expectedFlags: ["소유권분쟁"] as string[],
    },
    {
      name: "복합 위험 (유치권 + 법정지상권 + 분묘)",
      rights: [
        { id: "r1", type: "유치권", amount: 30_000_000, rankOrder: 1 },
        { id: "r2", type: "법정지상권", rankOrder: 2 },
        { id: "r3", type: "분묘기지권", rankOrder: 3 },
      ],
      tenants: [],
      expectedFlags: ["유치권", "법정지상권", "분묘"] as string[],
    },
  ];

  const results: any[] = [];

  testCases.forEach((testCase) => {
    console.log(`\n⚠️  ${testCase.name}`);
    
    const snapshot = {
      caseId: `2025타경-${testCase.name}`,
      propertyType: "아파트" as PropertyTypeKorean,
      appraisal: 500_000_000,
      minBid: 400_000_000,
      rights: testCase.rights || [],
      tenants: testCase.tenants || [],
    };

    const out = auctionEngine({
      snapshot: snapshot as any,
      userBidPrice: 450_000_000,
      options: { devMode: false },
    });

    const hasExpectedFlags = testCase.expectedFlags.every((flag) =>
      out.riskFlags.includes(flag)
    );
    
    console.log(`   - 위험 배지: [${out.riskFlags.join(", ") || "없음"}]`);
    console.log(`   - 예상 배지 일치: ${hasExpectedFlags ? "✓" : "✗"}`);
    console.log(`   - 예상 배지: [${testCase.expectedFlags.join(", ")}]`);
    
    results.push({ testCase, result: out, hasExpectedFlags });
  });

  return results;
}

// ============================================
// 테스트 케이스 5: 0원 방지 레이어 동작 확인
// ============================================

function testCase5_ZeroPrevention() {
  printTestHeader("테스트 케이스 5: 0원 방지 레이어 동작 확인");

  const testCases = [
    {
      name: "권리 없음 + 임차인 없음 (0원 방지 필요)",
      snapshot: {
        caseId: "2025타경-ZERO1",
        propertyType: "아파트" as PropertyTypeKorean,
        appraisal: 500_000_000,
        minBid: 400_000_000,
        rights: [],
        tenants: [],
      },
      shouldHaveFallback: true,
    },
    {
      name: "권리 금액 없음 + 임차인 없음 (0원 방지 필요)",
      snapshot: {
        caseId: "2025타경-ZERO2",
        propertyType: "아파트" as PropertyTypeKorean,
        appraisal: 500_000_000,
        minBid: 400_000_000,
        rights: [
          { id: "r1", type: "예고등기", rankOrder: 1 }, // 금액 없음
        ],
        tenants: [],
      },
      shouldHaveFallback: true,
    },
    {
      name: "권리 있음 + 임차인 없음 (0원 방지 불필요)",
      snapshot: {
        caseId: "2025타경-ZERO3",
        propertyType: "아파트" as PropertyTypeKorean,
        appraisal: 500_000_000,
        minBid: 400_000_000,
        rights: [
          { id: "r1", type: "근저당권", amount: 100_000_000, rankOrder: 1 },
        ],
        tenants: [],
      },
      shouldHaveFallback: false,
    },
  ];

  const results: any[] = [];

  testCases.forEach((testCase) => {
    console.log(`\n🔒 ${testCase.name}`);
    
    const out = auctionEngine({
      snapshot: testCase.snapshot as any,
      userBidPrice: 450_000_000,
      options: { devMode: true, logPrefix: "🧪 [ZERO-TEST]" },
    });

    const hasFallback = out.rights.assumedRightsAmount > 0;
    const isCorrect = testCase.shouldHaveFallback ? hasFallback : true;
    
    console.log(`   - 인수권리금액: ${formatNumber(out.rights.assumedRightsAmount)}원`);
    console.log(`   - 0원 방지 적용: ${hasFallback ? "✓" : "✗ (0원 발견!)"}`);
    console.log(`   - 예상 동작: ${testCase.shouldHaveFallback ? "0원 방지 필요" : "정상 계산"}`);
    console.log(`   - 검증 결과: ${isCorrect ? "✓ 통과" : "✗ 실패"}`);
    
    if (out.rights.notes) {
      const zeroNote = out.rights.notes.find((n: string) => n.includes("Fallback") || n.includes("0원"));
      if (zeroNote) {
        console.log(`   - Fallback 메시지: ${zeroNote}`);
      }
    }
    
    results.push({ testCase, result: out, hasFallback, isCorrect });
  });

  return results;
}

// ============================================
// 테스트 케이스 6: devMode 로그 확인
// ============================================

function testCase6_DevModeLogging() {
  printTestHeader("테스트 케이스 6: devMode 로그 확인");

  console.log("\n📝 devMode 활성화 테스트:");
  
  const snapshot = {
    caseId: "2025타경-DEV1",
    propertyType: "아파트" as PropertyTypeKorean,
    appraisal: 500_000_000,
    minBid: 400_000_000,
    rights: [
      { id: "r1", type: "근저당권", amount: 100_000_000, rankOrder: 1 },
    ],
    tenants: [],
  };

  console.log("\n✅ devMode: true (로그 출력 예상)");
  const out1 = auctionEngine({
    snapshot: snapshot as any,
    userBidPrice: 450_000_000,
    options: { devMode: true, logPrefix: "🧪 [DEV-TEST]" },
  });

  console.log("\n✅ devMode: false (로그 미출력 예상)");
  const out2 = auctionEngine({
    snapshot: snapshot as any,
    userBidPrice: 450_000_000,
    options: { devMode: false },
  });

  console.log("\n✅ devMode: undefined (로그 미출력 예상)");
  const out3 = auctionEngine({
    snapshot: snapshot as any,
    userBidPrice: 450_000_000,
    options: undefined,
  });

  return { out1, out2, out3 };
}

// ============================================
// 메인 테스트 실행 함수
// ============================================

export function runSmokeTests() {
  console.log("\n" + "🚀".repeat(40));
  console.log("Bid Master AI - Auction Engine v0.2 스모크 테스트 시작");
  console.log("🚀".repeat(40));

  const startTime = Date.now();

  try {
    // 테스트 케이스 실행
    const result1 = testCase1_BasicSample();
    const result2 = testCase2_PropertyTypes();
    const result3 = testCase3_RightTypes();
    const result4 = testCase4_RiskFlags();
    const result5 = testCase5_ZeroPrevention();
    const result6 = testCase6_DevModeLogging();

    // 결과 요약
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(80));
    console.log("📊 테스트 결과 요약");
    console.log("=".repeat(80));
    console.log(`총 실행 시간: ${duration}초`);
    console.log(`테스트 케이스 수: 6개`);
    console.log(`\n✅ 모든 테스트 완료!`);

    return {
      success: true,
      duration,
      results: {
        basic: result1,
        propertyTypes: result2,
        rightTypes: result3,
        riskFlags: result4,
        zeroPrevention: result5,
        devMode: result6,
      },
    };
  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// 실행 방법
// ============================================
// 
// 브라우저에서 실행:
// - src/app/test-smoke/page.tsx 페이지에서 "테스트 실행" 버튼 클릭
// - 또는 브라우저 콘솔에서: import('./test/smoke-test').then(m => m.runSmokeTests())
//
// Node.js에서 실행:
// - tsx src/lib/test/smoke-test.ts
// - 또는: node -r tsx/register src/lib/test/smoke-test.ts

