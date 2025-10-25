/**
 * 구글 시트 읽기 테스트 API
 */

import { NextRequest, NextResponse } from "next/server";
import { readSheetData } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  console.log("🧪 [읽기 테스트] 구글 시트 읽기 테스트 시작");

  try {
    // 구글 시트에서 데이터 읽기 시도
    const data = await readSheetData();

    console.log("🧪 [읽기 테스트] 결과:", data);

    return NextResponse.json({
      success: true,
      message: "읽기 테스트 완료",
      data: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🧪 [읽기 테스트] 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "읽기 테스트 실패",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
