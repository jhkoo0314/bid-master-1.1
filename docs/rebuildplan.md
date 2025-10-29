# Bid Master — 매물상세정보 페이지 Rebuild Plan

## 0) 목표
- **톤앤매너 일치:** 프리미엄 실전 매뉴얼 톤(차분·정확·전문).
- **정보 구조 재정렬:** “요약 → 리스크/결정 → 세부” 흐름.
- **학습형 UX:** 초보도 “이유를 이해”하고 행동을 결정할 수 있게.
- **성능/확장성:** Next.js 15 + Tailwind v4, 서버/클라이언트 분리, 스트리밍 준비.

---

## 1) 핵심 원칙
1. **한눈 요약**: 5초 내 핵심 판단(최저가·보증금·입찰일정·핵심리스크) 끝.
2. **근거 우선**: 모든 수치 옆에 근거(출처/수식/날짜) 표시.
3. **학습 우선**: 각 블록마다 “왜 중요한가” 1문장 포함.
4. **절제된 고급톤**: 과장 금지, 이모지 금지, 단색 대비·미세 그림자.
5. **명시적 상태**: 준비중/추정치/확정치 배지 표기.

---

## 2) 정보 설계 (IA)
1. **헤더 요약(Above the fold)**
   - [필수 카드 4] 감정가, 최저가(할인율), 입찰보증금, 다음 입찰일/법원
   - 상태 배지: `확정`, `추정`, `준비중`
2. **결정 보조 섹션**
   - 핵심리스크 3선(근저당/배당순위/인수비용) + “낙찰가 가이드(범위)”
   - 학습 포인트(이 물건을 볼 때의 관전포인트 3개)
3. **세부 정보**
   - 사건기본, 진행/매각 일정, 감정평가, 임차인/권리관계, 예상배당표
4. **지역/현장 체크**
   - 법원·등기소·세무서, 지도 링크(우선 링크 묶음 + 추가 링크 접기)
5. **학습 모듈**
   - “권리분석 리포트(요약 5줄) → 전체보기(정식서비스)”
   - “경매분석 리포트(요약 5줄) → 전체보기(정식서비스)”
6. **고려 사항**
   - 데이터 출처/스냅샷 타임스탬프, 업데이트 이력

---

## 3) 페이지 레이아웃 (Next.js 15 / App Router)
/app/property/[caseId]/page.tsx
/components/property/ SummaryHeader.tsx
/components/property/ DecisionPanel.tsx
/components/property/ SectionCard.tsx
/components/property/ ScheduleTable.tsx
/components/property/ RightsTable.tsx
/components/property/ PayoutTable.tsx
/components/property/ RegionPanel.tsx
/components/property/ LearnBlock.tsx
/lib/property/fetchers.ts
/lib/property/formatters.ts
/types/property.ts

- **컬럼 구조:** 데스크톱 2컬럼(메인 8 / 사이드 4), 모바일 1컬럼.
- **Sticky 요약바:** 스크롤 시 상단에 `최저가/다음입찰일/핵심리스크` 고정.

---

## 4) UI 컴포넌트 사양 (요점)
### 4.1 SummaryHeader
- 카드 4개: `감정가`, `최저가(↓할인율%)`, `입찰보증금(10%)`, `다음 입찰일/법원`
- 서브라인: 소재지(1줄), 물건종류/대상, 면적
- 배지: `확정/추정/준비중`

### 4.2 DecisionPanel
- **낙찰가 가이드(범위)**: `권장입찰가_min ~ max` + 산식 버튼(툴팁)
- **핵심리스크 3선**: 짧은 원인/영향/조치
- **행동 버튼**: `권리요약 보기` `배당요약 보기` `현장체크리스트 다운로드`

### 4.3 SectionCard (공통 래퍼)
- 제목, 보조설명(왜 중요한가), 본문, 출처/업데이트일, 접기/펼치기

### 4.4 Tables
- **ScheduleTable**: 사건/매각 일정(유찰은 회색 배지)
- **RightsTable**: 등기부 권리(순위/종류/권리자/등기일/청구금액/비고)
- **PayoutTable**: 배당 순서·예상배당(최저가 기준) + “실제 배당은 낙찰대금에 따라 변동” 고정 문구

### 4.5 RegionPanel
- 기관 정보 카드(법원/등기소/세무서), 주요 링크(우선 그룹/추가 접기)

### 4.6 LearnBlock
- “요약 5줄 + 전체보기(정식서비스)” 구조, 준비중일 때 설명 문장 명시

---

## 5) 데이터 모델 (요약)
```ts
// /types/property.ts
export type Money = number; // KRW(원), 프런트는 formatCurrency로 표시
export interface PriceSummary {
  appraised: Money;            // 감정가
  lowest: Money;               // 최저가
  discountRate: number;        // 0.30 => 30%
  deposit: Money;              // 입찰보증금
  status: 'confirmed' | 'estimated' | 'pending';
  updatedAt: string;           // ISO
}
export interface NextAuction {
  date: string; court: string; status: 'scheduled'|'canceled'|'tbd';
}
export interface RiskItem { title: string; cause: string; impact: string; action: string; severity: 'low'|'mid'|'high'; basis?: string; }
export interface ScheduleItem { day: string; title: string; date: string; note?: string; }
export interface RightRow { order: number; type: string; holder: string; date: string; claim: Money; note?: string; }
export interface PayoutRow { order: number; holder: string; type: string; claim: Money; expected: Money; remark?: string; }
export interface RegionInfo { court: Org; registry: Org; taxOffice: Org; links: Array<{label:string; url:string; group: 'primary'|'more'}>; }
export interface Org { name: string; phone?: string; address?: string; open?: { bidStart?: string; bidEnd?: string; }; }
export interface LearnSummary { title: string; bullets: string[]; state: 'preview'|'locked'|'comingSoon'; }
export interface PropertyDetail {
  caseId: string;
  meta: { address: string; type: string; area_pyeong?: number; area_m2?: number; };
  price: PriceSummary;
  nextAuction: NextAuction;
  risks: RiskItem[];
  schedules: ScheduleItem[];
  rights: RightRow[];
  payout: { base: Money; rows: PayoutRow[]; note: string; };
  region: RegionInfo;
  learn: { rights: LearnSummary; analysis: LearnSummary; };
  snapshotAt: string; // 데이터 스냅샷 기준시각
}

6) 상호작용 & 상태

상단 Sticky 요약바: 스크롤 240px 이후 고정.

툴팁/모달: 산식/용어 정의는 툴팁, 긴 설명은 모달.

접기/펼치기: 세부표는 기본 열림(데스크톱), 모바일은 섹션 단위 접힘.

로딩/에러/빈값: Skeleton → “데이터 없음” 안내 → 재시도 버튼.

7) 스타일 가이드 (Tailwind v4)

색

기본 텍스트: #0B1220

서브텍스트: #5B6475

라인/카드배경: #EEF2F6 / #F7F9FC

강조: #0E4ECF(프라이머리), 경고: #D93025, 정보: #2563EB

성공/안심: #156F4B (절제된 사용)

타이포

헤딩 font-semibold, 본문 font-normal, 숫자 tabular-nums.

카드

rounded-2xl shadow-sm border border-black/5 bg-white

배지

확정: bg-black text-white, 추정: bg-gray-900/70 text-white, 준비중: bg-gray-200 text-gray-700

모션

페이드/슬라이드 200ms, 숫자 카운트 500ms 이내, 과한 이징 금지.

8) 접근성/가독성

대비비율 4.5:1 이상.

표 헤더 scope="col", 요약바 aria-live="polite".

키보드 포커스 스타일 명확.

9) 성능

서버 컴포넌트 우선, 데이터 스트리밍(요약 먼저, 세부 후속).

표 컴포넌트 분할/가상화(행 50+일 때).

이미지/아이콘 지연 로드, 모듈 경량 아이콘.

10) 분석/로그

이벤트: view_summary, open_formula, toggle_section, cta_learn_rights, cta_learn_analysis, open_map_link.

파라미터: caseId, severity_max, discountRate, range_low/high.

11) SEO/공유

메타 타이틀: [최저가/할인율] [소재지 핵심키] | Bid Master

설명: 핵심리스크 1문장 + 다음 입찰일.

OG: 요약 카드 스냅샷 이미지(서버 렌더).

12) 카피 규칙

수치 먼저, 근거 바로 뒤.
예) “최저가 1,050,649,74원 (감정가 대비 30%↓, 2024-02-22 기준).”

추정/가정은 반드시 “추정” 표기.

13) API 계약(요약)

GET /api/property/:caseId → PropertyDetail

캐시: 1h SWR, snapshotAt 노출.

에러: 404(없음), 424(원천 지연), 503(준비중)

14) QA 체크리스트

 요약 4카드가 모든 케이스에서 값 표시/배지 정상.

 할인율·보증금 산식 툴팁 정상.

 Sticky 요약바 겹침/점프 없음(모바일/데스크톱).

 권리/배당 테이블 정렬·합계 검증.

 준비중 모듈의 문구/락 처리 일관.

 링크 그룹(우선/추가) 동작 및 추적 이벤트 수집.

15) 마이그레이션 플랜

기존 페이지를 /legacy/property/[caseId]로 보존.

새 페이지 /property/[caseId]에 feature flag.

2주 병행 운영 → 이벤트/체류/이탈 비교 → 기본값 전환.

16) 납품 산출물

페이지/컴포넌트 코드 + 스토리북 스냅샷

타입/목데이터(JSON 3종: 정상/준비중/데이터부족)

QA 시나리오 및 체크리스트

카피/툴팁 문구 사전

17) 개발 일정(안)

D+2: IA/와이어 + 타입/목업 완료

D+5: Summary/Decision 패널 완료

D+8: 표 영역/학습 블록/지역 패널

D+10: 접근성/성능/분석, QA 1차

D+12: 병행 운영 시작


다음 단계 제안: 이 계획대로 **와이어프레임(컴포넌트 스켈레톤) + 타입 정의 + 목데이터 3종**을 바로 생성해드리겠다.