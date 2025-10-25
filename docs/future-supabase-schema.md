# Supabase 스키마 (미래 계획)

> **주의**: 이 문서는 MVP 성공 후 Supabase 도입 시 참고할 스키마 문서입니다.
> 현재 MVP 단계에서는 구현하지 않습니다.

## 데이터베이스 스키마

### 1. users 테이블

사용자 정보를 저장합니다. (Clerk 인증과 연동)

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk의 사용자 ID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own data"
    ON public.users
    FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 사용자는 자신의 데이터만 업데이트 가능
CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### 2. simulations 테이블

사용자가 완료한 시뮬레이션 이력을 저장합니다.

```sql
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scenario_data JSONB NOT NULL, -- SimulationScenario 전체 데이터
    user_bid_price BIGINT NOT NULL, -- 사용자 입찰가
    is_success BOOLEAN NOT NULL, -- 낙찰 성공 여부
    analysis_result JSONB NOT NULL, -- RightsAnalysisResult 데이터
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX idx_simulations_completed_at ON public.simulations(completed_at DESC);

-- RLS 정책
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 시뮬레이션만 조회 가능
CREATE POLICY "Users can view own simulations"
    ON public.simulations
    FOR SELECT
    USING (user_id IN (
        SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- 사용자는 자신의 시뮬레이션만 생성 가능
CREATE POLICY "Users can create own simulations"
    ON public.simulations
    FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));
```

### 3. guides 테이블

학습 가이드 콘텐츠를 저장합니다.

```sql
CREATE TABLE public.guides (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL, -- URL 경로 (예: "malso-base-right")
    title TEXT NOT NULL, -- 가이드 제목
    category TEXT NOT NULL, -- 카테고리 (예: "권리분석", "입찰전략")
    content TEXT NOT NULL, -- MDX 콘텐츠
    order_index INTEGER DEFAULT 0, -- 정렬 순서
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_guides_category ON public.guides(category);
CREATE INDEX idx_guides_order_index ON public.guides(order_index);

-- RLS 정책 (공개 읽기)
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 가이드 조회 가능
CREATE POLICY "Guides are publicly readable"
    ON public.guides
    FOR SELECT
    USING (true);
```

### 4. waitlist 테이블

사전 알림 신청자 정보를 저장합니다.

```sql
CREATE TABLE public.waitlist (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- RLS 정책
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 공개 삽입 가능 (익명 사용자도 신청 가능)
CREATE POLICY "Anyone can join waitlist"
    ON public.waitlist
    FOR INSERT
    WITH CHECK (true);
```

## Edge Functions

### 1. generate-simulation

AI를 통해 시뮬레이션 시나리오를 생성합니다.

```typescript
// supabase/functions/generate-simulation/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Clerk JWT 검증
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // OpenAI API 호출
  // rights-analysis-engine으로 검증
  // 결과 반환

  return new Response(JSON.stringify({ scenario }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 2. add-to-waitlist

사전 알림 신청을 처리합니다.

```typescript
// supabase/functions/add-to-waitlist/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { name, email } = await req.json();

  // Supabase에 저장
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.from("waitlist").insert({ name, email });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  // Gmail API로 확인 메일 발송

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## 마이그레이션 계획

1. **Supabase 프로젝트 생성**
2. **위 스키마 DDL 실행**
3. **Edge Functions 배포**
4. **환경 변수 설정**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. **프론트엔드 코드 업데이트**
   - `@supabase/supabase-js` 설치
   - 서버 액션을 Edge Function 호출로 변경
   - 시뮬레이션 이력 저장 기능 추가
