/**
 * 사전 알림 신청 테스트 API
 */

import { NextRequest, NextResponse } from "next/server";
import { submitWaitlist } from "@/app/actions/submit-waitlist";

export async function POST(request: NextRequest) {
  console.log("🧪 [사전 알림 테스트] 사전 알림 신청 테스트 시작");

  try {
    const body = await request.json();
    const { name, email } = body;

    console.log(`🧪 [사전 알림 테스트] 테스트 데이터: ${name}, ${email}`);

    // 사전 알림 신청 시도
    const result = await submitWaitlist(name, email);

    console.log("🧪 [사전 알림 테스트] 결과:", result);

    return NextResponse.json({
      success: true,
      message: "사전 알림 테스트 완료",
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🧪 [사전 알림 테스트] 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "사전 알림 테스트 실패",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
