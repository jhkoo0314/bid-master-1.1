/**
 * Bid Master AI - OpenAI 클라이언트
 * AI를 통한 가상 경매 매물 생성
 *
 * 핵심 로그: AI 생성 시작/완료, 토큰 사용량 등
 */

import OpenAI from "openai";
import {
  DifficultyLevel,
  SimulationScenario,
  RightRecord,
  TenantRecord,
} from "@/types/simulation";
import { v4 as uuidv4 } from "uuid";

// OpenAI 클라이언트 초기화 (개발 모드에서는 API 키 없이도 작동)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-dev",
});

// 개발 모드 체크 함수
function isDevelopmentMode(): boolean {
  return (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "dummy-key-for-dev" ||
    process.env.NODE_ENV === "development"
  );
}

// 더미 데이터 생성 함수
function generateDummyData(difficulty: DifficultyLevel): any {
  return {
    caseNumber: `2025타경${Math.floor(Math.random() * 90000) + 10000}`,
    court: "서울중앙지방법원 경매1계",
    propertyType: "아파트",
    location: "서울특별시 강남구 테헤란로 123",
    locationShort: "서울 강남구",
    appraisalValue: 1200000000,
    minimumBidPrice: 960000000,
    bidDeposit: 96000000,
    claimAmount: 800000000,
    debtor: "김철수",
    owner: "김철수",
    creditor: "국민은행",
    auctionType: "부동산임의경매",
    biddingMethod: "기일입찰",
    status: "진행",
    daysUntilBid: 15,
    propertyDetails: {
      landArea: 85.5,
      landAreaPyeong: 25.8,
      buildingArea: 84.2,
      buildingAreaPyeong: 25.5,
      buildingType: "25평형",
      structure: "철근콘크리트조",
      usage: "아파트",
      floor: "15층",
    },
    schedule: {
      caseFiledDate: "2025-01-15",
      decisionDate: "2025-01-20",
      dividendDeadline: "2025-04-20",
      firstAuctionDate: "2025-09-15",
      currentAuctionDate: "2025-10-15",
    },
    biddingHistory: [
      {
        round: 1,
        auctionDate: "2025-09-15",
        minimumPrice: 1200000000,
        priceRatio: 100,
        result: "유찰",
      },
    ],
    rights: [
      {
        id: "right-1",
        registrationDate: "2016-11-22",
        rightType: "근저당권",
        rightHolder: "국민은행",
        claimAmount: 800000000,
        priority: 1,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      },
    ],
    tenants: [
      {
        id: "tenant-1",
        tenantName: "이영희",
        deposit: 50000000,
        monthlyRent: 0,
        moveInDate: "2020-03-15",
        confirmationDate: "2020-03-15",
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      },
    ],
    similarSales: [
      {
        saleDate: "2025-08-15",
        similarSize: "25평형",
        appraisalValue: 1200000000,
        salePrice: 1150000000,
        salePriceRatio: 95.8,
        location: "서울 강남구 테헤란로 125",
      },
    ],
    educationalContent: {
      difficulty: difficulty,
      oneLiner: "근저당권 1개, 임차인 없는 깔끔한 매물",
      coreAnalysis: {
        learningGoal: "근저당권 소멸 원리 이해",
        keyPoints: ["근저당권 소멸", "깨끗한 매물", "입찰 전략"],
        risks: ["권리분석 오류", "가격 산정 실수"],
        strategy: "감정가의 80% 수준에서 입찰",
      },
      stepByStepGuide: {
        step1: "근저당권 현황 파악하기",
        step2: "임차인 현황 확인하기",
        step3: "입찰가 산정하기",
        step4: "리스크 체크하기",
      },
      proTips: [
        "권리분석을 꼼꼼히 하세요",
        "감정가 대비 적정 입찰가를 계산하세요",
      ],
      legalTerms: {
        말소기준권리: "경매로 인해 소멸되는 권리",
        대항력: "임차인의 권리 보호 수준",
      },
    },
  };
}

// ============================================
// 1. 교육용 매물 생성 프롬프트
// ============================================

function getEducationalPropertyPrompt(difficulty: DifficultyLevel): string {
  const difficultySpecs = {
    초급: {
      rightsCount: "1-2개 (근저당 1개 또는 근저당 1개 + 가압류 1개)",
      tenantsComplexity: "없음 또는 대항력 없는 임차인 1명",
      propertyTypes: "아파트 (가장 익숙한 유형)",
      auctionRounds: "1-2회 (최저가 70-80%)",
      educationGoals: [
        "말소기준권리 기초 이해",
        "근저당권 소멸 원리",
        "깨끗한 매물 분석법",
      ],
    },
    중급: {
      rightsCount: "3-4개 (근저당 2개 + 가압류 1-2개 또는 전세권 포함)",
      tenantsComplexity:
        "대항력 있는 임차인 1-2명 (전입일 + 확정일자 모두 충족)",
      propertyTypes: "아파트, 오피스텔, 다세대주택",
      auctionRounds: "2-3회 (최저가 50-70%)",
      educationGoals: [
        "대항력 있는 임차인 분석",
        "복수 근저당 우선순위 판단",
        "인수 권리 총액 계산",
      ],
    },
    고급: {
      rightsCount: "5개 이상 (근저당 3개 + 가압류 2개 + 전세권 또는 지상권)",
      tenantsComplexity:
        "대항력 있는 임차인 2-3명 + 소액임차인 우선변제권 고려",
      propertyTypes: "근린주택, 토지+건물",
      auctionRounds: "3-5회 (최저가 40-60%)",
      educationGoals: [
        "복잡한 권리관계 완전 분석",
        "소액임차인 우선변제권 계산",
        "법정지상권 리스크 평가",
      ],
    },
  };

  const spec = difficultySpecs[difficulty];

  return `당신은 대한민국 법원 경매 전문가입니다. 교육 훈련용 가상 경매 매물을 생성해주세요.

**난이도**: ${difficulty}

**생성 요구사항**:

1. **현실적인 부동산 가격 적용** (필수):
   - 서울 강남 아파트: 감정가 10억~30억 (평당 3,000만~5,000만원)
   - 서울 비강남 아파트: 감정가 5억~15억 (평당 1,500만~3,000만원)
   - 경기도 신도시 아파트: 감정가 5억~12억 (평당 1,200만~2,500만원)
   - 지방 광역시 아파트: 감정가 2억~8억 (평당 800만~1,800만원)

2. **권리관계**: ${spec.rightsCount}
3. **임차인**: ${spec.tenantsComplexity}
4. **물건 종류**: ${spec.propertyTypes}
5. **유찰 횟수**: ${spec.auctionRounds}

6. **교육 목표**: ${spec.educationGoals.join(", ")}

**생성할 데이터 구조** (JSON 형식):
{
  "caseNumber": "2025타경XXXXX",
  "court": "OO지방법원 경매X계",
  "propertyType": "아파트",
  "location": "전체 주소",
  "locationShort": "간략 주소",
  "appraisalValue": 감정가(숫자),
  "minimumBidPrice": 최저가(숫자),
  "bidDeposit": 입찰보증금(숫자),
  "claimAmount": 청구금액(숫자),
  "debtor": "채무자명",
  "owner": "소유자명",
  "creditor": "채권자명",
  "auctionType": "부동산임의경매",
  "biddingMethod": "기일입찰",
  "status": "진행",
  "daysUntilBid": 남은일수(숫자),
  "propertyDetails": {
    "landArea": 토지면적_제곱미터(숫자),
    "landAreaPyeong": 토지면적_평(숫자),
    "buildingArea": 건물면적_제곱미터(숫자),
    "buildingAreaPyeong": 건물면적_평(숫자),
    "buildingType": "XX평형",
    "structure": "철근콘크리트조",
    "usage": "아파트",
    "floor": "X층"
  },
  "schedule": {
    "caseFiledDate": "2025-01-XX",
    "decisionDate": "2025-01-XX",
    "dividendDeadline": "2025-04-XX",
    "firstAuctionDate": "2025-09-XX",
    "currentAuctionDate": "2025-10-XX"
  },
  "biddingHistory": [
    {
      "round": 1,
      "auctionDate": "2025-09-XX",
      "minimumPrice": 금액(숫자),
      "priceRatio": 100,
      "result": "유찰"
    }
  ],
  "rights": [
    {
      "id": "right-1",
      "registrationDate": "2016-11-22",
      "rightType": "근저당권",
      "rightHolder": "OO은행",
      "claimAmount": 금액(숫자),
      "priority": 1
    }
  ],
  "tenants": [
    {
      "id": "tenant-1",
      "tenantName": "OOO",
      "deposit": 보증금(숫자),
      "monthlyRent": 월세(숫자),
      "moveInDate": "2020-XX-XX",
      "confirmationDate": "2020-XX-XX"
    }
  ],
  "similarSales": [
    {
      "saleDate": "2025-XX-XX",
      "similarSize": "XX평형",
      "appraisalValue": 감정가(숫자),
      "salePrice": 낙찰가(숫자),
      "salePriceRatio": 비율(숫자),
      "location": "주소"
    }
  ],
  "educationalContent": {
    "difficulty": "${difficulty}",
    "oneLiner": "20자 이내 한 줄 요약",
    "coreAnalysis": {
      "learningGoal": "이 매물의 교육 목표",
      "keyPoints": ["포인트1", "포인트2", "포인트3"],
      "risks": ["리스크1", "리스크2"],
      "strategy": "권장 입찰 전략"
    },
    "stepByStepGuide": {
      "step1": "권리분석 시작하기 가이드",
      "step2": "임차인 현황 파악하기 가이드",
      "step3": "입찰가 산정하기 가이드",
      "step4": "리스크 체크 가이드"
    },
    "proTips": ["팁1", "팁2"],
    "legalTerms": {
      "말소기준권리": "설명",
      "대항력": "설명"
    }
  }
}

**중요**: 
- 모든 날짜는 YYYY-MM-DD 형식
- 모든 금액은 숫자로만 (쉼표 없이)
- 실제 대한민국 부동산 시세를 반영할 것
- 권리 설정일은 배당요구종기일 이전이어야 함
- 교육 콘텐츠는 초보자도 이해하기 쉽게 작성`;
}

// ============================================
// 2. 시뮬레이션용 매물 생성 프롬프트
// ============================================

function getSimulationPropertyPrompt(): string {
  return `당신은 대한민국 법원 경매 전문가입니다. 실전 입찰 훈련용 가상 경매 매물을 생성해주세요.

**생성 요구사항**:

1. **현실적인 부동산 가격 적용** (필수):
   - 서울 강남 아파트: 감정가 10억~30억
   - 서울 비강남 아파트: 감정가 5억~15억
   - 경기도 신도시 아파트: 감정가 5억~12억
   - 지방 광역시 아파트: 감정가 2억~8억

2. **권리관계**: 다양한 복잡도 (1-5개)
3. **임차인**: 다양한 상황 (없음 ~ 복잡한 대항력 구조)
4. **최저가**: 감정가의 50-80% (유찰 횟수에 따라)
5. **근저당 청구금액**: 감정가의 30-90% (현실적인 대출 비율)
6. **임차보증금**: 해당 지역 전세 시세 참고

**생성할 데이터 구조는 교육용 매물과 동일하되, educationalContent는 제외**

**중요**: 
- 실제 법원 경매와 구별 불가능할 정도로 정교하게 생성
- 마이옥션, 지지옥션 등 실제 경매 사이트의 데이터 구조를 참고
- 모든 날짜, 금액, 권리관계가 법률적으로 정합성 있어야 함`;
}

// ============================================
// 3. 교육용 매물 생성
// ============================================

export async function generateEducationalProperty(
  difficulty: DifficultyLevel
): Promise<SimulationScenario> {
  console.log(`🤖 [OpenAI] 교육용 매물 생성 시작 (난이도: ${difficulty})`);
  const startTime = Date.now();

  // 개발 모드에서는 더미 데이터 사용
  if (isDevelopmentMode()) {
    console.log("🔧 [개발모드] 더미 데이터로 교육용 매물 생성");

    // 난이도별 더미 데이터 생성
    const dummyData = generateDummyData(difficulty);

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.log(`✅ [개발모드] 교육용 매물 생성 완료 (${generationTime}ms)`);
    console.log(`  - 사건번호: ${dummyData.caseNumber}`);

    return {
      id: uuidv4(),
      type: "educational",
      ...dummyData,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 대한민국 법원 경매 전문가입니다.",
        },
        {
          role: "user",
          content: getEducationalPropertyPrompt(difficulty),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI 응답이 비어있습니다.");
    }

    const data = JSON.parse(content);
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.log(`✅ [OpenAI] 교육용 매물 생성 완료 (${generationTime}ms)`);
    console.log(`  - 토큰 사용량: ${response.usage?.total_tokens || 0}`);
    console.log(`  - 사건번호: ${data.caseNumber}`);

    // SimulationScenario 형식으로 변환
    const scenario: SimulationScenario = {
      id: uuidv4(),
      type: "educational",
      basicInfo: {
        caseNumber: data.caseNumber,
        court: data.court,
        propertyType: data.propertyType,
        location: data.location,
        locationShort: data.locationShort,
        appraisalValue: data.appraisalValue,
        minimumBidPrice: data.minimumBidPrice,
        bidDeposit: data.bidDeposit,
        claimAmount: data.claimAmount,
        debtor: data.debtor,
        owner: data.owner,
        creditor: data.creditor,
        auctionType: data.auctionType,
        biddingMethod: data.biddingMethod,
        status: data.status,
        daysUntilBid: data.daysUntilBid,
      },
      propertyDetails: data.propertyDetails,
      schedule: data.schedule,
      biddingHistory: data.biddingHistory,
      rights: data.rights.map((r: any) => ({
        ...r,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      })),
      tenants: data.tenants.map((t: any) => ({
        ...t,
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      })),
      similarSales: data.similarSales,
      educationalContent: data.educationalContent,
      createdAt: new Date().toISOString(),
    };

    return scenario;
  } catch (error) {
    console.error("❌ [OpenAI] 교육용 매물 생성 실패:", error);
    throw error;
  }
}

// ============================================
// 4. 매물 유형별 권리와 임차인 생성 함수
// ============================================

/**
 * 매물 유형별 권리를 생성합니다.
 */
function generateSimulationRights(
  propertyType: string,
  claimAmount: number
): RightRecord[] {
  console.log(
    `🔍 [시뮬레이션 권리 생성] ${propertyType} - 청구금액: ${claimAmount.toLocaleString()}원`
  );

  const rights: RightRecord[] = [];
  const baseClaimAmount = Math.floor(claimAmount * 0.7); // 청구금액의 70%
  const secondaryClaimAmount = Math.floor(claimAmount * 0.3); // 청구금액의 30%

  // 기본 근저당권 (1순위)
  rights.push({
    id: "right-1",
    registrationDate: "2018-05-15",
    rightType: "근저당권",
    rightHolder: "신한은행",
    claimAmount: baseClaimAmount,
    priority: 1,
    isMalsoBaseRight: false,
    willBeExtinguished: false,
    willBeAssumed: false,
  });

  // 매물 유형별 추가 권리
  switch (propertyType) {
    case "아파트":
      // 아파트는 관리비 관련 권리가 있을 수 있음
      if (Math.random() > 0.5) {
        rights.push({
          id: "right-2",
          registrationDate: "2019-03-20",
          rightType: "가압류",
          rightHolder: "하나은행",
          claimAmount: secondaryClaimAmount,
          priority: 2,
          isMalsoBaseRight: false,
          willBeExtinguished: false,
          willBeAssumed: false,
        });
      }
      break;

    case "오피스텔":
      // 오피스텔은 상업용 대출이 많음
      rights.push({
        id: "right-2",
        registrationDate: "2019-03-20",
        rightType: "근저당권",
        rightHolder: "하나은행",
        claimAmount: secondaryClaimAmount,
        priority: 2,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      });
      break;

    case "단독주택":
      // 단독주택은 개인 대출이 많음
      if (Math.random() > 0.4) {
        rights.push({
          id: "right-2",
          registrationDate: "2019-03-20",
          rightType: "근저당권",
          rightHolder: "하나은행",
          claimAmount: secondaryClaimAmount,
          priority: 2,
          isMalsoBaseRight: false,
          willBeExtinguished: false,
          willBeAssumed: false,
        });
      }
      break;
  }

  console.log(`✅ [시뮬레이션 권리 생성] 생성된 권리 개수: ${rights.length}`);
  return rights;
}

/**
 * 매물 유형별 임차인을 생성합니다.
 */
function generateSimulationTenants(
  propertyType: string,
  location: string
): TenantRecord[] {
  console.log(`🔍 [시뮬레이션 임차인 생성] ${propertyType} - ${location}`);

  const tenants: TenantRecord[] = [];

  // 매물 유형별 임차인 생성
  switch (propertyType) {
    case "아파트":
      // 아파트는 거주용 임차인이 많음
      tenants.push({
        id: "tenant-1",
        tenantName: "이영희",
        deposit: 50000000,
        monthlyRent: 0,
        moveInDate: "2020-03-15",
        confirmationDate: "2020-03-15",
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      });
      break;

    case "오피스텔":
      // 오피스텔은 상업용 임차인이 많음
      tenants.push({
        id: "tenant-1",
        tenantName: "최수진",
        deposit: 30000000,
        monthlyRent: 0,
        moveInDate: "2021-01-10",
        confirmationDate: "2021-01-10",
        hasDaehangryeok: true,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      });
      break;

    case "단독주택":
      // 단독주택은 거주용 임차인
      tenants.push({
        id: "tenant-1",
        tenantName: "김영수",
        deposit: 40000000,
        monthlyRent: 0,
        moveInDate: "2020-08-20",
        confirmationDate: "2020-08-20",
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      });
      break;
  }

  console.log(
    `✅ [시뮬레이션 임차인 생성] 생성된 임차인 개수: ${tenants.length}`
  );
  return tenants;
}

// ============================================
// 5. 시뮬레이션용 매물 생성
// ============================================

/**
 * 시뮬레이션용 현실적인 가격 범위를 생성합니다.
 */
function generateSimulationPriceRanges(propertyType: string, region: string) {
  console.log(
    `💰 [시뮬레이션 가격 생성] ${propertyType} - ${region} 현실적 가격 생성`
  );

  // 매물 유형별 기본 가격 범위 (억 단위)
  const baseRanges = {
    아파트: {
      "서울 강남": { min: 8, max: 25 },
      "서울 비강남": { min: 4, max: 12 },
      "경기 신도시": { min: 3, max: 10 },
      "지방 광역시": { min: 1.5, max: 6 },
      기타: { min: 2, max: 8 },
    },
    주택: {
      "서울 강남": { min: 6, max: 20 },
      "서울 비강남": { min: 3, max: 10 },
      "경기 신도시": { min: 2, max: 8 },
      "지방 광역시": { min: 1, max: 5 },
      기타: { min: 1.5, max: 6 },
    },
    다가구주택: {
      "서울 강남": { min: 4, max: 12 },
      "서울 비강남": { min: 2.5, max: 8 },
      "경기 신도시": { min: 2, max: 6 },
      "지방 광역시": { min: 1, max: 4 },
      기타: { min: 1.5, max: 5 },
    },
    근린주택: {
      "서울 강남": { min: 5, max: 15 },
      "서울 비강남": { min: 2.5, max: 8 },
      "경기 신도시": { min: 2, max: 6 },
      "지방 광역시": { min: 1, max: 4 },
      기타: { min: 1.5, max: 5 },
    },
    도시형생활주택: {
      "서울 강남": { min: 3, max: 10 },
      "서울 비강남": { min: 2, max: 6 },
      "경기 신도시": { min: 1.5, max: 5 },
      "지방 광역시": { min: 0.8, max: 3 },
      기타: { min: 1, max: 4 },
    },
    오피스텔: {
      "서울 강남": { min: 3, max: 8 },
      "서울 비강남": { min: 2, max: 5 },
      "경기 신도시": { min: 1.5, max: 4 },
      "지방 광역시": { min: 0.8, max: 3 },
      기타: { min: 1, max: 4 },
    },
    단독주택: {
      "서울 강남": { min: 6, max: 20 },
      "서울 비강남": { min: 3, max: 10 },
      "경기 신도시": { min: 2, max: 8 },
      "지방 광역시": { min: 1, max: 5 },
      기타: { min: 1.5, max: 6 },
    },
    빌라: {
      "서울 강남": { min: 2, max: 6 },
      "서울 비강남": { min: 1.5, max: 4 },
      "경기 신도시": { min: 1, max: 3 },
      "지방 광역시": { min: 0.5, max: 2 },
      기타: { min: 0.8, max: 3 },
    },
    원룸: {
      "서울 강남": { min: 1, max: 3 },
      "서울 비강남": { min: 0.8, max: 2.5 },
      "경기 신도시": { min: 0.5, max: 1.8 },
      "지방 광역시": { min: 0.3, max: 1.2 },
      기타: { min: 0.4, max: 1.5 },
    },
  };

  // 지역 분류
  const getRegionCategory = (region: string) => {
    if (
      region.includes("강남") ||
      region.includes("서초") ||
      region.includes("송파")
    )
      return "서울 강남";
    if (region.includes("서울")) return "서울 비강남";
    if (
      region.includes("경기") ||
      region.includes("분당") ||
      region.includes("성남")
    )
      return "경기 신도시";
    if (
      region.includes("부산") ||
      region.includes("대구") ||
      region.includes("인천") ||
      region.includes("광주") ||
      region.includes("대전") ||
      region.includes("울산")
    )
      return "지방 광역시";
    return "기타";
  };

  const regionCategory = getRegionCategory(region);
  const priceRange = baseRanges[propertyType]?.[regionCategory] ||
    baseRanges[propertyType]?.["기타"] || { min: 1, max: 5 };

  // 5개의 다양한 가격 생성
  const priceRanges = [];
  for (let i = 0; i < 5; i++) {
    // 랜덤 변동 추가 (±15% - 시뮬레이션은 더 다양하게)
    const randomVariation = (Math.random() - 0.5) * 0.3; // -15% ~ +15%
    const basePrice =
      priceRange.min + (priceRange.max - priceRange.min) * Math.random();
    const adjustedPrice = basePrice * (1 + randomVariation);

    // 현실적인 가격으로 조정 (백만원 단위로 반올림)
    const marketValue =
      Math.round((adjustedPrice * 100000000) / 1000000) * 1000000;
    const appraisalValue = Math.round(
      marketValue * (0.75 + Math.random() * 0.15)
    ); // 시장가의 75-90%
    const claimAmount = Math.round(
      appraisalValue * (0.4 + Math.random() * 0.3)
    ); // 감정가의 40-70%

    priceRanges.push({
      marketValue,
      appraisalValue,
      claimAmount,
    });
  }

  console.log(
    `💰 [시뮬레이션 가격 생성] 생성된 가격 범위: ${priceRanges.length}개`
  );
  return priceRanges;
}

export async function generateSimulationProperty(): Promise<SimulationScenario> {
  console.log("🤖 [OpenAI] 시뮬레이션용 매물 생성 시작");
  const startTime = Date.now();

  // 개발 모드에서는 더미 데이터 사용
  if (isDevelopmentMode()) {
    console.log("🔧 [개발모드] 더미 데이터로 시뮬레이션용 매물 생성");

    // 시뮬레이션용 매물 템플릿 (교육용과 동일하지만 더 현실적인 데이터)
    const simulationTemplates = [
      {
        propertyType: "아파트",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("아파트", "서울 강남"),
        propertyDetails: [
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "20층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "12층",
          },
          {
            landArea: 115.7,
            landAreaPyeong: 35.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "25층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 49.6,
            buildingAreaPyeong: 15.0,
            buildingType: "15평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "8층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "30층",
          },
        ],
      },
      {
        propertyType: "오피스텔",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 용산구 이태원동 789-12", short: "서울 용산구" },
          {
            full: "서울특별시 영등포구 여의도동 101-23",
            short: "서울 영등포구",
          },
          { full: "경기도 수원시 영통구 광교동 202-34", short: "경기 수원시" },
        ],
        priceRanges: generateSimulationPriceRanges("오피스텔", "서울 강남"),
        propertyDetails: [
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 49.6,
            buildingAreaPyeong: 15.0,
            buildingType: "15평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "12층",
          },
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 33.1,
            buildingAreaPyeong: 10.0,
            buildingType: "10평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "8층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "15층",
          },
          {
            landArea: 24.8,
            landAreaPyeong: 7.5,
            buildingArea: 24.8,
            buildingAreaPyeong: 7.5,
            buildingType: "7.5평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "6층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "18층",
          },
        ],
      },
      {
        propertyType: "단독주택",
        locations: [
          { full: "서울특별시 강남구 도곡동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 반포동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("단독주택", "서울 강남"),
        propertyDetails: [
          {
            landArea: 198.3,
            landAreaPyeong: 60.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "3층",
          },
          {
            landArea: 165.3,
            landAreaPyeong: 50.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "2층",
          },
          {
            landArea: 231.4,
            landAreaPyeong: 70.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "3층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "2층",
          },
          {
            landArea: 264.5,
            landAreaPyeong: 80.0,
            buildingArea: 165.3,
            buildingAreaPyeong: 50.0,
            buildingType: "50평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "빌라",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("빌라", "서울 강남"),
        propertyDetails: [
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "3층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "2층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "4층",
          },
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "2층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "5층",
          },
        ],
      },
      {
        propertyType: "주택",
        locations: [
          { full: "서울특별시 강남구 도곡동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 반포동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("주택", "서울 강남"),
        propertyDetails: [
          {
            landArea: 165.3,
            landAreaPyeong: 50.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "2층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "2층",
          },
          {
            landArea: 198.3,
            landAreaPyeong: 60.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "다가구주택",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("다가구주택", "서울 강남"),
        propertyDetails: [
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "3층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "3층",
          },
          {
            landArea: 115.7,
            landAreaPyeong: 35.0,
            buildingArea: 148.8,
            buildingAreaPyeong: 45.0,
            buildingType: "45평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "4층",
          },
        ],
      },
      {
        propertyType: "근린주택",
        locations: [
          { full: "서울특별시 강남구 가로수길 123-45", short: "서울 강남구" },
          { full: "서울특별시 마포구 홍대입구역 456-78", short: "서울 마포구" },
          { full: "서울특별시 종로구 인사동 789-12", short: "서울 종로구" },
          { full: "서울특별시 송파구 잠실동 101-23", short: "서울 송파구" },
          { full: "경기도 부천시 원미구 상동 202-34", short: "경기 부천시" },
        ],
        priceRanges: generateSimulationPriceRanges("근린주택", "서울 강남"),
        propertyDetails: [
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "2층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "2층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "도시형생활주택",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges(
          "도시형생활주택",
          "서울 강남"
        ),
        propertyDetails: [
          {
            landArea: 19.8,
            landAreaPyeong: 6.0,
            buildingArea: 19.8,
            buildingAreaPyeong: 6.0,
            buildingType: "6평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "8층",
          },
          {
            landArea: 16.5,
            landAreaPyeong: 5.0,
            buildingArea: 16.5,
            buildingAreaPyeong: 5.0,
            buildingType: "5평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "12층",
          },
          {
            landArea: 23.1,
            landAreaPyeong: 7.0,
            buildingArea: 23.1,
            buildingAreaPyeong: 7.0,
            buildingType: "7평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "15층",
          },
        ],
      },
      {
        propertyType: "원룸",
        locations: [
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
        ],
        priceRanges: generateSimulationPriceRanges("원룸", "서울 강남"),
        propertyDetails: [
          {
            landArea: 16.5,
            landAreaPyeong: 5.0,
            buildingArea: 16.5,
            buildingAreaPyeong: 5.0,
            buildingType: "5평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "8층",
          },
          {
            landArea: 19.8,
            landAreaPyeong: 6.0,
            buildingArea: 19.8,
            buildingAreaPyeong: 6.0,
            buildingType: "6평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "12층",
          },
          {
            landArea: 23.1,
            landAreaPyeong: 7.0,
            buildingArea: 23.1,
            buildingAreaPyeong: 7.0,
            buildingType: "7평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "15층",
          },
          {
            landArea: 13.2,
            landAreaPyeong: 4.0,
            buildingArea: 13.2,
            buildingAreaPyeong: 4.0,
            buildingType: "4평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "6층",
          },
          {
            landArea: 26.4,
            landAreaPyeong: 8.0,
            buildingArea: 26.4,
            buildingAreaPyeong: 8.0,
            buildingType: "8평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "18층",
          },
        ],
      },
    ];

    // 랜덤하게 매물 유형 선택
    const selectedTemplate =
      simulationTemplates[
        Math.floor(Math.random() * simulationTemplates.length)
      ];
    const selectedLocation =
      selectedTemplate.locations[
        Math.floor(Math.random() * selectedTemplate.locations.length)
      ];
    const selectedPriceRange =
      selectedTemplate.priceRanges[
        Math.floor(Math.random() * selectedTemplate.priceRanges.length)
      ];
    const selectedPropertyDetails =
      selectedTemplate.propertyDetails[
        Math.floor(Math.random() * selectedTemplate.propertyDetails.length)
      ];

    // 가격 계산 (감정가 기준으로 최저가, 입찰시작가 계산)
    const minimumBidPrice = Math.floor(selectedPriceRange.appraisalValue * 0.7); // 감정가의 70% (시뮬레이션은 더 낮게)
    const startingBidPrice = Math.floor(
      selectedPriceRange.appraisalValue * 0.75
    ); // 감정가의 75%
    const bidDeposit = Math.floor(minimumBidPrice * 0.1); // 최저가의 10%

    console.log(
      `🏠 [시뮬레이션 매물 생성] 선택된 매물 유형: ${selectedTemplate.propertyType}`
    );
    console.log(
      `📍 [시뮬레이션 매물 생성] 선택된 위치: ${selectedLocation.short}`
    );
    console.log(
      `💰 [시뮬레이션 매물 생성] 시장가: ${selectedPriceRange.marketValue.toLocaleString()}원`
    );
    console.log(
      `💰 [시뮬레이션 매물 생성] 감정가: ${selectedPriceRange.appraisalValue.toLocaleString()}원`
    );

    const dummyData = {
      caseNumber: `2025타경${Math.floor(Math.random() * 90000) + 10000}`,
      court: "서울중앙지방법원 경매2계",
      propertyType: selectedTemplate.propertyType,
      location: selectedLocation.full,
      locationShort: selectedLocation.short,
      marketValue: selectedPriceRange.marketValue,
      appraisalValue: selectedPriceRange.appraisalValue,
      minimumBidPrice: minimumBidPrice,
      startingBidPrice: startingBidPrice,
      bidDeposit: bidDeposit,
      claimAmount: selectedPriceRange.claimAmount,
      debtor: "박민수",
      owner: "박민수",
      creditor: "신한은행",
      auctionType: "부동산임의경매",
      biddingMethod: "기일입찰",
      status: "진행",
      daysUntilBid: 8,
      propertyDetails: selectedPropertyDetails,
      schedule: {
        caseFiledDate: "2025-02-10",
        decisionDate: "2025-02-15",
        dividendDeadline: "2025-05-15",
        firstAuctionDate: "2025-08-10",
        currentAuctionDate: "2025-10-10",
      },
      biddingHistory: [
        {
          round: 1,
          auctionDate: "2025-08-10",
          minimumPrice: 800000000,
          priceRatio: 100,
          result: "유찰",
        },
        {
          round: 2,
          auctionDate: "2025-09-10",
          minimumPrice: 640000000,
          priceRatio: 80,
          result: "유찰",
        },
      ],
      rights: generateSimulationRights(
        selectedTemplate.propertyType,
        selectedPriceRange.claimAmount
      ),
      tenants: generateSimulationTenants(
        selectedTemplate.propertyType,
        selectedLocation.short
      ),
      similarSales: [
        {
          saleDate: "2025-07-20",
          similarSize: "14평형",
          appraisalValue: 800000000,
          salePrice: 750000000,
          salePriceRatio: 93.8,
          location: "서울 서초구 서초대로 458",
        },
      ],
    };

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.log(
      `✅ [개발모드] 시뮬레이션용 매물 생성 완료 (${generationTime}ms)`
    );
    console.log(`  - 사건번호: ${dummyData.caseNumber}`);

    return {
      id: uuidv4(),
      type: "simulation",
      ...dummyData,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 대한민국 법원 경매 전문가입니다.",
        },
        {
          role: "user",
          content: getSimulationPropertyPrompt(),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI 응답이 비어있습니다.");
    }

    const data = JSON.parse(content);
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.log(
      `✅ [OpenAI] 시뮬레이션용 매물 생성 완료 (${generationTime}ms)`
    );
    console.log(`  - 토큰 사용량: ${response.usage?.total_tokens || 0}`);
    console.log(`  - 사건번호: ${data.caseNumber}`);

    // SimulationScenario 형식으로 변환
    const scenario: SimulationScenario = {
      id: uuidv4(),
      type: "simulation",
      basicInfo: {
        caseNumber: data.caseNumber,
        court: data.court,
        propertyType: data.propertyType,
        location: data.location,
        locationShort: data.locationShort,
        appraisalValue: data.appraisalValue,
        minimumBidPrice: data.minimumBidPrice,
        bidDeposit: data.bidDeposit,
        claimAmount: data.claimAmount,
        debtor: data.debtor,
        owner: data.owner,
        creditor: data.creditor,
        auctionType: data.auctionType,
        biddingMethod: data.biddingMethod,
        status: data.status,
        daysUntilBid: data.daysUntilBid,
      },
      propertyDetails: data.propertyDetails,
      schedule: data.schedule,
      biddingHistory: data.biddingHistory,
      rights: data.rights.map((r: any) => ({
        ...r,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      })),
      tenants: data.tenants.map((t: any) => ({
        ...t,
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
      })),
      similarSales: data.similarSales,
      createdAt: new Date().toISOString(),
    };

    return scenario;
  } catch (error) {
    console.error("❌ [OpenAI] 시뮬레이션용 매물 생성 실패:", error);
    throw error;
  }
}
