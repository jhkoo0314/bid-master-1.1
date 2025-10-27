/**
 * 구글 시트 쓰기 API 엔드포인트
 * 서버 액션을 API로 노출하여 fetch 호출이 가능하도록 함
 */

import { NextRequest, NextResponse } from "next/server";
import { submitWaitlist } from "@/app/actions/submit-waitlist";

export async function POST(request: NextRequest) {
  try {
    console.log("📡 [API] 구글 시트 쓰기 요청 받음");

    const { name, email } = await request.json();

    // 입력 검증
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: "이름과 이메일을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 서버 액션 호출
    const result = await submitWaitlist(name, email);

    console.log("📡 [API] 서버 액션 결과:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [API] 서버 액션 호출 실패:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}




