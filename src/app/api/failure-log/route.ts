import { NextRequest, NextResponse } from "next/server";

// 실패기록 타입 정의
interface FailureLog {
  id: string;
  timestamp: string;
  testType: string;
  errorMessage: string;
  userAgent: string;
  ipAddress: string;
  details: any;
}

// 메모리 기반 실패기록 저장소 (실제 환경에서는 데이터베이스 사용)
let failureLogs: FailureLog[] = [];

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [실패기록] 새로운 실패기록 저장 요청");

    const body = await request.json();
    const { testType, errorMessage, details } = body;

    // 클라이언트 IP 주소 가져오기
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // User-Agent 가져오기
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 새로운 실패기록 생성
    const newFailureLog: FailureLog = {
      id: `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      testType,
      errorMessage,
      userAgent,
      ipAddress,
      details: details || {},
    };

    // 실패기록 저장
    failureLogs.push(newFailureLog);

    // 최대 100개까지만 보관 (메모리 절약)
    if (failureLogs.length > 100) {
      failureLogs = failureLogs.slice(-100);
    }

    console.log("✅ [실패기록] 실패기록 저장 완료:", newFailureLog.id);

    return NextResponse.json({
      success: true,
      message: "실패기록이 저장되었습니다",
      failureLogId: newFailureLog.id,
    });
  } catch (error) {
    console.error("❌ [실패기록] 실패기록 저장 오류:", error);
    return NextResponse.json(
      { success: false, error: "실패기록 저장에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("📋 [실패기록] 실패기록 목록 조회 요청");

    // 최신 순으로 정렬
    const sortedLogs = failureLogs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 50); // 최근 50개만 반환

    console.log(`✅ [실패기록] ${sortedLogs.length}개 실패기록 반환`);

    return NextResponse.json({
      success: true,
      logs: sortedLogs,
      totalCount: failureLogs.length,
    });
  } catch (error) {
    console.error("❌ [실패기록] 실패기록 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "실패기록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log("🗑️ [실패기록] 모든 실패기록 삭제 요청");

    failureLogs = [];

    console.log("✅ [실패기록] 모든 실패기록 삭제 완료");

    return NextResponse.json({
      success: true,
      message: "모든 실패기록이 삭제되었습니다",
    });
  } catch (error) {
    console.error("❌ [실패기록] 실패기록 삭제 오류:", error);
    return NextResponse.json(
      { success: false, error: "실패기록 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
