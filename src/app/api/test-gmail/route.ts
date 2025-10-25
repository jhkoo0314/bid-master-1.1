/**
 * Gmail API 연결 테스트 API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  testGmailConnection,
  sendWaitlistConfirmationEmail,
} from "@/lib/gmail-client";

export async function GET(request: NextRequest) {
  console.log("🧪 [Gmail 테스트] Gmail API 연결 테스트 시작");

  try {
    // Gmail API 연결 테스트
    const connectionResult = await testGmailConnection();

    console.log("🧪 [Gmail 테스트] 연결 테스트 결과:", connectionResult);

    return NextResponse.json({
      success: true,
      message: "Gmail API 연결 테스트 완료",
      connection: connectionResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🧪 [Gmail 테스트] 연결 테스트 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gmail API 연결 테스트 실패",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("🧪 [Gmail 테스트] Gmail 이메일 발송 테스트 시작");

  try {
    const body = await request.json();
    const { name, email } = body;

    console.log(`🧪 [Gmail 테스트] 테스트 데이터: ${name}, ${email}`);

    // Gmail 이메일 발송 테스트
    const emailResult = await sendWaitlistConfirmationEmail(name, email);

    console.log("🧪 [Gmail 테스트] 이메일 발송 결과:", emailResult);

    return NextResponse.json({
      success: true,
      message: "Gmail 이메일 발송 테스트 완료",
      emailResult: emailResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🧪 [Gmail 테스트] 이메일 발송 테스트 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gmail 이메일 발송 테스트 실패",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
