# Bid Master — pointplan.md (v1.1, Dashboard Integration Update)
경매 시뮬레이션의 **포인트·레벨·랭킹·대시보드 구조**를 통합 정의한 문서입니다.  
이번 버전은 **UI(대시보드)**를 먼저 구축하고, 이후 **게임 기능 로직**을 점진적으로 연동하는 개발 순서를 포함합니다.

---

## 1) 개발 순서 개요
**추천 순서:**
1. **대시보드 구현 (UI Layer)**  
   - 시뮬레이션 상태, 추천매물, 미션, 필터바 구성  
   - 컴포넌트: `DashboardHeader.tsx`, `DashboardStats.tsx`, `Leaderboard.tsx`
2. **로컬 상태 연동 (Local State Layer)**  
   - `useState`와 `useEffect`로 XP, 포인트, 정확도, 수익률 저장  
   - `localStorage`에 persist (로그인 필요 없음)
3. **게임 로직 연결 (Logic Layer)**  
   - pointplan의 수식(`P = Base × D × S × C × A × V × R + Bonus − Penalty`)을 계산 함수로 구현  
   - `calcPoint()`, `calcAccuracy()`, `calcRPDelta()` 함수 생성  
4. **백엔드 연동 (Data Layer)**  
   - Supabase 또는 Firebase 연결 (선택 사항)
   - 유저별 시즌 기록, 리더보드, 업적 저장

---

## 2) 대시보드 설계 요약
대시보드는 pointplan의 핵심 데이터를 시각화하는 HUD(Head-Up Display) 역할을 합니다.

**대시보드 주요 섹션**
| 영역 | 표시 내용 | 관련 데이터 | 소스 |
|------|------------|--------------|------|
| 시뮬레이션 상태 | 레벨, 포인트, 정확도, 수익률 | XP, P, A | localStorage / Supabase |
| 추천 매물 | 난이도·희소성 기반 추천 | D, S, C | 로컬 추천 알고리즘 |
| 오늘의 미션 | 일일/주간 미션 진행률 | Mission Log | localStorage |
| 필터바 | 매물유형/지역 선택 | UI 전용 | — |

**컴포넌트 구조 예시**
```
<App>
 ├─ <DashboardHeader />   // 상단 대시보드
 ├─ <BidSimulation />     // 메인 게임 로직
 └─ <Leaderboard />       // 시즌 리더보드
```

---

## 3) 로컬 상태 관리
로그인 없이 시뮬레이션 데이터를 유지하기 위해 브라우저에 저장합니다.

```tsx
const [points, setPoints] = useState(() => Number(localStorage.getItem('points')) || 0);
const [xp, setXp] = useState(() => Number(localStorage.getItem('xp')) || 0);
const [accuracy, setAccuracy] = useState(() => Number(localStorage.getItem('accuracy')) || 0);
const [roi, setRoi] = useState(() => Number(localStorage.getItem('roi')) || 0);

useEffect(() => {
  localStorage.setItem('points', points.toString());
  localStorage.setItem('xp', xp.toString());
  localStorage.setItem('accuracy', accuracy.toString());
  localStorage.setItem('roi', roi.toString());
}, [points, xp, accuracy, roi]);
```

> 나중에 Supabase로 전환 시 동일 키 구조(`points`, `xp`, `accuracy`, `roi`)로 서버 저장 가능.

---

## 4) 포인트 계산 공식 (요약 재확인)
**기본식**
```
P = Base × D × S × C × A × V × R + Bonus − Penalty
```
이 수식은 pointplan의 핵심 게임 로직이며, 대시보드에는 계산 결과만 표시합니다.

함수 예시:
```tsx
function calcPoint({ base, D, S, C, A, V, R, bonus, penalty }) {
  return Math.round(base * D * S * C * A * V * R + bonus - penalty);
}
```

---

## 5) 시각화 지표
대시보드의 각 수치는 아래 항목을 반영합니다.

| 항목 | 데이터 출처 | 표시 방식 |
|------|---------------|-----------|
| 누적 포인트 | calcPoint() 누적값 | 숫자 |
| 정확도 | calcAccuracy() 결과 | % |
| 수익률 | ROI 계산 | % |
| 레벨 | XP / 레벨 공식 | Lv 표시 |
| 미션 완료도 | mission_logs | progress bar (optional) |

---

## 6) 필터바 축소 기준
- 높이 50~60px 이하 유지
- `select` 요소 2~3개 이내
- padding: `px-2 py-1`
- 버튼 크기: `px-3 py-1`, `text-sm`
- flex-wrap 허용으로 반응형 대응

---

## 7) 로컬 시뮬레이션 데이터 구조
```js
userData = {
  points: 1240,
  xp: 920,
  accuracy: 0.86,
  roi: 0.048,
  missions: {
    daily: { done: 2, total: 3 },
    weekly: { done: 1, total: 2 }
  },
  level: 3
}
```

---

## 8) 전체 로드맵
1️⃣ UI (DashboardHeader + Filter) →  
2️⃣ 로컬 상태 관리 →  
3️⃣ 포인트 계산 로직 →  
4️⃣ 리더보드 및 시즌 데이터 →  
5️⃣ Supabase 연동 및 분석 대시보드.

---

## 9) 버전 이력
- v1.0 (2025-10-28): 기본 포인트·레벨·랭크 시스템 정의  
- v1.1 (2025-10-29): 대시보드 우선 개발 순서 및 로컬 상태 관리 추가
