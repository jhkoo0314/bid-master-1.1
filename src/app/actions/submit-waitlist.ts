/**
 * Bid Master AI - 사전 알림 신청 서버 액션
 */

"use server";

import { addWaitlistToSheet } from "@/lib/google-sheets";
import { sendWaitlistConfirmationEmail } from "@/lib/gmail-client";

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

    // 1단계: 구글 시트에 데이터 저장 시도
    console.log("📊 [Google Sheets] 데이터 저장 시도...");
    let googleSheetsSuccess = false;
    let googleSheetsMessage = "";

    try {
      const googleResult = await addWaitlistToSheet(name, email);
      if (googleResult.success) {
        googleSheetsSuccess = true;
        googleSheetsMessage = googleResult.message;
        console.log("✅ [Google Sheets] 데이터 저장 성공");
        console.log(`  - 메시지: ${googleSheetsMessage}`);
      } else {
        console.log("❌ [Google Sheets] 데이터 저장 실패");
        console.log(`  - 오류: ${googleResult.message}`);
      }
    } catch (googleError) {
      console.error("❌ [Google Sheets] 저장 중 오류 발생:", googleError);
      googleSheetsMessage = "구글 시트 저장 중 오류가 발생했습니다.";
    }

    // 2단계: 구글 시트 저장 실패 시 로컬 파일에 백업 저장
    if (!googleSheetsSuccess) {
      console.log("📊 [백업 저장] 로컬 파일에 데이터 저장 시도...");

      try {
        const fs = require("fs");
        const path = require("path");

        const data = {
          name,
          email,
          timestamp: new Date().toISOString(),
        };

        const filePath = path.join(process.cwd(), "waitlist-data.json");

        // 기존 데이터 읽기
        let existingData = [];
        try {
          const fileContent = fs.readFileSync(filePath, "utf8");
          existingData = JSON.parse(fileContent);
        } catch (error) {
          // 파일이 없으면 빈 배열로 시작
          existingData = [];
        }

        // 새 데이터 추가
        existingData.push(data);

        // 파일에 저장
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        console.log("✅ [백업 저장] 로컬 파일 저장 완료");
        console.log(`  - 총 레코드 수: ${existingData.length}`);
      } catch (backupError) {
        console.error("❌ [백업 저장] 로컬 파일 저장 실패:", backupError);
        throw new Error(
          "데이터 저장에 실패했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    }

    // 3단계: Gmail API를 사용하여 확인 메일 발송
    console.log("📧 [Gmail] 확인 메일 발송 시도...");
    let emailSent = false;
    let emailMessage = "";

    try {
      const emailResult = await sendWaitlistConfirmationEmail(name, email);
      if (emailResult.success) {
        emailSent = true;
        emailMessage = emailResult.message;
        console.log("✅ [Gmail] 확인 메일 발송 성공");
        console.log(`  - 메시지: ${emailMessage}`);
      } else {
        console.log("❌ [Gmail] 확인 메일 발송 실패");
        console.log(`  - 오류: ${emailResult.message}`);
      }
    } catch (emailError) {
      console.error("❌ [Gmail] 메일 발송 중 오류 발생:", emailError);
      emailMessage = "이메일 발송 중 오류가 발생했습니다.";
    }

    // 최종 결과 로그
    if (googleSheetsSuccess) {
      console.log("✅ [사전 알림] 신청 완료 (구글 시트 저장)");
    } else {
      console.log("⚠️ [사전 알림] 신청 완료 (로컬 백업 저장)");
    }

    if (emailSent) {
      console.log("✅ [사전 알림] 확인 메일 발송 완료");
    } else {
      console.log("⚠️ [사전 알림] 확인 메일 발송 실패");
    }

    // 사용자에게 보여줄 메시지 결정
    let userMessage;
    if (googleSheetsSuccess && emailSent) {
      userMessage =
        "사전 알림 신청이 완료되었습니다! 확인 메일을 발송했습니다. 정식 출시되면 이메일로 알려드리겠습니다.";
    } else if (googleSheetsSuccess) {
      userMessage =
        "사전 알림 신청이 완료되었습니다! (이메일 발송 실패) 정식 출시되면 이메일로 알려드리겠습니다.";
    } else if (emailSent) {
      userMessage =
        "사전 알림 신청이 완료되었습니다! 확인 메일을 발송했습니다. (임시 저장) 정식 출시되면 이메일로 알려드리겠습니다.";
    } else {
      userMessage =
        "사전 알림 신청이 완료되었습니다! (임시 저장, 이메일 발송 실패) 정식 출시되면 이메일로 알려드리겠습니다.";
    }

    return {
      success: true,
      message: userMessage,
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
