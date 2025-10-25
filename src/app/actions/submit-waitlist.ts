/**
 * Bid Master AI - 사전 알림 신청 서버 액션
 */

"use server";

import { addWaitlistToSheet } from "@/lib/google-sheets";

/**
 * 사전 알림 신청을 처리합니다.
 * Google Sheets API와 Gmail API를 사용하여 데이터를 저장하고 확인 메일을 발송합니다.
 *
 * @param name 신청자 이름
 * @param email 신청자 이메일
 * @returns 성공 여부
 */
export async function submitWaitlist(
  name: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  console.log("📧 [사전 알림] 신청 요청");
  console.log(`  - 이름: ${name}`);
  console.log(`  - 이메일: ${email}`);

  try {
    // 입력 검증
    if (!name || !email) {
      throw new Error("이름과 이메일을 모두 입력해주세요.");
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("올바른 이메일 형식이 아닙니다.");
    }

    // Google Sheets API를 사용하여 데이터 저장
    console.log("📊 [Google Sheets] 데이터 저장 시도...");

    try {
      // 실제 구글 시트에 데이터 저장
      const sheetResult = await addWaitlistToSheet(name, email);

      if (!sheetResult.success) {
        throw new Error(sheetResult.message);
      }

      console.log("✅ [Google Sheets] 데이터 저장 완료");
      console.log(`  - 결과: ${sheetResult.message}`);
    } catch (sheetError) {
      console.error("❌ [Google Sheets] 저장 실패:", sheetError);
      throw new Error("데이터 저장 중 오류가 발생했습니다.");
    }

    // TODO: Gmail API를 사용하여 확인 메일 발송
    console.log("📧 [Gmail] 확인 메일 발송 시도...");
    console.log("  ⚠️ Gmail API가 설정되지 않았습니다. 로그만 기록합니다.");

    console.log("✅ [사전 알림] 신청 완료 (시뮬레이션)");

    return {
      success: true,
      message:
        "사전 알림 신청이 완료되었습니다! 정식 출시되면 이메일로 알려드리겠습니다.",
    };
  } catch (error) {
    console.error("❌ [사전 알림] 신청 실패:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}
