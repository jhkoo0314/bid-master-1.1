# Bid Master — 메인(목록/대시보드) 페이지 Rebuild Plan

## 0) 목표
- 프리미엄 실전 매뉴얼 톤 일관화(상세뷰와 동일).
- “탐색 → 학습 → 실습” 흐름을 1스크롤 내에서 완결.
- 성능 안정(초기 로드 < 2.5s, CLS≈0, 스켈레톤·스트리밍).
- Next.js 15(App Router)·Tailwind v4 기준 컴포넌트화.

---

## 1) 정보 설계(IA)
1. **Top Bar / Global Header**
   - 로고, 핵심 네비(실전 가이드, 수익 계산기, 용어집), 사전알림 CTA
   - 로그인 버튼은 비활성 스타일 유지(준비중 배지)
2. **Hero**
   - 한 문장 가치 제안 + 서브 카피
   - 주요 CTA: “실전 경매 훈련 시작” → 매물 목록 앵커
   - 신뢰요소: 익명 실습·무료 시작·데이터 스냅샷 시각
3. **KPI / Activity Strip (Hero 아래)**
   - 실시간 활성 사용자(비주얼 숫자), 오늘 생성된 시뮬레이션 수, 평균 시도/유저
   - 값 옆에 근거/산식 툴팁
4. **컨트롤 레일**
   - 필터(유형/권리/난이도/가격), 정렬(추천/최신/난이도), 새로고침
   - 태그칩 형태의 “적용 중인 필터 요약” + 한 번에 초기화
   - 모바일: 상단 고정 Sheet(필터/정렬 합침)
5. **목록 그리드 & 카드**
   - PC: 4컬럼(>1280px), 3컬럼(≥1024), 2컬럼(≥768)
   - 모바일: 스와이프 캐러셀(현재 구현 유지, 인디케이터 개선)
   - 카드 정보: 썸네일, 난이도 배지, 핵심 3수치(최저가/할인율/보증금), 권리유형, “자세히 보기”
6. **학습 패널(사이드 또는 그리드 하단)**
   - “처음이라면 이 조합부터” 가이드 프리셋(필터 프리셋 버튼 3종)
   - “권리유형 미니 가이드”(5줄 미니) + 전체 가이드 링크
7. **빈/에러/로딩 상태**
   - 스켈레톤 8장(카드 스켈레톤), 에러 재시도, 빈 상태 CTA(매물 생성)
8. **Footer**
   - 브랜드·저작권·문의, 데이터 출처·스냅샷 시각, 링크 그룹

---

## 2) 레이아웃 & 라우팅
/app/page.tsx // 메인
/components/layout/TopHeader.tsx
/components/hero/MainHero.tsx
/components/metrics/ActivityStrip.tsx
/components/filters/FilterBar.tsx
/components/filters/ActiveChips.tsx
/components/list/PropertyGrid.tsx
/components/list/PropertyCard.tsx // 공용화(상세로 이동 링크 포함)
components/list/MobileCarousel.tsx
/components/learn/QuickGuides.tsx
/components/common/EmptyState.tsx
/components/common/ErrorState.tsx
/components/common/SkeletonCard.tsx

- PC: 12그리드(메인 9, 보조 3) 또는 단일 12그리드 + 섹션 분리.
- 모바일: 1컬럼, 필터/정렬은 상단 시트로 합침.

---

## 3) UI 컴포넌트 사양(요점)
### 3.1 TopHeader
- 좌: 로고+서브 브랜드라인(“Fail fast, learn faster” 문구 유지)
- 중: 주요 네비(가이드/계산기/용어집)
- 우: 사전알림 CTA(강조), 로그인(비활성 배지: 준비중)

### 3.2 MainHero
- H1 1문장(가치 제안), H2 1문장(서브), Primary CTA 1개
- 배경은 미세 그라디언트 또는 질감, 이모지 사용 금지

### 3.3 ActivityStrip
- 지표 3~4개 카운터: `tabular-nums`, 0.5s 카운트업
- 툴팁: 산식/집계 기준

### 3.4 FilterBar
- 필수: 유형, 권리유형(멀티), 난이도, 가격 슬라이더
- 보조: 지역(선택), 정렬
- 액션: 적용, 초기화, 새로고침(무제한)
- 모바일 Sheet: `FilterBarSheet`로 분리, 적용 시 닫힘

### 3.5 ActiveChips
- 현재 적용된 필터를 한 줄 칩으로 요약, 각 칩 X로 개별 제거

### 3.6 PropertyCard (리팩터)
- 상단: 썸네일(비율 고정), 좌측 상단 난이도 배지
- 본문: 제목(소재지 축약), 핵심 3수치(최저가/할인율/보증금)
- 툴바: 권리유형 아이콘 라인, 자세히 보기 버튼
- 접근성: 키보드 포커스, 카드 전체 클릭 영역(상세 라우트)

### 3.7 MobileCarousel
- 스와이프 민감도/경계값 상향, 인디케이터 탭 이동
- 카드 간 마진 균형화, 페이지 스냅(overflow-hidden)

### 3.8 QuickGuides
- 프리셋 버튼: `입문(초급+아파트)`, `수익형(상가+권리 단순)`, `연습강화(중·고급 혼합)`
- “왜 이 조합인가” 1줄 근거, 적용 즉시 스크롤 유지

---

## 4) 스타일 가이드(Tailwind v4)
- 컬러:  
  - 텍스트 `#0B1220`, 보조 `#5B6475`  
  - 카드/표면 `#FFFFFF`, 섹션 배경 `#F7F9FC`  
  - 프라이머리 `#0E4ECF`(버튼·링크), 경고 `#D93025`  
- 타이포: 헤딩 `font-semibold`, 본문 `font-normal`, 숫자 `tabular-nums`
- 컴포넌트: `rounded-2xl shadow-sm border border-black/5`
- 모션: hover -2px, 카운트업 500ms, 전환 200ms

---

## 5) 성능/상태
- 서버 컴포넌트 우선, 클라이언트는 필터/상호작용만.
- 초기 로드: Hero+ActivityStrip 먼저, 목록은 스트리밍.
- 이미지 `next/image` 변환, 썸네일 `fill`+`sizes` 지정.
- 스켈레톤 8장, 가상 스크롤은 40장 이상에서만 적용.
- 에러바운더리: 목록/API 실패 시 재시도 버튼 표준화.

---

## 6) 데이터 계약(프런트 기준)
```ts
export type DifficultyLevel = '초급'|'중급'|'고급';
export interface CardCore {
  id: string;
  title: string;                 // 주소 축약
  thumbnail: string;             // static or signed url
  price: { lowest: number; discountRate: number; deposit: number; };
  rightTypes: string[];          // 아이콘 매핑용
  difficulty: DifficultyLevel;
  region?: string;
  updatedAt: string;             // 스냅샷 시각
}
export interface ListPayload {
  items: CardCore[];
  metrics: { activeUsers: number; simsToday: number; avgTries: number; };
  snapshotAt: string;
}
7) 상호작용 시나리오

필터 변경 → 적용 클릭 → 로딩 스켈레톤 → 결과 스트리밍

칩 제거 → 해당 필터만 제거 후 즉시 재쿼리

새로고침 → 동일 필터로 재생성(무제한), 로깅 남김

카드 클릭 → /property/[caseId] 이동, 스크롤 위치 저장

8) 로깅/분석

filter_apply, filter_reset, refresh_click, card_open, guide_preset_apply

공통 파라미터: filters, resultCount, latency, snapshotAt

9) 접근성

필터·정렬 키보드 포커스 스타일

칩 제거 버튼에 aria-label

캐러셀에 aria-roledescription="carousel" 및 aria-live="polite"

10) QA 체크리스트

 초기 로드 성능(2.5s 이하) / CLS 없음

 필터 적용 후 스크롤 위치 보존

 모바일 시트 적용/닫힘, 캐러셀 스와이프·인디케이터 동작

 카드 숫자 포맷(원 단위, 탭룰러)·배지 일관

 빈/에러/스켈레톤 상태 표준화

11) 마이그레이션

기존 /app/page.tsx 보존(/legacy)

새 구성에 Feature Flag

1~2주 AB 비교(체류, 카드 클릭률, 필터 적용률) 후 전환

12) 일정(안)

D+2: IA/와이어, 공통 카드/필터 타입 정의

D+5: Hero/Activity/FilterBar/ActiveChips

D+8: Grid/Carousel/QuickGuides/상태처리

D+10: 성능/접근성/분석, QA 1차 → AB 병행


다음 단계에선 이 `listview.md` 기준으로 컴포넌트 스켈레톤과 타입, 목데이터(JSON 3종: 정상/빈/에러)를 바로