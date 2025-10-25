# Bid Master AI

> AI를 통해 무한 생성되는 실전 경매 훈련장

**Bid Master AI**는 로그인 없이 즉시 시작할 수 있는 경매 시뮬레이션 플랫폼입니다. OpenAI를 활용하여 실제 법원 경매와 구별이 불가능한 가상 매물을 무한히 생성하고, 사용자는 권리분석부터 입찰까지 전 과정을 체험하며 경매의 본질을 학습합니다.

## 🎯 프로젝트 목표

**"AI를 통해, 실제 법원 경매 정보와 구별이 불가능할 정도로 정교한 가상 매물을 무한히 생성한다. 사용자는 어떠한 회원가입 절차도 없이, 사이트 방문 즉시 시뮬레이션에 몰입하며 경매의 본질을 '체험'으로 이해하게 만든다."**

## ✨ 주요 기능

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

### Animation & Charts

- **Framer Motion**
- **Recharts**

### Future Plans

- **Supabase** (PostgreSQL, Edge Functions)
- **Clerk** (Authentication)

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/bid-master-ai.git
cd bid-master-ai
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```env
# OpenAI API (필수)
OPENAI_API_KEY=sk-proj-...

# Google Sheets API (사전 알림 신청용)
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Gmail API (확인 메일 발송용)
GMAIL_FROM_EMAIL=your-email@gmail.com

# 개발 모드 (선택)
NEXT_PUBLIC_DEV_MODE=false
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
bid-master-ai/
├── src/
│   ├── app/
│   │   ├── actions/              # 서버 액션
│   │   │   ├── generate-property.ts
│   │   │   ├── generate-simulation.ts
│   │   │   └── submit-waitlist.ts
│   │   ├── layout.tsx
│   │   └── page.tsx              # 메인 페이지
│   ├── components/               # UI 컴포넌트
│   │   ├── DevModeToggle.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── ProfitCalculator.tsx
│   │   └── WaitlistModal.tsx
│   ├── lib/                      # 핵심 로직
│   │   ├── openai-client.ts      # AI 매물 생성
│   │   ├── rights-analysis-engine.ts  # 권리분석 엔진
│   │   └── profit-calculator.ts  # 수익 계산
│   ├── store/                    # 상태 관리
│   │   └── simulation-store.ts
│   └── types/                    # 타입 정의
│       └── simulation.ts
├── docs/                         # 미래 계획 문서
│   ├── future-supabase-schema.md
│   └── future-clerk-integration.md
├── .env.example                  # 환경 변수 템플릿
├── .cursorignore                 # Cursor AI 보안 설정
└── README.md
```

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

- [ ] `OPENAI_API_KEY`
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID`
- [ ] `GMAIL_FROM_EMAIL`

## 📊 MVP 성공 지표

- **활성화 (Activation)**: 신규 방문자 중 24시간 내 시뮬레이션 1회 이상 완료
- **유지 (Retention)**: 일간 재방문율 (Day 1 Retention)
- **잠재고객 전환 (Lead Conversion)**: 사전 알림 신청 완료 비율

## 🔮 미래 계획

### Phase 1: MVP (현재)

- ✅ 익명 사용자 경매 시뮬레이션
- ✅ AI 기반 교육용 매물 생성
- ✅ 권리분석 엔진
- ✅ 수익 계산기

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

## 📝 라이선스

MIT License

## 👥 기여

이 프로젝트는 현재 MVP 단계입니다. 기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ by Bid Master AI Team**
