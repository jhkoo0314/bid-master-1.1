/**
 * 구글 시트 연결 테스트 API
 */

import { NextRequest, NextResponse } from "next/server";
import { addWaitlistToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  console.log("🧪 [테스트] 구글 시트 연결 테스트 시작");

  try {
    const body = await request.json();
    const { name, email } = body;

    console.log(`🧪 [테스트] 테스트 데이터: ${name}, ${email}`);

    // 구글 시트에 데이터 저장 시도
    const result = await addWaitlistToSheet(name, email);

    console.log("🧪 [테스트] 결과:", result);

    return NextResponse.json({
      success: true,
      message: "테스트 완료",
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🧪 [테스트] 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "테스트 실패",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
