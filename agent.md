# Bid Master AI - 프로젝트 정리 문서

## 📋 프로젝트 개요

**Bid Master AI**는 AI를 통해 무한 생성되는 실전 경매 훈련장입니다. 로그인 없이 즉시 시작할 수 있는 경매 시뮬레이션 플랫폼으로, OpenAI를 활용하여 실제 법원 경매와 구별이 불가능한 가상 매물을 무한히 생성하고, 사용자는 권리분석부터 입찰까지 전 과정을 체험하며 경매의 본질을 학습할 수 있습니다.

## 🎯 핵심 목표

- **AI 기반 교육용 매물 무한 생성**: 실제 법원 경매 정보와 구별이 불가능할 정도로 정교한 가상 매물 생성
- **로그인 없는 즉시 체험**: 어떠한 회원가입 절차도 없이 사이트 방문 즉시 시뮬레이션에 몰입
- **경매의 본질 체험**: 권리분석부터 입찰까지 전 과정을 통한 경매 이해

## 🛠 기술 스택

### Core

- **Next.js 15** (App Router, React Compiler)
- **TypeScript**
- **Tailwind CSS**

### State Management

- **Zustand** (with persist middleware)

### AI & APIs

- **OpenAI API** (GPT-4o)
- **Google Sheets API** (사전 알림 신청)
- **Gmail API** (확인 메일 발송)
- **Unsplash API** (매물 이미지 생성)

### Animation & Charts

- **Framer Motion**
- **Recharts**

### Future Plans

- **Supabase** (PostgreSQL, Edge Functions)
- **Clerk** (Authentication)

## 📁 프로젝트 구조

```
bid-master-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/            # 서버 액션
│   │   │   ├── generate-property.ts      # 매물 생성
│   │   │   ├── generate-simulation.ts    # 시뮬레이션 생성
│   │   │   └── submit-waitlist.ts        # 사전 알림 신청
│   │   ├── api/                # API 엔드포인트
│   │   │   ├── sheets/write/            # 구글 시트 쓰기
│   │   │   ├── test-read/route.ts       # 데이터 읽기 테스트
│   │   │   ├── test-sheets/route.ts     # 구글 시트 연결 테스트
│   │   │   ├── test-simple/route.ts     # 로컬 파일 저장 테스트
│   │   │   └── test-waitlist/route.ts   # 사전 알림 테스트
│   │   ├── calculator/         # 수익 계산기 페이지
│   │   ├── property/[id]/      # 매물 상세 페이지
│   │   ├── simulation/[id]/    # 시뮬레이션 페이지
│   │   ├── test-sheets/        # 구글 시트 테스트 페이지
│   │   ├── test-simple/        # 간단한 테스트 페이지
│   │   ├── test-images/        # 이미지 테스트 페이지
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 메인 페이지
│   ├── components/             # UI 컴포넌트
│   │   ├── AuctionAnalysisModal.tsx      # 경매 분석 모달
│   │   ├── BiddingModal.tsx              # 입찰 모달
│   │   ├── DevModeToggle.tsx             # 개발자 모드 토글
│   │   ├── ProfitCalculator.tsx          # 수익 계산기
│   │   ├── PropertyCard.tsx              # 매물 카드
│   │   ├── PropertyFilter.tsx            # 매물 필터
│   │   └── WaitlistModal.tsx             # 사전 알림 모달
│   ├── lib/                    # 핵심 로직
│   │   ├── format-utils.ts     # 포맷 유틸리티
│   │   ├── google-sheets.ts   # 구글 시트 연동
│   │   ├── openai-client.ts    # AI 매물 생성
│   │   ├── profit-calculator.ts # 수익 계산
│   │   ├── regional-analysis.ts # 지역분석
│   │   ├── rights-analysis-engine.ts # 권리분석 엔진
│   │   └── unsplash-client.ts  # Unsplash 이미지 API
│   ├── store/                  # 상태 관리
│   │   └── simulation-store.ts # 시뮬레이션 상태
│   └── types/                  # 타입 정의
│       └── simulation.ts       # 시뮬레이션 타입
├── docs/                       # 미래 계획 문서
│   ├── future-supabase-schema.md
│   └── future-clerk-integration.md
├── bid-master-v1-sheet-mcp.json # 구글 서비스 계정 키
├── waitlist-data.json         # 사전 알림 데이터 (로컬)
└── README.md
```

## 🎮 주요 기능

### 1. AI 기반 교육용 매물 생성

- **단계별 난이도**: 초급 3개 + 중급 2개 + 고급 2개
- **실제 시세 반영**: 대한민국 부동산 시장의 현실적인 가격 적용
- **3단계 교육 콘텐츠**:
  - 한 줄 요약
  - 핵심 분석 (학습 목표, 주목할 포인트, 리스크, 전략)
  - 단계별 분석 가이드 (권리분석 → 임차인 → 입찰가 → 리스크)

### 2. 권리분석 엔진

- **말소기준권리 자동 판단**
- **권리 인수/소멸 여부 계산**
- **임차인 대항력 분석**
- **안전 마진 계산**
- **권장 입찰가 범위 제시**

### 3. 수익 계산기

- 총 투자금액 계산 (낙찰가 + 인수권리 + 명도비용 + 세금)
- 예상 수익 및 ROI 계산
- 손익분기점 분석
- 비용 구성 상세 표시

### 4. 개발자 모드

- 일반 모드: 매물 생성 10회 제한
- 개발자 모드: 무제한 생성 + 디버그 정보 표시

### 5. 사전 알림 시스템

- **Google Sheets 연동**: 사전 알림 신청 데이터를 구글 시트에 자동 저장
- **로컬 백업**: 구글 시트 연결 실패 시 로컬 파일(`waitlist-data.json`)에 백업 저장
- **이메일 확인**: Gmail API를 통한 신청 확인 메일 발송
- **테스트 페이지**: 개발자용 테스트 페이지로 시스템 검증 가능

### 6. 이미지 통합 시스템

- **Unsplash API 연동**: 매물별 고품질 이미지 자동 생성
- **이미지 테스트**: `/test-images` - Unsplash API 연결 및 이미지 생성 테스트
- **동적 이미지 로딩**: 매물 유형별 맞춤형 이미지 검색
- **이미지 캐싱**: 성능 최적화를 위한 이미지 캐싱 시스템

### 7. 테스트 및 디버깅 도구

- **구글 시트 테스트**: `/test-sheets` - 구글 시트 연결 상태 확인
- **로컬 저장 테스트**: `/test-simple` - 로컬 파일 저장 기능 테스트
- **이미지 테스트**: `/test-images` - Unsplash API 및 이미지 생성 테스트
- **API 테스트**: 각종 API 엔드포인트별 개별 테스트 가능
- **실시간 로그**: 모든 핵심 기능에 상세한 로그 기록

## 📊 핵심 컴포넌트 분석

### 1. 시뮬레이션 상태 관리 (`src/store/simulation-store.ts`)

```typescript
interface SimulationStore {
  // 현재 시뮬레이션
  currentScenario: SimulationScenario | null;
  setCurrentScenario: (scenario: SimulationScenario | null) => void;

  // 사용자 입찰가
  userBidPrice: number | null;
  setUserBidPrice: (price: number | null) => void;

  // 개발자 모드
  devMode: DevModeState;
  toggleDevMode: () => void;
  incrementRefreshCount: () => void;
  incrementSimulationCount: () => void;
  resetCounts: () => void;

  // 교육용 매물 목록 (메인 페이지)
  educationalProperties: SimulationScenario[];
  setEducationalProperties: (properties: SimulationScenario[]) => void;
}
```

### 2. 권리분석 엔진 (`src/lib/rights-analysis-engine.ts`)

핵심 기능:

- **말소기준권리 판단**: 배당요구종기일 이전에 설정된 최선순위 권리
- **권리 인수/소멸 판단**: 말소기준권리보다 선순위는 인수, 후순위는 소멸
- **임차인 대항력 판단**: 전입일과 확정일자 요건 충족 여부
- **안전 마진 계산**: 인수해야 할 권리와 임차보증금 총액

### 3. AI 매물 생성 (`src/lib/openai-client.ts`)

- **교육용 매물 생성**: 난이도별 맞춤형 교육 콘텐츠 포함
- **시뮬레이션용 매물 생성**: 실전 입찰 훈련용 현실적 데이터
- **개발 모드 지원**: API 키 없이도 더미 데이터로 작동

### 4. 매물 카드 컴포넌트 (`src/components/PropertyCard.tsx`)

- 난이도별 색상 구분 (초급: 녹색, 중급: 노란색, 고급: 빨간색)
- 용어 설명 툴팁 (호버 시 법률 용어 설명 표시)
- 입찰 모달 연동

### 5. Google Sheets 연동 (`src/lib/google-sheets.ts`)

핵심 기능:

- **서비스 계정 인증**: JSON 키 파일을 통한 구글 API 인증
- **자동 시트 생성**: 사전 알림 데이터용 시트 자동 생성
- **데이터 저장**: 이름, 이메일, 타임스탬프를 구글 시트에 저장
- **에러 처리**: 연결 실패 시 로컬 파일로 백업 저장
- **로깅**: 모든 작업에 상세한 로그 기록

### 6. Unsplash 이미지 클라이언트 (`src/lib/unsplash-client.ts`)

핵심 기능:

- **API 연동**: Unsplash API를 통한 고품질 이미지 검색
- **매물별 이미지**: 매물 유형에 맞는 맞춤형 이미지 검색
- **성능 최적화**: 이미지 크기 및 품질 최적화
- **에러 처리**: API 실패 시 기본 이미지로 대체

### 7. 사전 알림 시스템 (`src/app/actions/submit-waitlist.ts`)

- **이중 저장**: 구글 시트 + 로컬 파일 동시 저장
- **이메일 발송**: Gmail API를 통한 확인 메일 자동 발송
- **데이터 검증**: 이메일 형식 및 필수 필드 검증
- **에러 복구**: 구글 시트 실패 시에도 로컬 저장으로 서비스 지속

## 🔍 핵심 로직

### 1. 매물 생성 프로세스

1. **필터링**: 사용자 선택 조건에 따른 매물 유형/지역/가격 필터링
2. **템플릿 선택**: 매물 유형별 사전 정의된 템플릿에서 랜덤 선택
3. **가격 생성**: 현실적인 부동산 시세를 반영한 가격 범위 생성
4. **권리/임차인 생성**: 난이도별 복잡도에 따른 권리 구조 생성
5. **권리분석**: 권리분석 엔진을 통한 말소기준권리 판단 및 인수/소멸 여부 계산
6. **교육 콘텐츠**: 매물별 맞춤형 교육 콘텐츠 생성

### 2. 권리분석 엔진 로직

```typescript
// 말소기준권리 판단
const malsoBaseRight = determineMalsoBaseRight(rights, dividendDeadline);

// 권리 인수/소멸 판단
const analyzedRights = determineRightStatus(rights, malsoBaseRight);

// 임차인 대항력 판단
const analyzedTenants = determineTenantDaehangryeok(
  tenants,
  malsoBaseRight,
  dividendDeadline
);

// 안전 마진 계산
const safetyMargin = calculateSafetyMargin(analyzedRights, analyzedTenants);
```

### 3. 개발자 모드

- **일반 모드**: 매물 생성 10회 제한으로 사전 알림 유도
- **개발자 모드**: 무제한 생성 + 디버그 정보 표시
- **상태 관리**: Zustand persist로 브라우저 새로고침 시에도 상태 유지

### 4. 사전 알림 시스템 프로세스

```typescript
// 사전 알림 신청 플로우
1. 사용자 정보 입력 (이름, 이메일)
2. 데이터 검증 (이메일 형식, 필수 필드)
3. 구글 시트 저장 시도
4. 로컬 파일 백업 저장
5. Gmail API로 확인 메일 발송
6. 결과 반환 (성공/실패 상태)
```

### 5. 이미지 생성 시스템

```typescript
// Unsplash 이미지 검색 프로세스
1. 매물 유형별 검색 키워드 생성
2. Unsplash API 호출 (고품질 이미지 검색)
3. 이미지 최적화 (크기, 품질 조정)
4. 캐싱 및 에러 처리
5. 매물 카드에 이미지 적용
```

### 6. 테스트 시스템

- **구글 시트 테스트**: `/test-sheets` - 구글 시트 연결 및 데이터 저장 테스트
- **로컬 저장 테스트**: `/test-simple` - 로컬 파일 저장 기능 테스트
- **이미지 테스트**: `/test-images` - Unsplash API 및 이미지 생성 테스트
- **API 개별 테스트**: 각 엔드포인트별 독립적인 테스트 가능
- **실시간 모니터링**: 모든 테스트에 상세한 로그 및 결과 표시

## 📈 MVP 성공 지표

- **활성화 (Activation)**: 신규 방문자 중 24시간 내 시뮬레이션 1회 이상 완료
- **유지 (Retention)**: 일간 재방문율 (Day 1 Retention)
- **잠재고객 전환 (Lead Conversion)**: 사전 알림 신청 완료 비율

## 🔮 미래 계획

### Phase 1: MVP (현재)

- ✅ 익명 사용자 경매 시뮬레이션
- ✅ AI 기반 교육용 매물 생성
- ✅ 권리분석 엔진
- ✅ 수익 계산기
- ✅ 사전 알림 시스템 (구글 시트 + 로컬 백업)
- ✅ 이메일 확인 시스템 (Gmail API)
- ✅ Unsplash 이미지 통합 시스템
- ✅ 이미지 테스트 및 디버깅 도구
- ✅ 테스트 및 디버깅 도구
- ✅ 상세한 로깅 시스템

### Phase 2: 사용자 인증 (Clerk)

- [ ] 이메일/소셜 로그인
- [ ] 시뮬레이션 이력 저장
- [ ] 개인화된 학습 경로

### Phase 3: 데이터베이스 (Supabase)

- [ ] PostgreSQL 데이터베이스
- [ ] Edge Functions
- [ ] Row Level Security (RLS)

### Phase 4: 유료 구독 모델

- [ ] AI 스마트 리포트 (A4 1장 분량)
- [ ] 상세 권리분석 해설
- [ ] 입찰 전략 제안
- [ ] PDF 다운로드

## 🔒 보안

### Git 보안

- `.env` 및 `.env.local` 파일은 **절대 Git에 커밋하지 않습니다**
- `.gitignore`에 환경 변수 파일 보호 규칙 추가됨

### Cursor IDE 보안

- `.cursorignore` 파일로 환경 변수 파일을 Cursor AI 컨텍스트에서 제외
- 개발 시 `@` 컨텍스트에 `.env` 파일을 절대 포함하지 마세요

## 🚀 배포

### Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정 (`.env.example` 참고)
3. 자동 배포 완료

### 환경 변수 체크리스트

- [ ] `OPENAI_API_KEY` - OpenAI API 키 (필수)
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` - 구글 시트 ID (사전 알림용)
- [ ] `GMAIL_FROM_EMAIL` - Gmail 발송자 이메일 (확인 메일용)
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` - 구글 서비스 계정 JSON (선택사항)
- [ ] `UNSPLASH_ACCESS_KEY` - Unsplash API 키 (이미지 생성용)
- [ ] `NEXT_PUBLIC_DEV_MODE` - 개발자 모드 활성화 (선택사항)

## 📝 개발 가이드

### 핵심 로그 규칙

- 웹사이트의 핵심적인 기능이나 사용자가 추가해달라고 한 코드를 작성할 때는 항상 핵심적인 부분에 로그를 남겨줘
- 에러를 해결해 달라고 요청할 때 chrome dev mcp를 열어서 스크린샷, 웹사이트 로그를 사용해줘
- pnpm run dev 와 같이 서버를 실행시키는 명령어는 실행하지 말고 실행을 원하면 사용자에게 반드시 물어봐
- 나는 비개발자이고 초보야. 최대한 이해하기 쉽게 설명해
- 항상 한국어로 대답해

### 주요 로그 포인트

1. **매물 생성**: AI 생성 시작/완료, 토큰 사용량
2. **권리분석**: 말소기준권리 판단, 대항력 계산 결과
3. **이미지 생성**: Unsplash API 호출, 이미지 검색 결과
4. **사용자 액션**: 필터 적용, 입찰 시도, 새로고침
5. **에러 처리**: API 실패, 검증 오류, 네트워크 문제
6. **사전 알림**: 구글 시트 저장, 로컬 백업, 이메일 발송
7. **테스트 시스템**: 각종 API 테스트 결과 및 성능 지표

### 로그 형식 예시

```typescript
// 매물 생성 로그
console.log("🏠 [매물 생성] AI 매물 생성 시작");
console.log("🏠 [매물 생성] 생성 완료 - 토큰 사용량: 1,250");

// 권리분석 로그
console.log("⚖️ [권리분석] 말소기준권리 판단 완료");
console.log("⚖️ [권리분석] 대항력 계산 결과: 임차인 2명 인수");

// 이미지 생성 로그
console.log("🖼️ [이미지 생성] Unsplash API 호출 시작");
console.log("🖼️ [이미지 생성] 이미지 검색 완료 - 매물 유형: 아파트");

// 사전 알림 로그
console.log("📧 [사전 알림] 구글 시트 저장 성공");
console.log("📧 [사전 알림] 확인 메일 발송 완료");

// 테스트 로그
console.log("🧪 [테스트] 구글 시트 연결 테스트 시작");
console.log("🧪 [테스트] 테스트 완료 - 응답시간: 2.3초");
```

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ by Bid Master AI Team**
