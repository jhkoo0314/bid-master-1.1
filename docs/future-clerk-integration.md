# Clerk 인증 통합 가이드 (미래 계획)

> **주의**: 이 문서는 MVP 성공 후 Clerk 도입 시 참고할 가이드입니다.
> 현재 MVP 단계에서는 구현하지 않습니다.

## Clerk 도입 목적

MVP에서는 익명 사용자가 로그인 없이 시뮬레이션을 체험할 수 있습니다.
MVP 성공 후, Clerk을 도입하여 다음 기능을 제공합니다:

1. **사용자 인증**: 이메일, 소셜 로그인 (Google, Kakao 등)
2. **시뮬레이션 이력 저장**: 로그인한 사용자의 학습 기록 관리
3. **개인화된 학습 경로**: 사용자별 맞춤 추천
4. **유료 구독 모델**: AI 스마트 리포트 구독 서비스

## 설치 및 설정

### 1. Clerk 설치

```bash
npm install @clerk/nextjs
```

### 2. 환경 변수 설정

`.env.local` 파일에 Clerk 키 추가:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 3. Clerk Provider 추가

`src/app/layout.tsx` 업데이트:

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 4. 미들웨어 설정

`src/middleware.ts` 생성:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 공개 경로 정의 (로그인 불필요)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/property/(.*)",
  "/guides(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // 공개 경로가 아니면 인증 필요
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

## 주요 컴포넌트 업데이트

### 1. 헤더에 사용자 메뉴 추가

```typescript
// src/components/Header.tsx

"use client";

import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bid Master AI</h1>

        <div>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                로그인
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
```

### 2. 시뮬레이션 저장 기능 추가

```typescript
// src/app/actions/save-simulation.ts

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function saveSimulation(
  scenarioData: SimulationScenario,
  userBidPrice: number,
  analysisResult: RightsAnalysisResult
) {
  // Clerk 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  // Supabase에 저장
  const supabase = createClient();

  // clerk_user_id로 users 테이블에서 user_id 조회
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!user) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }

  // 시뮬레이션 저장
  const { error } = await supabase.from("simulations").insert({
    user_id: user.id,
    scenario_data: scenarioData,
    user_bid_price: userBidPrice,
    is_success: userBidPrice >= analysisResult.recommendedBidRange.min,
    analysis_result: analysisResult,
  });

  if (error) {
    throw new Error("시뮬레이션 저장에 실패했습니다.");
  }

  return { success: true };
}
```

### 3. 사용자 대시보드 페이지

```typescript
// src/app/dashboard/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = createClient();

  // 사용자의 시뮬레이션 이력 조회
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  const { data: simulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("user_id", user?.id)
    .order("completed_at", { ascending: false })
    .limit(10);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">내 학습 이력</h1>

      {/* 시뮬레이션 이력 표시 */}
      <div className="space-y-4">
        {simulations?.map((sim) => (
          <div key={sim.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold">
              {sim.scenario_data.basicInfo.caseNumber}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(sim.completed_at).toLocaleDateString()}
            </p>
            <p
              className={`text-sm ${
                sim.is_success ? "text-green-600" : "text-red-600"
              }`}
            >
              {sim.is_success ? "낙찰 성공" : "유찰"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Supabase와의 연동

### 1. Clerk Webhook 설정

Clerk 대시보드에서 Webhook 설정:

- Endpoint: `https://your-project.supabase.co/functions/v1/clerk-webhook`
- Events: `user.created`, `user.updated`, `user.deleted`

### 2. Webhook Handler (Supabase Edge Function)

```typescript
// supabase/functions/clerk-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.4.9";

serve(async (req) => {
  const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET")!;
  const svix = new Webhook(webhookSecret);

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event;
  try {
    event = svix.verify(payload, headers);
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  switch (event.type) {
    case "user.created":
      await supabase.from("users").insert({
        clerk_user_id: event.data.id,
        email: event.data.email_addresses[0].email_address,
        name: event.data.first_name + " " + event.data.last_name,
      });
      break;

    case "user.updated":
      await supabase
        .from("users")
        .update({
          email: event.data.email_addresses[0].email_address,
          name: event.data.first_name + " " + event.data.last_name,
        })
        .eq("clerk_user_id", event.data.id);
      break;

    case "user.deleted":
      await supabase.from("users").delete().eq("clerk_user_id", event.data.id);
      break;
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## 마이그레이션 체크리스트

- [ ] Clerk 계정 생성 및 애플리케이션 설정
- [ ] `@clerk/nextjs` 패키지 설치
- [ ] 환경 변수 설정
- [ ] `layout.tsx`에 ClerkProvider 추가
- [ ] `middleware.ts` 생성 및 인증 라우트 설정
- [ ] Supabase users 테이블 생성
- [ ] Clerk Webhook 설정
- [ ] Webhook Handler Edge Function 배포
- [ ] 로그인/회원가입 페이지 디자인
- [ ] 사용자 대시보드 구현
- [ ] 시뮬레이션 저장 기능 추가
- [ ] 기존 익명 사용자 데이터 마이그레이션 계획 수립
