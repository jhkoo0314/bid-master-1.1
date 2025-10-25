/**
 * Gmail SMTP 이메일 유틸리티
 * Nodemailer를 사용하여 Gmail SMTP로 이메일을 발송합니다.
 *
 * 사용법:
 * 1. .env.local 파일에 다음 환경 변수 설정:
 *    GMAIL_USER=jhyun06270314@gmail.com
 *    GMAIL_APP_PASSWORD=ikqf suxu msup sqae
 *    GMAIL_FROM_EMAIL=jhyun06270314@gmail.com
 *
 * 2. Gmail 앱 비밀번호 생성:
 *    - Google 계정 설정 → 보안 → 2단계 인증 활성화
 *    - 보안 → 앱 비밀번호 생성
 */

import nodemailer from "nodemailer";

/**
 * Gmail SMTP 트랜스포터를 초기화합니다.
 */
function createGmailTransporter() {
  console.log("📧 [Gmail SMTP] 트랜스포터 초기화 중...");

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      "Gmail SMTP 설정이 누락되었습니다. GMAIL_USER와 GMAIL_APP_PASSWORD 환경 변수를 확인해주세요."
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS 사용
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    console.log("✅ [Gmail SMTP] 트랜스포터 초기화 완료");
    console.log(`  - 사용자: ${gmailUser}`);
    return transporter;
  } catch (error) {
    console.error("❌ [Gmail SMTP] 트랜스포터 초기화 실패:", error);
    throw error;
  }
}

/**
 * 사전 알림 신청 확인 이메일을 발송합니다.
 * @param name 신청자 이름
 * @param email 신청자 이메일
 * @returns 성공 여부
 */
export async function sendWaitlistConfirmationEmail(
  name: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  console.log("📧 [Gmail SMTP] 확인 이메일 발송 시작");
  console.log(`  - 수신자: ${name} <${email}>`);

  try {
    // Gmail SMTP 트랜스포터 초기화
    const transporter = createGmailTransporter();

    // 발송자 이메일 (환경 변수에서 가져오기)
    const fromEmail =
      process.env.GMAIL_FROM_EMAIL ||
      process.env.GMAIL_USER ||
      "jhyun06270314@gmail.com";

    // 이메일 제목
    const subject = "[Bid Master AI] 사전 알림 신청이 완료되었습니다";

    // 이메일 내용 (HTML 형식)
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bid Master AI</h2>
        <p>안녕하세요, <strong>${name}</strong>님!</p>
        
        <p>Bid Master AI 사전 알림 신청이 완료되었습니다.</p>
        <p>정식 출시되면 <strong>${email}</strong>로 가장 먼저 알려드리겠습니다.</p>
        
        <p>감사합니다.<br>
        <strong>Bid Master AI 팀</strong></p>
      </div>
    `;

    // 이메일 발송
    const result = await transporter.sendMail({
      from: `"Bid Master AI" <${fromEmail}>`,
      to: email,
      subject: subject,
      html: emailBody,
    });

    console.log("✅ [Gmail SMTP] 확인 이메일 발송 성공");
    console.log(`  - 메시지 ID: ${result.messageId}`);
    console.log(`  - 발송자: ${fromEmail}`);
    console.log(`  - 수신자: ${email}`);

    return {
      success: true,
      message: "확인 이메일이 성공적으로 발송되었습니다.",
    };
  } catch (error) {
    console.error("❌ [Gmail SMTP] 확인 이메일 발송 실패:", error);

    // 에러 타입별 처리
    let errorMessage = "이메일 발송 중 오류가 발생했습니다.";

    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage = "Gmail 인증에 실패했습니다. 앱 비밀번호를 확인해주세요.";
      } else if (error.message.includes("authentication")) {
        errorMessage = "Gmail SMTP 인증에 실패했습니다.";
      } else if (error.message.includes("quota")) {
        errorMessage = "Gmail SMTP 할당량을 초과했습니다.";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Gmail SMTP 서버에 연결할 수 없습니다.";
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Gmail SMTP 연결 상태를 테스트합니다.
 * @returns 연결 상태
 */
export async function testGmailConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log("🧪 [Gmail SMTP] 연결 테스트 시작");

  try {
    // Gmail SMTP 트랜스포터 초기화
    const transporter = createGmailTransporter();

    // SMTP 연결 테스트
    await transporter.verify();

    console.log("✅ [Gmail SMTP] 연결 테스트 성공");
    console.log(`  - 사용자: ${process.env.GMAIL_USER}`);

    return {
      success: true,
      message: `Gmail SMTP 연결 성공 (${process.env.GMAIL_USER})`,
    };
  } catch (error) {
    console.error("❌ [Gmail SMTP] 연결 테스트 실패:", error);

    let errorMessage = "Gmail SMTP 연결 실패";
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage = "Gmail 인증 실패 - 앱 비밀번호를 확인해주세요";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Gmail SMTP 서버 연결 실패";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}
